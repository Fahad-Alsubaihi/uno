import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Card } from './Card';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const CARD_W   = 56;   // عرض الكارت sm
const CARD_H   = 84;   // ارتفاع الكارت sm  (نسبة 1:1.5)
const MIN_SHOW = 24;   // أقل مساحة مرئية أفقياً لكل ورقة
const H_PAD    = 16;   // هامش أفقي — يمنع لمس الحواف
const LIFT     = 32;   // ارتفاع الورقة عند الاختيار
const ROW_GAP  = 6;    // مسافة بين الصفين

/* ─────────────────────────────────────────────
   Layout Calculator
───────────────────────────────────────────── */
function calcLayout(count, winW) {
  if (count === 0) return { overlap: 0, rows: 1, cardW: CARD_W, cardH: CARD_H };

  // الفضاء المتاح بعد الهوامش
  const avail = winW - H_PAD * 2;

  // ─ جرب صف واحد ─
  if (CARD_W * count <= avail) {
    return { overlap: 0, rows: 1, cardW: CARD_W, cardH: CARD_H };
  }

  const overlap1 = Math.ceil((CARD_W * count - avail) / Math.max(count - 1, 1));
  if (overlap1 <= CARD_W - MIN_SHOW) {
    return { overlap: overlap1, rows: 1, cardW: CARD_W, cardH: CARD_H };
  }

  // ─ جرب صفين ─
  const half     = Math.ceil(count / 2);
  const overlap2 = Math.max(
    0,
    Math.ceil((CARD_W * half - avail) / Math.max(half - 1, 1))
  );

  return {
    overlap: Math.min(overlap2, CARD_W - MIN_SHOW),
    rows: 2,
    cardW: CARD_W,
    cardH: CARD_H,
  };
}

/* ─────────────────────────────────────────────
   Glow color per card
───────────────────────────────────────────── */
const GLOW = {
  red:    'rgba(220,38,38,0.7)',
  green:  'rgba(22,163,74,0.7)',
  blue:   'rgba(37,99,235,0.7)',
  yellow: 'rgba(217,119,6,0.7)',
  wild:   'rgba(167,139,250,0.7)',
};

