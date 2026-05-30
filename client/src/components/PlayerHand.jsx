import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { Card } from './Card';

const SIZES = [
  { key: 'sm', w: 52, h: 78 },
];
const MIN_VISIBLE = 0.80;
const SIDE_PAD = 12; // هامش يمين ويسار ثابت — الأوراق ما تطلع برا الشاشة

function calcLayout(count, availW) {
  if (count === 0) return { size: 'sm', w: 52, h: 78, rows: 1, overlap: 0 };
  for (const rows of [1, 2]) {
    const perRow = Math.ceil(count / rows);
    for (const { key, w, h } of SIZES) {
      if (w * perRow <= availW) return { size: key, w, h, rows, overlap: 0 };
      const minVisible = w * MIN_VISIBLE;
      const step = (availW - minVisible) / Math.max(perRow - 1, 1);
      if (step >= minVisible && perRow > 1) {
        const overlap = w - step;
        if (overlap >= 0 && overlap <= w * (1 - MIN_VISIBLE))
          return { size: key, w, h, rows, overlap };
      }
    }
  }
  const w = 52; const h = 78;
  return { size: 'sm', w, h, rows: 2, overlap: Math.round(w * 0.20) };
}

export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno }) {
  const topCard      = gameState?.topCard;
  const currentColor = gameState?.currentColor;
  const pendingDraw  = gameState?.pendingDraw || 0;
  const [unoPressed, setUnoPressed] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null); // الورقة المحددة
  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 390);

  useEffect(() => {
    const fn = () => setWinW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // عند تغيير الأوراق (بعد اللعب) نصفّر الاختيار
  useEffect(() => { setUnoPressed(false); setSelectedIdx(null); }, [hand.length]);

  const layout = useMemo(() => {
    const availW = winW - SIDE_PAD * 2;
    return calcLayout(hand.length, availW);
  }, [hand.length, winW]);

  const { size, w, h, rows, overlap } = layout;
  const LIFT = Math.round(h * 0.30); // ارتفاع رفع الورقة المحددة

  const perRow    = Math.ceil(hand.length / rows);
  const rowArrays = Array.from({ length: rows }, (_, r) =>
    hand.slice(r * perRow, (r + 1) * perRow)
  );

  function isPlayable(card) {
    if (!isMyTurn) return false;
    if (pendingDraw > 0) return (card.drawValue || 0) >= pendingDraw;
    if (card.color === 'wild') return pendingDraw === 0 || (card.drawValue || 0) >= pendingDraw;
    if (!topCard) return false;
    const activeColor = currentColor || topCard.color;
    if (card.color === activeColor) return true;
    if (card.type !== 'number' && topCard.color !== 'wild' && card.type === topCard.type) return true;
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

  function handleCardTap(globalIdx, card, jumpable) {
    const playable = isPlayable(card) || jumpable;
    if (!playable) return;

    if (selectedIdx === globalIdx) {
      // ضغطة ثانية على نفس الورقة = العب
      setSelectedIdx(null);
      onPlay(globalIdx, card, jumpable);
    } else {
      // ضغطة أولى = اختر
      setSelectedIdx(globalIdx);
    }
  }

  const hasUno      = hand.length === 1;
  const hasPlayable = hand.some(isPlayable);

  function renderRow(cards, startIdx) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        height: h + LIFT + 4,
        paddingTop: LIFT + 4,
        position: 'relative',
        overflow: 'visible',
      }}>
        {cards.map((card, i) => {
          const globalIdx = startIdx + i;
          const playable  = isPlayable(card);
          const jumpable  = isJumpable(card);
          const isActive  = playable || jumpable;
          const isSelected = selectedIdx === globalIdx;
          const dimmed    = isMyTurn && !isActive;
          const marginLeft = i === 0 ? 0 : -overlap;

          return (
            <motion.div
              key={card.id}
              initial={{ y: 40, opacity: 0, scale: 0.85 }}
              animate={{
                y: isSelected ? -LIFT : 0,
                scale: isSelected ? 1.08 : 1,
                opacity: 1,
                zIndex: isSelected ? 500 : i,
              }}
              exit={{ y: -20, opacity: 0 }}
              transition={{
                y:     { type: 'spring', stiffness: 380, damping: 28 },
                scale: { type: 'spring', stiffness: 380, damping: 28 },
                opacity: { duration: 0.13 },
              }}
              style={{
                marginLeft,
                flexShrink: 0,
                position: 'relative',
                cursor: isActive ? 'pointer' : 'default',
              }}
              onClick={() => handleCardTap(globalIdx, card, jumpable)}
            >
              {/* حلقة اختيار */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute', inset: -4, borderRadius: 11,
                    border: '2.5px solid #fff',
                    boxShadow: `0 0 0 3px ${
                      card.color === 'red' ? '#DC262680' :
                      card.color === 'blue' ? '#2563EB80' :
                      card.color === 'green' ? '#16A34A80' :
                      card.color === 'yellow' ? '#D9770680' : '#A78BFA80'
                    }`,
                    zIndex: 0, pointerEvents: 'none',
                  }}
                />
              )}

              {/* حلقة jump-in */}
              {jumpable && !isSelected && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.85 }}
                  style={{
                    position: 'absolute', inset: -2, borderRadius: 9,
                    border: '2px solid #D97706',
                    background: 'rgba(217,119,6,0.12)',
                    zIndex: 0, pointerEvents: 'none',
                  }}
                />
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                <Card card={card} isPlayable={isActive} size={size} onClick={() => {}} />
                {dimmed && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 7,
                    background: 'rgba(0,0,0,0.58)',
                    zIndex: 2, pointerEvents: 'none',
                  }} />
                )}
              </div>

              {/* نص "اضغط للعب" تحت الورقة المحددة */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute', bottom: -18, left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 9, color: '#fff',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '2px 6px', borderRadius: 6,
                    whiteSpace: 'nowrap', zIndex: 600,
                    fontFamily: 'var(--font-head)',
                    pointerEvents: 'none',
                  }}
                >
                  اضغط للعب
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }

  // عند الضغط خارج الأوراق نصفّر الاختيار
  function handleBgTap(e) {
    if (e.target === e.currentTarget) setSelectedIdx(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* زر UNO */}
      <div style={{ display: 'flex', justifyContent: 'center', height: 34 }}>
        <AnimatePresence>
          {hasUno && (
            <motion.button
              key="uno-btn"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={!unoPressed ? { scale: 0.92 } : {}}
              onClick={() => { if (!unoPressed) { setUnoPressed(true); onCallUno?.(); } }}
              style={{
                background: unoPressed ? '#374151' : '#F43F5E',
                border: `2px solid ${unoPressed ? '#4B5563' : '#FB7185'}`,
                borderRadius: 10, padding: '5px 18px',
                fontFamily: 'var(--font-head)', fontSize: 14,
                color: unoPressed ? '#6B7280' : '#fff',
                cursor: unoPressed ? 'default' : 'pointer',
                letterSpacing: 2,
                boxShadow: unoPressed ? 'none' : '0 0 16px rgba(244,63,94,0.5)',
              }}
            >
              {unoPressed ? '✓ UNO!' : 'UNO!'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* الصفوف */}
      <div
        onClick={handleBgTap}
        style={{
          padding: `0 ${SIDE_PAD}px`,  // هامش ثابت يمين ويسار
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <AnimatePresence>
          {rowArrays.map((rowCards, ri) => (
            <div key={ri} style={{ overflow: 'visible' }}>
              {renderRow(rowCards, ri * perRow)}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* شريط المعلومات */}
      <div style={{
        textAlign: 'center', fontSize: 10,
        color: hand.length >= 20 ? '#EF4444' : '#475569',
        direction: 'rtl', padding: '4px 0 6px',
      }}>
        {hand.length} / 25 ورقة
        {hand.length >= 20 && <span style={{ marginRight: 4 }}>⚠️</span>}
        {isMyTurn && !hasPlayable && pendingDraw === 0 && (
          <span style={{ color: '#F43F5E', marginRight: 6 }}>· اسحب من الدكة</span>
        )}
        {isMyTurn && pendingDraw > 0 && !hasPlayable && (
          <span style={{ color: '#F43F5E', marginRight: 6 }}>· اسحب +{pendingDraw}</span>
        )}
        {selectedIdx !== null && (
          <span style={{ color: '#A78BFA', marginRight: 6 }}>· اضغط مرة ثانية للعب</span>
        )}
      </div>
    </div>
  );
}