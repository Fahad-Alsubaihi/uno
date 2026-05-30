import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── SVG helpers ── */
function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx, cy, r, startDeg, endDeg) {
  if (endDeg - startDeg >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
  }
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function truncate(str, n) {
  return str && str.length > n ? str.slice(0, n) + '…' : str;
}

/* ── Wheel SVG ── */
function WheelSVG({ segments }) {
  const SIZE = 300;
  const CX = 150;
  const CY = 150;
  const R = 138;
  const LABEL_R = 90;

  const total = segments.reduce((s, g) => s + g.size, 0);
  let cumAngle = 0;

  const slices = segments.map((seg) => {
    const span = total > 0 ? (seg.size / total) * 360 : 360 / segments.length;
    const start = cumAngle;
    const end = cumAngle + span;
    const mid = start + span / 2;
    cumAngle = end;
    const labelPos = polarToXY(CX, CY, LABEL_R, mid);
    return { ...seg, start, end, mid, span, labelPos };
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block', filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.4))' }}>
      {slices.map((sl) => {
        const textRot = sl.mid;
        const isSmall = sl.span < 25;
        const label = sl.type === 'luck'
          ? (sl.text === 'retry' ? '🍀' : '🔄')
          : truncate(sl.text, isSmall ? 4 : 8);
        const sizeLabel = sl.type === 'punishment' ? '★'.repeat(sl.size) : null;

        return (
          <g key={sl.id}>
            {/* Slice */}
            <path
              d={slicePath(CX, CY, R, sl.start, sl.end)}
              fill={sl.color}
              stroke="#0F0F23"
              strokeWidth={2}
            />
            {/* Highlight */}
            <path
              d={slicePath(CX, CY, R, sl.start, sl.end)}
              fill="url(#shine)"
              stroke="none"
            />
            {/* Label group rotated to face outward */}
            <g transform={`rotate(${textRot}, ${CX}, ${CY})`}>
              <text
                x={CX}
                y={CY - LABEL_R}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.95)"
                fontSize={isSmall ? 9 : 11}
                fontFamily="'Chakra Petch', sans-serif"
                fontWeight="600"
              >
                {label}
              </text>
              {sizeLabel && !isSmall && (
                <text
                  x={CX}
                  y={CY - LABEL_R + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.55)"
                  fontSize={8}
                >
                  {sizeLabel}
                </text>
              )}
            </g>
          </g>
        );
      })}

      {/* Shine gradient overlay */}
      <defs>
        <radialGradient id="shine" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Outer ring */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />

      {/* Center hub */}
      <circle cx={CX} cy={CY} r={32} fill="#0F0F23" />
      <circle cx={CX} cy={CY} r={26} fill="#1E1B4B" stroke="rgba(167,139,250,0.4)" strokeWidth={2} />
      <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
        fill="#A78BFA" fontSize={11} fontFamily="'Russo One', sans-serif">
        UNO
      </text>
    </svg>
  );
}

/* ── Result banner ── */
const RESULT_STYLE = {
  execute: { bg: '#EF4444', border: '#FCA5A5', glow: 'rgba(239,68,68,0.6)', label: 'ينفذ العقوبة!' },
  retry:   { bg: '#7C3AED', border: '#C4B5FD', glow: 'rgba(124,58,237,0.6)', label: '🍀 حاول مرة أخرى' },
  reverse: { bg: '#2563EB', border: '#93C5FD', glow: 'rgba(37,99,235,0.6)',  label: '🔄 تنقلب على الفائز' },
};

