import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

function WheelSVG({ segments, size = 280 }) {
  const CX = size / 2;
  const CY = size / 2;
  const R  = size / 2 - 10;
  const LABEL_R = R * 0.62;

  const total = segments.reduce((s, g) => s + g.size, 0);
  let cumAngle = 0;

  const slices = segments.map(seg => {
    const span  = total > 0 ? (seg.size / total) * 360 : 360 / segments.length;
    const start = cumAngle;
    const end   = cumAngle + span;
    const mid   = start + span / 2;
    cumAngle    = end;
    return { ...seg, start, end, mid, span };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}>
      <defs>
        <radialGradient id="shine" cx="40%" cy="35%" r="70%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {slices.map(sl => {
        const isSmall = sl.span < 22;
        const label   = sl.type === 'luck'
          ? (sl.text === 'retry' ? '🍀' : '🔄')
          : truncate(sl.text, isSmall ? 3 : 7);
        // حجم / احتمالية كرقم بدل نجوم
        const sizeLabel = sl.type === 'punishment' && !isSmall ? `${sl.size}/5` : null;

        return (
          <g key={sl.id}>
            <path d={slicePath(CX, CY, R, sl.start, sl.end)} fill={sl.color} stroke="#0F0F23" strokeWidth={1.5} />
            <path d={slicePath(CX, CY, R, sl.start, sl.end)} fill="url(#shine)" stroke="none" />
            <g transform={`rotate(${sl.mid}, ${CX}, ${CY})`}>
              <text
                x={CX} y={CY - LABEL_R}
                textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.95)"
                fontSize={isSmall ? 8 : 10}
                fontFamily="'Chakra Petch', sans-serif"
                fontWeight="600"
              >{label}</text>
              {sizeLabel && (
                <text
                  x={CX} y={CY - LABEL_R + 13}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize={8}
                >{sizeLabel}</text>
              )}
            </g>
          </g>
        );
      })}

      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2.5} />
      <circle cx={CX} cy={CY} r={28} fill="#0F0F23" />
      <circle cx={CX} cy={CY} r={22} fill="#1E1B4B" stroke="rgba(167,139,250,0.4)" strokeWidth={1.5} />
      <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
        fill="#A78BFA" fontSize={9} fontFamily="'Russo One', sans-serif">UNO</text>
    </svg>
  );
}

const RESULT_STYLE = {
  execute: { bg: '#991B1B', border: '#EF4444', glow: 'rgba(239,68,68,0.5)', label: 'ينفذ العقوبة!' },
  retry:   { bg: '#4C1D95', border: '#8B5CF6', glow: 'rgba(124,58,237,0.5)', label: '🍀 حاول مرة أخرى' },
  reverse: { bg: '#1E3A8A', border: '#3B82F6', glow: 'rgba(37,99,235,0.5)',  label: '🔄 تنقلب على الفائز' },
};

