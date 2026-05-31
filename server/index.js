const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
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

function roomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function broadcastGameState(room) {
  const base = room.getGameState();
  for (const player of room.players) {
    io.to(player.id).emit('game-state', { ...base, myHand: player.hand });
  }
}

function emitGameOver(room, winner) {
  // Pick loser = eliminated player with most cards (last eliminated), or any non-winner
  const loserRecord = room.eliminatedPlayers[room.eliminatedPlayers.length - 1] || null;
  const loser = loserRecord ? { id: loserRecord.id, name: loserRecord.name } : null;

  if (room.punishmentMode && loser) {
    room.currentSpinnerId = loser.id;
    room.currentSpinnerName = loser.name;
    room.lastWinner = winner;
    room.wheelRetryCount = 0;
    room.wheelCumAngle = 0;
  }

  io.to(room.code).emit('game-over', {
    winner,
    loser,
    punishmentMode: room.punishmentMode,
  });
}

function handleElimination(room, result) {
  if (!result.eliminated) return false;
  const eliminated = room.eliminatedPlayers[room.eliminatedPlayers.length - 1];
  if (eliminated) {
    io.to(room.code).emit('player-eliminated', { playerId: eliminated.id, playerName: eliminated.name });
  }
  if (room.players.length === 1) {
    room.gameStarted = false;
    emitGameOver(room, room.players[0]);
    return true;
  }
  return false;
}

io.on('connection', socket => {
  console.log('connected:', socket.id);

  socket.on('create-room', ({ playerName }) => {
    const code = roomCode();
    const room = new GameRoom(code);
    rooms.set(code, room);
    room.addPlayer(socket.id, playerName);
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('room-joined', { roomCode: code, playerId: socket.id });
    io.to(code).emit('room-updated', room.getState());
    socket.emit('punishment-updated', room.getPunishmentState());
  });

  socket.on('join-room', ({ roomCode, playerName }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return socket.emit('error', { message: 'الغرفة غير موجودة' });
    if (room.gameStarted) return socket.emit('error', { message: 'اللعبة بدأت بالفعل' });
    if (room.players.length >= 4) return socket.emit('error', { message: 'الغرفة ممتلئة (4 لاعبين)' });
    room.addPlayer(socket.id, playerName);
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit('room-joined', { roomCode: code, playerId: socket.id });
    io.to(code).emit('room-updated', room.getState());
    socket.emit('punishment-updated', room.getPunishmentState());
  });

  socket.on('start-game', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    if (room.players[0]?.id !== socket.id)
      return socket.emit('error', { message: 'فقط المضيف يمكنه البدء' });
    if (room.players.length < 2)
      return socket.emit('error', { message: 'تحتاج لاعبين على الأقل' });
    const startResult = room.startGame();
    if (startResult?.error) return socket.emit('error', { message: startResult.error });
    io.to(room.code).emit('game-started');
    broadcastGameState(room);
  });

  // ── Punishment events ──
  socket.on('set-punishment-mode', ({ enabled }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const r = room.setPunishmentMode(socket.id, enabled);
    if (r.error) return socket.emit('error', { message: r.error });
    io.to(room.code).emit('punishment-updated', room.getPunishmentState());
  });

  socket.on('set-segments', ({ segments }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const r = room.setSegments(socket.id, segments);
    if (r.error) return socket.emit('error', { message: r.error });
    io.to(room.code).emit('punishment-updated', room.getPunishmentState());
  });

  socket.on('approve-punishment', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    room.approvePunishment(socket.id);
    io.to(room.code).emit('punishment-updated', room.getPunishmentState());
  });

  socket.on('spin-wheel', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.spinWheel(socket.id);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('wheel-result', result);
  });

  socket.on('set-rounds', ({ rounds }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.setRounds(socket.id, rounds);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('rounds-updated', {
      totalRounds: room.totalRounds === Infinity ? '∞' : room.totalRounds,
    });
    io.to(room.code).emit('room-updated', room.getState());
  });

  socket.on('start-next-round', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.startNextRound(socket.id);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('round-started', { currentRound: room.currentRound });
    broadcastGameState(room);
  });

  socket.on('play-card', ({ cardIndex, chosenColor }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.playCard(socket.id, cardIndex, chosenColor);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('card-played', { playerId: socket.id, card: result.card });
    if (result.roundOver) {
      io.to(room.code).emit('round-over', {
        roundWinner:  result.roundWinner,
        scores:       result.scores,
        currentRound: result.currentRound,
        totalRounds:  result.totalRounds,
      });
      broadcastGameState(room);
    } else if (result.gameOver) {
      io.to(room.code).emit('game-over', {
        winner:         result.winner,
        loser:          result.loser,
        punishmentMode: room.punishmentMode,
        scores:         result.scores,
      });
    } else {
      broadcastGameState(room);
    }
  });

  socket.on('draw-card', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.drawCard(socket.id);
    if (result.error) return socket.emit('error', { message: result.error });
    if (!handleElimination(room, result)) broadcastGameState(room);
  });

  socket.on('pass-turn', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.passTurn(socket.id);
    if (result.error) return socket.emit('error', { message: result.error });
    broadcastGameState(room);
  });

  socket.on('call-uno', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.callUno(socket.id);
    if (result.error) return socket.emit('error', { message: result.error });
    const player = room.players.find(p => p.id === socket.id);
    io.to(room.code).emit('uno-called', { playerId: socket.id, playerName: player?.name });
    broadcastGameState(room);
  });

  socket.on('catch-uno', ({ targetId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.catchUno(socket.id, targetId);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('uno-caught', { targetName: result.targetName });
    broadcastGameState(room);
  });

  socket.on('jump-in', ({ cardIndex }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.jumpIn(socket.id, cardIndex);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('card-played', { playerId: socket.id, card: result.card, jumpIn: true });
    if (result.gameOver) {
      io.to(room.code).emit('game-over', { winner: result.winner });
    } else {
      broadcastGameState(room);
    }
  });

  socket.on('seven-swap', ({ targetPlayerId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.sevenSwap(socket.id, targetPlayerId);
    if (result.error) return socket.emit('error', { message: result.error });
    io.to(room.code).emit('seven-swapped', { fromId: socket.id, toId: targetPlayerId });
    broadcastGameState(room);
  });

  socket.on('color-roulette-pick', ({ chosenColor }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.colorRoulettePick(socket.id, chosenColor);
    if (result.error) return socket.emit('error', { message: result.error });
    // just save the chosen color and broadcast — drawing happens card-by-card via roulette-draw
    broadcastGameState(room);
  });

  socket.on('roulette-draw', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const result = room.rouletteDraw(socket.id);
    if (result.error) return socket.emit('error', { message: result.error });
    if (result.found) io.to(room.code).emit('roulette-resolved', { drew: 1 });
    if (!handleElimination(room, result)) broadcastGameState(room);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    room.removePlayer(socket.id);
    if (room.players.length === 0) {
      rooms.delete(code);
    } else {
      io.to(code).emit('room-updated', room.getState());
      if (room.gameStarted) broadcastGameState(room);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`UNO No Mercy → port ${PORT}`));