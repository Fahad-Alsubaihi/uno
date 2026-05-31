import { AnimatePresence, motion } from 'framer-motion';

const STYLES = {
  uno:        { bg: 'linear-gradient(135deg,#F43F5E,#BE123C)', border: '#FB7185', glow: 'rgba(244,63,94,0.7)' },
  caught:     { bg: 'linear-gradient(135deg,#7C3AED,#5B21B6)', border: '#A78BFA', glow: 'rgba(124,58,237,0.6)' },
  swap:       { bg: 'linear-gradient(135deg,#0891B2,#0E7490)', border: '#22D3EE', glow: 'rgba(8,145,178,0.6)' },
  jumpin:     { bg: 'linear-gradient(135deg,#D97706,#92400E)', border: '#FCD34D', glow: 'rgba(217,119,6,0.6)' },
  eliminated: { bg: 'linear-gradient(135deg,#374151,#1F2937)', border: '#6B7280', glow: 'rgba(55,65,81,0.5)' },
  roulette:   { bg: 'linear-gradient(135deg,#7C3AED,#5B21B6)', border: '#A78BFA', glow: 'rgba(124,58,237,0.6)' },
};

export function Notification({ notification }) {
  const s = STYLES[notification?.type] || STYLES.uno;
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.text}
          initial={{ opacity: 0, scale: 0.4, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.3, y: -50 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          style={{
            position: 'fixed', top: '38%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: s.bg,
            border: `2px solid ${s.border}`,
            borderRadius: 16, padding: '16px 36px',
            fontFamily: 'var(--font-head)', fontSize: 24,
            color: '#fff', letterSpacing: 2,
            zIndex: 400,
            boxShadow: `0 0 50px ${s.glow}, 0 0 100px ${s.glow}50, 0 16px 40px rgba(0,0,0,0.4)`,
            pointerEvents: 'none', textAlign: 'center',
            direction: 'rtl', whiteSpace: 'nowrap',
          }}
        >
          {/* Shine */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 14,
            background: 'linear-gradient(140deg, rgba(255,255,255,0.18) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />
          {notification.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
