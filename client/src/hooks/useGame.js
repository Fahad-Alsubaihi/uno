import { useCallback } from 'react';

export function useGame(socket) {
  const createRoom       = useCallback((n)      => socket.emit('create-room',        { playerName: n }), [socket]);
  const joinRoom         = useCallback((c, n)   => socket.emit('join-room',           { roomCode: c, playerName: n }), [socket]);
  const startGame        = useCallback(()       => socket.emit('start-game'), [socket]);
  const playCard         = useCallback((i, col) => socket.emit('play-card',           { cardIndex: i, chosenColor: col }), [socket]);
  const drawCard         = useCallback(()       => socket.emit('draw-card'), [socket]);
  const callUno          = useCallback(()       => socket.emit('call-uno'), [socket]);
  const catchUno         = useCallback((id)     => socket.emit('catch-uno',           { targetId: id }), [socket]);
  const jumpIn           = useCallback((i)      => socket.emit('jump-in',             { cardIndex: i }), [socket]);
  const sevenSwap        = useCallback((id)     => socket.emit('seven-swap',          { targetPlayerId: id }), [socket]);
  const colorRoulettePick = useCallback((c)     => socket.emit('color-roulette-pick', { chosenColor: c }), [socket]);

  // Punishment
  const setPunishmentMode  = useCallback((en)  => socket.emit('set-punishment-mode', { enabled: en }), [socket]);
  const setPenalties       = useCallback((p)   => socket.emit('set-penalties',       { penalties: p }), [socket]);
  const setWheelOptions    = useCallback((o)   => socket.emit('set-wheel-options',   { options: o }), [socket]);
  const approvePunishment  = useCallback(()    => socket.emit('approve-punishment'), [socket]);
  const spinWheel          = useCallback(()    => socket.emit('spin-wheel'), [socket]);

  return {
    createRoom, joinRoom, startGame, playCard, drawCard,
    callUno, catchUno, jumpIn, sevenSwap, colorRoulettePick,
    setPunishmentMode, setPenalties, setWheelOptions, approvePunishment, spinWheel,
  };
}
