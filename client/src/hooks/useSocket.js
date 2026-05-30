import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

let _socket = null;
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

    on('room-joined', ({ roomCode, playerId }) => {
      ref.current.setRoomCode(roomCode);
      ref.current.setPlayerId(playerId);
      ref.current.setScreen('lobby');
    });
    on('room-updated', (s) => ref.current.setRoomPlayers(s.players));
    on('game-started', () => ref.current.setScreen('game'));
    on('game-state',   (s) => ref.current.setGameState(s));

    on('game-over', ({ winner, loser, punishment }) => {
      ref.current.setWinner(winner);
      ref.current.setLoser(loser || null);
      const s = ref.current;
      if (s.punishment?.enabled && loser) {
        // Store current penalty in punishment state
        ref.current.setPunishment({ ...s.punishment, currentPenalty: punishment });
        ref.current.setShowWheel(true);
      }
      ref.current.setScreen('winner');
    });

    on('player-eliminated', ({ playerName }) => {
      ref.current.setNotification({ type: 'eliminated', text: `⚰️ ${playerName} طُرد!` });
      setTimeout(() => ref.current.setNotification(null), 3000);
    });
    on('uno-called',    ({ playerName }) => {
      ref.current.setNotification({ type: 'uno',    text: `${playerName} — UNO!` });
      setTimeout(() => ref.current.setNotification(null), 2500);
    });
    on('uno-caught',    ({ targetName }) => {
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

    // Punishment
    on('punishment-updated', (data) => ref.current.setPunishment(data));
    on('wheel-result', (result) => {
      ref.current.setWheelResult(result);
      ref.current.setShowWheel(true);
    });

    on('error', ({ message }) => {
      ref.current.setError(message);
      setTimeout(() => ref.current.setError(null), 3000);
    });

    return () => {
      ['room-joined','room-updated','game-started','game-state','game-over',
       'player-eliminated','uno-called','uno-caught','seven-swapped',
       'roulette-resolved','card-played','punishment-updated','wheel-result','error',
      ].forEach(ev => socket.off(ev));
    };
  }, []);

  return getSocket();
}
