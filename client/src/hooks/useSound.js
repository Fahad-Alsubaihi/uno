import { useRef, useCallback } from 'react';

function makeCtx() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
}

export function useSound() {
  const ctxRef = useRef(null);

  function ctx() {
    if (!ctxRef.current) ctxRef.current = makeCtx();
    return ctxRef.current;
  }

  function beep(freq, duration, type = 'sine', gain = 0.3, startTime = 0) {
    const c = ctx();
    if (!c) return;
    const now = c.currentTime + startTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  const playCard = useCallback(() => {
    beep(600, 0.08, 'square', 0.15);
    beep(900, 0.06, 'square', 0.1, 0.06);
  }, []);

  const drawCard = useCallback(() => {
    beep(300, 0.12, 'sawtooth', 0.1);
    beep(250, 0.08, 'sawtooth', 0.08, 0.1);
  }, []);

  const uno = useCallback(() => {
    beep(523, 0.1, 'square', 0.2);
    beep(659, 0.1, 'square', 0.2, 0.1);
    beep(784, 0.2, 'square', 0.25, 0.2);
  }, []);

  const error = useCallback(() => {
    beep(200, 0.15, 'sawtooth', 0.2);
    beep(150, 0.15, 'sawtooth', 0.15, 0.1);
  }, []);

  const win = useCallback(() => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => beep(f, 0.15, 'square', 0.2, i * 0.12));
    beep(1047, 0.4, 'square', 0.25, notes.length * 0.12);
  }, []);

  const jumpIn = useCallback(() => {
    beep(800, 0.05, 'square', 0.2);
    beep(1000, 0.05, 'square', 0.2, 0.05);
    beep(1200, 0.1, 'square', 0.25, 0.1);
  }, []);

  const swap = useCallback(() => {
    beep(440, 0.1, 'sine', 0.2);
    beep(660, 0.1, 'sine', 0.2, 0.12);
  }, []);

  const yourTurn = useCallback(() => {
    beep(523, 0.07, 'sine', 0.18);
    beep(784, 0.14, 'sine', 0.24, 0.09);
  }, []);

  return { playCard, drawCard, uno, error, win, jumpIn, swap, yourTurn };
}
