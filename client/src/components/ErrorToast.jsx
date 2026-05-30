import { AnimatePresence, motion } from 'framer-motion';

export function ErrorToast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#7F1D1D',
            border: '1px solid #EF4444',
            borderRadius: 10,
            padding: '12px 24px',
            color: '#FCA5A5',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 14,
            zIndex: 500,
            boxShadow: '0 0 20px rgba(239,68,68,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
