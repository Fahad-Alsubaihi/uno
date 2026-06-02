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
        /* Transparent container — pointer-events only on the panel */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {/* Floating panel — compact, centered, doesn't block cards */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            style={{
              pointerEvents: 'auto',
              direction: 'rtl',
              background: 'rgba(10,8,30,0.82)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: 20,
              padding: '14px 18px 16px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              // Positioned slightly above center to leave cards visible
              marginBottom: '18vh',
            }}
          >
            {/* Title */}
            <p style={{
              fontFamily: 'var(--font-head)', fontSize: 12,
              color: '#A78BFA', letterSpacing: 2, margin: 0,
            }}>
              {title}
            </p>

            {/* 4 buttons in a horizontal row */}
            <div style={{ display: 'flex', gap: 10 }}>
              {COLORS.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 460, damping: 24 }}
                  whileHover={{ scale: 1.1, y: -4, boxShadow: `0 0 28px ${c.glow}80, 0 0 60px ${c.glow}30` }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onPick(c.id)}
                  aria-label={c.label}
                  style={{
                    width: 68, height: 68,
                    borderRadius: 14,
                    background: `linear-gradient(145deg, ${c.bg} 0%, ${c.dark} 100%)`,
                    border: `2px solid ${c.glow}50`,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: `0 0 14px ${c.glow}30, 0 6px 16px rgba(0,0,0,0.45)`,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Shine */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(140deg, rgba(255,255,255,0.18) 0%, transparent 55%)',
                    pointerEvents: 'none',
                  }} />
                  {/* Color dot */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: c.glow,
                    boxShadow: `0 0 10px ${c.glow}`,
                    position: 'relative', zIndex: 1,
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-head)', fontSize: 11,
                    color: '#fff', letterSpacing: 1,
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
