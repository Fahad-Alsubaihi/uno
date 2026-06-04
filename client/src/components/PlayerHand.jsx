import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Card } from './Card';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const LIFT  = 38;
const H_PAD = 9;

const GLOW = {
  red:    'rgba(220,38,38,0.7)',
  green:  'rgba(22,163,74,0.7)',
  blue:   'rgba(37,99,235,0.7)',
  yellow: 'rgba(217,119,6,0.7)',
  wild:   'rgba(167,139,250,0.7)',
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function buildRows(hand, perRow) {
  const rows = [];
  for (let i = 0; i < hand.length; i += perRow)
    rows.push(hand.slice(i, i + perRow));
  return rows;
}

function calcLayout(winW) {
  const availW  = winW - H_PAD * 2;
  const targetW = winW < 480 ? 58 : winW < 768 ? 64 : winW < 1024 ? 72 : 80;
  const perRow  = Math.max(3, Math.floor(availW / targetW));
  const cardW   = Math.floor(availW / perRow);
  const cardH   = Math.round(cardW * 1.5);
  const peek    = Math.round(cardH * 0.25);
  return { cardW, cardH, perRow, peek };
}

/* ─────────────────────────────────────────────
   PlayerHand
───────────────────────────────────────────── */
export function PlayerHand({ hand, isMyTurn, gameState, onPlay, onCallUno, trayRef: trayRefProp }) {
  const topCard                = gameState?.topCard;
  const currentColor           = gameState?.currentColor;
  const pendingDraw            = gameState?.pendingDraw   || 0;
  const lastDrawValue          = gameState?.lastDrawValue || 0;
  const inDrawPhase            = gameState?.inDrawPhase            || false;
  const drawPhaseFoundPlayable = gameState?.drawPhaseFoundPlayable || false;
  const lastDrawnCardId        = gameState?.lastDrawnCardId        || null;

  const [selectedIdx,  setSelectedIdx]  = useState(null);
  const [unoPressed,   setUnoPressed]   = useState(false);
  const [hiddenCardId, setHiddenCardId] = useState(null);
  const [winW, setWinW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 390
  );

  // use prop ref if provided (for Pixi animation layer), else local fallback
  const localTrayRef = useRef(null);
  const trayRef = trayRefProp ?? localTrayRef;

  /* ── window resize ── */
  useEffect(() => {
    const fn = () => setWinW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  /* ── reset on hand change (server confirmed) ── */
  useEffect(() => {
    setSelectedIdx(null);
    setUnoPressed(false);
    setHiddenCardId(null);
  }, [hand.length]);

  /* ── confirm ref is mounted ── */
  useEffect(() => {
    console.log('trayRef ready:', trayRef.current);
  }, []);

  /* ── card dimensions & layout ── */
  const { cardW, cardH, perRow, peek } = useMemo(() => calcLayout(winW), [winW]);
  // Filter out the optimistically-hidden card for display only
  const displayHand = useMemo(
    () => hiddenCardId ? hand.filter(c => c.id !== hiddenCardId) : hand,
    [hand, hiddenCardId]
  );
  const rows    = useMemo(() => buildRows(displayHand, perRow), [displayHand, perRow]);
  const numRows = rows.length || 1;

  /*
    Row positioning (absolute inside rows-container):
      rowIndex (last)  → top = 0            → visually on TOP  (fully visible)
      rowIndex (first) → top = (n-1)*PEEK   → visually at BOTTOM (peeking)

    z-index:  rowIndex+1  →  last row = highest z = covers rows beneath it
  */

  /* ── game logic (unchanged) ── */
  const isPlayable = useCallback((card) => {
    if (!isMyTurn) return false;
    // After drawing a playable card, only that card can be played
    if (drawPhaseFoundPlayable) return card.id === lastDrawnCardId;
    if (pendingDraw > 0) return (card.drawValue || 0) >= lastDrawValue;
    if (card.color === 'wild') return true;
    if (!topCard) return false;
    const activeColor = currentColor || topCard.color;
    if (card.color === activeColor) return true;
    if (card.type !== 'number' && topCard.color !== 'wild' && card.type === topCard.type) return true;
    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
    return false;
  }, [isMyTurn, drawPhaseFoundPlayable, lastDrawnCardId, pendingDraw, lastDrawValue, topCard, currentColor]);

  /* ── tap handler ── */
  function handleTap(globalIdx, card) {
    if (!isPlayable(card)) { setSelectedIdx(null); return; }
    if (selectedIdx === globalIdx) {
      setSelectedIdx(null);
      setHiddenCardId(card.id); // hide immediately before server responds
      const serverIdx = hand.findIndex(c => c.id === card.id);
      onPlay(serverIdx, card);
    } else {
      setSelectedIdx(globalIdx);
    }
  }

  const hasUno      = displayHand.length === 1;
  const hasPlayable = displayHand.some(isPlayable);

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      width:         '100%',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
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
                position:      'relative',
                background:    unoPressed
                  ? 'rgba(30,41,59,0.8)'
                  : 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
                border:        `1.5px solid ${unoPressed ? 'rgba(71,85,105,0.6)' : 'rgba(251,113,133,0.7)'}`,
                borderRadius:  24,
                padding:       '8px 28px',
                fontFamily:    'var(--font-head)',
                fontSize:      16,
                color:         unoPressed ? '#475569' : '#fff',
                cursor:        unoPressed ? 'default' : 'pointer',
                letterSpacing: 3,
                boxShadow:     unoPressed
                  ? 'none'
                  : '0 0 24px rgba(244,63,94,0.5), 0 4px 14px rgba(0,0,0,0.4)',
                transition:    'background 0.2s, box-shadow 0.2s, color 0.2s',
              }}
            >
              {!unoPressed && (
                <motion.span
                  animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 24,
                    border: '2px solid rgba(244,63,94,0.5)',
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
      <div
        ref={trayRef}
        style={{
          margin:               '0 8px 4px',
          background:           'rgba(15,10,40,0.55)',
          backdropFilter:       'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border:               isMyTurn
            ? '1.5px solid rgba(34,197,94,0.55)'
            : '1px solid rgba(255,255,255,0.08)',
          borderRadius:         '20px 20px 16px 16px',
          boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.06)',
          animation:            isMyTurn ? 'trayGlow 1.15s ease-in-out infinite' : 'none',
          overflow:             'visible',
          position:             'relative',
          transition:           'border-color 0.3s',
          // paddingTop reserves space so lifted cards don't get clipped
          paddingTop:   16,
          paddingLeft:  H_PAD,
          paddingRight: H_PAD,
          paddingBottom: 0,
        }}
      >
        {/* ── Rows container ── */}
        <div style={{
          position: 'relative',
          height:   cardH + (numRows - 1) * peek,
          overflow: 'visible',
        }}>
          {rows.map((rowCards, rowIndex) => {
            /*
              rowIndex n-1 (last)  → top = 0           → top of tray, fully visible
              rowIndex 0   (first) → top = (n-1)*PEEK  → bottom, only PEEK visible
            */
            const rowTop = (numRows - 1 - rowIndex) * peek;
            const rowZ   = numRows - rowIndex;

            return (
              <div
                key={rowIndex}
                style={{
                  position:       'absolute',
                  top:            rowTop,
                  left:           0,
                  right:          0,
                  height:         cardH,
                  display:        'flex',
                  justifyContent: 'center',
                  overflow:       'visible',
                  zIndex:         rowZ,
                }}
              >
                {rowCards.map((card, i) => {
                  const globalIdx   = rowIndex * perRow + i;
                  const playable    = isPlayable(card);
                  const selected    = selectedIdx === globalIdx;
                  const isDrawnCard = drawPhaseFoundPlayable && card.id === lastDrawnCardId;
                  const dimmed      = isMyTurn && !playable;
                  const glowColor   = GLOW[card.color] || GLOW.wild;

                  return (
                    <motion.div
                      key={card.id}
                      initial={{ y: 40, opacity: 0, scale: 0.85 }}
                      animate={{
                        y:       selected ? -LIFT : 0,
                        scale:   selected ? 1.08 : 1,
                        opacity: 1,
                        zIndex:  selected ? 999 : rowZ * 10 + i,
                        filter:  selected
                          ? `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 8px 20px rgba(0,0,0,0.6))`
                          : playable
                            ? `drop-shadow(0 2px 4px rgba(0,0,0,0.4))`
                            : 'none',
                      }}
                      exit={{ y: -30, opacity: 0, scale: 0.8 }}
                      transition={{
                        y:       { type: 'spring', stiffness: 500, damping: 36 },
                        scale:   { type: 'spring', stiffness: 500, damping: 36 },
                        filter:  { duration: 0.15 },
                        opacity: { duration: 0.14, delay: Math.min(i * 0.008, 0.1) },
                      }}
                      style={{
                        position:    'relative',
                        flexShrink:  0,
                        cursor:      playable ? 'pointer' : 'default',
                        touchAction: 'manipulation',
                        width:       cardW,
                        height:      cardH,
                        marginLeft:  i === 0 ? 0 : -(cardW * 0.5),
                      }}
                      onClick={() => handleTap(globalIdx, card)}
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

                      {/* ── Drawn card pulse (must play) ── */}
                      {isDrawnCard && !selected && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.06, 1] }}
                          transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut' }}
                          style={{
                            position:      'absolute',
                            inset:         -5,
                            borderRadius:  12,
                            border:        '2.5px solid #FCD34D',
                            background:    'rgba(252,211,77,0.12)',
                            boxShadow:     '0 0 16px rgba(252,211,77,0.6)',
                            zIndex:        0,
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {/* ── Card — native size via customW/customH ── */}
                      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}>
                        <Card
                          card={card}
                          isPlayable={playable}
                          customW={cardW}
                          customH={cardH}
                          onClick={() => {}}
                        />
                      </div>

                      {/* ── Dim overlay ── */}
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

                      {/* ── "Play" label ── */}
                      <AnimatePresence>
                        {selected && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.14 }}
                            style={{
                              position:             'absolute',
                              bottom:               -22,
                              left:                 '50%',
                              transform:            'translateX(-50%)',
                              background:           'rgba(255,255,255,0.14)',
                              backdropFilter:       'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              border:               '1px solid rgba(255,255,255,0.28)',
                              borderRadius:         8,
                              padding:              '2px 9px',
                              fontSize:             9,
                              fontWeight:           600,
                              color:                '#fff',
                              letterSpacing:        1.5,
                              whiteSpace:           'nowrap',
                              zIndex:               1000,
                              pointerEvents:        'none',
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
          })}
        </div>

        {/* ── Status bar ── */}
        <div style={{
          display:        'flex',
          justifyContent: 'center',
          alignItems:     'center',
          gap:            6,
          paddingTop:     8,
          paddingBottom:  10,
          minHeight:      20,
        }}>
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
            <span style={{
              fontSize:      10,
              fontFamily:    'var(--font-head)',
              fontWeight:    600,
              letterSpacing: 1,
              color:         hand.length >= 20 ? '#FCA5A5' : '#94A3B8',
            }}>
              {hand.length} / 25
            </span>
          </div>

          <AnimatePresence mode="wait">
            {isMyTurn && drawPhaseFoundPlayable && (
              <motion.span key="must-play-hint"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: [0.7, 1, 0.7], x: 0 }} exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.1 }}
                style={{ fontSize: 10, color: '#FCD34D', fontFamily: 'var(--font-head)', letterSpacing: 1 }}
              >
                · العب الورقة المسحوبة
              </motion.span>
            )}
            {isMyTurn && inDrawPhase && !drawPhaseFoundPlayable && (
              <motion.span key="draw-again-hint"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: [0.6, 1, 0.6], x: 0 }} exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.1 }}
                style={{ fontSize: 10, color: '#60A5FA', fontFamily: 'var(--font-head)', letterSpacing: 1 }}
              >
                · اسحب مرة أخرى
              </motion.span>
            )}
            {isMyTurn && !inDrawPhase && !hasPlayable && pendingDraw === 0 && (
              <motion.span key="draw-hint"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 10, color: '#A78BFA', fontFamily: 'var(--font-head)', letterSpacing: 1 }}
              >
                · اسحب حتى تجد ورقة
              </motion.span>
            )}
            {isMyTurn && pendingDraw > 0 && !hasPlayable && (
              <motion.span key="pending-hint"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 10, color: '#FCA5A5', fontFamily: 'var(--font-head)', letterSpacing: 1 }}
              >
                · اسحب +{pendingDraw}
              </motion.span>
            )}
            {selectedIdx !== null && (
              <motion.span key="play-hint"
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 10, color: '#A78BFA', fontFamily: 'var(--font-head)', letterSpacing: 1 }}
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
