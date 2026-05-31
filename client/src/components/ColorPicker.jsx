import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  { id: 'red',    label: 'أحمر', bg: '#DC2626', dark: '#7F1D1D', glow: '#EF4444' },
  { id: 'blue',   label: 'أزرق', bg: '#2563EB', dark: '#1E3A8A', glow: '#60A5FA' },
  { id: 'green',  label: 'أخضر', bg: '#16A34A', dark: '#14532D', glow: '#22C55E' },
  { id: 'yellow', label: 'أصفر', bg: '#D97706', dark: '#78350F', glow: '#FCD34D' },
];

export function ColorPicker({ open, onPick, title = 'اختر اللون' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            style={{ direction: 'rtl', textAlign: 'center' }}
          >
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                fontFamily: 'var(--font-head)', fontSize: 15,
                marginBottom: 22, color: '#E2E8F0', letterSpacing: 3,
                textShadow: '0 0 20px rgba(167,139,250,0.7)',
              }}
            >
              {title}
            </motion.p>

            {/* 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {COLORS.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 24 }}
                  whileHover={{
                    scale: 1.07,
                    boxShadow: `0 0 36px ${c.glow}90, 0 0 70px ${c.glow}40`,
                    y: -5,
                  }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onPick(c.id)}
                  aria-label={c.label}
                  style={{
                    width: 132, height: 112,
                    borderRadius: 18,
                    background: `linear-gradient(145deg, ${c.bg} 0%, ${c.dark} 100%)`,
                    border: `2px solid ${c.glow}55`,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 10,
                    boxShadow: `0 0 22px ${c.glow}35, 0 10px 28px rgba(0,0,0,0.45)`,
                    transition: 'box-shadow 0.18s, transform 0.15s',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Shine overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(140deg, rgba(255,255,255,0.18) 0%, transparent 52%)',
                    pointerEvents: 'none',
                  }} />

                  {/* Glowing orb */}
                  <motion.div
                    animate={{ boxShadow: [`0 0 14px ${c.glow}`, `0 0 28px ${c.glow}, 0 0 50px ${c.glow}60`, `0 0 14px ${c.glow}`] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: i * 0.3 }}
                    style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: c.glow,
                      position: 'relative', zIndex: 1,
                    }}
                  />

                  <span style={{
                    fontFamily: 'var(--font-head)', fontSize: 14,
                    color: '#fff', letterSpacing: 2,
                    textShadow: '0 1px 6px rgba(0,0,0,0.5)',
                    position: 'relative', zIndex: 1,
                  }}>
                    {c.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
