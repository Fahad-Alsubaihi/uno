import { motion, AnimatePresence } from 'framer-motion';

export function RoundOverModal({ result, roomPlayers, playerId, isHost, onNextRound }) {
  if (!result) return null;
  const { roundWinner, scores, currentRound, totalRounds } = result;

  const sorted = [...roomPlayers]
    .map(p => ({ ...p, score: scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: 20,
          direction: 'rtl',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            background: 'rgba(14,10,40,0.96)',
            border: '1px solid rgba(124,58,237,0.5)',
            borderRadius: 22,
            padding: '28px 24px',
            width: '100%',
            maxWidth: 380,
            boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Round badge */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 20, padding: '4px 16px', marginBottom: 12,
              fontFamily: 'var(--font-head)', fontSize: 11, color: '#A78BFA', letterSpacing: 2,
            }}>
              الجولة {currentRound} / {totalRounds}
            </div>

            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ fontSize: 48, lineHeight: 1, marginBottom: 10 }}
            >
              🎯
            </motion.div>

            <h2 style={{
              fontFamily: 'var(--font-head)', fontSize: 20,
              color: '#F43F5E', letterSpacing: 3, margin: 0,
              textShadow: '0 0 20px rgba(244,63,94,0.5)',
            }}>
              {roundWinner.name} فاز الجولة!
            </h2>
          </div>

          {/* Scores */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontFamily: 'var(--font-head)', fontSize: 10,
              color: '#475569', letterSpacing: 2,
            }}>
              النقاط المتراكمة
            </div>
            {sorted.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px',
                  background: p.id === playerId ? 'rgba(124,58,237,0.1)' : 'transparent',
                  borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-head)', fontSize: 10,
                    color: i === 0 ? '#FCD34D' : '#475569',
                    width: 16,
                  }}>
                    {i === 0 ? '👑' : `${i + 1}`}
                  </span>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#E2E8F0' }}>
                    {p.name}
                    {p.id === playerId && (
                      <span style={{ color: '#7C3AED', fontSize: 10, marginRight: 4 }}>(أنت)</span>
                    )}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-head)', fontSize: 16,
                  color: p.score > 0 ? '#22C55E' : '#475569',
                  letterSpacing: 1,
                }}>
                  {p.score}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Next round button */}
          {isHost ? (
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(244,63,94,0.7)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onNextRound}
              style={{
                width: '100%', padding: '16px',
                background: 'linear-gradient(135deg, #F43F5E, #BE123C)',
                border: '1px solid rgba(251,113,133,0.3)',
                borderRadius: 14, color: '#fff',
                fontFamily: 'var(--font-head)', fontSize: 15, letterSpacing: 2,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(244,63,94,0.4)',
              }}
            >
              {`ابدأ الجولة ${Number(currentRound) + 1} من ${totalRounds}`}
            </motion.button>
          ) : (
            <div style={{
              textAlign: 'center', padding: 14,
              background: 'rgba(0,0,0,0.2)', borderRadius: 12,
              color: '#475569', fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 2,
            }}>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                في انتظار المضيف…
              </motion.span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
