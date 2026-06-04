// GSAP card flight layer + Canvas 2D particle engine
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FlyingCard } from './FlyingCard';

// ── Shared constants ─────────────────────────────────────────────────────────
const BACK = { id: '__back__', color: 'wild', type: 'wild', value: 'wild' };

// ── DOM rect helpers ─────────────────────────────────────────────────────────
function rectOf(ref) {
  if (!ref?.current) return null;
  return ref.current.getBoundingClientRect();
}

function ensureSize(r, minW = 46, minH = 69) {
  if (!r) return null;
  const w = Math.max(r.width,  minW);
  const h = Math.max(r.height, minH);
  return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
}

function centeredOn(posRef, sizeRef) {
  const p = rectOf(posRef);
  const s = sizeRef ? ensureSize(rectOf(sizeRef)) : null;
  if (!p) return null;
  const w = s?.width  ?? 58;
  const h = s?.height ?? 87;
  return { left: p.left + p.width / 2 - w / 2, top: p.top + p.height / 2 - h / 2, width: w, height: h };
}

let _flySeq = 0;

// ── Canvas 2D particle effects ───────────────────────────────────────────────
// Each factory returns { tick(ctx, W, H) → boolean (true = still alive) }

const PALETTE = ['#F43F5E', '#22C55E', '#60A5FA', '#FCD34D', '#A78BFA', '#FB923C'];

