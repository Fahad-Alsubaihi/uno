import { motion, AnimatePresence } from 'framer-motion';

export function TiebreakerModal({ open, scores, roomPlayers, playerId, isHost, onStartTiebreaker, onCallTie }) {
  if (!open) return null;

  const sorted = [...roomPlayers]
    .map(p => ({ ...p, score: scores?.[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 600,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: 20, direction: 'rtl',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{
            background: 'rgba(14,10,40,0.97)',
            border: '1px solid rgba(251,191,36,0.5)',
            borderRadius: 22,
            padding: '28px 24px',
            width: '100%',
            maxWidth: 360,
            boxShadow: '0 0 60px rgba(251,191,36,0.2), 0 24px 60px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: 52, lineHeight: 1, marginBottom: 12 }}
            >
              🤝
            </motion.div>
            <motion.h2
              animate={{ textShadow: ['0 0 12px rgba(251,191,36,0.4)', '0 0 30px rgba(251,191,36,0.9)', '0 0 12px rgba(251,191,36,0.4)'] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                fontFamily: 'var(--font-head)', fontSize: 26,
                color: '#FCD34D', letterSpacing: 3, margin: 0,
              }}
            >
              تعادل!
            </motion.h2>
            <p style={{ color: '#64748B', fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: 2, marginTop: 6 }}>
              النقاط متساوية بعد كل الجولات
            </p>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, overflow: 'hidden', marginBottom: 22,
          }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                background: p.id === playerId ? 'rgba(251,191,36,0.08)' : 'transparent',
                borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#E2E8F0' }}>
                  {p.name}
                  {p.id === playerId && <span style={{ color: '#FCD34D', fontSize: 10, marginRight: 4 }}>(أنت)</span>}
                </span>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: '#FCD34D' }}>
                  {p.score}
                </span>
              </div>
            ))}
          </div>

          {isHost ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(34,197,94,0.7)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartTiebreaker}
                style={{
                  width: '100%', padding: '15px',
                  background: 'linear-gradient(135deg, #16A34A, #15803D)',
                  border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: 14, color: '#fff',
                  fontFamily: 'var(--font-head)', fontSize: 14, letterSpacing: 2,
                  cursor: 'pointer',
                  boxShadow: '0 0 18px rgba(34,197,94,0.35)',
                }}
              >
                العب جولة فاصلة ⚔️
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(100,116,139,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onCallTie}
                style={{
                  width: '100%', padding: '13px',
                  background: 'rgba(30,27,75,0.8)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14, color: '#94A3B8',
                  fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 2,
                  cursor: 'pointer',
                }}
              >
                اعتبروها تعادل 🤝
              </motion.button>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: 14,
              background: 'rgba(0,0,0,0.2)', borderRadius: 12,
              color: '#475569', fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 2,
            }}>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                في انتظار قرار المضيف…
              </motion.span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
