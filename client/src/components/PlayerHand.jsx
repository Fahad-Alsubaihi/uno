import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno }) {
  const topCard     = gameState?.topCard;
  const currentColor = gameState?.currentColor;
  const pendingDraw = gameState?.pendingDraw || 0;

  // Auto-scale: no scroll — all cards always visible
  const cardSize = hand.length <= 7 ? 'md' : hand.length <= 12 ? 'sm' : 'xs';
  const overlap  = hand.length <= 7 ? -16  : hand.length <= 12 ? -22  : -28;

  function isPlayable(card) {
    if (!isMyTurn) return false;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* UNO button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {hasUno && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onCallUno}
            style={{
              background: '#F43F5E', border: '2px solid #FB7185',
              borderRadius: 10, padding: '7px 20px',
              fontFamily: 'var(--font-head)', fontSize: 16,
              color: '#fff', cursor: 'pointer', letterSpacing: 2,
              boxShadow: '0 0 20px rgba(244,63,94,0.5)',
            }}
          >
            UNO!
          </motion.button>
        )}
      </div>

      {/* Hand — overlapping cards, no scroll */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        padding: '8px 12px 0', flexWrap: 'nowrap',
        overflow: 'visible',
      }}>
        <AnimatePresence mode="popLayout">
          {hand.map((card, idx) => {
            const playable = isPlayable(card);
            const jumpable = isJumpable(card);
            const dimmed   = isMyTurn && !playable && !jumpable;
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ y: 50, opacity: 0 }}
                animate={{
                  y: 0, opacity: dimmed ? 0.32 : 1,
                  filter: dimmed ? 'grayscale(50%)' : 'none',
                  zIndex: idx,
                }}
                exit={{ y: -30, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26, delay: idx * 0.025 }}
                whileHover={{
                  y: -18, zIndex: 200,
                  transition: { duration: 0.1 },
                }}
                style={{
                  marginLeft: idx === 0 ? 0 : overlap,
                  flexShrink: 0, position: 'relative', cursor: (playable || jumpable) ? 'pointer' : 'default',
                }}
              >
                {/* Jump-in ring */}
                {jumpable && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.9 }}
                    style={{
                      position: 'absolute', inset: -3, borderRadius: 11,
                      border: '2px solid #D97706', background: 'rgba(217,119,6,0.2)',
                      zIndex: 0, pointerEvents: 'none',
                    }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Card
                    card={card} isPlayable={playable || jumpable} size={cardSize}
                    layoutId={card.id}
                    onClick={() => onPlay(idx, card, jumpable)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Info bar */}
      {hand.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', direction: 'rtl' }}>
          {hand.length} ورقة
          {isMyTurn && !hasPlayable && (
            <span style={{ color: '#F43F5E', marginRight: 6 }}>· لا ورقة تنفع — اسحب</span>
          )}
        </div>
      )}
    </div>
  );
}
