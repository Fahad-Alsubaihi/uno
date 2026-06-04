import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { FlyingCard } from './FlyingCard';

// ── Placeholder card used for face-down flights (back always shown) ───────
const BACK = { id: '__back__', color: 'wild', type: 'wild', value: 'wild' };

// ── Helpers ───────────────────────────────────────────────────────────────
function rectOf(ref) {
  if (!ref?.current) return null;
  return ref.current.getBoundingClientRect();
}

// Normalise a DOMRect to a plain object with a guaranteed minimum card size
function ensureSize(r, minW = 46, minH = 69) {
  if (!r) return null;
  const w = Math.max(r.width,  minW);
  const h = Math.max(r.height, minH);
  return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
}

// Build a "centered rect" — same size as `sizeRef` but centered on `posRef`
function centeredOn(posRef, sizeRef) {
  const p = rectOf(posRef);
  const s = sizeRef ? ensureSize(rectOf(sizeRef)) : null;
  if (!p) return null;
  const w = s?.width  ?? 58;
  const h = s?.height ?? 87;
  return { left: p.left + p.width / 2 - w / 2, top: p.top + p.height / 2 - h / 2, width: w, height: h };
}

let _flySeq = 0;

// ── Pixi particle helpers ─────────────────────────────────────────────────
function pixi_winParticles(app) {
  const W  = app.renderer.width  / (window.devicePixelRatio || 1);
  const H  = app.renderer.height / (window.devicePixelRatio || 1);
  const cx = W / 2;
  const cy = H / 2;
  const palette = [0xF43F5E, 0x22C55E, 0x60A5FA, 0xFCD34D, 0xA78BFA, 0xFB923C];
  for (let i = 0; i < 60; i++) {
    const g  = new PIXI.Graphics();
    const pw = 4 + Math.random() * 10;
    const ph = 4 + Math.random() * 10;
    g.rect(-pw / 2, -ph / 2, pw, ph);
    g.fill({ color: palette[i % palette.length] });
    g.x = cx + (Math.random() - 0.5) * 100;
    g.y = cy + (Math.random() - 0.5) * 50;
    app.stage.addChild(g);
    const vx = (Math.random() - 0.5) * 11;
    const vy = -Math.random() * 15 - 4;
    const rv = (Math.random() - 0.5) * 0.28;
    let t = 0;
    const fn = (tk) => {
      t += (tk.deltaMS ?? tk.deltaTime * (1000 / 60)) / 1000;
      g.x += vx; g.y += vy + t * 22; g.rotation += rv;
      g.alpha = Math.max(0, 1 - t / 1.5);
      if (g.alpha <= 0) { app.ticker.remove(fn); try { app.stage.removeChild(g); g.destroy(); } catch {} }
    };
    app.ticker.add(fn);
  }
}

function pixi_unoPulse(app, trayR) {
  if (!trayR) return;
  const cx = trayR.left + trayR.width  / 2;
  const cy = trayR.top  + trayR.height / 2;
  const ring = new PIXI.Graphics();
  app.stage.addChild(ring);
  let t = 0;
  const fn = (tk) => {
    t += (tk.deltaMS ?? tk.deltaTime * (1000 / 60)) / 1000;
    const p = Math.min(t / 0.6, 1);
    ring.clear();
    ring.circle(cx, cy, 50 + p * 100);
    ring.stroke({ color: 0xF43F5E, alpha: (1 - p) * 0.85, width: 3.5 });
    if (p >= 1) { app.ticker.remove(fn); try { app.stage.removeChild(ring); ring.destroy(); } catch {} }
  };
  app.ticker.add(fn);
}

function pixi_stackShake(app, discardR) {
  if (!discardR) return;
  const cx = discardR.left + discardR.width  / 2;
  const cy = discardR.top  + discardR.height / 2;
  const gfx = new PIXI.Graphics();
  gfx.circle(0, 0, 42);
  gfx.stroke({ color: 0xEF4444, alpha: 0.9, width: 2.5 });
  gfx.x = cx; gfx.y = cy;
  app.stage.addChild(gfx);
  let t = 0;
  const fn = (tk) => {
    t += (tk.deltaMS ?? tk.deltaTime * (1000 / 60)) / 1000;
    gfx.x     = cx + Math.sin(t * 54) * 10 * Math.max(0, 1 - t / 0.4);
    gfx.alpha = Math.max(0, 1 - t / 0.55);
    if (t >= 0.55) { app.ticker.remove(fn); try { app.stage.removeChild(gfx); gfx.destroy(); } catch {} }
  };
  app.ticker.add(fn);
}

