import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { getSavedSession, saveSession, clearSession } from '../utils/clientId';

let _socket = null;
const _reactionTimers = {};

function getSocket() {
  if (!_socket) _socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
  return _socket;
}

export function useSocket() {
  const store = useGameStore();
  const ref = useRef(store);
  ref.current = store;

  useEffect(() => {
    const socket = getSocket();
    const on = (ev, fn) => socket.on(ev, fn);

    const tryRejoin = () => {
      const session = getSavedSession();
      if (session.roomCode && session.clientId) {
        socket.emit('rejoin-room', session);
      }
    };

    // Fire immediately if already connected, otherwise wait for connect event
    if (socket.connected) {
      tryRejoin();
    }
    on('connect', tryRejoin);

    on('room-joined', ({ roomCode, playerId }) => {
      ref.current.setRoomCode(roomCode);
      ref.current.setPlayerId(playerId);
      ref.current.setScreen('lobby');
      // persist session so page reload can reconnect
      saveSession(roomCode, ref.current.playerName);
    });

    on('rejoin-failed', () => {
      clearSession();
      // stay on home screen — store already initialized correctly
    });
    on('room-updated', (s) => {
      ref.current.setRoomPlayers(s.players);
      if (s.totalRounds !== undefined) ref.current.setTotalRounds(s.totalRounds);
      if (s.hostId !== undefined) ref.current.setHostId(s.hostId);
    });
    on('game-started', () => ref.current.setScreen('game'));
    on('game-state',   (s) => ref.current.setGameState(s));

    on('game-over', ({ winner, loser, punishmentMode, scores }) => {
      ref.current.setWinner(winner);
      ref.current.setLoser(loser || null);
      if (scores) ref.current.setFinalScores(scores);
      const s = ref.current;
      if ((punishmentMode || s.punishment?.enabled) && loser) {
        ref.current.setShowWheel(false);
        ref.current.setWheelResult(null);
      }
      ref.current.setScreen('winner');
    });

    on('round-over', (data) => {
      ref.current.setRoundResult(data);
    });

    on('round-started', () => {
      ref.current.setRoundResult(null);
    });

    on('rounds-updated', ({ totalRounds }) => {
      ref.current.setTotalRounds(totalRounds);
    });

    on('player-eliminated', ({ playerName }) => {
      ref.current.setNotification({ type: 'eliminated', text: `⚰️ ${playerName} طُرد!` });
      setTimeout(() => ref.current.setNotification(null), 3000);
    });
    on('uno-called', ({ playerName }) => {
      ref.current.setNotification({ type: 'uno', text: `${playerName} — UNO!` });
      setTimeout(() => ref.current.setNotification(null), 2500);
    });
    on('uno-caught', ({ targetName }) => {
      ref.current.setNotification({ type: 'caught', text: `امسكنا ${targetName}! +2` });
      setTimeout(() => ref.current.setNotification(null), 2500);
    });
    on('seven-swapped', () => {
      ref.current.setNotification({ type: 'swap', text: 'تم التبادل!' });
      setTimeout(() => ref.current.setNotification(null), 2000);
    });
    on('roulette-resolved', ({ drew }) => {
      ref.current.setNotification({ type: 'roulette', text: `روليت! سحب ${drew} ورقة` });
      setTimeout(() => ref.current.setNotification(null), 2500);
    });
    on('card-played', ({ jumpIn }) => {
      if (jumpIn) {
        ref.current.setNotification({ type: 'jumpin', text: 'اقتحام!' });
        setTimeout(() => ref.current.setNotification(null), 1500);
      }
    });

    on('game-restarted', (state) => {
      ref.current.setGameState(null);
      ref.current.setWinner(null);
      ref.current.setLoser(null);
      ref.current.setRoundResult(null);
      ref.current.setFinalScores(null);
      ref.current.setShowWheel(false);
      ref.current.setWheelResult(null);
      ref.current.setRoomPlayers(state.players);
      if (state.totalRounds !== undefined) ref.current.setTotalRounds(Number(state.totalRounds) || state.totalRounds);
      if (state.hostId !== undefined) ref.current.setHostId(state.hostId);
      ref.current.setScreen('lobby');
    });

    on('second-chance-granted', ({ loserName }) => {
      ref.current.setWheelResult(null);
      ref.current.setNotification({ type: 'chance', text: `🎲 ${loserName} حصل على فرصة ثانية!` });
      setTimeout(() => ref.current.setNotification(null), 2500);
    });

    on('reaction', ({ playerId, emoji }) => {
      if (_reactionTimers[playerId]) clearTimeout(_reactionTimers[playerId]);
      ref.current.setReaction(playerId, emoji);
      _reactionTimers[playerId] = setTimeout(() => {
        ref.current.clearReaction(playerId);
      }, 2500);
    });

    on('kicked', () => {
      ref.current.reset();
      ref.current.setError('تم طردك من الغرفة');
      setTimeout(() => ref.current.setError(null), 3500);
    });

    on('punishment-updated', (data) => ref.current.setPunishment(data));

    on('wheel-result', (result) => {
      ref.current.setWheelResult(result);
    });

    on('error', ({ message }) => {
      ref.current.setError(message);
      setTimeout(() => ref.current.setError(null), 3000);
    });

    return () => {
      ['connect','room-joined','rejoin-failed','room-updated','game-started',
       'game-state','game-over','player-eliminated','uno-called','uno-caught',
       'seven-swapped','roulette-resolved','card-played','punishment-updated',
       'wheel-result','round-over','round-started','rounds-updated','game-restarted',
       'kicked','reaction','second-chance-granted','error',
      ].forEach(ev => socket.off(ev));
    };
  }, []);

  return getSocket();
}