function makeWinEffect(cx, cy) {
  const pts = Array.from({ length: 60 }, (_, i) => ({
    x:   cx + (Math.random() - 0.5) * 100,
    y:   cy + (Math.random() - 0.5) * 50,
    vx:  (Math.random() - 0.5) * 11,
    vy:  -Math.random() * 15 - 4,
    w:   4 + Math.random() * 10,
    h:   4 + Math.random() * 10,
    rot: Math.random() * Math.PI * 2,
    rv:  (Math.random() - 0.5) * 0.28,
    col: PALETTE[i % PALETTE.length],
    age: 0,
  }));
  let last = null;
  return {
    tick(ctx) {
      const now = performance.now();
      const dt  = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      let alive = false;
      for (const p of pts) {
        p.age += dt;
        p.x   += p.vx;
        p.y   += p.vy + p.age * 22;
        p.rot += p.rv;
        const a = Math.max(0, 1 - p.age / 1.5);
        if (a <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      return alive;
    },
  };
}

function makeUnoPulse(cx, cy) {
  let age = 0, last = null;
  return {
    tick(ctx) {
      const now = performance.now();
      const dt  = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      age += dt;
      const p = Math.min(age / 0.6, 1);
      ctx.beginPath();
      ctx.arc(cx, cy, 50 + p * 100, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244,63,94,${(1 - p) * 0.85})`;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      return p < 1;
    },
  };
}

function makeStackShake(cx, cy) {
  let age = 0, last = null;
  return {
    tick(ctx) {
      const now = performance.now();
      const dt  = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      age += dt;
      const wobble = Math.sin(age * 54) * 10 * Math.max(0, 1 - age / 0.4);
      const a = Math.max(0, 1 - age / 0.55);
      ctx.beginPath();
      ctx.arc(cx + wobble, cy, 42, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239,68,68,${a * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      return age < 0.55;
    },
  };
}

function makeElimination(cx, cy) {
  const pts = Array.from({ length: 20 }, () => ({
    x:   cx + (Math.random() - 0.5) * 60,
    y:   cy + (Math.random() - 0.5) * 40,
    vx:  (Math.random() - 0.5) * 4,
    vy:  Math.random() * 3 + 2,
    rot: Math.random() * Math.PI * 2,
    age: 0,
  }));
  let last = null;
  return {
    tick(ctx) {
      const now = performance.now();
      const dt  = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      let alive = false;
      for (const p of pts) {
        p.age += dt;
        p.x   += p.vx;
        p.y   += p.vy + p.age * 8;
        p.rot += 0.12;
        const a = Math.max(0, 1 - p.age / 0.9);
        if (a <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-5, -8, 10, 16);
        ctx.restore();
      }
      return alive;
    },
  };
}

// ── Canvas particle engine hook ──────────────────────────────────────────────
function useParticleCanvas() {
  const canvasRef  = useRef(null);
  const effectsRef = useRef([]);
  const rafRef     = useRef(null);

  function runLoop() {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = null; return; }
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.width  / dpr;
    const H   = canvas.height / dpr;
    ctx.clearRect(0, 0, W, H);
    effectsRef.current = effectsRef.current.filter(fx => fx.tick(ctx, W, H));
    if (effectsRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(runLoop);
    } else {
      rafRef.current = null;
    }
  }

  function addEffect(fx) {
    effectsRef.current.push(fx);
    if (!rafRef.current) rafRef.current = requestAnimationFrame(runLoop);
  }

  function mountCanvas(container) {
    if (!container || canvasRef.current) return;
    const canvas = document.createElement('canvas');
    const dpr    = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.getContext('2d').scale(dpr, dpr);
    Object.assign(canvas.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%', pointerEvents: 'none',
    });
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const onResize = () => {
      if (!canvasRef.current) return;
      const dpr2 = window.devicePixelRatio || 1;
      canvasRef.current.width  = window.innerWidth  * dpr2;
      canvasRef.current.height = window.innerHeight * dpr2;
      canvasRef.current.getContext('2d').scale(dpr2, dpr2);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvasRef.current = null;
    };
  }

  return { mountCanvas, addEffect };
}

// ── CardAnimationLayer ────────────────────────────────────────────────────────
export const CardAnimationLayer = forwardRef(function CardAnimationLayer(
  { deckRef, discardRef, trayRef, opponentsRef, gameState },
  fwdRef,
) {
  const [flies, setFlies]   = useState([]);
  const divRef              = useRef(null);
  const prevStateRef        = useRef(null);
  const dealtRef            = useRef(false);
  const { mountCanvas, addEffect } = useParticleCanvas();

  // Mount Canvas overlay
  useEffect(() => {
    if (!divRef.current) return;
    return mountCanvas(divRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Flying card state helpers
  const removeFly = useCallback((id) => {
    setFlies(f => {
      const fly = f.find(x => x.id === id);
      if (fly?._fallback) clearTimeout(fly._fallback);
      return f.filter(x => x.id !== id);
    });
  }, []);

  const addFly = useCallback((cfg) => {
    const id = ++_flySeq;
    // Safety net: remove after 1.5 s even if onComplete never fires
    const _fallback = setTimeout(() => {
      cfg.onLand?.();
      setFlies(f => f.filter(x => x.id !== id));
    }, 1500);
    setFlies(f => [...f, { ...cfg, id, _fallback }]);
  }, []);

  // Opponent DOM rect by flat index
  function getOppRect(flatIdx) {
    if (!opponentsRef?.current) return null;
    const el = opponentsRef.current.querySelectorAll('[data-opp-idx]')[flatIdx];
    return el ? ensureSize(el.getBoundingClientRect(), 60, 80) : null;
  }

  // ── Imperative API exposed to GameScreen ──────────────────────────────────
  useImperativeHandle(fwdRef, () => ({
    // Called when player plays a card — flies from hand to discard
    animatePlay(fromRect, card, onLand) {
      const toRect = ensureSize(rectOf(discardRef), fromRect?.width ?? 58, fromRect?.height ?? 87);
      if (!fromRect || !toRect) { onLand?.(); return; }
      addFly({ fromRect, toRect, card, faceDown: false, flipOnArrive: false, onLand });
    },
    // Called when player draws a card — flies from deck to hand tray
    animateDraw() {
      const from = ensureSize(rectOf(deckRef));
      const to   = centeredOn(trayRef, deckRef);
      if (!from || !to) return;
      addFly({ fromRect: from, toRect: to, card: BACK, faceDown: true, flipOnArrive: false });
    },
  }), [addFly, discardRef, deckRef, trayRef]);

  // ── Watch gameState for automatic animations ──────────────────────────────
  useEffect(() => {
    const prev = prevStateRef.current;
    const curr = gameState;
    prevStateRef.current = curr;
    if (!curr) return;

    const deckR    = ensureSize(rectOf(deckRef));
    const discardR = ensureSize(rectOf(discardRef));
    const trayR    = rectOf(trayRef);

    const prevLen = prev?.myHand?.length ?? 0;
    const currLen = curr.myHand?.length  ?? 0;

    // ── Deal animation (game start) ───────────────────────────────────────
    if (!prevLen && currLen >= 2 && !dealtRef.current) {
      dealtRef.current = true;
      if (deckR && trayR) {
        const fw = deckR.width;
        const fh = deckR.height;
        const to = {
          left:   trayR.left + trayR.width  / 2 - fw / 2,
          top:    trayR.top  + trayR.height / 2 - fh / 2,
          width:  fw,
          height: fh,
        };
        // Player's own cards — flip to reveal face on arrival
        curr.myHand?.forEach((myCard, i) => {
          setTimeout(
            () => addFly({ fromRect: deckR, toRect: to, card: myCard, faceDown: true, flipOnArrive: true }),
            i * 100,
          );
        });
        // Opponents' cards — stay face-down
        const myId = curr.myPlayerId ?? curr.players?.[0]?.id;
        curr.players?.forEach((p, pi) => {
          if (p.id === myId) return;
          const oppR = getOppRect(pi);
          if (!oppR) return;
          const to2 = {
            left:   oppR.left + oppR.width  / 2 - fw / 2,
            top:    oppR.top  + oppR.height / 2 - fh / 2,
            width:  fw,
            height: fh,
          };
          for (let j = 0; j < Math.min(p.cardCount ?? 7, 7); j++) {
            setTimeout(
              () => addFly({ fromRect: deckR, toRect: to2, card: BACK, faceDown: true, flipOnArrive: false }),
              j * 100 + 50,
            );
          }
        });
      }
    }

    // ── UNO pulse (hand drops to 1 card) ─────────────────────────────────
    if (currLen === 1 && prevLen === 2 && trayR) {
      addEffect(makeUnoPulse(trayR.left + trayR.width / 2, trayR.top + trayR.height / 2));
    }

    // ── Stack shake (pendingDraw grew) ────────────────────────────────────
    if ((curr.pendingDraw ?? 0) > (prev?.pendingDraw ?? 0) && discardR) {
      addEffect(makeStackShake(discardR.left + discardR.width / 2, discardR.top + discardR.height / 2));
    }

    // ── Win explosion ─────────────────────────────────────────────────────
    if (!prev?.winner && curr.winner) {
      addEffect(makeWinEffect(window.innerWidth / 2, window.innerHeight / 2));
    }

    // ── Opponent play / draw animations ───────────────────────────────────
    const prevPs = prev?.players ?? [];
    const currPs = curr.players  ?? [];
    currPs.forEach((p, pi) => {
      const pp = prevPs.find(x => x.id === p.id);
      if (!pp) return;

      if (p.cardCount < pp.cardCount && discardR) {
        // Opponent played a card — fly face-down from their area to discard
        const oppR = getOppRect(pi);
        if (oppR) {
          const fw = 46, fh = 69;
          const fr = {
            left:   oppR.left + oppR.width  / 2 - fw / 2,
            top:    oppR.top  + oppR.height / 2 - fh / 2,
            width:  fw,
            height: fh,
          };
          addFly({
            fromRect:    fr,
            toRect:      ensureSize(discardR, fw, fh),
            card:        BACK,
            faceDown:    true,
            flipOnArrive: false,
          });
        }
      } else if (p.cardCount > pp.cardCount && deckR && !(prevLen === 0 && currLen >= 2)) {
        // Opponent drew a card — fly from deck to their area
        const oppR = getOppRect(pi);
        if (oppR) {
          const fw = deckR.width, fh = deckR.height;
          const to = {
            left:   oppR.left + oppR.width  / 2 - fw / 2,
            top:    oppR.top  + oppR.height / 2 - fh / 2,
            width:  fw,
            height: fh,
          };
          addFly({ fromRect: deckR, toRect: to, card: BACK, faceDown: true, flipOnArrive: false });
        }
      }
    });

    // ── Player elimination ────────────────────────────────────────────────
    if (prev && currPs.length < prevPs.length) {
      const gone = prevPs.find(p => !currPs.find(x => x.id === p.id));
      if (gone) {
        const pi   = prevPs.findIndex(x => x.id === gone.id);
        const oppR = getOppRect(pi) ?? deckR;
        if (oppR) addEffect(makeElimination(oppR.left + oppR.width / 2, oppR.top + oppR.height / 2));
      }
    }
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Canvas overlay — particles only (no pixi, pure Canvas 2D) */}
      <div
        ref={divRef}
        style={{
          position:      'fixed',
          inset:         0,
          pointerEvents: 'none',
          zIndex:        9998,
          overflow:      'hidden',
        }}
      />

      {/* GSAP-powered portal flying cards */}
      {flies.map(fly => (
        <FlyingCard
          key={fly.id}
          fromRect={fly.fromRect}
          toRect={fly.toRect}
          card={fly.card}
          faceDown={fly.faceDown}
          flipOnArrive={fly.flipOnArrive ?? false}
          onComplete={() => {
            if (fly._fallback) clearTimeout(fly._fallback);
            removeFly(fly.id);
            fly.onLand?.();
          }}
        />
      ))}
    </>
  );
});
