import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_LIST = [
  'اشرب كوب ماء كامل',
  'قلد صوت حيوان 10 ثواني',
  'قول مدح لكل لاعب',
  'افعل 10 ضغط',
  'غني مقطع',
  'قل سراً محرجاً',
  'العب الجولة القادمة بيدك العكسية',
  'تخطي دورك مرتين',
];

export function PunishmentSetup({ open, onClose, punishment, isHost, game }) {
  const [custom, setCustom] = useState('');
  const { penalties = DEFAULT_LIST, wheelOptions = { execute: 60, retry: 20, reverse: 20 } } = punishment;

  function addPenalty() {
    const t = custom.trim();
    if (!t) return;
    game.setPenalties([...penalties, t]);
    setCustom('');
  }

  function removePenalty(idx) {
    game.setPenalties(penalties.filter((_, i) => i !== idx));
  }

  function updateWheel(key, raw) {
    const val = Math.max(0, Math.min(100, Number(raw)));
    const others = Object.entries(wheelOptions)
      .filter(([k]) => k !== key)
      .map(([k, v]) => [k, v]);
    const remaining = 100 - val;
    const total = others.reduce((s, [, v]) => s + v, 0);
    const scaled = total === 0
      ? others.map(([k]) => [k, remaining / others.length])
      : others.map(([k, v]) => [k, Math.round((v / total) * remaining)]);
    const next = { ...wheelOptions, [key]: val };
    scaled.forEach(([k, v]) => { next[k] = v; });
    // Fix rounding
    const sum = Object.values(next).reduce((a, b) => a + b, 0);
    if (sum !== 100) next[scaled[0]?.[0] || 'retry'] += 100 - sum;
    game.setWheelOptions(next);
  }

  const WHEEL_LABELS = {
    execute: { label: 'ينفذ العقوبة', color: '#F43F5E' },
    retry:   { label: 'حظ — حاول مرة ثانية', color: '#7C3AED' },
    reverse: { label: 'العقوبة تنقلب على الفائز', color: '#0891B2' },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, padding: 16,
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161630', border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 20, padding: '24px 20px',
              width: '100%', maxWidth: 500, maxHeight: '88vh', overflowY: 'auto',
              direction: 'rtl',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#A78BFA', letterSpacing: 2 }}>
                إعداد العقوبات
              </h2>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#94A3B8', fontSize: 18 }}>×</button>
            </div>

            {/* Penalties list */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 10 }}>
                قائمة العقوبات ({penalties.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                <AnimatePresence>
                  {penalties.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                        borderRadius: 8, padding: '8px 12px',
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#CBD5E1', flex: 1 }}>{p}</span>
                      {isHost && (
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => removePenalty(i)}
                          style={{ background: 'rgba(244,63,94,0.2)', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', color: '#F43F5E', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ×
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {isHost && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={custom}
                    onChange={e => setCustom(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPenalty()}
                    placeholder="أضف عقوبة خاصة…"
                    style={{
                      flex: 1, background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8,
                      padding: '8px 12px', color: '#E2E8F0', fontSize: 13,
                      fontFamily: 'var(--font-body)', textAlign: 'right',
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={addPenalty}
                    style={{
                      background: '#7C3AED', border: 'none', borderRadius: 8,
                      padding: '8px 14px', color: '#fff', cursor: 'pointer',
                      fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: 1,
                    }}
                  >
                    + أضف
                  </motion.button>
                </div>
              )}
            </div>

            {/* Wheel options */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 12 }}>
                خيارات العجلة (المجموع 100%)
              </div>
              {Object.entries(WHEEL_LABELS).map(([key, { label, color }]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#CBD5E1' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 13, color }}>{wheelOptions[key]}%</span>
                  </div>
                  <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                    <div style={{
                      position: 'absolute', right: 0, top: 0, height: '100%',
                      width: `${wheelOptions[key]}%`, background: color,
                      borderRadius: 3, transition: 'width 0.2s',
                    }} />
                    {isHost && (
                      <input
                        type="range" min={0} max={100} value={wheelOptions[key]}
                        onChange={e => updateWheel(key, e.target.value)}
                        style={{
                          position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%', marginTop: 16,
                background: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
                border: 'none', borderRadius: 10, padding: 12,
                color: '#fff', fontFamily: 'var(--font-head)', fontSize: 14,
                letterSpacing: 2, cursor: 'pointer',
              }}
            >
              حفظ وإغلاق
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
