const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis');
const GameRoom = require('./GameRoom');

const app = express();
app.use(cors());
app.get('/health', (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

const rooms = new Map();

// clientId tracking
const socketToClient  = new Map(); // socketId  → clientId
const clientToSocket  = new Map(); // clientId  → socketId (latest active)
const disconnectTimers = new Map(); // `${code}:${clientId}` → timer

function cid(socket) { return socketToClient.get(socket.id); }

// Redis
const redis = createClient({ url: 'redis://redis:6379' });
redis.connect().catch(console.error);

const TTL = 86400;

async function saveRoomSettings(room) {
  await redis.setEx(`room:${room.code}`, TTL, JSON.stringify({
    code: room.code,
    segments: room.segments,
    totalRounds: room.totalRounds === Infinity ? '∞' : room.totalRounds,
    punishmentMode: room.punishmentMode,
  }));
}

async function loadRoomSettings(code) {
  const data = await redis.get(`room:${code}`);
  return data ? JSON.parse(data) : null;
}

async function refreshRoom(code) {
  await redis.expire(`room:${code}`, TTL);
}

function roomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

// Touches room on every game-event access to keep lastActivityAt current
function getRoom(socket) {
  const room = rooms.get(socket.data.roomCode);
  if (room) room.touch();
  return room;
}

function broadcastGameState(room) {
  const base = room.getGameState();
  for (const player of room.players) {
    io.to(player.id).emit('game-state', { ...base, myHand: player.hand });
  }
}

function emitGameOver(room, winner) {
  const loserRecord = room.eliminatedPlayers[room.eliminatedPlayers.length - 1] || null;
  const loser = loserRecord ? { id: loserRecord.clientId, name: loserRecord.name } : null;

  if (room.punishmentMode && loser) {
    room.currentSpinnerId = loser.id;
    room.currentSpinnerName = loser.name;
    room.lastWinner = winner;
    room.wheelRetryCount = 0;
    room.wheelCumAngle = 0;
  }

  io.to(room.code).emit('game-over', { winner, loser, punishmentMode: room.punishmentMode });
}

function handleElimination(room, result) {
  if (!result.eliminated) return false;
  const eliminated = room.eliminatedPlayers[room.eliminatedPlayers.length - 1];
  if (eliminated) {
    io.to(room.code).emit('player-eliminated', { playerId: eliminated.clientId, playerName: eliminated.name });
  }
  if (room.players.length === 1) {
    const survivor = room.players[0];
    const winResult = room._handleWin(survivor);
    if (winResult.roundOver) {
      io.to(room.code).emit('round-over', {
        roundWinner: winResult.roundWinner, scores: winResult.scores,
        currentRound: winResult.currentRound, totalRounds: winResult.totalRounds,
        roundLoser: winResult.roundLoser || null,
        punishmentMode: room.punishmentMode,
      });
      broadcastGameState(room);
    } else if (winResult.tiebreaker) {
      io.to(room.code).emit('tiebreaker', { scores: winResult.scores });
    } else {
      io.to(room.code).emit('game-over', {
        winner: winResult.winner, loser: winResult.loser,
        punishmentMode: room.punishmentMode, scores: winResult.scores,
      });
    }
    return true;
  }
  return false;
}

async function loadRoomIfNeeded(code) {
  if (rooms.has(code)) return;
  const saved = await loadRoomSettings(code);
  if (saved) {
    const room = new GameRoom(code);
    room.segments = saved.segments;
    room.totalRounds = saved.totalRounds === '∞' ? Infinity : Number(saved.totalRounds);
    room.punishmentMode = saved.punishmentMode;
    rooms.set(code, room);
  }
}

io.on('connection', socket => {
  console.log('connected:', socket.id);

  // ── Create room ──
  socket.on('create-room', async ({ clientId, playerName }) => {
    const code = roomCode();
    const room = new GameRoom(code);
    rooms.set(code, room);

    socketToClient.set(socket.id, clientId);
    clientToSocket.set(clientId, socket.id);
    room.addPlayer(clientId, socket.id, playerName);

    await saveRoomSettings(room);

    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('room-joined', { roomCode: code, playerId: clientId });
    io.to(code).emit('room-updated', room.getState());
    socket.emit('punishment-updated', room.getPunishmentState());
  });

  // ── Join room ──
  socket.on('join-room', async ({ clientId, roomCode: roomCodeParam, playerName }) => {
    const code = (roomCodeParam || '').toUpperCase().trim();

    await loadRoomIfNeeded(code);

    const room = rooms.get(code);
    if (!room) return socket.emit('error', { message: 'الغرفة غير موجودة أو انتهت صلاحيتها' });
    room.touch();

    // If this clientId is already in the room (e.g. lobby refresh), reconnect them
    const existing = room.players.find(p => p.clientId === clientId);
    if (existing) {
      const timerKey = `${code}:${clientId}`;
      const timer = disconnectTimers.get(timerKey);
      if (timer) { clearTimeout(timer); disconnectTimers.delete(timerKey); }

      socketToClient.set(socket.id, clientId);
      clientToSocket.set(clientId, socket.id);
      room.reconnectPlayer(clientId, socket.id);
      socket.join(code);
      socket.data.roomCode = code;
      socket.emit('room-joined', { roomCode: code, playerId: clientId });
      socket.emit('punishment-updated', room.getPunishmentState());
      io.to(code).emit('room-updated', room.getState());
      await refreshRoom(code);
      return;
    }

    if (room.gameStarted) return socket.emit('error', { message: 'اللعبة بدأت بالفعل' });
    if (room.players.length >= 4) return socket.emit('error', { message: 'الغرفة ممتلئة (4 لاعبين)' });

    socketToClient.set(socket.id, clientId);
    clientToSocket.set(clientId, socket.id);
    room.addPlayer(clientId, socket.id, playerName);
    socket.join(code);
    socket.data.roomCode = code;

    await refreshRoom(code);

    socket.emit('room-joined', { roomCode: code, playerId: clientId });
    io.to(code).emit('room-updated', room.getState());
    socket.emit('punishment-updated', room.getPunishmentState());
  });

  // ── Rejoin room (page reload / reconnect) ──
  socket.on('rejoin-room', async ({ clientId, roomCode: roomCodeParam, playerName }) => {
    const code = (roomCodeParam || '').toUpperCase().trim();
    if (!code) return;

    await loadRoomIfNeeded(code);

    const room = rooms.get(code);
    if (!room) {
      socket.emit('rejoin-failed', { reason: 'الغرفة غير موجودة' });
      return;
    }
    room.touch();

    // Check active players AND eliminated players
    const existingPlayer =
      room.players.find(p => p.clientId === clientId) ||
      room.eliminatedPlayers.find(p => p.clientId === clientId);

    if (!existingPlayer) {
      socket.emit('rejoin-failed', { reason: 'لست في هذه الغرفة' });
      return;
    }

    // If eliminated, restore them to active players before reconnecting
    const isEliminated = !room.players.find(p => p.clientId === clientId);
    if (isEliminated) {
      room.players.push({ clientId: existingPlayer.clientId, id: existingPlayer.id, name: existingPlayer.name, hand: [], unoCalled: false, connected: false });
      room.eliminatedPlayers = room.eliminatedPlayers.filter(p => p.clientId !== clientId);
    }

    // Cancel grace-period timer
    const timerKey = `${code}:${clientId}`;
    const timer = disconnectTimers.get(timerKey);
    if (timer) { clearTimeout(timer); disconnectTimers.delete(timerKey); }

    socketToClient.set(socket.id, clientId);
    clientToSocket.set(clientId, socket.id);
    room.reconnectPlayer(clientId, socket.id);

    socket.join(code);
    socket.data.roomCode = code;

    socket.emit('room-joined', { roomCode: code, playerId: clientId });
    socket.emit('punishment-updated', room.getPunishmentState());

    if (room.gameStarted) {
      socket.emit('game-started');
      const base = room.getGameState();
      socket.emit('game-state', { ...base, myHand: existingPlayer.hand });
      // Notify all connected players that this player reconnected
      io.to(code).emit('room-updated', room.getState());
    } else {
      io.to(code).emit('room-updated', room.getState());
    }

    await refreshRoom(code);
  });

  // ── Start game ──
  socket.on('start-game', () => {
    const room = getRoom(socket);
    if (!room) return;
    const clientId = cid(socket);
    if (room.hostClientId !== clientId)
      return socket.emit('error', { message: 'فقط المضيف يمكنه البدء' });
    if (room.players.filter(p => p.connected).length < 2)
      return socket.emit('error', { message: 'تحتاج لاعبين على الأقل' });
    const startResult = room.startGame();
    if (startResult?.error) return socket.emit('error', { message: startResult.error });
    io.to(room.code).emit('game-started');
    broadcastGameState(room);
  });

  // ── Punishment events ──
  socket.on('set-punishment-mode', async ({ enabled }) => {
    const room = getRoom(socket);
    if (!room) return;
    const r = room.setPunishmentMode(cid(socket), enabled);
    if (r.error) return socket.emit('error', { message: r.error });
    io.to(room.code).emit('punishment-updated', room.getPunishmentState());
    await saveRoomSettings(room);
  });

  socket.on('set-segments', async ({ segments }) => {
    const room = getRoom(socket);
    if (!room) return;
    const r = room.setSegments(cid(socket), segments);
    if (r.error) return socket.emit('error', { message: r.error });
    io.to(room.code).emit('punishment-updated', room.getPunishmentState());
    await saveRoomSettings(room);
  });

  socket.on('approve-punishment', () => {
    const room = getRoom(socket);
    if (!room) return;
    room.approvePunishment(cid(socket));
    io.to(room.code).emit('punishment-updated', room.getPunishmentState());
  });

  socket.on('spin-wheel', () => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.spinWheel(cid(socket));
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('wheel-result', result);
  });

  socket.on('set-rounds', async ({ rounds }) => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.setRounds(cid(socket), rounds);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('rounds-updated', { totalRounds: room.totalRounds === Infinity ? '∞' : room.totalRounds });
    io.to(room.code).emit('room-updated', room.getState());
    await saveRoomSettings(room);
  });

  socket.on('start-next-round', () => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.startNextRound(cid(socket));
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('round-started', { currentRound: room.currentRound });
    broadcastGameState(room);
  });

  socket.on('start-tiebreaker', () => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.startTiebreaker(cid(socket));
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('round-started', { currentRound: room.currentRound });
    broadcastGameState(room);
  });

  socket.on('call-tie', () => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.callTie(cid(socket));
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('game-over', {
      winner: null, loser: null,
      tie: true, punishmentMode: false, scores: result.scores,
    });
  });

  // ── Game events ──
  socket.on('play-card', ({ cardIndex, chosenColor }) => {
    const room = getRoom(socket);
    if (!room) return;
    const clientId = cid(socket);
    const result = room.playCard(clientId, cardIndex, chosenColor);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('card-played', { playerId: clientId, card: result.card });
    if (result.roundOver) {
      io.to(room.code).emit('round-over', {
        roundWinner: result.roundWinner, scores: result.scores,
        currentRound: result.currentRound, totalRounds: result.totalRounds,
        roundLoser: result.roundLoser || null,
        punishmentMode: room.punishmentMode,
      });
      broadcastGameState(room);
    } else if (result.tiebreaker) {
      io.to(room.code).emit('tiebreaker', { scores: result.scores });
    } else if (result.gameOver) {
      io.to(room.code).emit('game-over', {
        winner: result.winner, loser: result.loser,
        punishmentMode: room.punishmentMode, scores: result.scores,
      });
    } else {
      broadcastGameState(room);
    }
  });

  socket.on('draw-card', () => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.drawCard(cid(socket));
    if (result.error) return socket.emit('error', { message: result.error });
    if (!handleElimination(room, result)) broadcastGameState(room);
  });

  socket.on('pass-turn', () => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.passTurn(cid(socket));
    if (result.error) return socket.emit('error', { message: result.error });
    broadcastGameState(room);
  });

  socket.on('call-uno', () => {
    const room = getRoom(socket);
    if (!room) return;
    const clientId = cid(socket);
    const result = room.callUno(clientId);
    if (result.error) return socket.emit('error', { message: result.error });
    const player = room.players.find(p => p.clientId === clientId);
    io.to(room.code).emit('uno-called', { playerId: clientId, playerName: player?.name });
    broadcastGameState(room);
  });

  socket.on('catch-uno', ({ targetId }) => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.catchUno(cid(socket), targetId);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('uno-caught', { targetName: result.targetName });
    broadcastGameState(room);
  });

  socket.on('seven-swap', ({ targetPlayerId: targetClientId }) => {
    const room = getRoom(socket);
    if (!room) return;
    const clientId = cid(socket);
    const result = room.sevenSwap(clientId, targetClientId);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('seven-swapped', { fromId: clientId, toId: targetClientId });
    broadcastGameState(room);
  });

  socket.on('color-roulette-pick', ({ chosenColor }) => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.colorRoulettePick(cid(socket), chosenColor);
    if (result.error) return socket.emit('error', { message: result.error });
    broadcastGameState(room);
  });

  socket.on('roulette-draw', () => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.rouletteDraw(cid(socket));
    if (result.error) return socket.emit('error', { message: result.error });
    if (result.found) io.to(room.code).emit('roulette-resolved', { drew: 1 });
    if (!handleElimination(room, result)) broadcastGameState(room);
  });

  // ── Room management ──
  socket.on('restart-game', () => {
    const room = getRoom(socket);
    if (!room) return;
    const result = room.restartGame(cid(socket));
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('game-restarted', room.getState());
  });

  socket.on('grant-second-chance', () => {
    const room = getRoom(socket);
    if (!room) return;
    if (room.lastWinner?.id !== cid(socket)) return socket.emit('error', { message: 'فقط الفائز يقدر يمنح فرصة' });
    if (!room.lastLoserId) return socket.emit('error', { message: 'لا يوجد خسران' });
    room.currentSpinnerId = room.lastLoserId;
    room.currentSpinnerName = room.lastLoserName;
    room.wheelRetryCount = 0;
    io.to(room.code).emit('second-chance-granted', { loserName: room.lastLoserName });
  });

  socket.on('player-visibility', ({ away }) => {
    const room = getRoom(socket);
    if (!room) return;
    room.setPlayerAway(cid(socket), away);
    io.to(room.code).emit('room-updated', room.getState());
    if (room.gameStarted) broadcastGameState(room);
  });

  socket.on('send-reaction', ({ emoji }) => {
    const room = getRoom(socket);
    if (!room) return;
    const clientId = cid(socket);
    const player = room.players.find(p => p.clientId === clientId);
    if (!player) return;
    io.to(room.code).emit('reaction', { playerId: clientId, playerName: player.name, emoji });
  });

  socket.on('kick-player', ({ targetId: targetClientId }) => {
    const room = getRoom(socket);
    if (!room) return;
    if (room.hostClientId !== cid(socket)) return socket.emit('error', { message: 'فقط المضيف' });

    const target = room.players.find(p => p.clientId === targetClientId);
    if (!target) return;

    const targetSocketId = target.id;

    // Cancel any pending disconnect timer
    const timerKey = `${room.code}:${targetClientId}`;
    const timer = disconnectTimers.get(timerKey);
    if (timer) { clearTimeout(timer); disconnectTimers.delete(timerKey); }
    clientToSocket.delete(targetClientId);

    room.removePlayer(targetClientId);
    if (targetSocketId) io.to(targetSocketId).emit('kicked');
    io.to(room.code).emit('room-updated', room.getState());
  });

  // ── Disconnect (with 30s grace period) ──
  socket.on('disconnect', async () => {
    const code = socket.data.roomCode;
    const clientId = socketToClient.get(socket.id);
    socketToClient.delete(socket.id);

    const room = rooms.get(code);
    if (!room || !clientId) return;

    room.disconnectPlayer(clientId);
    io.to(code).emit('room-updated', room.getState());
    if (room.gameStarted) broadcastGameState(room);

    const timerKey = `${code}:${clientId}`;
    disconnectTimers.set(timerKey, setTimeout(async () => {
      disconnectTimers.delete(timerKey);
      clientToSocket.delete(clientId);

      const r = rooms.get(code);
      if (!r) return;
      r.removePlayer(clientId);

      if (r.players.length === 0) {
        // Everyone left — save settings and delete room from memory
        await saveRoomSettings(r);
        rooms.delete(code);
      } else if (r.gameStarted && r.players.length < 2) {
        // Not enough players to continue — force reset to lobby
        r.forceResetToLobby();
        io.to(code).emit('game-restarted', r.getState());
        await saveRoomSettings(r);
      } else {
        io.to(code).emit('room-updated', r.getState());
        if (r.gameStarted) broadcastGameState(r);
      }
    }, 30000));
  });
});

// ── Room expiration cleanup (every 30 min) ──
// NOTE: Redis stores settings only (segments/rounds/punishmentMode).
// Live game state (hands, deck, discard pile, scores) is in-memory only.
// If the server restarts mid-game, that game is lost. Persisting full game
// state would require saving room.getGameState() to Redis on every mutation.
const INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActivityAt > INACTIVITY_LIMIT_MS) {
      rooms.delete(code);
      console.log(`[cleanup] deleted inactive room ${code}`);
    }
  }
}, 30 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`UNO No Mercy → port ${PORT}`));
