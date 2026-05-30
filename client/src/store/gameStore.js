import { create } from 'zustand';

const DEFAULT_SEGMENTS = [
  { id: '1', type: 'punishment', text: 'اشرب كوب ماء كامل',               size: 3, color: '#EF4444' },
  { id: '2', type: 'punishment', text: 'قلد صوت حيوان 10 ثواني',           size: 2, color: '#F97316' },
  { id: '3', type: 'luck',       text: 'retry',                            size: 2, color: '#7C3AED' },
  { id: '4', type: 'punishment', text: 'افعل 10 ضغط',                     size: 3, color: '#EC4899' },
  { id: '5', type: 'punishment', text: 'غني مقطع',                         size: 2, color: '#DC2626' },
  { id: '6', type: 'luck',       text: 'reverse',                          size: 1, color: '#2563EB' },
  { id: '7', type: 'punishment', text: 'قل سراً محرجاً',                   size: 2, color: '#B45309' },
  { id: '8', type: 'punishment', text: 'تخطي دورك مرتين',                  size: 2, color: '#EA580C' },
];

export const useGameStore = create((set) => ({
  screen: 'home',
  playerName: '',
  playerId: null,
  roomCode: null,
  roomPlayers: [],
  gameState: null,
  winner: null,
  loser: null,
  error: null,
  notification: null,

  punishment: {
    enabled: false,
    segments: DEFAULT_SEGMENTS.map(s => ({ ...s })),
    approvals: [],
    totalPlayers: 0,
  },
  showWheel: false,
  wheelResult: null,

  setScreen: (screen) => set({ screen }),
  setPlayerName: (playerName) => set({ playerName }),
  setPlayerId: (playerId) => set({ playerId }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setRoomPlayers: (roomPlayers) => set({ roomPlayers }),
  setGameState: (gameState) => set({ gameState }),
  setWinner: (winner) => set({ winner }),
  setLoser: (loser) => set({ loser }),
  setError: (error) => set({ error }),
  setNotification: (notification) => set({ notification }),
  setPunishment: (punishment) => set({ punishment }),
  setShowWheel: (showWheel) => set({ showWheel }),
  setWheelResult: (wheelResult) => set({ wheelResult }),

  reset: () => set({
    screen: 'home',
    playerName: '',
    playerId: null,
    roomCode: null,
    roomPlayers: [],
    gameState: null,
    winner: null,
    loser: null,
    error: null,
    notification: null,
    showWheel: false,
    wheelResult: null,
    punishment: {
      enabled: false,
      segments: DEFAULT_SEGMENTS.map(s => ({ ...s })),
      approvals: [],
      totalPlayers: 0,
    },
  }),
}));
