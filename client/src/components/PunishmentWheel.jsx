import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SEGMENTS = {
  execute: { label: 'ينفذ العقوبة!',            color: '#F43F5E', glow: '#F43F5E' },
  retry:   { label: 'حظ — حاول مرة أخرى',      color: '#7C3AED', glow: '#A78BFA' },
  reverse: { label: 'العقوبة تنقلب على الفائز', color: '#0891B2', glow: '#22D3EE' },
};

function buildGradient(wo) {
  const eA = wo.execute * 3.6;
  const rA = wo.retry   * 3.6;
  return `conic-gradient(from -90deg,
    #F43F5E 0deg ${eA}deg,
    #7C3AED ${eA}deg ${eA + rA}deg,
    #0891B2 ${eA + rA}deg 360deg)`;
}

// Returns degrees to rotate so the given result segment is at the top
function calcStopAngle(result, wo) {
  const eA = wo.execute * 3.6;
  const rA = wo.retry   * 3.6;
  const starts = { execute: 0, retry: eA, reverse: eA + rA };
  const sizes  = { execute: eA, retry: rA, reverse: wo.reverse * 3.6 };
  const center = starts[result] + sizes[result] / 2;
  return (360 - center + 360) % 360;
}

export function PunishmentWheel({ open, wheelResult, loser, playerId, onSpin, onClose, punishment }) {
  const [spinning, setSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const wo = punishment?.wheelOptions || { execute: 60, retry: 20, reverse: 20 };

  const isLoser = loser?.id === playerId;

  useEffect(() => {
    if (wheelResult && !revealed) {
      const stop = calcStopAngle(wheelResult.result, wo);
      const total = 5 * 360 + stop;
      setSpinAngle(total);
      setSpinning(true);
      const t = setTimeout(() => { setSpinning(false); setRevealed(true); }, 3200);
      return () => clearTimeout(t);
    }
  }, [wheelResult]);

  useEffect(() => {
    if (!open) { setSpinning(false); setSpinAngle(0); setRevealed(false); }
  }, [open]);

  const seg = wheelResult ? SEGMENTS[wheelResult.result] : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', zIndex: 500, padding: 24, direction: 'rtl',
          }}
        >
          {/* Title */}
          <motion.h2
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(18px,4vw,28px)', color: '#F43F5E', letterSpacing: 3, marginBottom: 6, textAlign: 'center' }}
          >
            عجلة العقوبات
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ color: '#94A3B8', fontSize: 14, marginBottom: 20, textAlign: 'center' }}
          >
            {loser?.name} يدير العجلة
          </motion.p>

          {/* Penalty card */}
          {punishment?.currentPenalty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 12, padding: '10px 20px', marginBottom: 20,
                fontFamily: 'var(--font-body)', fontSize: 14, color: '#CBD5E1', textAlign: 'center',
                maxWidth: 320,
              }}
            >
              <span style={{ color: '#A78BFA', fontSize: 11, letterSpacing: 2, display: 'block', marginBottom: 4 }}>العقوبة</span>
              {punishment.currentPenalty}
            </motion.div>
          )}

          {/* Wheel */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            {/* Pointer */}
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '18px solid #fff',
              zIndex: 10, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }} />

            <motion.div
              animate={{ rotate: spinAngle }}
              transition={spinning
                ? { duration: 3, ease: [0.1, 0.5, 0.3, 1] }
                : { duration: 0 }}
              style={{
                width: 260, height: 260, borderRadius: '50%',
                background: buildGradient(wo),
                border: '4px solid rgba(255,255,255,0.15)',
                boxShadow: '0 0 40px rgba(124,58,237,0.4)',
                position: 'relative',
              }}
            >
              {/* Segment labels inside wheel */}
              {[
                { key: 'execute', angle: wo.execute * 1.8 - 90 },
                { key: 'retry',   angle: wo.execute * 3.6 + wo.retry * 1.8 - 90 },
                { key: 'reverse', angle: (wo.execute + wo.retry) * 3.6 + wo.reverse * 1.8 - 90 },
              ].map(({ key, angle }) => (
                <div key={key} style={{
                  position: 'absolute', width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: `rotate(${angle}deg)`,
                  pointerEvents: 'none',
                }}>
                  <span style={{
                    position: 'absolute', top: '12%',
                    fontFamily: 'var(--font-head)', fontSize: 10,
                    color: 'rgba(255,255,255,0.9)', letterSpacing: 1,
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    whiteSpace: 'nowrap',
                    transform: `rotate(${-angle}deg)`,
                  }}>
                    {SEGMENTS[key].label.split(' ')[0]}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Center hub */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: '#0F0F23', border: '3px solid rgba(255,255,255,0.3)',
              zIndex: 5,
            }} />
          </div>

          {/* Spin button (loser only) or waiting */}
          {!wheelResult && (
            isLoser ? (
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: '0 0 30px rgba(244,63,94,0.7)' }}
                whileTap={{ scale: 0.94 }}
                onClick={onSpin}
                style={{
                  background: 'linear-gradient(135deg,#F43F5E,#BE123C)',
                  border: 'none', borderRadius: 14, padding: '14px 40px',
                  fontFamily: 'var(--font-head)', fontSize: 18, letterSpacing: 3,
                  color: '#fff', cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(244,63,94,0.5)',
                }}
              >
                أدر العجلة!
              </motion.button>
            ) : (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#64748B', letterSpacing: 2 }}
              >
                في انتظار {loser?.name}…
              </motion.div>
            )
          )}

          {/* Result */}
          <AnimatePresence>
            {revealed && seg && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  background: seg.color, border: `2px solid ${seg.glow}`,
                  borderRadius: 14, padding: '16px 32px', textAlign: 'center',
                  boxShadow: `0 0 30px ${seg.glow}60`, marginTop: 4,
                }}
              >
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: '#fff', letterSpacing: 2, marginBottom: 6 }}>
                  {seg.label}
                </div>
                {wheelResult.result === 'retry' && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                    محاولة {wheelResult.retryCount}/3
                  </div>
                )}
                {wheelResult.result === 'reverse' && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                    {wheelResult.winnerName} ينفذ العقوبة
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Retry spin or close */}
          {revealed && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {wheelResult?.result === 'retry' && isLoser && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setRevealed(false); setSpinAngle(0); onSpin(); }}
                  style={{
                    background: '#7C3AED', border: 'none', borderRadius: 10,
                    padding: '10px 24px', color: '#fff',
                    fontFamily: 'var(--font-head)', fontSize: 14, cursor: 'pointer', letterSpacing: 1,
                  }}
                >
                  حاول مرة أخرى
                </motion.button>
              )}
              {wheelResult?.result !== 'retry' && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 10, padding: '10px 24px', color: '#94A3B8',
                    fontFamily: 'var(--font-head)', fontSize: 14, cursor: 'pointer', letterSpacing: 1,
                  }}
                >
                  إغلاق
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