/* ─────────────────────────────────────────────
   PlayerHand Component
───────────────────────────────────────────── */
export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno }) {
  const topCard      = gameState?.topCard;
  const currentColor = gameState?.currentColor;
  const pendingDraw  = gameState?.pendingDraw || 0;

  const [selectedIdx, setSelectedIdx] = useState(null);
  const [unoPressed,  setUnoPressed]  = useState(false);
  const [winW, setWinW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 390
  );

  /* ── window resize ── */
  useEffect(() => {
    const fn = () => setWinW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  /* ── reset on hand change ── */
  useEffect(() => {
    setSelectedIdx(null);
    setUnoPressed(false);
  }, [hand.length]);

  /* ── layout ── */
  const { overlap, rows, cardW, cardH } = useMemo(
    () => calcLayout(hand.length, winW),
    [hand.length, winW]
  );

  const perRow    = Math.ceil(hand.length / rows);
  const rowArrays = useMemo(
    () => Array.from({ length: rows }, (_, r) =>
      hand.slice(r * perRow, (r + 1) * perRow)
    ),
    [hand, rows, perRow]
  );

  /* ── game logic (unchanged) ── */
  const isPlayable = useCallback((card) => {
    if (!isMyTurn) return false;
    if (pendingDraw > 0) return (card.drawValue || 0) >= pendingDraw;
    if (card.color === 'wild') return true;
    if (!topCard) return false;
    const activeColor = currentColor || topCard.color;
    if (card.color === activeColor) return true;
    if (card.type !== 'number' && topCard.color !== 'wild' && card.type === topCard.type) return true;
    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
    return false;
  }, [isMyTurn, pendingDraw, topCard, currentColor]);

  const isJumpable = useCallback((card) => {
    if (!topCard || isMyTurn) return false;
    return (
      card.color === topCard.color &&
      card.type  === topCard.type &&
      (card.type !== 'number' || card.value === topCard.value)
    );
  }, [topCard, isMyTurn]);

  /* ── tap handler (unchanged logic) ── */
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

  /* ─────────────────────────────────────────
     Row Renderer
  ───────────────────────────────────────── */
  function renderRow(cards, startIdx) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        height: cardH + LIFT + 4,
        paddingTop: LIFT + 4,
        position: 'relative',
        overflow: 'visible',
      }}>
        {cards.map((card, i) => {
          const gIdx     = startIdx + i;
          const playable = isPlayable(card);
          const jumpable = isJumpable(card);
          const active   = playable || jumpable;
          const selected = selectedIdx === gIdx;
          const dimmed   = isMyTurn && !active;
          const glowColor = GLOW[card.color] || GLOW.wild;

          return (
            <motion.div
              key={card.id}
              initial={{ y: 60, opacity: 0, scale: 0.8 }}
              animate={{
                y:       selected ? -(LIFT) : 0,
                scale:   selected ? 1.12 : 1,
                opacity: 1,
                zIndex:  selected ? 999 : i + 1,
                filter:  selected
                  ? `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 8px 20px rgba(0,0,0,0.6))`
                  : active
                    ? `drop-shadow(0 2px 6px rgba(0,0,0,0.4))`
                    : 'none',
              }}
              exit={{ y: -40, opacity: 0, scale: 0.75 }}
              transition={{
                y:       { type: 'spring', stiffness: 450, damping: 32 },
                scale:   { type: 'spring', stiffness: 450, damping: 32 },
                filter:  { duration: 0.15 },
                opacity: { duration: 0.14, delay: Math.min(i * 0.008, 0.12) },
              }}
              style={{
                marginLeft:  i === 0 ? 0 : -overlap,
                flexShrink:  0,
                position:    'relative',
                cursor:      active ? 'pointer' : 'default',
                touchAction: 'manipulation',
              }}
              onClick={() => handleTap(gIdx, card, jumpable)}
            >
              {/* ── Selection ring ── */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position:      'absolute',
                      inset:         -4,
                      borderRadius:  12,
                      border:        '2.5px solid rgba(255,255,255,0.95)',
                      boxShadow:     `0 0 0 3px ${glowColor}, 0 0 18px ${glowColor}`,
                      zIndex:        0,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </AnimatePresence>

              {/* ── Jump-in pulse ── */}
              {jumpable && !selected && (
                <motion.div
                  animate={{ opacity: [0.15, 0.85, 0.15], scale: [1, 1.04, 1] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  style={{
                    position:      'absolute',
                    inset:         -3,
                    borderRadius:  10,
                    border:        '2px solid #F59E0B',
                    background:    'rgba(245,158,11,0.08)',
                    zIndex:        0,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* ── Card ── */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Card card={card} isPlayable={active} size="sm" onClick={() => {}} />

                {/* dim overlay */}
                {dimmed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      position:      'absolute',
                      inset:         0,
                      borderRadius:  8,
                      background:    'rgba(0,0,0,0.52)',
                      zIndex:        2,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>

              {/* ── "Play" label ── */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.14 }}
                    style={{
                      position:        'absolute',
                      bottom:          -22,
                      left:            '50%',
                      transform:       'translateX(-50%)',
                      background:      'rgba(255,255,255,0.14)',
                      backdropFilter:  'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border:          '1px solid rgba(255,255,255,0.28)',
                      borderRadius:    8,
                      padding:         '2px 9px',
                      fontSize:        9,
                      fontWeight:      600,
                      color:           '#fff',
                      letterSpacing:   1.5,
                      whiteSpace:      'nowrap',
                      zIndex:          1000,
                      pointerEvents:   'none',
                    }}
                  >
                    ▶ العب
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    );
  }

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      width:         '100%',
      /* Safe Area — iPhone notch / home bar */
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>

      {/* ── UNO Button ── */}
      <div style={{
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'center',
        height:         42,
        paddingTop:     6,
      }}>
        <AnimatePresence>
          {hasUno && (
            <motion.button
              key="uno-btn"
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              whileHover={!unoPressed ? { scale: 1.06 } : {}}
              whileTap={!unoPressed ? { scale: 0.88 } : {}}
              onClick={() => {
                if (!unoPressed) { setUnoPressed(true); onCallUno?.(); }
              }}
              style={{
                position:     'relative',
                background:   unoPressed
                  ? 'rgba(30,41,59,0.8)'
                  : 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
                border:       `1.5px solid ${unoPressed ? 'rgba(71,85,105,0.6)' : 'rgba(251,113,133,0.7)'}`,
                borderRadius: 24,
                padding:      '8px 28px',
                fontFamily:   'var(--font-head)',
                fontSize:     16,
                fontWeight:   700,
                color:        unoPressed ? '#475569' : '#fff',
                cursor:       unoPressed ? 'default' : 'pointer',
                letterSpacing: 3,
                boxShadow:    unoPressed
                  ? 'none'
                  : '0 0 24px rgba(244,63,94,0.5), 0 4px 14px rgba(0,0,0,0.4)',
                transition:   'background 0.2s, box-shadow 0.2s, color 0.2s',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            >
              {/* pulse ring */}
              {!unoPressed && (
                <motion.span
                  animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                  style={{
                    position:     'absolute',
                    inset:        0,
                    borderRadius: 24,
                    border:       '2px solid rgba(244,63,94,0.5)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {unoPressed ? '✓ UNO' : 'UNO!'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Card Tray ── */}
      <div style={{
        margin:           '0 8px 4px',
        background:       'rgba(15,10,40,0.55)',
        backdropFilter:   'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border:           '1px solid rgba(255,255,255,0.08)',
        borderRadius:     '20px 20px 16px 16px',
        boxShadow:        '0 -4px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        overflow:         'visible',
        /* هامش داخلي يضمن عدم لمس الحواف */
        padding:          `6px ${H_PAD}px 10px`,
      }}>

        {/* rows */}
        <AnimatePresence>
          {rowArrays.map((rowCards, ri) => (
            <div
              key={ri}
              style={{
                overflow:     'visible',
                marginBottom: ri < rows - 1 ? ROW_GAP : 0,
              }}
            >
              {renderRow(rowCards, ri * perRow)}
            </div>
          ))}
        </AnimatePresence>

        {/* ── Status bar ── */}
        <div style={{
          display:        'flex',
          justifyContent: 'center',
          alignItems:     'center',
          gap:            6,
          paddingTop:     6,
          minHeight:      20,
        }}>
          {/* card count pill */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          4,
            background:   hand.length >= 20
              ? 'rgba(239,68,68,0.18)'
              : 'rgba(255,255,255,0.07)',
            border:       `1px solid ${hand.length >= 20 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 20,
            padding:      '2px 10px',
          }}>
            {hand.length >= 20 && (
              <span style={{ fontSize: 10 }}>⚠️</span>
            )}
            <span style={{
              fontSize:    10,
              fontFamily:  'var(--font-head)',
              fontWeight:  600,
              letterSpacing: 1,
              color:       hand.length >= 20 ? '#FCA5A5' : '#94A3B8',
            }}>
              {hand.length} / 25
            </span>
          </div>

          {/* hint */}
          <AnimatePresence mode="wait">
            {isMyTurn && !hasPlayable && pendingDraw === 0 && (
              <motion.span
                key="draw-hint"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{
                  fontSize: 10, color: '#A78BFA',
                  fontFamily: 'var(--font-head)', letterSpacing: 1,
                }}
              >
                · اسحب
              </motion.span>
            )}
            {isMyTurn && pendingDraw > 0 && !hasPlayable && (
              <motion.span
                key="pending-hint"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{
                  fontSize: 10, color: '#FCA5A5',
                  fontFamily: 'var(--font-head)', letterSpacing: 1,
                }}
              >
                · اسحب +{pendingDraw}
              </motion.span>
            )}
            {selectedIdx !== null && (
              <motion.span
                key="play-hint"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{
                  fontSize: 10, color: '#A78BFA',
                  fontFamily: 'var(--font-head)', letterSpacing: 1,
                }}
              >
                · اضغط ثانية للعب
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}