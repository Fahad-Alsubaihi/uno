import { useCallback } from 'react';

export function useGame(socket) {
  const createRoom        = useCallback((n)    => socket.emit('create-room',        { playerName: n }), [socket]);
  const joinRoom          = useCallback((c, n) => socket.emit('join-room',           { roomCode: c, playerName: n }), [socket]);
  const startGame         = useCallback(()     => socket.emit('start-game'), [socket]);
  const playCard          = useCallback((i, c) => socket.emit('play-card',           { cardIndex: i, chosenColor: c }), [socket]);
  const drawCard          = useCallback(()     => socket.emit('draw-card'), [socket]);
  const passTurn          = useCallback(()     => socket.emit('pass-turn'), [socket]);
  const callUno           = useCallback(()     => socket.emit('call-uno'), [socket]);
  const catchUno          = useCallback((id)   => socket.emit('catch-uno',           { targetId: id }), [socket]);
  const jumpIn            = useCallback((i)    => socket.emit('jump-in',             { cardIndex: i }), [socket]);
  const sevenSwap         = useCallback((id)   => socket.emit('seven-swap',          { targetPlayerId: id }), [socket]);
  const colorRoulettePick = useCallback((c)    => socket.emit('color-roulette-pick', { chosenColor: c }), [socket]);
  const rouletteDraw      = useCallback(()     => socket.emit('roulette-draw'), [socket]);

  const setPunishmentMode = useCallback((en)   => socket.emit('set-punishment-mode', { enabled: en }), [socket]);
  const setSegments       = useCallback((segs) => socket.emit('set-segments',        { segments: segs }), [socket]);
  const approvePunishment = useCallback(()     => socket.emit('approve-punishment'), [socket]);
  const spinWheel         = useCallback(()     => socket.emit('spin-wheel'), [socket]);
  const setRounds         = useCallback((n)    => socket.emit('set-rounds',          { rounds: n }), [socket]);
  const startNextRound    = useCallback(()     => socket.emit('start-next-round'), [socket]);
  const restartGame       = useCallback(()     => socket.emit('restart-game'), [socket]);
  const kickPlayer        = useCallback((id)   => socket.emit('kick-player',   { targetId: id }), [socket]);
  const sendReaction        = useCallback((emoji) => socket.emit('send-reaction',      { emoji }), [socket]);
  const grantSecondChance   = useCallback(()      => socket.emit('grant-second-chance'), [socket]);

  return {
    createRoom, joinRoom, startGame, playCard, drawCard, passTurn,
    callUno, catchUno, jumpIn, sevenSwap, colorRoulettePick, rouletteDraw,
    setPunishmentMode, setSegments, approvePunishment, spinWheel,
    setRounds, startNextRound, restartGame, kickPlayer, sendReaction, grantSecondChance,
  };
}