import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { Card } from './Card';

/*
  أحجام الكارد المتاحة (من Card.jsx):
    xs: 38 × 57
    sm: 52 × 78
    md: 72 × 108

  الاستراتيجية:
  - نحاول نحط كل الأوراق في صف واحد بأكبر حجم ممكن مع تداخل معقول
  - لو ما كفى ننتقل لصفين
  - التداخل المسموح: حتى 50% من عرض الكارد (يعني نص الكارد مرئي دايماً)
*/

const SIZES = [
  { key: 'sm', w: 52, h: 78 },

];

const MIN_VISIBLE = 0.80; // أقل نسبة مرئية لكل كارد

function calcLayout(count, availW) {
  if (count === 0) return { size: 'sm', w: 52, h: 78, rows: 1, overlap: 0 };

  for (const rows of [1, 2]) {
    const perRow = Math.ceil(count / rows);
    for (const { key, w, h } of SIZES) {
      // بدون تداخل
      if (w * perRow <= availW) {
        return { size: key, w, h, rows, overlap: 0 };
      }
      // مع تداخل — كل كارد يجب يكون مرئي بنسبة MIN_VISIBLE على الأقل
      const minVisible = w * MIN_VISIBLE;
      // availW = minVisible + (perRow-1)*step → step = (availW - minVisible) / (perRow - 1)
      const step = (availW - minVisible) / Math.max(perRow - 1, 1);
      if (step >= minVisible && perRow > 1) {
        const overlap = w - step; // كم نتداخل
        if (overlap >= 0 && overlap <= w * (1 - MIN_VISIBLE)) {
          return { size: key, w, h, rows, overlap };
        }
      }
    }
  }
  // آخر حل: sm صفين بتداخل 20% فقط
  const w = 52; const h = 78;
  const perRow = Math.ceil(count / 2);
  const minVisible = w * MIN_VISIBLE;
  const overlap = Math.max(0, w - (availW - minVisible) / Math.max(perRow - 1, 1));
  return { size: 'sm', w, h, rows: 2, overlap: Math.round(w * 0.20) };
}

export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno }) {
  const topCard      = gameState?.topCard;
  const currentColor = gameState?.currentColor;
  const pendingDraw  = gameState?.pendingDraw || 0;
  const [unoPressed, setUnoPressed] = useState(false);
  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 390);

  useEffect(() => {
    const fn = () => setWinW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => { setUnoPressed(false); }, [hand.length]);

  const layout = useMemo(() => {
    const availW = winW - 20; // padding
    return calcLayout(hand.length, availW);
  }, [hand.length, winW]);

  const { size, w, h, rows, overlap } = layout;
  const HOVER_LIFT = Math.round(h * 0.15); // 15% ارتفاع الكارد

  // قسّم الأوراق على الصفوف
  const perRow    = Math.ceil(hand.length / rows);
  const rowArrays = Array.from({ length: rows }, (_, r) =>
    hand.slice(r * perRow, (r + 1) * perRow)
  );

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

  const hasUno      = hand.length === 1;
  const hasPlayable = hand.some(isPlayable);

  function renderRow(cards, startIdx) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        height: h + HOVER_LIFT,        // ارتفاع ثابت يشمل مساحة الهوفر
        paddingTop: HOVER_LIFT,
        position: 'relative',
      }}>
        {cards.map((card, i) => {
          const idx      = startIdx + i;
          const playable = isPlayable(card);
          const jumpable = isJumpable(card);
          const dimmed   = isMyTurn && !playable && !jumpable;
          const marginLeft = i === 0 ? 0 : -overlap;

          return (
            <motion.div
              key={card.id}
              initial={{ y: 30, opacity: 0, scale: 0.85 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.13, delay: i * 0.012 }}
              whileHover={(playable || jumpable) ? {
                y: -HOVER_LIFT,
                zIndex: 300,
                transition: { duration: 0.09 },
              } : {}}
              style={{
                marginLeft,
                flexShrink: 0,
                position: 'relative',
                zIndex: i,
                cursor: (playable || jumpable) ? 'pointer' : 'default',
              }}
              onClick={() => (playable || jumpable) && onPlay(idx, card, jumpable)}
            >
              {jumpable && (
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
                <Card card={card} isPlayable={playable || jumpable} size={size} onClick={() => {}} />
                {dimmed && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 7,
                    background: 'rgba(0,0,0,0.58)',
                    zIndex: 2, pointerEvents: 'none',
                  }} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
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
              whileHover={!unoPressed ? { scale: 1.08 } : {}}
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
      <div style={{ padding: '0 6px', overflow: 'visible' }}>
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
        direction: 'rtl', padding: '3px 0 6px',
      }}>
        {hand.length} / 25 ورقة
        {hand.length >= 20 && <span style={{ marginRight: 4 }}>⚠️</span>}
        {isMyTurn && !hasPlayable && pendingDraw === 0 && (
          <span style={{ color: '#F43F5E', marginRight: 6 }}>· اسحب من الدكة</span>
        )}
        {isMyTurn && pendingDraw > 0 && !hasPlayable && (
          <span style={{ color: '#F43F5E', marginRight: 6 }}>· اسحب +{pendingDraw}</span>
        )}
      </div>
    </div>
  );
}