function pixi_eliminationBurst(app, posR) {
  if (!posR) return;
  const cx = posR.left + posR.width  / 2;
  const cy = posR.top  + posR.height / 2;
  for (let i = 0; i < 20; i++) {
    const g = new PIXI.Graphics();
    g.rect(-5, -8, 10, 16);
    g.fill({ color: 0x475569 });
    g.x = cx + (Math.random() - 0.5) * 60;
    g.y = cy + (Math.random() - 0.5) * 40;
    app.stage.addChild(g);
    const vx = (Math.random() - 0.5) * 4;
    const vy = Math.random() * 3 + 2;
    let t = 0;
    const fn = (tk) => {
      t += (tk.deltaMS ?? tk.deltaTime * (1000 / 60)) / 1000;
      g.x += vx; g.y += vy + t * 8; g.rotation += 0.12;
      g.alpha = Math.max(0, 1 - t / 0.9);
      if (g.alpha <= 0) { app.ticker.remove(fn); try { app.stage.removeChild(g); g.destroy(); } catch {} }
    };
    app.ticker.add(fn);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CardAnimationLayer
// ─────────────────────────────────────────────────────────────────────────
export const CardAnimationLayer = forwardRef(function CardAnimationLayer(
  { deckRef, discardRef, trayRef, opponentsRef, gameState },
  fwdRef,
) {
  const [flies, setFlies]   = useState([]);
  const pixiDivRef          = useRef(null);
  const appRef              = useRef(null);
  const prevStateRef        = useRef(null);
  const dealtRef            = useRef(false);   // avoid double-deal on strict-mode double-mount

  // ── stable helpers ─────────────────────────────────────────────────────
  const addFly = useCallback((cfg) => {
    const id = ++_flySeq;
    setFlies(f => [...f, { ...cfg, id }]);
    return id;
  }, []);

  const removeFly = useCallback((id) => {
    setFlies(f => f.filter(x => x.id !== id));
  }, []);

  function getOppRect(flatIdx) {
    if (!opponentsRef?.current) return null;
    const el = opponentsRef.current.querySelectorAll('[data-opp-idx]')[flatIdx];
    return el ? ensureSize(el.getBoundingClientRect(), 60, 80) : null;
  }

  function pixiRun(fn) {
    if (appRef.current) fn(appRef.current);
  }

  // ── Pixi init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const div = pixiDivRef.current;
    if (!div) return;
    let dead = false;
    const app = new PIXI.Application();

    app.init({
      backgroundAlpha: 0, antialias: true, autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      width: window.innerWidth, height: window.innerHeight,
    }).then(() => {
      if (dead) { app.destroy(true); return; }
      Object.assign(app.canvas.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        pointerEvents: 'none',
      });
      div.appendChild(app.canvas);
      appRef.current = app;
    }).catch(() => {});

    const onResize = () => appRef.current?.renderer.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);

    return () => {
      dead = true;
      window.removeEventListener('resize', onResize);
      try { appRef.current?.destroy(true, { children: true }); } catch {}
      appRef.current = null;
    };
  }, []);

  // ── Imperative API: GameScreen calls these to trigger play / draw ──────
  useImperativeHandle(fwdRef, () => ({
    // Animate a card flying from player's hand to discard pile
    // fromRect: DOMRect captured at tap time; card: card data; onLand: called after 380ms
    animatePlay(fromRect, card, onLand) {
      const toRect = ensureSize(rectOf(discardRef), fromRect?.width ?? 58, fromRect?.height ?? 87);
      if (!fromRect || !toRect) { onLand?.(); return; }
      addFly({ fromRect, toRect, card, faceDown: false, onLand });
    },

    // Animate a face-down card flying from deck to player's tray
    animateDraw() {
      const from = ensureSize(rectOf(deckRef));
      const to   = centeredOn(trayRef, deckRef);
      if (!from || !to) return;
      addFly({ fromRect: from, toRect: to, card: BACK, faceDown: true });
    },
  }), [addFly, discardRef, deckRef, trayRef]);

  // ── Watch gameState — auto-trigger opponent / deal / effect animations ─
  useEffect(() => {
    const prev = prevStateRef.current;
    const curr = gameState;
    prevStateRef.current = curr;
    if (!curr) return;

    const deckR    = ensureSize(rectOf(deckRef));
    const discardR = ensureSize(rectOf(discardRef));
    const trayR    = rectOf(trayRef);

    const prevLen = prev?.myHand?.length ?? 0;
    const currLen = curr.myHand?.length ?? 0;

    // ── Deal animation: game start (hand was 0, now ≥ 2) ──────────────
    if (!prevLen && currLen >= 2 && !dealtRef.current) {
      dealtRef.current = true;
      if (deckR && trayR) {
        const fw = deckR.width, fh = deckR.height;
        const tw = fw, th = fh;
        const to = { left: trayR.left + trayR.width / 2 - tw / 2, top: trayR.top, width: tw, height: th };
        for (let i = 0; i < currLen; i++) {
          setTimeout(() => addFly({ fromRect: deckR, toRect: to, card: BACK, faceDown: true }), i * 95);
        }
        // Deal to opponents
        const myId = curr.myPlayerId ?? curr.players?.[0]?.id;
          const me   = curr.players?.find(p => p.id === myId);
        curr.players?.forEach((p, pi) => {
          if (me && p.id === me.id) return;
          const oppR = getOppRect(pi);
          if (!oppR || !deckR) return;
          const to2 = { left: oppR.left + oppR.width / 2 - fw / 2, top: oppR.top, width: fw, height: fh };
          for (let j = 0; j < Math.min(p.cardCount ?? 7, 7); j++) {
            setTimeout(() => addFly({ fromRect: deckR, toRect: to2, card: BACK, faceDown: true }), j * 95 + 45);
          }
        });
      }
    }

    // ── UNO: hit 1 card ───────────────────────────────────────────────
    if (currLen === 1 && prevLen === 2) {
      pixiRun(app => pixi_unoPulse(app, trayR));
    }

    // ── Stack shake: pendingDraw grew ─────────────────────────────────
    if ((curr.pendingDraw ?? 0) > (prev?.pendingDraw ?? 0)) {
      pixiRun(app => pixi_stackShake(app, discardR));
    }

    // ── Win: first winner ─────────────────────────────────────────────
    if (!prev?.winner && curr.winner) {
      pixiRun(pixi_winParticles);
    }

    // ── Opponent play / draw ──────────────────────────────────────────
    const prevPs = prev?.players ?? [];
    const currPs = curr.players ?? [];
    currPs.forEach((p, pi) => {
      const pp = prevPs.find(x => x.id === p.id);
      if (!pp) return;

      if (p.cardCount < pp.cardCount && discardR) {
        // Opponent played a card: fly from their position to discard
        const oppR = getOppRect(pi);
        if (oppR) {
          const fw = 46, fh = 69;
          const fr = { left: oppR.left + oppR.width / 2 - fw / 2, top: oppR.top + oppR.height / 2 - fh / 2, width: fw, height: fh };
          addFly({ fromRect: fr, toRect: ensureSize(discardR, fw, fh), card: BACK, faceDown: true });
        }
      } else if (p.cardCount > pp.cardCount && deckR) {
        // Opponent drew a card — skip if it's the initial deal
        if (!prevLen && currLen >= 2) return;
        const oppR = getOppRect(pi);
        if (oppR) {
          const fw = deckR.width, fh = deckR.height;
          const to = { left: oppR.left + oppR.width / 2 - fw / 2, top: oppR.top + oppR.height / 2 - fh / 2, width: fw, height: fh };
          addFly({ fromRect: deckR, toRect: to, card: BACK, faceDown: true });
        }
      }
    });

    // ── Elimination: player left mid-game ─────────────────────────────
    const elimId = prev && currPs.length < prevPs.length
      ? prevPs.find(p => !currPs.find(x => x.id === p.id))
      : null;
    if (elimId) {
      const pi  = prevPs.findIndex(x => x.id === elimId.id);
      const opp = getOppRect(pi);
      pixiRun(app => pixi_eliminationBurst(app, opp ?? deckR));
    }

  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Pixi canvas — particles & glow effects only */}
      <div
        ref={pixiDivRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}
      />

      {/* Portal flying cards — real Card components in transit */}
      {flies.map(fly => (
        <FlyingCard
          key={fly.id}
          fromRect={fly.fromRect}
          toRect={fly.toRect}
          card={fly.card}
          faceDown={fly.faceDown}
          onComplete={() => {
            removeFly(fly.id);
            fly.onLand?.();
          }}
        />
      ))}
    </>
  );
});
