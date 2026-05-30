import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { Card } from './Card';

// عدد الأوراق اللي بعدها ننتقل لصفين
const TWO_ROW_THRESHOLD = 9;
// أحجام الكارد
const CARD_W = { sm: 48, md: 64 };
const CARD_H = { sm: 72, md: 96 };
const GAP    = 4;

export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno }) {
  const topCard      = gameState?.topCard;
  const currentColor = gameState?.currentColor;
  const pendingDraw  = gameState?.pendingDraw || 0;
  const [unoPressed, setUnoPressed] = useState(false);

  useEffect(() => { setUnoPressed(false); }, [hand.length]);

  // حجم الكارد بناءً على عرض الشاشة وعدد الأوراق
  const cardSize = useMemo(() => {
    const availW = (typeof window !== 'undefined' ? window.innerWidth : 400) - 32;
    const perRow  = hand.length > TWO_ROW_THRESHOLD ? Math.ceil(hand.length / 2) : hand.length;
    const needed  = perRow * (CARD_W.md + GAP);
    return needed <= availW ? 'md' : 'sm';
  }, [hand.length]);

  const w = CARD_W[cardSize];
  const h = CARD_H[cardSize];

  // قسّم الأوراق لصفين لو زادت عن الحد
  const useTwoRows = hand.length > TWO_ROW_THRESHOLD;
  const row1 = useTwoRows ? hand.slice(0, Math.ceil(hand.length / 2)) : hand;
  const row2 = useTwoRows ? hand.slice(Math.ceil(hand.length / 2))    : [];

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
      card.type  === topCard.type &&
      (card.type !== 'number' || card.value === topCard.value)
    );
  }

  function handleUno() {
    if (unoPressed) return;
    setUnoPressed(true);
    onCallUno?.();
  }

  const hasUno      = hand.length === 1;
  const hasPlayable = hand.some(isPlayable);

  // ارتفاع دور الهوفر
  const hoverLift = 14;

  function renderRow(cards, startIdx) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: GAP,
        // ارتفاع ثابت = ارتفاع الكارد + مساحة الهوفر
        height: h + hoverLift,
        flexWrap: 'nowrap',
        overflow: 'visible',
        paddingTop: hoverLift,
      }}>
        <AnimatePresence mode="popLayout">
          {cards.map((card, i) => {
            const idx      = startIdx + i;
            const playable = isPlayable(card);
            const jumpable = isJumpable(card);
            const dimmed   = isMyTurn && !playable && !jumpable;

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ y: 40, opacity: 0, scale: 0.85 }}
                animate={{ y: 0,  opacity: 1, scale: 1, zIndex: i }}
                exit={{ y: -20, opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28, delay: i * 0.015 }}
                whileHover={{ y: -(hoverLift), zIndex: 200, transition: { duration: 0.1 } }}
                style={{
                  flexShrink: 0,
                  position: 'relative',
                  cursor: (playable || jumpable) ? 'pointer' : 'default',
                }}
              >
                {/* Jump-in ring */}
                {jumpable && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.9 }}
                    style={{
                      position: 'absolute', inset: -3, borderRadius: 11,
                      border: '2px solid #D97706',
                      background: 'rgba(217,119,6,0.2)',
                      zIndex: 0, pointerEvents: 'none',
                    }}
                  />
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Card
                    card={card}
                    isPlayable={playable || jumpable}
                    size={cardSize}
                    layoutId={card.id}
                    onClick={() => onPlay(idx, card, jumpable)}
                  />
                  {dimmed && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 8,
                      background: 'rgba(0,0,0,0.62)',
                      zIndex: 2, pointerEvents: 'none',
                    }} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 4, overflow: 'visible' }}>

      {/* زر UNO */}
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: 34 }}>
        <AnimatePresence>
          {hasUno && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={!unoPressed ? { scale: 1.1 } : {}}
              whileTap={!unoPressed ? { scale: 0.9 } : {}}
              onClick={handleUno}
              disabled={unoPressed}
              style={{
                background: unoPressed ? '#374151' : '#F43F5E',
                border: `2px solid ${unoPressed ? '#4B5563' : '#FB7185'}`,
                borderRadius: 10, padding: '6px 20px',
                fontFamily: 'var(--font-head)', fontSize: 15,
                color: unoPressed ? '#6B7280' : '#fff',
                cursor: unoPressed ? 'default' : 'pointer',
                letterSpacing: 2,
                boxShadow: unoPressed ? 'none' : '0 0 18px rgba(244,63,94,0.5)',
                transition: 'all .2s',
              }}
            >
              {unoPressed ? '✓ UNO!' : 'UNO!'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* الصف الأول (أو الوحيد) */}
      <div style={{ padding: '0 8px', overflow: 'visible' }}>
        {renderRow(row1, 0)}
      </div>

      {/* الصف الثاني — فقط لو الأوراق زادت */}
      {useTwoRows && (
        <div style={{ padding: '0 8px', overflow: 'visible' }}>
          {renderRow(row2, row1.length)}
        </div>
      )}

      {/* شريط المعلومات */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', direction: 'rtl', paddingTop: 2 }}>
        {hand.length} / 25 ورقة
        {hand.length >= 20 && (
          <span style={{ color: '#EF4444', marginRight: 6 }}>⚠️ قريب الحد!</span>
        )}
        {isMyTurn && !hasPlayable && pendingDraw === 0 && (
          <span style={{ color: '#F43F5E', marginRight: 6 }}>· اسحب</span>
        )}
        {isMyTurn && pendingDraw > 0 && !hasPlayable && (
          <span style={{ color: '#F43F5E', marginRight: 6 }}>· اسحب +{pendingDraw}</span>
        )}
      </div>
    </div>
  );
}