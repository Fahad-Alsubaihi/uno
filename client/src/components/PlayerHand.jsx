import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Card } from './Card';

export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno }) {
  const topCard     = gameState?.topCard;
  const currentColor = gameState?.currentColor;
  const pendingDraw = gameState?.pendingDraw || 0;
  const [unoPressed, setUnoPressed] = useState(false);

  // احسب الحجم بناءً على عرض الشاشة الفعلي
  const [cardSize, setCardSize] = useState('md');
  const [overlap, setOverlap] = useState(-16);

  const CARD_W = { xs: 38, sm: 52, md: 72 };

  useEffect(() => {
    function calc() {
      const availableW = window.innerWidth - 32;
      const count = hand.length || 1;

      // جرب كل حجم من الأكبر للأصغر
      for (const size of ['md', 'sm', 'xs']) {
        const w = CARD_W[size];
        // أقل تداخل مسموح
        const minOverlap = size === 'md' ? -28 : size === 'sm' ? -32 : -26;
        // هل يطيج بدون تداخل؟
        if (w * count <= availableW) {
          setCardSize(size);
          setOverlap(-12);
          return;
        }
        // هل يطيج مع تداخل معقول؟
        const neededOverlap = (availableW - w * count) / (count - 1);
        if (neededOverlap >= minOverlap) {
          setCardSize(size);
          setOverlap(Math.floor(neededOverlap));
          return;
        }
      }
      // آخر حل: xs مع أقصى تداخل
      setCardSize('xs');
      const w = CARD_W['xs'];
      const neededOverlap = Math.max(-26, (availableW - w * count) / (count - 1));
      setOverlap(Math.floor(neededOverlap));
    }

    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [hand.length]);

  // أعد ضغط UNO لو تغيرت الأوراق
  useEffect(() => { setUnoPressed(false); }, [hand.length]);

  function isPlayable(card) {
    if (!isMyTurn) return false;
    if (pendingDraw > 0) return (card.drawValue || 0) >= pendingDraw;
    if (card.color === 'wild') return true;
    if (!topCard) return false;
    const activeColor = currentColor || topCard.color;
    if (card.color === activeColor) return true;
    if (card.value === topCard.value) return true;
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

  function handleUno() {
    if (unoPressed) return;
    setUnoPressed(true);
    onCallUno?.();
  }

  const hasUno = hand.length === 1;
  const hasPlayable = hand.some(isPlayable);
  const cardH = { xs: 57, sm: 78, md: 108 };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      // مساحة كافية للأوراق اللي ترتفع عند hover
      paddingBottom: 8,
      overflow: 'visible',
    }}>
      {/* زر UNO */}
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: 36 }}>
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
                borderRadius: 10, padding: '7px 20px',
                fontFamily: 'var(--font-head)', fontSize: 16,
                color: unoPressed ? '#6B7280' : '#fff',
                cursor: unoPressed ? 'default' : 'pointer',
                letterSpacing: 2,
                boxShadow: unoPressed ? 'none' : '0 0 20px rgba(244,63,94,0.5)',
                transition: 'all .2s',
              }}
            >
              {unoPressed ? '✓ UNO!' : 'UNO!'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* الأوراق — بدون scroll، كلها ظاهرة */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        // ارتفاع ثابت + مساحة للـ hover
        minHeight: (cardH[cardSize] || 108) + 24,
        padding: '0 16px',
        flexWrap: 'nowrap',
        overflow: 'visible',
        position: 'relative',
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
                initial={{ y: 60, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1, zIndex: idx }}
                exit={{ y: -30, opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring', stiffness: 320, damping: 26,
                  delay: idx * 0.02,
                }}
                whileHover={{
                  y: -20, zIndex: 200,
                  transition: { duration: 0.1 },
                }}
                style={{
                  marginLeft: idx === 0 ? 0 : overlap,
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

                  {/* Overlay أسود غامق للأوراق اللي ما تنفع */}
                  {dimmed && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 8,
                      background: 'rgba(0, 0, 0, 0.68)',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* شريط المعلومات */}
      {hand.length > 0 && (
        <div style={{
          textAlign: 'center', fontSize: 11,
          color: '#475569', direction: 'rtl',
          paddingBottom: 4,
        }}>
          {hand.length} ورقة
          {isMyTurn && !hasPlayable && pendingDraw === 0 && (
            <span style={{ color: '#F43F5E', marginRight: 6 }}>
              · لا ورقة تنفع — اسحب
            </span>
          )}
          {isMyTurn && pendingDraw > 0 && !hasPlayable && (
            <span style={{ color: '#F43F5E', marginRight: 6 }}>
              · العب ورقة سحب أو اسحب +{pendingDraw}
            </span>
          )}
        </div>
      )}
    </div>
  );
}