/* ── Main component ── */
export function PunishmentWheel({ open, segments = [], wheelResult, loser, winner, playerId, onSpin, onClose }) {
  const [spinTo, setSpinTo]   = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const prevResult = useRef(null);

  // When a new wheel-result arrives, animate the wheel
  useEffect(() => {
    if (!wheelResult || wheelResult === prevResult.current) return;
    prevResult.current = wheelResult;
    setRevealed(false);
    setSpinTo(wheelResult.stopAngle);
    setSpinning(true);
    const t = setTimeout(() => { setSpinning(false); setRevealed(true); }, 4200);
    return () => clearTimeout(t);
  }, [wheelResult?.stopAngle]);

  // Reset when wheel closes
  useEffect(() => {
    if (!open) {
      setSpinTo(0);
      setSpinning(false);
      setRevealed(false);
      prevResult.current = null;
    }
  }, [open]);

  const isLoser  = loser?.id === playerId;
  const rs = wheelResult ? RESULT_STYLE[wheelResult.type] : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(5,3,20,0.95)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 500, padding: '20px 16px', direction: 'rtl',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, color: '#F43F5E', letterSpacing: 3, marginBottom: 4 }}>
              عجلة العقوبات
            </div>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              {loser?.name} — حان وقتك! 🎯
            </div>
          </motion.div>

          {/* Wheel + Pointer */}
          <div style={{ position: 'relative', width: 300, height: 300, marginBottom: 20, flexShrink: 0 }}>
            {/* Pointer (fixed, above wheel) */}
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
            }}>
              <svg width={22} height={28} viewBox="0 0 22 28">
                <polygon points="11,0 0,28 22,28" fill="#fff" />
                <polygon points="11,4 3,26 19,26" fill="#1E1B4B" />
              </svg>
            </div>

            {/* Spinning wheel */}
            <motion.div
              animate={{ rotate: spinTo }}
              transition={spinning
                ? { duration: 4, ease: [0.04, 0.6, 0.25, 1] }
                : { duration: 0 }}
              style={{ width: 300, height: 300 }}
            >
              <WheelSVG segments={segments} />
            </motion.div>
          </div>

          {/* Spin button or waiting */}
          <AnimatePresence mode="wait">
            {!wheelResult && !spinning && (
              <motion.div
                key="spin-btn"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ marginBottom: 16, textAlign: 'center' }}
              >
                {isLoser ? (
                  <motion.button
                    whileHover={{ scale: 1.06, boxShadow: '0 0 30px rgba(244,63,94,0.7)' }}
                    whileTap={{ scale: 0.94 }}
                    onClick={onSpin}
                    style={{
                      background: 'linear-gradient(135deg,#F43F5E,#BE123C)',
                      border: 'none', borderRadius: 14, padding: '14px 44px',
                      fontFamily: 'var(--font-head)', fontSize: 20, letterSpacing: 3,
                      color: '#fff', cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(244,63,94,0.5)',
                    }}
                  >
                    أدر العجلة!
                  </motion.button>
                ) : (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.4 }}
                    style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#64748B', letterSpacing: 2 }}
                  >
                    في انتظار {loser?.name} للدوران…
                  </motion.div>
                )}
              </motion.div>
            )}

            {spinning && (
              <motion.div
                key="spinning-anim"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ marginBottom: 16 }}
              >
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.6 }}
                  style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: '#A78BFA', letterSpacing: 3, textAlign: 'center' }}
                >
                  تدور…
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {revealed && rs && wheelResult && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                style={{
                  background: rs.bg,
                  border: `2px solid ${rs.border}`,
                  borderRadius: 16,
                  padding: '18px 28px',
                  textAlign: 'center',
                  boxShadow: `0 0 40px ${rs.glow}`,
                  marginBottom: 16,
                  maxWidth: 320,
                  width: '100%',
                }}
              >
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#fff', letterSpacing: 2, marginBottom: 6 }}>
                  {rs.label}
                </div>

                {wheelResult.type === 'execute' && (
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                    {wheelResult.segment?.text}
                    {wheelResult.forced && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                        (بعد 3 محاولات 🎲)
                      </div>
                    )}
                  </div>
                )}

                {wheelResult.type === 'retry' && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    محاولة {wheelResult.retryCount} من 3
                  </div>
                )}

                {wheelResult.type === 'reverse' && (
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                    <strong>{winner?.name || wheelResult.winnerName}</strong> ينفذ:
                    <br />
                    {wheelResult.punishment}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons after result */}
          <AnimatePresence>
            {revealed && wheelResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
              >
                {wheelResult.type === 'retry' && isLoser && (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setRevealed(false); onSpin(); }}
                    style={{
                      background: '#7C3AED', border: 'none', borderRadius: 10,
                      padding: '11px 28px', color: '#fff',
                      fontFamily: 'var(--font-head)', fontSize: 14, cursor: 'pointer', letterSpacing: 1,
                      boxShadow: '0 0 16px rgba(124,58,237,0.5)',
                    }}
                  >
                    🍀 أدر مرة أخرى
                  </motion.button>
                )}
                {wheelResult.type !== 'retry' && (
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={onClose}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10, padding: '11px 28px', color: '#94A3B8',
                      fontFamily: 'var(--font-head)', fontSize: 14, cursor: 'pointer', letterSpacing: 1,
                    }}
                  >
                    إغلاق
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
