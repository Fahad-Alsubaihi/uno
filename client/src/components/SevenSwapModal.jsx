import { motion, AnimatePresence } from 'framer-motion';

export function SevenSwapModal({ open, players, myId, onSwap }) {
  const others = players.filter(p => p.id !== myId);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            style={{
              background: '#1E1B4B', border: '1px solid rgba(167,139,250,0.4)',
              borderRadius: 16, padding: '32px', textAlign: 'center',
              boxShadow: '0 0 40px rgba(124,58,237,0.5)', minWidth: 280, direction: 'rtl',
            }}
          >
            <p style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#E2E8F0', marginBottom: 6, letterSpacing: 2 }}>
              السبعة — تبادل الأوراق
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>
              اختر لاعباً لتبادل أوراقك معه
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {others.map(p => (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.04, background: 'rgba(124,58,237,0.3)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSwap(p.id)}
                  style={{
                    background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)',
                    borderRadius: 10, padding: '14px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: '#E2E8F0', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                >
                  <span>{p.name}</span>
                  <span style={{ color: '#A78BFA', fontSize: 13 }}>{p.cardCount} ورقة</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