export function PunishmentWheel({ open, segments = [], wheelResult, loser, winner, playerId, onSpin, onClose, onGrantSecondChance }) {
  const [spinTo, setSpinTo]     = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const prevResult = useRef(null);

  // حجم العجلة حسب الشاشة
  const wheelSize = typeof window !== 'undefined'
    ? Math.min(window.innerWidth - 40, 300)
    : 280;

  useEffect(() => {
    if (!wheelResult || wheelResult === prevResult.current) return;
    prevResult.current = wheelResult;
    setRevealed(false);
    setSpinTo(wheelResult.stopAngle);
    setSpinning(true);
    const t = setTimeout(() => { setSpinning(false); setRevealed(true); }, 4200);
    return () => clearTimeout(t);
  }, [wheelResult?.stopAngle]);

  useEffect(() => {
    if (!open) {
      setSpinTo(0); setSpinning(false);
      setRevealed(false); prevResult.current = null;
    }
  }, [open]);

  const isLoser  = loser?.id === playerId;
  const isWinner = winner?.id === playerId;
  const rs       = wheelResult ? RESULT_STYLE[wheelResult.type] : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5,3,20,0.96)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflowY: 'auto',
            zIndex: 500, padding: '20px 16px 32px',
            direction: 'rtl',
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ textAlign: 'center', marginBottom: 12, flexShrink: 0 }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: '#F43F5E', letterSpacing: 3, marginBottom: 2 }}>
              عجلة العقوبات
            </div>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              {loser?.name} — حان وقتك! 🎯
            </div>
          </motion.div>

          {/* العجلة + المؤشر */}
          <div style={{ position: 'relative', width: wheelSize, height: wheelSize, marginBottom: 16, flexShrink: 0 }}>
            {/* مؤشر فوق العجلة */}
            <div style={{
              position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10,
            }}>
              <svg width={20} height={26} viewBox="0 0 20 26">
                <polygon points="10,0 0,26 20,26" fill="#fff" />
                <polygon points="10,4 2,24 18,24" fill="#1E1B4B" />
              </svg>
            </div>

            <motion.div
              animate={{ rotate: spinTo }}
              transition={spinning
                ? { duration: 4, ease: [0.04, 0.6, 0.25, 1] }
                : { duration: 0 }}
              style={{ width: wheelSize, height: wheelSize }}
            >
              <WheelSVG segments={segments} size={wheelSize} />
            </motion.div>
          </div>

          {/* زر الدوران / انتظار */}
          <AnimatePresence mode="wait">
            {!wheelResult && !spinning && (
              <motion.div
                key="spin-btn"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ marginBottom: 12, textAlign: 'center', flexShrink: 0 }}
              >
                {isLoser ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                    onClick={onSpin}
                    style={{
                      background: 'linear-gradient(135deg,#F43F5E,#BE123C)',
                      border: 'none', borderRadius: 14, padding: '13px 40px',
                      fontFamily: 'var(--font-head)', fontSize: 18, letterSpacing: 3,
                      color: '#fff', cursor: 'pointer',
                      boxShadow: '0 0 18px rgba(244,63,94,0.5)',
                    }}
                  >
                    أدر العجلة!
                  </motion.button>
                ) : (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.4 }}
                    style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#64748B', letterSpacing: 2 }}
                  >
                    في انتظار {loser?.name}…
                  </motion.div>
                )}
              </motion.div>
            )}

            {spinning && (
              <motion.div
                key="spinning"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ marginBottom: 12, flexShrink: 0 }}
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

          {/* النتيجة */}
          <AnimatePresence>
            {revealed && rs && wheelResult && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                style={{
                  background: rs.bg,
                  border: `2px solid ${rs.border}`,
                  borderRadius: 14,
                  padding: '14px 22px',
                  textAlign: 'center',
                  boxShadow: `0 0 30px ${rs.glow}`,
                  marginBottom: 14,
                  width: '100%',
                  maxWidth: 340,
                  flexShrink: 0,
                }}
              >
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: '#fff', letterSpacing: 2, marginBottom: 6 }}>
                  {rs.label}
                </div>

                {wheelResult.type === 'execute' && (
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
                    {wheelResult.segment?.text}
                    {wheelResult.forced && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
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
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
                    {winner?.name || wheelResult.winnerName} ينفذ:
                    <br />
                    {wheelResult.punishment}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* أزرار بعد النتيجة */}
          <AnimatePresence>
            {revealed && wheelResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', flexShrink: 0, width: '100%', maxWidth: 340 }}
              >
                {/* retry: الخسران يدور مرة أخرى */}
                {wheelResult.type === 'retry' && isLoser && (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setRevealed(false); onSpin(); }}
                    style={{
                      width: '100%', background: '#7C3AED', border: 'none', borderRadius: 10,
                      padding: '12px', color: '#fff',
                      fontFamily: 'var(--font-head)', fontSize: 15, cursor: 'pointer', letterSpacing: 1,
                    }}
                  >
                    🍀 أدر مرة أخرى
                  </motion.button>
                )}

                {/* execute/reverse: الفائز يقدر يمنح فرصة ثانية */}
                {wheelResult.type !== 'retry' && isWinner && (
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(34,197,94,0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onGrantSecondChance}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(22,163,74,0.2))',
                      border: '1px solid rgba(34,197,94,0.5)',
                      borderRadius: 10, padding: '12px', color: '#22C55E',
                      fontFamily: 'var(--font-head)', fontSize: 14, cursor: 'pointer', letterSpacing: 1,
                      boxShadow: '0 0 12px rgba(34,197,94,0.2)',
                    }}
                  >
                    🎁 امنح {loser?.name} فرصة ثانية
                  </motion.button>
                )}

                {/* إغلاق — دائماً */}
                {wheelResult.type !== 'retry' && (
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={onClose}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10, padding: '10px', color: '#94A3B8',
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