import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

const COLOR_RING = {
  red: '#DC2626', green: '#16A34A', blue: '#2563EB', yellow: '#D97706', wild: '#7C3AED',
};

export function GameBoard({ gameState, isMyTurn, onDraw }) {
  const { topCard, currentColor, pendingDraw, deckCount, direction } = gameState;
  const ringColor = COLOR_RING[currentColor] || '#7C3AED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, direction: 'rtl' }}>

      {/* تراكم السحب */}
      <AnimatePresence>
        {pendingDraw > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            style={{
              background: 'rgba(127,29,29,0.9)', border: '1px solid #EF4444',
              borderRadius: 20, padding: '4px 18px',
              fontFamily: 'var(--font-head)', fontSize: 16,
              color: '#FCA5A5', letterSpacing: 2,
              boxShadow: '0 0 20px rgba(239,68,68,0.35)',
            }}
          >
            +{pendingDraw} متراكم
          </motion.div>
        )}
      </AnimatePresence>

      {/* الدكة + المستعملة */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>

        {/* الدكة */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <motion.div
            whileHover={isMyTurn ? { y: -4, scale: 1.04 } : {}}
            whileTap={isMyTurn ? { scale: 0.96 } : {}}
            onClick={isMyTurn ? onDraw : undefined}
            style={{ cursor: isMyTurn ? 'pointer' : 'default', position: 'relative' }}
          >
            {/* ظل الدكة */}
            {[3, 2, 1].map(o => (
              <div key={o} style={{
                position: 'absolute',
                top: -o * 2, left: -o * 2,
                width: 72, height: 108, borderRadius: 10,
                background: 'linear-gradient(135deg,#1E1B4B,#4C1D95)',
                border: '1.5px solid rgba(167,139,250,0.15)',
                opacity: 0.4 - o * 0.1,
              }} />
            ))}
            <Card card={{ id: 'deck', color: 'wild', type: 'wild', value: 'wild' }} faceDown size="md" />
          </motion.div>
          <span style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-head)' }}>
            {deckCount} ورقة
          </span>
          <AnimatePresence>
            {isMyTurn && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: [0.4, 1, 0.4] }} exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                style={{ fontSize: 9, color: '#A78BFA', fontFamily: 'var(--font-head)', letterSpacing: 1 }}
              >
                اضغط للسحب
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* الوسط — اللون + اتجاه */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <motion.div
            animate={{ boxShadow: `0 0 18px ${ringColor}80`, background: ringColor }}
            transition={{ duration: 0.4 }}
            style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)' }}
          />
          <motion.div
            animate={{ rotate: direction === 1 ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ fontSize: 22, color: '#334155', lineHeight: 1 }}
          >↻</motion.div>
        </div>

        {/* المستعملة */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            {/* ظل خلفي */}
            <div style={{
              position: 'absolute', top: 4, left: -4,
              width: 72, height: 108, borderRadius: 10,
              background: 'rgba(0,0,0,0.3)',
            }} />
            <AnimatePresence mode="popLayout">
              {topCard && (
                <motion.div
                  key={topCard.id}
                  layoutId={topCard.id}
                  initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <Card card={topCard} size="md" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-head)' }}>
            المستعملة
          </span>
        </div>
      </div>
    </div>
  );
}