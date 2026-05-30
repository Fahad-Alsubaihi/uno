import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno }) {
  const scrollRef = useRef(null);
  const topCard = gameState?.topCard;
  const currentColor = gameState?.currentColor;
  const pendingDraw = gameState?.pendingDraw || 0;

  function isPlayable(card) {
    if (!isMyTurn) return false;

    // Stacking rule: card.drawValue >= current accumulated penalty
    if (pendingDraw > 0) return (card.drawValue || 0) >= pendingDraw;

    if (card.color === 'wild') return true;
    if (!topCard) return false;

    const activeColor = currentColor || topCard.color;
    if (card.color === activeColor) return true;
    if (card.type !== 'number' && card.type === topCard.type) return true;
    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
    return false;
  }

  function isJumpable(card) {
    if (!topCard || isMyTurn) return false;
    return (
      card.color === topCard.color &&
      card.type === topCard.type &&
      (card.type !== 'number' || card.value === topCard.value)
    );
  }

  const hasUno = hand.length === 1;
  const hasPlayable = hand.some(isPlayable);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, direction: 'rtl' }}>
      {/* UNO button */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {hasUno && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={onCallUno}
            style={{
              background: '#F43F5E', border: '2px solid #FB7185', borderRadius: 10,
              padding: '8px 20px', fontFamily: 'var(--font-head)', fontSize: 16,
              color: '#fff', cursor: 'pointer', letterSpacing: 2,
              boxShadow: '0 0 20px rgba(244,63,94,0.5)',
            }}
          >
            UNO!
          </motion.button>
        )}
      </div>

      {/* Hand scroll area */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          padding: '12px 16px 4px',
          scrollbarWidth: 'thin', scrollbarColor: '#7C3AED transparent',
          WebkitOverflowScrolling: 'touch',
          justifyContent: hand.length <= 7 ? 'center' : 'flex-start',
          flexDirection: 'row-reverse',
        }}
      >
        <AnimatePresence mode="popLayout">
          {hand.map((card, idx) => {
            const playable = isPlayable(card);
            const jumpable = isJumpable(card);
            const dimmed = isMyTurn && !playable && !jumpable;
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ y: 60, opacity: 0, rotate: 10 }}
                animate={{
                  y: 0,
                  opacity: dimmed ? 0.35 : 1,
                  rotate: 0,
                  filter: dimmed ? 'grayscale(40%)' : 'none',
                }}
                exit={{ y: -40, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24, delay: idx * 0.03 }}
                style={{ flexShrink: 0, position: 'relative' }}
              >
                {jumpable && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}
                    style={{
                      position: 'absolute', inset: -4, borderRadius: 14,
                      background: 'rgba(217,119,6,0.3)', border: '2px solid #D97706',
                      zIndex: 0, pointerEvents: 'none',
                    }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Card
                    card={card} isPlayable={playable || jumpable} size="md"
                    layoutId={card.id}
                    onClick={() => onPlay(idx, card, jumpable)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hand.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', direction: 'rtl' }}>
          {hand.length} ورقة في يدك
          {isMyTurn && !hasPlayable && (
            <span style={{ color: '#F43F5E', marginRight: 8 }}>· لا ورقة تنفع — اسحب</span>
          )}
        </div>
      )}
    </div>
  );
}
