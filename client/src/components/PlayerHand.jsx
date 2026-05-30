import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { Card } from './Card';

// حجم ثابت — sm دايماً
const CARD_W = 52;
const CARD_H = 78;
// أقل عرض مرئي لكل ورقة (نص الورقة = 26px)
const MIN_SHOW = 26;
// هامش جانبي ثابت
const PAD = 14;

function calcOverlap(count, winW) {
  const avail = winW - PAD * 2;
  // بلا تداخل
  if (CARD_W * count <= avail) return { overlap: 0, rows: 1 };
  // صف واحد بتداخل — minimum 26px مرئي
  const overlap1 = Math.ceil((CARD_W * count - avail) / Math.max(count - 1, 1));
  if (overlap1 <= CARD_W - MIN_SHOW) return { overlap: overlap1, rows: 1 };
  // صفين
  const half = Math.ceil(count / 2);
  const overlap2 = Math.max(0, Math.ceil((CARD_W * half - avail) / Math.max(half - 1, 1)));
  return { overlap: Math.min(overlap2, CARD_W - MIN_SHOW), rows: 2 };
}

export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno }) {
  const topCard     = gameState?.topCard;
  const currentColor= gameState?.currentColor;
  const pendingDraw = gameState?.pendingDraw || 0;

  const [selectedIdx, setSelectedIdx] = useState(null);
  const [unoPressed, setUnoPressed]   = useState(false);
  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 390);

  useEffect(() => {
    const fn = () => setWinW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => { setSelectedIdx(null); setUnoPressed(false); }, [hand.length]);

  const { overlap, rows } = useMemo(() => calcOverlap(hand.length, winW), [hand.length, winW]);

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

  function handleTap(globalIdx, card, jumpable) {
    const active = isPlayable(card) || jumpable;
    if (!active) { setSelectedIdx(null); return; }
    if (selectedIdx === globalIdx) {
      setSelectedIdx(null);
      onPlay(globalIdx, card, jumpable);
    } else {
      setSelectedIdx(globalIdx);
    }
  }

  const hasUno      = hand.length === 1;
  const hasPlayable = hand.some(isPlayable);
  // ارتفاع الرفع عند الاختيار
  const LIFT = 28;

  function renderRow(cards, startIdx) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        // ارتفاع الصف = الكارت + مساحة الرفع فوقه
        height: CARD_H + LIFT,
        paddingTop: LIFT,
        position: 'relative',
      }}>
        {cards.map((card, i) => {
          const gIdx     = startIdx + i;
          const playable = isPlayable(card);
          const jumpable = isJumpable(card);
          const active   = playable || jumpable;
          const selected = selectedIdx === gIdx;
          const dimmed   = isMyTurn && !active && !selected;

          return (
            <motion.div
              key={card.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{
                y: selected ? -LIFT : 0,
                scale: selected ? 1.10 : 1,
                opacity: 1,
                zIndex: selected ? 999 : i,
              }}
              exit={{ y: -30, opacity: 0, scale: 0.8 }}
              transition={{
                y:       { type: 'spring', stiffness: 420, damping: 30 },
                scale:   { type: 'spring', stiffness: 420, damping: 30 },
                opacity: { duration: 0.12, delay: i * 0.01 },
              }}
              style={{
                marginLeft: i === 0 ? 0 : -overlap,
                flexShrink: 0,
                position: 'relative',
                cursor: active ? 'pointer' : 'default',
              }}
              onClick={() => handleTap(gIdx, card, jumpable)}
            >
              {/* حلقة الاختيار */}
              {selected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute', inset: -3, borderRadius: 11,
                    border: '2px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 0 12px rgba(255,255,255,0.4)',
                    zIndex: 0, pointerEvents: 'none',
                  }}
                />
              )}

              {/* حلقة jump-in */}
              {jumpable && !selected && (
                <motion.div
                  animate={{ opacity: [0.2, 0.9, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{
                    position: 'absolute', inset: -2, borderRadius: 9,
                    border: '2px solid #D97706',
                    background: 'rgba(217,119,6,0.1)',
                    zIndex: 0, pointerEvents: 'none',
                  }}
                />
              )}

              {/* الكارت */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Card card={card} isPlayable={active} size="sm" onClick={() => {}} />
                {/* تعتيم الأوراق غير القابلة */}
                {dimmed && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 8,
                    background: 'rgba(0,0,0,0.55)',
                    zIndex: 2, pointerEvents: 'none',
                  }} />
                )}
              </div>

              {/* "العب" تحت الورقة المختارة */}
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute', bottom: -20, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 6, padding: '2px 8px',
                    fontSize: 9, color: '#fff',
                    fontFamily: 'var(--font-head)', letterSpacing: 1,
                    whiteSpace: 'nowrap', zIndex: 1000,
                    pointerEvents: 'none',
                  }}
                >
                  ▶ العب
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* UNO */}
      <div style={{ display: 'flex', justifyContent: 'center', height: 36, alignItems: 'center' }}>
        <AnimatePresence>
          {hasUno && (
            <motion.button
              key="uno"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => { if (!unoPressed) { setUnoPressed(true); onCallUno?.(); } }}
              style={{
                background: unoPressed ? '#1F2937' : 'linear-gradient(135deg,#F43F5E,#BE123C)',
                border: `1.5px solid ${unoPressed ? '#374151' : '#FB7185'}`,
                borderRadius: 20, padding: '5px 22px',
                fontFamily: 'var(--font-head)', fontSize: 15,
                color: unoPressed ? '#4B5563' : '#fff',
                cursor: unoPressed ? 'default' : 'pointer',
                letterSpacing: 3,
                boxShadow: unoPressed ? 'none' : '0 0 20px rgba(244,63,94,0.45)',
              }}
            >
              {unoPressed ? '✓ UNO' : 'UNO!'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* الأوراق */}
      <div style={{ padding: `0 ${PAD}px`, overflow: 'visible' }}>
        <AnimatePresence>
          {rowArrays.map((rowCards, ri) => (
            <div key={ri} style={{ overflow: 'visible' }}>
              {renderRow(rowCards, ri * perRow)}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* شريط الحالة */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 8, padding: '5px 0 4px',
        fontSize: 10, fontFamily: 'var(--font-head)',
        color: hand.length >= 20 ? '#EF4444' : '#334155',
      }}>
        {hand.length >= 20 && <span>⚠️</span>}
        <span>{hand.length} / 25</span>
        {isMyTurn && !hasPlayable && pendingDraw === 0 && (
          <span style={{ color: '#7C3AED' }}>· اسحب</span>
        )}
        {isMyTurn && pendingDraw > 0 && !hasPlayable && (
          <span style={{ color: '#EF4444' }}>· اسحب +{pendingDraw}</span>
        )}
        {selectedIdx !== null && (
          <span style={{ color: '#A78BFA' }}>· اضغط ثانية للعب</span>
        )}
      </div>
    </div>
  );
}