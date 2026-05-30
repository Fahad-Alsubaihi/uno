import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

const COLOR_RING = {
  red: '#DC2626', green: '#16A34A', blue: '#2563EB', yellow: '#D97706', wild: '#7C3AED',
};

export function GameBoard({ gameState, isMyTurn, onDraw }) {
  const { topCard, currentColor, pendingDraw, deckCount } = gameState;
  const ringColor = COLOR_RING[currentColor] || '#7C3AED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, direction: 'rtl' }}>

      {/* تراكم السحب */}
      <AnimatePresence>
        {pendingDraw > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              background: '#7F1D1D', border: '1px solid #EF4444',
              borderRadius: 8, padding: '5px 16px',
              fontFamily: 'var(--font-head)', fontSize: 14,
              color: '#FCA5A5', letterSpacing: 2,
              boxShadow: '0 0 14px rgba(239,68,68,0.4)',
            }}
          >
            تراكم: +{pendingDraw}
          </motion.div>
        )}
      </AnimatePresence>

      {/* نقطة اللون الحالي */}
      <motion.div
        animate={{ boxShadow: `0 0 14px ${ringColor}90` }}
        style={{
          width: 14, height: 14, borderRadius: '50%',
          background: ringColor, border: '2px solid rgba(255,255,255,0.3)',
        }}
      />

      {/* الدكة + المستعملة */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>

        {/* الدكة */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <motion.div
            whileHover={isMyTurn ? { scale: 1.06, y: -3 } : {}}
            whileTap={isMyTurn ? { scale: 0.95 } : {}}
            onClick={isMyTurn ? onDraw : undefined}
            style={{ cursor: isMyTurn ? 'pointer' : 'default', position: 'relative' }}
          >
            {[2, 1].map(offset => (
              <div key={offset} style={{
                position: 'absolute', top: -offset * 2, left: offset * 2,
                width: 56, height: 84, borderRadius: 8,
                background: 'linear-gradient(135deg, #1E1B4B, #4C1D95)',
                border: '1.5px solid rgba(167,139,250,0.2)', opacity: 0.55,
              }} />
            ))}
            <Card card={{ id: 'deck', color: 'wild', type: 'wild', value: 'wild' }} faceDown size="sm" />
          </motion.div>
          <span style={{ fontSize: 10, color: '#64748B' }}>{deckCount} متبقية</span>
          {isMyTurn && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ fontSize: 9, color: '#A78BFA', fontFamily: 'var(--font-head)', letterSpacing: 1 }}
            >
              اضغط للسحب
            </motion.span>
          )}
        </div>

        {/* سهم الاتجاه */}
        <motion.div
          animate={{ rotate: gameState.direction === 1 ? 0 : 180 }}
          transition={{ duration: 0.4, type: 'spring' }}
          style={{ color: '#4B5563', fontSize: 18 }}
        >↻</motion.div>

        {/* المستعملة */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 3, right: -3, opacity: 0.25,
              width: 56, height: 84, borderRadius: 8, background: '#374151',
            }} />
            <AnimatePresence mode="popLayout">
              {topCard && (
                <Card
                  key={topCard.id} card={topCard} size="sm" layoutId={topCard.id}
                  initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                />
              )}
            </AnimatePresence>
          </div>
          <span style={{ fontSize: 10, color: '#64748B' }}>المستعمَلة</span>
        </div>
      </div>
    </div>
  );
}