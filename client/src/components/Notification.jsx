import { AnimatePresence, motion } from 'framer-motion';

const STYLES = {
  uno:        { bg: '#F43F5E', border: '#FB7185', glow: 'rgba(244,63,94,0.6)' },
  caught:     { bg: '#7C3AED', border: '#A78BFA', glow: 'rgba(124,58,237,0.5)' },
  swap:       { bg: '#0891B2', border: '#22D3EE', glow: 'rgba(8,145,178,0.5)' },
  jumpin:     { bg: '#D97706', border: '#FCD34D', glow: 'rgba(217,119,6,0.5)' },
  eliminated: { bg: '#374151', border: '#6B7280', glow: 'rgba(55,65,81,0.5)' },
  roulette:   { bg: '#7C3AED', border: '#A78BFA', glow: 'rgba(124,58,237,0.5)' },
};

export function Notification({ notification }) {
  const s = STYLES[notification?.type] || STYLES.uno;
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.text}
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.2, y: -40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          style={{
            position: 'fixed', top: '38%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: s.bg, border: `2px solid ${s.border}`,
            borderRadius: 14, padding: '14px 32px',
            fontFamily: 'var(--font-head)', fontSize: 22,
            color: '#fff', letterSpacing: 2,
            zIndex: 400, boxShadow: `0 0 40px ${s.glow}`,
            pointerEvents: 'none', textAlign: 'center',
            direction: 'rtl', whiteSpace: 'nowrap',
          }}
        >
          {notification.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
