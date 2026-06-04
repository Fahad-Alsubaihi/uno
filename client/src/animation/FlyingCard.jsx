import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { Card } from '../components/Card';

// Quadratic bezier: gives us a natural arc path without MotionPathPlugin
function qbez(t, p0, cp, p1) {
  const m = 1 - t;
  return m * m * p0 + 2 * m * t * cp + t * t * p1;
}

/**
 * Portal-rendered real Card that flies along a bezier arc via GSAP.
 *
 * fromRect / toRect  — DOMRect from getBoundingClientRect()
 * card               — card data object
 * faceDown           — start face-down
 * flipOnArrive       — if true, do rotateY 0→90→0 flip at destination, revealing the face
 * duration           — flight time in seconds (default 0.38)
 * onComplete         — called after animation (and optional flip) finishes
 */
export function FlyingCard({
  fromRect,
  toRect,
  card,
  faceDown: initialFaceDown = false,
  flipOnArrive = false,
  duration = 0.38,
  onComplete,
}) {
  const wrapRef = useRef(null);
  const backRef = useRef(null);
  const faceRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) { onComplete?.(); return; }

    const w  = wrap.offsetWidth;
    const h  = wrap.offsetHeight;
    const sx = fromRect.left + fromRect.width  / 2;
    const sy = fromRect.top  + fromRect.height / 2;
    const ex = toRect.left   + toRect.width    / 2;
    const ey = toRect.top    + toRect.height   / 2;

    // Arc control point — apex scales with distance
    const dist = Math.hypot(ex - sx, ey - sy);
    const cpX  = (sx + ex) / 2;
    const cpY  = (sy + ey) / 2 - Math.max(60, dist * 0.38);
    const dir  = ex >= sx ? 1 : -1;

    // Snap to start position immediately
    gsap.set(wrap, { x: sx - w / 2, y: sy - h / 2, rotation: 0, opacity: 1 });

    // quickSetters — direct DOM writes per frame, ~3× faster than gsap.set()
    const setX   = gsap.quickSetter(wrap, 'x', 'px');
    const setY   = gsap.quickSetter(wrap, 'y', 'px');
    const setRot = gsap.quickSetter(wrap, 'rotation', 'deg');
    const setOpa = gsap.quickSetter(wrap, 'opacity');

    // ── After flight: optional flip reveal ────────────────────────────────
    function doFlipOrComplete() {
      if (!flipOnArrive) { onComplete?.(); return; }

      const back = backRef.current;
      const face = faceRef.current;
      // Snap to exact destination, remove spin
      gsap.set(wrap, { x: ex - w / 2, y: ey - h / 2, rotation: 0, opacity: 1 });

      if (!back || !face) { onComplete?.(); return; }

      // Phase 1: back half-turn (0° → 90°)
      gsap.to(back, {
        rotationY: 90,
        duration: 0.11,
        ease: 'power2.in',
        onComplete() {
          gsap.set(back, { opacity: 0 });
          gsap.set(face, { rotationY: -90, opacity: 1 });
          // Phase 2: face completes the flip (-90° → 0°)
          gsap.to(face, {
            rotationY: 0,
            duration: 0.11,
            ease: 'power2.out',
            onComplete() {
              // Brief pause, then fade out so the real card in hand takes over
              gsap.to(wrap, {
                opacity: 0,
                duration: 0.08,
                delay: 0.06,
                onComplete: () => onComplete?.(),
              });
            },
          });
        },
      });
    }

    // ── Main flight tween ─────────────────────────────────────────────────
    const obj   = { t: 0 };
    const tween = gsap.to(obj, {
      t: 1,
      duration,
      ease: 'power3.out',
      onUpdate() {
        const t  = obj.t;
        setX(qbez(t, sx, cpX, ex) - w / 2);
        setY(qbez(t, sy, cpY, ey) - h / 2);
        setRot(dir * 280 * t * (1 - t * 0.55));
        if (!flipOnArrive) setOpa(t > 0.8 ? Math.max(0, (1 - t) / 0.2) : 1);
      },
      onComplete: doFlipOrComplete,
    });

    return () => { tween.kill(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const w = Math.max(36, Math.round(fromRect.width));
  const h = Math.max(54, Math.round(fromRect.height));

  return createPortal(
    <div
      ref={wrapRef}
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
      {flipOnArrive ? (
        <>
          {/* Back face — visible during flight */}
          <div ref={backRef} style={{ position: 'absolute', inset: 0 }}>
            <Card card={card} faceDown={true} customW={w} customH={h} />
          </div>
          {/* Front face — shown during flip reveal */}
          <div ref={faceRef} style={{ position: 'absolute', inset: 0, opacity: 0 }}>
            <Card card={card} faceDown={false} customW={w} customH={h} />
          </div>
        </>
      ) : (
        <Card card={card} faceDown={initialFaceDown} customW={w} customH={h} />
      )}
    </div>,
    document.body,
  );
}
