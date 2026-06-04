import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

// ── Card dimensions matching the React UI ─────────────────────────────────
const CW = 58;
const CH = 87;
const RADIUS = 8;

// ── Pixi hex colors ───────────────────────────────────────────────────────
const C = {
  red:    0xDC2626,
  green:  0x16A34A,
  blue:   0x2563EB,
  yellow: 0xD97706,
  wild:   0x7C3AED,
  back:   0x3B1A7A,
};

// ── Easing functions ──────────────────────────────────────────────────────
function easeOutCubic(t)    { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t)  { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
function easeOutBack(t)     { const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); }

// ── Helper: center of a DOM ref ───────────────────────────────────────────
function rectOf(ref) {
  if (!ref?.current) return null;
  const r = ref.current.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// ── Helper: draw a card sprite (Graphics) ────────────────────────────────
function makeCardSprite(color = 'back') {
  const g   = new PIXI.Graphics();
  const hex = C[color] ?? C.wild;

  // shadow layer
  g.roundRect(-CW / 2 + 3, -CH / 2 + 3, CW, CH, RADIUS);
  g.fill({ color: 0x000000, alpha: 0.35 });

  // card body
  g.roundRect(-CW / 2, -CH / 2, CW, CH, RADIUS);
  g.fill({ color: hex });

  // highlight border
  g.roundRect(-CW / 2 + 1, -CH / 2 + 1, CW - 2, CH - 2, RADIUS - 1);
  g.stroke({ color: 0xffffff, alpha: 0.22, width: 1.5 });

  // inner oval (UNO-style logo mark)
  g.ellipse(0, 0, CW * 0.32, CH * 0.2);
  g.fill({ color: 0xffffff, alpha: color === 'back' ? 0.12 : 0.2 });

  return g;
}

// ── Quadratic bezier interpolation ───────────────────────────────────────
function qbez(t, p0, cp, p1) {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * cp + t * t * p1;
}

// ── Fly a card from point A to B along a bezier arc ───────────────────────
function flyCard(app, { from, to, color = 'back', duration = 0.55, delay = 0, onLand }) {
  if (!app) return;

  const card = makeCardSprite(color);
  card.x = from.x;
  card.y = from.y;
  card.alpha = 0;
  app.stage.addChild(card);

  const cpX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 80;
  const cpY = Math.min(from.y, to.y) - 110 - Math.random() * 50;
  const dir = to.x > from.x ? 1 : -1;
  let elapsed = -delay;

  const fn = (ticker) => {
    elapsed += (ticker.deltaMS ?? ticker.deltaTime * (1000 / 60)) / 1000;
    if (elapsed < 0) return;

    const t = Math.min(elapsed / duration, 1);
    const e = easeInOutCubic(t);

    card.x       = qbez(e, from.x, cpX, to.x);
    card.y       = qbez(e, from.y, cpY, to.y);
    card.rotation = e * Math.PI * 2 * dir;
    card.alpha    = t < 0.1 ? t * 10 : t > 0.82 ? (1 - t) / 0.18 : 1;

    if (t >= 1) {
      app.ticker.remove(fn);
      app.stage.removeChild(card);
      card.destroy();
      onLand?.();
    }
  };

  app.ticker.add(fn);
  return () => { try { app.ticker.remove(fn); app.stage.removeChild(card); card.destroy(); } catch {} };
}

// ── Deal N cards from deck to tray with staggered delay ───────────────────
function dealCards(app, from, to, count) {
  for (let i = 0; i < count; i++) {
    flyCard(app, { from, to, color: 'back', duration: 0.4, delay: i * 0.11 });
  }
}

// ── Win particle explosion ─────────────────────────────────────────────────
function winParticles(app) {
  if (!app) return;
  const cx = app.renderer.width / (window.devicePixelRatio || 1) / 2;
  const cy = app.renderer.height / (window.devicePixelRatio || 1) / 2;
  const colors = [0xF43F5E, 0x22C55E, 0x60A5FA, 0xFCD34D, 0xA78BFA, 0xFB923C];

  for (let i = 0; i < 55; i++) {
    const p = new PIXI.Graphics();
    const w = 5 + Math.random() * 8;
    const h = 5 + Math.random() * 8;
    p.rect(-w / 2, -h / 2, w, h);
    p.fill({ color: colors[Math.floor(Math.random() * colors.length)] });
    p.x  = cx + (Math.random() - 0.5) * 80;
    p.y  = cy + (Math.random() - 0.5) * 40;
    app.stage.addChild(p);

    const vx  = (Math.random() - 0.5) * 9;
    const vy0 = -Math.random() * 13 - 5;
    const rot = (Math.random() - 0.5) * 0.25;
    let t = 0;

    const fn = (ticker) => {
      t += (ticker.deltaMS ?? ticker.deltaTime * (1000 / 60)) / 1000;
      p.x       += vx;
      p.y       += vy0 + t * 18; // gravity
      p.alpha    = Math.max(0, 1 - t / 1.4);
      p.rotation += rot;
      if (p.alpha <= 0) {
        app.ticker.remove(fn);
        try { app.stage.removeChild(p); p.destroy(); } catch {}
      }
    };
    app.ticker.add(fn);
  }
}

// ── UNO light pulse on tray ───────────────────────────────────────────────
function unoPulse(app, trayPos) {
  if (!app || !trayPos) return;
  const ring = new PIXI.Graphics();
  app.stage.addChild(ring);
  let t = 0;

  const fn = (ticker) => {
    t += (ticker.deltaMS ?? ticker.deltaTime * (1000 / 60)) / 1000;
    const progress = Math.min(t / 0.65, 1);
    const radius   = 60 + progress * 80;
    ring.clear();
    ring.circle(trayPos.x, trayPos.y, radius);
    ring.stroke({ color: 0xF43F5E, alpha: (1 - progress) * 0.8, width: 3 });

    if (progress >= 1) {
      app.ticker.remove(fn);
      try { app.stage.removeChild(ring); ring.destroy(); } catch {}
    }
  };
  app.ticker.add(fn);
}

// ── Stack shake: 3 quick nudges on discard pile ───────────────────────────
function stackShake(app, discardPos) {
  if (!app || !discardPos) return;
  const orb = new PIXI.Graphics();
  orb.circle(0, 0, CW / 2 + 8);
  orb.stroke({ color: 0xEF4444, alpha: 0.9, width: 2.5 });
  orb.x = discardPos.x;
  orb.y = discardPos.y;
  app.stage.addChild(orb);
  let t = 0;

  const fn = (ticker) => {
    t += (ticker.deltaMS ?? ticker.deltaTime * (1000 / 60)) / 1000;
    orb.x       = discardPos.x + Math.sin(t * 48) * 8 * Math.max(0, 1 - t / 0.45);
    orb.alpha   = Math.max(0, 1 - t / 0.5);
    if (t >= 0.5) {
      app.ticker.remove(fn);
      try { app.stage.removeChild(orb); orb.destroy(); } catch {}
    }
  };
  app.ticker.add(fn);
}

// ── Main component ─────────────────────────────────────────────────────────
export function CardAnimationLayer({ deckRef, discardRef, trayRef, opponentsRef, gameState }) {
  const containerRef  = useRef(null);
  const appRef        = useRef(null);
  const prevStateRef  = useRef(null);
  const pendingRef    = useRef([]);   // queue of animations while app is initializing

  // ── Initialize Pixi application ──────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    const app = new PIXI.Application();

    app.init({
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      width:  window.innerWidth,
      height: window.innerHeight,
    }).then(() => {
      if (destroyed) { app.destroy(true); return; }

      app.canvas.style.position       = 'absolute';
      app.canvas.style.top            = '0';
      app.canvas.style.left           = '0';
      app.canvas.style.width          = '100%';
      app.canvas.style.height         = '100%';
      app.canvas.style.pointerEvents  = 'none';
      container.appendChild(app.canvas);
      appRef.current = app;

      // Drain queued animations
      pendingRef.current.forEach(fn => fn(app));
      pendingRef.current = [];
    }).catch(() => {});

    // Resize canvas when window resizes
    const onResize = () => {
      if (!appRef.current) return;
      appRef.current.renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      destroyed = true;
      window.removeEventListener('resize', onResize);
      if (appRef.current) {
        try { appRef.current.destroy(true, { children: true }); } catch {}
        appRef.current = null;
      }
    };
  }, []);

  // ── Helper: run fn now or enqueue if app not ready ────────────────────────
  function run(fn) {
    if (appRef.current) {
      fn(appRef.current);
    } else {
      pendingRef.current.push(fn);
    }
  }

  // ── Get opponent element center by index ──────────────────────────────────
  function getOpponentPos(idx) {
    if (!opponentsRef?.current) return null;
    const items = opponentsRef.current.querySelectorAll('[data-opp-idx]');
    const el = items[idx];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // ── Detect gameState changes and trigger animations ───────────────────────
  useEffect(() => {
    const prev = prevStateRef.current;
    const curr = gameState;
    prevStateRef.current = curr;

    if (!curr) return;

    const deckPos    = rectOf(deckRef);
    const discardPos = rectOf(discardRef);
    const trayPos    = rectOf(trayRef);

    // ── Deal: game just started (hand went from 0/null to 7) ─────────────────
    if (!prev?.myHand?.length && (curr.myHand?.length ?? 0) >= 7) {
      if (deckPos && trayPos) {
        run(app => dealCards(app, deckPos, trayPos, curr.myHand.length));
      }
      return; // skip other checks on initial deal
    }

    // ── Card played by ME: topCard changed ───────────────────────────────────
    if (prev?.topCard?.id !== curr.topCard?.id && curr.topCard && prev?.topCard) {
      if (trayPos && discardPos) {
        run(app => flyCard(app, {
          from: trayPos,
          to:   discardPos,
          color: curr.topCard.color === 'wild' ? 'wild' : curr.topCard.color,
          duration: 0.5,
        }));
      }
    }

    // ── Card drawn (my hand grew by 1) ────────────────────────────────────────
    const prevLen = prev?.myHand?.length ?? 0;
    const currLen = curr.myHand?.length ?? 0;
    if (currLen === prevLen + 1 && deckPos && trayPos) {
      run(app => flyCard(app, {
        from: deckPos,
        to:   trayPos,
        color: 'back',
        duration: 0.42,
      }));
    }

    // ── UNO: I just hit 1 card ─────────────────────────────────────────────────
    if (currLen === 1 && prevLen === 2 && trayPos) {
      run(app => unoPulse(app, trayPos));
    }

    // ── Stack shake: pendingDraw increased ────────────────────────────────────
    if ((curr.pendingDraw ?? 0) > (prev?.pendingDraw ?? 0) && discardPos) {
      run(app => stackShake(app, discardPos));
    }

    // ── Win: first time winner appears ────────────────────────────────────────
    if (!prev?.winner && curr.winner) {
      run(app => winParticles(app));
    }

    // ── Opponent card played (count dropped) ──────────────────────────────────
    const prevPlayers = prev?.players ?? [];
    const currPlayers = curr.players ?? [];
    currPlayers.forEach((p, idx) => {
      const pp = prevPlayers.find(x => x.id === p.id);
      if (!pp) return;
      if (p.cardCount < pp.cardCount && discardPos) {
        const oppPos = getOpponentPos(idx);
        if (oppPos) {
          run(app => flyCard(app, {
            from: oppPos,
            to:   discardPos,
            color: curr.topCard?.color === 'wild' ? 'wild' : (curr.topCard?.color ?? 'back'),
            duration: 0.5,
          }));
        }
      } else if (p.cardCount > pp.cardCount && deckPos) {
        const oppPos = getOpponentPos(idx);
        if (oppPos) {
          run(app => flyCard(app, {
            from: deckPos,
            to:   oppPos,
            color: 'back',
            duration: 0.42,
          }));
        }
      }
    });
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        9999,
        overflow:      'hidden',
      }}
    />
  );
}
