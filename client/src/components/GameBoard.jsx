import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

const COLOR_RING = {
  red: '#DC2626', green: '#16A34A', blue: '#2563EB', yellow: '#D97706', wild: '#7C3AED',
};

export function GameBoard({ gameState, isMyTurn, onDraw, hasPlayableInHand }) {
  const { topCard, currentColor, pendingDraw, deckCount, direction, inDrawPhase, drawPhaseFoundPlayable } = gameState;
  const ringColor = COLOR_RING[currentColor] || '#7C3AED';
  // Can't draw if: found playable after drawing, OR already have a playable card (official rule)
  const canDraw = isMyTurn && !drawPhaseFoundPlayable && (!hasPlayableInHand || inDrawPhase || pendingDraw > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, direction: 'rtl', position: 'relative' }}>

      {/* Pending draw badge */}
      <AnimatePresence>
        {pendingDraw > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              background: 'rgba(127,29,29,0.92)',
              border: '1.5px solid #EF4444',
              borderRadius: 22, padding: '5px 20px',
              fontFamily: 'var(--font-head)', fontSize: 18,
              color: '#FCA5A5', letterSpacing: 2,
              boxShadow: '0 0 28px rgba(239,68,68,0.45)',
            }}
          >
            +{pendingDraw} متراكم
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glowing felt table */}
      <motion.div
        animate={{
          boxShadow: [
            `0 0 40px ${ringColor}25, inset 0 0 60px rgba(0,0,0,0.6)`,
            `0 0 70px ${ringColor}40, inset 0 0 60px rgba(0,0,0,0.6)`,
            `0 0 40px ${ringColor}25, inset 0 0 60px rgba(0,0,0,0.6)`,
          ],
          borderColor: [`${ringColor}20`, `${ringColor}40`, `${ringColor}20`],
        }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          background: 'radial-gradient(ellipse at center, rgba(15,12,40,0.9) 0%, rgba(8,6,24,0.95) 100%)',
          border: `1.5px solid ${ringColor}30`,
          borderRadius: 28,
          padding: '20px 28px',
          display: 'flex', alignItems: 'center', gap: 28,
        }}
      >
        {/* Deck */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <motion.div
            whileHover={canDraw ? { y: -6, scale: 1.06 } : {}}
            whileTap={canDraw ? { scale: 0.95 } : {}}
            onClick={canDraw ? onDraw : undefined}
            style={{ cursor: canDraw ? 'pointer' : 'default', position: 'relative' }}
          >
            {/* Stack shadow layers */}
            {[3, 2, 1].map(o => (
              <div key={o} style={{
                position: 'absolute',
                top: -o * 2, left: -o * 2,
                width: 80, height: 120, borderRadius: 10,
                background: 'linear-gradient(135deg, #1E1B4B, #4C1D95)',
                border: '1.5px solid rgba(167,139,250,0.12)',
                opacity: 0.45 - o * 0.1,
              }} />
            ))}
            <Card card={{ id: 'deck', color: 'wild', type: 'wild', value: 'wild' }} faceDown size="md" />
            {/* Draw glow ring when it's your turn and can draw */}
            <AnimatePresence>
              {canDraw && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.05, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  style={{
                    position: 'absolute', inset: -4,
                    borderRadius: 12,
                    border: '2px solid rgba(167,139,250,0.6)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Disabled overlay when must play drawn card */}
              {isMyTurn && drawPhaseFoundPlayable && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.55)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-head)' }}>
            {deckCount} ورقة
          </span>
          <AnimatePresence mode="wait">
            {isMyTurn && drawPhaseFoundPlayable && (
              <motion.span
                key="must-play"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: [0.7, 1, 0.7], scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ fontSize: 9, color: '#FCD34D', fontFamily: 'var(--font-head)', letterSpacing: 1, textAlign: 'center' }}
              >
                العب الورقة
              </motion.span>
            )}
            {isMyTurn && inDrawPhase && !drawPhaseFoundPlayable && (
              <motion.span
                key="draw-again"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.1 }}
                style={{ fontSize: 9, color: '#60A5FA', fontFamily: 'var(--font-head)', letterSpacing: 1, textAlign: 'center' }}
              >
                اسحب مرة أخرى
              </motion.span>
            )}
            {canDraw && !inDrawPhase && (
              <motion.span
                key="press-draw"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                style={{ fontSize: 9, color: '#A78BFA', fontFamily: 'var(--font-head)', letterSpacing: 1 }}
              >
                اضغط للسحب
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Center — color dot + direction arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {/* Color indicator dot */}
          <motion.div
            animate={{
              boxShadow: [`0 0 14px ${ringColor}70, 0 0 28px ${ringColor}35`, `0 0 24px ${ringColor}, 0 0 50px ${ringColor}60`, `0 0 14px ${ringColor}70, 0 0 28px ${ringColor}35`],
              background: ringColor,
            }}
            transition={{
              boxShadow: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
              background: { duration: 0.35 },
            }}
            style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.3)',
            }}
          />

          {/* Direction arrow — big animated */}
          <motion.div
            animate={{ rotate: direction === 1 ? 0 : 180, scale: [1, 1.08, 1] }}
            transition={{
              rotate: { type: 'spring', stiffness: 220, damping: 20 },
              scale: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
            }}
            style={{ position: 'relative' }}
          >
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -6,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ringColor}30 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ringColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h14a4 4 0 0 1 0 8H7" />
              <polyline points="7 5 3 8 7 11" />
              <path d="M21 16H7a4 4 0 0 1 0-8h10" />
              <polyline points="17 13 21 16 17 19" />
            </svg>
          </motion.div>
        </div>

        {/* Discard pile */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            {/* Shadow behind top card */}
            <div style={{
              position: 'absolute', top: 5, left: -5,
              width: 80, height: 120, borderRadius: 10,
              background: 'rgba(0,0,0,0.35)',
            }} />
            <AnimatePresence mode="popLayout">
              {topCard && (
                <motion.div
                  key={topCard.id}
                  layoutId={topCard.id}
                  initial={{ scale: 0.45, rotate: -25, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.55, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                >
                  <Card card={topCard} size="md" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-head)' }}>
            المستعملة
          </span>
        </div>
      </motion.div>
    </div>
  );
}
