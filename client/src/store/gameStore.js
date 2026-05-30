import { create } from 'zustand';

const DEFAULT_PENALTIES = [
  'اشرب كوب ماء كامل',
  'قلد صوت حيوان 10 ثواني',
  'قول مدح لكل لاعب',
  'افعل 10 ضغط',
  'غني مقطع',
  'قل سراً محرجاً',
  'العب الجولة القادمة بيدك العكسية',
  'تخطي دورك مرتين',
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

  // Punishment mode state
  punishment: {
    enabled: false,
    penalties: [...DEFAULT_PENALTIES],
    wheelOptions: { execute: 60, retry: 20, reverse: 20 },
    approvals: [],
    totalPlayers: 0,
    currentPenalty: null,
  },
  wheelResult: null,   // { result, punishment, retryCount, loserName, winnerName }
  showWheel: false,

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
  setWheelResult: (wheelResult) => set({ wheelResult }),
  setShowWheel: (showWheel) => set({ showWheel }),

  reset: () =>
    set({
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
      wheelResult: null,
      showWheel: false,
      punishment: {
        enabled: false,
        penalties: [...DEFAULT_PENALTIES],
        wheelOptions: { execute: 60, retry: 20, reverse: 20 },
        approvals: [],
        totalPlayers: 0,
        currentPenalty: null,
      },
    }),
}));
