import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

let _socket = null;

function getSocket() {
  if (!_socket) {
    _socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
  }
  return _socket;
}

export function useSocket() {
  const store = useGameStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    const socket = getSocket();

    const on = (ev, fn) => socket.on(ev, fn);

    on('room-joined', ({ roomCode, playerId }) => {
      storeRef.current.setRoomCode(roomCode);
      storeRef.current.setPlayerId(playerId);
      storeRef.current.setScreen('lobby');
    });

    on('room-updated', (state) => {
      storeRef.current.setRoomPlayers(state.players);
    });

    on('game-started', () => {
      storeRef.current.setScreen('game');
    });

    on('game-state', (state) => {
      storeRef.current.setGameState(state);
    });

    on('game-over', ({ winner }) => {
      storeRef.current.setWinner(winner);
      storeRef.current.setScreen('winner');
    });

    on('player-eliminated', ({ playerName }) => {
      storeRef.current.setNotification({ type: 'eliminated', text: `⚰️ ${playerName} طُرد من اللعبة!` });
      setTimeout(() => storeRef.current.setNotification(null), 3000);
    });

    on('uno-called', ({ playerName }) => {
      storeRef.current.setNotification({ type: 'uno', text: `${playerName} — UNO!` });
      setTimeout(() => storeRef.current.setNotification(null), 2500);
    });

    on('uno-caught', ({ targetName }) => {
      storeRef.current.setNotification({ type: 'caught', text: `امسكنا ${targetName}! +2` });
      setTimeout(() => storeRef.current.setNotification(null), 2500);
    });

    on('seven-swapped', () => {
      storeRef.current.setNotification({ type: 'swap', text: 'تم التبادل!' });
      setTimeout(() => storeRef.current.setNotification(null), 2000);
    });

    on('roulette-resolved', ({ drew }) => {
      storeRef.current.setNotification({ type: 'roulette', text: `روليت الألوان! سحب ${drew} ورقة` });
      setTimeout(() => storeRef.current.setNotification(null), 2500);
    });

    on('card-played', ({ jumpIn }) => {
      if (jumpIn) {
        storeRef.current.setNotification({ type: 'jumpin', text: 'اقتحام!' });
        setTimeout(() => storeRef.current.setNotification(null), 1500);
      }
    });

    on('error', ({ message }) => {
      storeRef.current.setError(message);
      setTimeout(() => storeRef.current.setError(null), 3000);
    });

    return () => {
      ['room-joined','room-updated','game-started','game-state','game-over',
       'player-eliminated','uno-called','uno-caught','seven-swapped',
       'roulette-resolved','card-played','error'
      ].forEach(ev => socket.off(ev));
    };
  }, []);

  return getSocket();
}
