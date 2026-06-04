import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../components/Card';

// ── Easing: power3 out ────────────────────────────────────────────────────
function p3out(t) { return 1 - (1 - t) ** 3; }

// ── Quadratic bezier ──────────────────────────────────────────────────────
function qbez(t, p0, cp, p1) {
  const m = 1 - t;
  return m * m * p0 + 2 * m * t * cp + t * t * p1;
}

// ── FlyingCard: portal-rendered real Card flying along a bezier arc ───────
// fromRect / toRect: DOMRect (or compatible) from getBoundingClientRect()
// card: card data object (same shape as the rest of the app)
// faceDown: show back of card
// duration: ms
// onComplete: called when animation finishes
export function FlyingCard({ fromRect, toRect, card, faceDown = false, duration = 380, onComplete }) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) { onComplete?.(); return; }

    // Centers of start / end rects
    const sx = fromRect.left + fromRect.width  / 2;
    const sy = fromRect.top  + fromRect.height / 2;
    const ex = toRect.left   + toRect.width    / 2;
    const ey = toRect.top    + toRect.height   / 2;

    // Arc control point — apex proportional to distance
    const dist = Math.hypot(ex - sx, ey - sy);
    const cpX  = (sx + ex) / 2;
    const cpY  = (sy + ey) / 2 - Math.max(55, dist * 0.38);

    // Spin direction based on horizontal travel
    const dir = ex >= sx ? 1 : -1;

    let t0 = null;
    let raf = null;
    let done = false;

    function frame(ts) {
      if (!t0) t0 = ts;
      const t = Math.min((ts - t0) / duration, 1);
      const e = p3out(t);

      // Card center in viewport space
      const cx = qbez(e, sx, cpX, ex);
      const cy = qbez(e, sy, cpY, ey);

      // Translate so card is centered on that point (el is top:0 left:0)
      const tx = cx - fromRect.width  / 2;
      const ty = cy - fromRect.height / 2;

      // Spin: ramps up then eases back, settle at ~15° tilt max
      const spin = dir * 300 * e * (1 - e * 0.55);

      el.style.transform = `translate(${tx}px, ${ty}px) rotate(${spin}deg)`;
      // Fade out last 20%
      el.style.opacity   = t > 0.8 ? String(Math.max(0, (1 - t) / 0.2)) : '1';

      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else if (!done) {
        done = true;
        onComplete?.();
      }
    }

    raf = requestAnimationFrame(frame);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use fromRect dimensions for the flying card size
  const w = Math.max(36, Math.round(fromRect.width));
  const h = Math.max(54, Math.round(fromRect.height));

  return createPortal(
    <div
      ref={elRef}
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        width:           w,
        height:          h,
        willChange:      'transform, opacity',
        pointerEvents:   'none',
        zIndex:          99999,
        transformOrigin: 'center center',
      }}
    >
      <Card card={card} faceDown={faceDown} customW={w} customH={h} />
    </div>,
    document.body,
  );
}
