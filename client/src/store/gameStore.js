import { create } from 'zustand';

export const useGameStore = create((set) => ({
  screen: 'home',
  playerName: '',
  playerId: null,
  roomCode: null,
  roomPlayers: [],
  gameState: null,
  winner: null,
  error: null,
  notification: null,

  setScreen: (screen) => set({ screen }),
  setPlayerName: (playerName) => set({ playerName }),
  setPlayerId: (playerId) => set({ playerId }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setRoomPlayers: (roomPlayers) => set({ roomPlayers }),
  setGameState: (gameState) => set({ gameState }),
  setWinner: (winner) => set({ winner }),
  setError: (error) => set({ error }),
  setNotification: (notification) => set({ notification }),

  reset: () =>
    set({
      screen: 'home',
      playerName: '',
      playerId: null,
      roomCode: null,
      roomPlayers: [],
      gameState: null,
      winner: null,
      error: null,
      notification: null,
    }),
}));
