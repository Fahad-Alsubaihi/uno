import { useCallback } from 'react';

export function useGame(socket) {
  const createRoom = useCallback(
    (playerName) => socket.emit('create-room', { playerName }), [socket]);

  const joinRoom = useCallback(
    (roomCode, playerName) => socket.emit('join-room', { roomCode, playerName }), [socket]);

  const startGame = useCallback(() => socket.emit('start-game'), [socket]);

  const playCard = useCallback(
    (cardIndex, chosenColor) => socket.emit('play-card', { cardIndex, chosenColor }), [socket]);

  const drawCard = useCallback(() => socket.emit('draw-card'), [socket]);

  const callUno = useCallback(() => socket.emit('call-uno'), [socket]);

  const catchUno = useCallback(
    (targetId) => socket.emit('catch-uno', { targetId }), [socket]);

  const jumpIn = useCallback(
    (cardIndex) => socket.emit('jump-in', { cardIndex }), [socket]);

  const sevenSwap = useCallback(
    (targetPlayerId) => socket.emit('seven-swap', { targetPlayerId }), [socket]);

  const colorRoulettePick = useCallback(
    (chosenColor) => socket.emit('color-roulette-pick', { chosenColor }), [socket]);

  return { createRoom, joinRoom, startGame, playCard, drawCard, callUno, catchUno, jumpIn, sevenSwap, colorRoulettePick };
}
