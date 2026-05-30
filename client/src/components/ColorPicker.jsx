import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  { id: 'red',    label: 'أحمر',  bg: '#DC2626', glow: '#EF4444' },
  { id: 'green',  label: 'أخضر',  bg: '#16A34A', glow: '#22C55E' },
  { id: 'blue',   label: 'أزرق',  bg: '#2563EB', glow: '#60A5FA' },
  { id: 'yellow', label: 'أصفر',  bg: '#D97706', glow: '#FCD34D' },
];

export function ColorPicker({ open, onPick, title = 'اختر اللون' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            style={{
              background: '#1E1B4B', border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: 16, padding: '32px 40px', textAlign: 'center',
              boxShadow: '0 0 40px rgba(124,58,237,0.4)', direction: 'rtl',
            }}
          >
            <p style={{ fontFamily: 'var(--font-head)', fontSize: 18, marginBottom: 24, color: '#E2E8F0', letterSpacing: 2 }}>
              {title}
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {COLORS.map(c => (
                <motion.button
                  key={c.id}
                  whileHover={{ scale: 1.15, boxShadow: `0 0 20px ${c.glow}` }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onPick(c.id)}
                  aria-label={c.label}
                  title={c.label}
                  style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: c.bg, border: '3px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer', transition: 'box-shadow 0.2s',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
