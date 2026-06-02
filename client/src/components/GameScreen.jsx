import { useState, useEffect, useRef, createRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';

// refs prepared for card-fly animation — attached to DOM in future steps
export const deckRef    = createRef(); // deck pile in GameBoard
export const discardRef = createRef(); // discard pile in GameBoard
export const trayRef    = createRef(); // card tray in PlayerHand
import { PlayerHand } from './PlayerHand';
import { GameBoard } from './GameBoard';
import { OpponentHand } from './OpponentHand';
import { ColorPicker } from './ColorPicker';
import { SevenSwapModal } from './SevenSwapModal';
import { ErrorToast } from './ErrorToast';
import { Notification } from './Notification';
import { CardGuide } from './CardGuide';
import { RoundOverModal } from './RoundOverModal';

const COLOR_META = {
  red:    { hex: '#DC2626', glow: '#EF4444', label: 'أحمر' },
  green:  { hex: '#16A34A', glow: '#22C55E', label: 'أخضر' },
  blue:   { hex: '#2563EB', glow: '#60A5FA', label: 'أزرق' },
  yellow: { hex: '#D97706', glow: '#FCD34D', label: 'أصفر' },
  wild:   { hex: '#7C3AED', glow: '#A78BFA', label: 'وايلد' },
};

const EMOJIS = ['😂', '😤', '🔥', '💀', '😱', '👏', '🤡', '😈'];

export function GameScreen({ socket }) {
  const { gameState, playerId, hostId, error, notification, roundResult, roomPlayers, setRoundResult, reactions } = useGameStore();
  // Defined early so hooks can use it as a dependency without TDZ
  const isMyTurn = gameState?.currentPlayerId === playerId;

  const { playCard, drawCard, callUno, catchUno, sevenSwap, colorRoulettePick, rouletteDraw, startNextRound, sendReaction } = useGame(socket);
  const sound = useSound();

  const prevIsMyTurnRef = useRef(false);

  // Sound + vibration when turn starts
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      sound.yourTurn();
      navigator.vibrate?.([150, 50, 100]);
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  // Page Visibility API — broadcast away status to other players
  useEffect(() => {
    if (!socket) return;
    const onVisibility = () => socket.emit('player-visibility', { away: document.hidden });
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [socket]);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reactionText, setReactionText] = useState('');

  useEffect(() => {
    if (gameState?.pendingSevenSwap && gameState?.pendingSevenPlayerId === playerId) {
      setSwapOpen(true);
    } else {
      setSwapOpen(false);
    }
  }, [gameState?.pendingSevenSwap, gameState?.pendingSevenPlayerId, playerId]);

  if (!gameState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#7C3AED', letterSpacing: 4 }}
        >
          جار التحميل…
        </motion.div>
      </div>
    );
  }

  const myHand   = gameState.myHand || [];
  const players  = gameState.players || [];
  const myPlayer = players.find(p => p.id === playerId);
  const opponents = players.filter(p => p.id !== playerId);
  const isMyRoulette     = gameState.pendingColorRoulette && gameState.pendingColorRoulettePlayerId === playerId;
  const rouletteNeedPick = isMyRoulette && !gameState.rouletteChosenColor;
  const rouletteDrawing  = isMyRoulette && !!gameState.rouletteChosenColor;
  const currentPlayerName = players.find(p => p.id === gameState.currentPlayerId)?.name || '';
  const colorInfo = COLOR_META[gameState.currentColor] || COLOR_META.wild;

  function handlePlay(cardIndex, card) {
    if (card.type === 'wild-color-roulette') {
      sound.playCard();
      playCard(cardIndex, null);
      return;
    }
    if (card.color === 'wild') {
      setPendingCardIndex(cardIndex);
      setColorPickerOpen(true);
    } else {
      sound.playCard();
      playCard(cardIndex, null);
    }
  }

  function handleColorPick(color) {
    setColorPickerOpen(false);
    sound.playCard();
    playCard(pendingCardIndex, color);
    setPendingCardIndex(null);
  }

  function handleRoulettePick(color) { sound.swap(); colorRoulettePick(color); }
  function handleDraw() {
    sound.drawCard();
    if (rouletteDrawing) { rouletteDraw(); } else { drawCard(); }
  }
  function handleUno() { sound.uno(); callUno(); }
  function handleSwap(targetId) { setSwapOpen(false); sound.swap(); sevenSwap(targetId); }

  return (
    <div style={{
      width: '100vw', height: '100dvh',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'visible', position: 'relative',
      direction: 'rtl',
    }}>
      <ErrorToast message={error} />
      <Notification notification={notification} />
      <ColorPicker open={colorPickerOpen} onPick={handleColorPick} />
      <ColorPicker open={rouletteNeedPick} onPick={handleRoulettePick} title="روليت الألوان — اختر لون" />
      <SevenSwapModal open={swapOpen} players={players} myId={playerId} onSwap={handleSwap} />
      <CardGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
      <RoundOverModal
        result={roundResult}
        roomPlayers={roomPlayers}
        playerId={playerId}
        isHost={hostId ? hostId === playerId : roomPlayers[0]?.id === playerId}
        onNextRound={() => { startNextRound(); setRoundResult(null); }}
      />

      {/* ── HUD HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 12px', height: 50, flexShrink: 0,
        background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        gap: 8, position: 'relative',
      }}>
        {/* Brand */}
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#F43F5E', letterSpacing: 2, flexShrink: 0 }}>
          UNO<span style={{ color: '#7C3AED' }}>·NM</span>
        </div>

        {/* Card guide button */}
        <motion.button
          whileHover={{ scale: 1.12, boxShadow: '0 0 12px rgba(124,58,237,0.5)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setGuideOpen(true)}
          aria-label="دليل الأوراق"
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.4)',
            color: '#A78BFA',
            fontFamily: 'var(--font-head)', fontSize: 13,
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          ?
        </motion.button>

        {/* Emoji reaction button */}
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setEmojiOpen(v => !v)}
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: emojiOpen ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.15)',
            border: `1px solid ${emojiOpen ? 'rgba(124,58,237,0.8)' : 'rgba(124,58,237,0.4)'}`,
            fontSize: 13, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          😊
        </motion.button>

        {/* Emoji + text picker dropdown */}
        <AnimatePresence>
          {emojiOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.92 }}
              transition={{ duration: 0.14 }}
              style={{
                position: 'absolute', top: 54, left: 8,
                background: 'rgba(14,10,40,0.97)',
                border: '1px solid rgba(124,58,237,0.45)',
                borderRadius: 14, padding: 8,
                zIndex: 300,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                width: 176,
              }}
            >
              {/* Emoji grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {EMOJIS.map(e => (
                  <motion.button
                    key={e}
                    whileHover={{ scale: 1.25, background: 'rgba(124,58,237,0.2)' }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => { sendReaction(e); setEmojiOpen(false); }}
                    style={{
                      background: 'transparent', border: 'none',
                      fontSize: 22, cursor: 'pointer',
                      width: 38, height: 38,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8,
                    }}
                  >
                    {e}
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div style={{
                height: 1, margin: '8px 2px',
                background: 'rgba(124,58,237,0.2)',
              }} />

              {/* Text input */}
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  autoFocus
                  value={reactionText}
                  onChange={e => setReactionText(e.target.value.slice(0, 24))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && reactionText.trim()) {
                      sendReaction(reactionText.trim());
                      setReactionText('');
                      setEmojiOpen(false);
                    }
                    if (e.key === 'Escape') setEmojiOpen(false);
                  }}
                  placeholder="اكتب شي..."
                  style={{
                    flex: 1, background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(124,58,237,0.35)',
                    borderRadius: 8, padding: '6px 8px',
                    color: '#E2E8F0', fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    outline: 'none', direction: 'rtl',
                    minWidth: 0,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,0.35)'; }}
                />
                <motion.button
                  whileHover={reactionText.trim() ? { scale: 1.1 } : {}}
                  whileTap={reactionText.trim() ? { scale: 0.9 } : {}}
                  onClick={() => {
                    if (!reactionText.trim()) return;
                    sendReaction(reactionText.trim());
                    setReactionText('');
                    setEmojiOpen(false);
                  }}
                  style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: reactionText.trim() ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${reactionText.trim() ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.1)'}`,
                    color: reactionText.trim() ? '#A78BFA' : '#475569',
                    fontSize: 14, cursor: reactionText.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ↑
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Turn indicator — center */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isMyTurn ? 'my-turn' : 'their-turn'}
            initial={{ opacity: 0, scale: 0.85, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 6 }}
            transition={{ duration: 0.18 }}
            style={{
              fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: 1.5,
              color: rouletteNeedPick ? '#FCD34D' : isMyTurn ? '#22C55E' : '#64748B',
              background: rouletteNeedPick
                ? 'rgba(252,211,77,0.12)'
                : isMyTurn
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(255,255,255,0.04)',
              padding: '4px 12px', borderRadius: 20,
              border: `1px solid ${rouletteNeedPick ? 'rgba(252,211,77,0.3)' : isMyTurn ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isMyTurn ? '0 0 14px rgba(34,197,94,0.25)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {rouletteNeedPick ? 'اختر لون'
              : rouletteDrawing ? `اسحب — ${gameState.rouletteChosenColor || ''}`
              : isMyTurn ? '◀ دورك'
              : `دور ${currentPlayerName}`}
          </motion.div>
        </AnimatePresence>

        <div style={{ flex: 1 }} />

        {/* Current color indicator */}
        <motion.div
          animate={{
            boxShadow: [`0 0 8px ${colorInfo.glow}60`, `0 0 16px ${colorInfo.glow}`, `0 0 8px ${colorInfo.glow}60`],
            background: colorInfo.hex,
          }}
          transition={{ boxShadow: { repeat: Infinity, duration: 1.8 }, background: { duration: 0.35 } }}
          style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            flexShrink: 0,
          }}
        />

        {/* Player count */}
        <div style={{
          fontSize: 10, color: '#475569',
          fontFamily: 'var(--font-head)', letterSpacing: 1, flexShrink: 0,
        }}>
          {players.length}v
        </div>
      </div>

      {/* ── OPPONENTS ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 8, padding: '8px 12px', flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {opponents.map((opp, idx) => (
          <OpponentHand
            key={opp.id}
            player={opp}
            playerIndex={idx + 1}
            isCurrentPlayer={!isMyTurn && gameState.currentPlayerId === opp.id}
            onCatchUno={catchUno}
            canCatch={true}
            reaction={reactions[opp.id] || null}
          />
        ))}
      </div>

      {/* ── BOARD ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <GameBoard
          gameState={gameState}
          isMyTurn={(isMyTurn && !isMyRoulette) || rouletteDrawing}
          onDraw={handleDraw}
          hasPlayableInHand={myHand.some(card => {
            if (gameState.pendingDraw > 0) return (card.drawValue || 0) >= (gameState.lastDrawValue || 0);
            if (card.color === 'wild') return true;
            const top = gameState.topCard;
            const col = gameState.currentColor || top?.color;
            if (card.color === col) return true;
            if (card.type !== 'number' && top?.color !== 'wild' && card.type === top?.type) return true;
            if (card.type === 'number' && top?.type === 'number' && card.value === top?.value) return true;
            return false;
          })}
        />
      </div>

      {/* ── MY NAME ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 6, flexShrink: 0, padding: '2px 0',
      }}>
        <AnimatePresence>
          {reactions[playerId] && (
            <motion.span
              key={reactions[playerId]}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              style={reactions[playerId].length <= 2
                ? { fontSize: 18, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }
                : {
                    fontSize: 10, color: '#E2E8F0',
                    background: 'rgba(14,10,40,0.95)',
                    border: '1px solid rgba(124,58,237,0.5)',
                    borderRadius: 20, padding: '2px 8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }
              }
            >
              {reactions[playerId]}
            </motion.span>
          )}
        </AnimatePresence>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 10, color: '#334155', letterSpacing: 2 }}>
          {myPlayer?.name || 'أنت'}
        </span>
        <AnimatePresence>
          {isMyTurn && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.4, 1] }}
              exit={{ scale: 0 }}
              transition={{ repeat: Infinity, duration: 0.9 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── HAND ── */}
      <div style={{
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
        overflowX: 'hidden',  // يمنع الخروج يمين ويسار
        overflowY: 'visible', // يسمح للأوراق ترتفع
        background: 'rgba(0,0,0,0.5)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
      }}>
        <PlayerHand
          hand={myHand}
          isMyTurn={isMyTurn && !isMyRoulette && !rouletteDrawing}
          gameState={gameState}
          onPlay={handlePlay}
          onCallUno={handleUno}
        />
      </div>

      {/* Roulette hint */}
      <AnimatePresence>
        {(rouletteNeedPick || rouletteDrawing) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
              background: '#1E1B4B', border: '1px solid #7C3AED',
              borderRadius: 10, padding: '6px 18px',
              fontFamily: 'var(--font-head)', fontSize: 11, color: '#A78BFA',
              zIndex: 100, letterSpacing: 1, whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 0 20px rgba(124,58,237,0.3)',
            }}
          >
            {rouletteNeedPick ? 'اختر اللون الذي ستسحب له' : `اسحب حتى يجيك لون ${gameState.rouletteChosenColor || ''}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
