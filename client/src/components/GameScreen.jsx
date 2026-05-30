import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import { PlayerHand } from './PlayerHand';
import { GameBoard } from './GameBoard';
import { OpponentHand } from './OpponentHand';
import { ColorPicker } from './ColorPicker';
import { SevenSwapModal } from './SevenSwapModal';
import { ErrorToast } from './ErrorToast';
import { Notification } from './Notification';

export function GameScreen({ socket }) {
  const { gameState, playerId, error, notification } = useGameStore();
  const { playCard, drawCard, callUno, catchUno, jumpIn, sevenSwap, colorRoulettePick } = useGame(socket);
  const sound = useSound();

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState(null);
  const [swapOpen, setSwapOpen] = useState(false);

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
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#7C3AED', letterSpacing: 4 }}>
          جار التحميل…
        </motion.div>
      </div>
    );
  }

  const myHand = gameState.myHand || [];
  const players = gameState.players || [];
  const isMyTurn = gameState.currentPlayerId === playerId;
  const myPlayer = players.find(p => p.id === playerId);
  const opponents = players.filter(p => p.id !== playerId);
  const isMyRoulette = gameState.pendingColorRoulette && gameState.pendingColorRoulettePlayerId === playerId;
  const currentPlayerName = players.find(p => p.id === gameState.currentPlayerId)?.name || '';

  function handlePlay(cardIndex, card, isJumpIn) {
    if (isJumpIn) { sound.jumpIn(); jumpIn(cardIndex); return; }
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
  function handleDraw() { sound.drawCard(); drawCard(); }
  function handleUno() { sound.uno(); callUno(); }
  function handleSwap(targetId) { setSwapOpen(false); sound.swap(); sevenSwap(targetId); }

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',          /* dynamic viewport — يحسب شريط المتصفح */
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'clip',
      position: 'relative',
      direction: 'rtl',
    }}>
      <ErrorToast message={error} />
      <Notification notification={notification} />
      <ColorPicker open={colorPickerOpen} onPick={handleColorPick} />
      <ColorPicker open={isMyRoulette} onPick={handleRoulettePick} title="روليت الألوان — اختر لون" />
      <SevenSwapModal open={swapOpen} players={players} myId={playerId} onSwap={handleSwap} />

      {/* ── HEADER — ثابت ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
        height: 44,
      }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, color: '#F43F5E', letterSpacing: 3 }}>
          UNO<span style={{ color: '#7C3AED' }}>·NM</span>
        </div>
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontFamily: 'var(--font-head)', fontSize: 11, color: isMyTurn ? '#22C55E' : '#94A3B8', letterSpacing: 2 }}
        >
          {isMyRoulette ? '🎲 اختر لون' : isMyTurn ? '▶ دورك' : `دور ${currentPlayerName}`}
        </motion.div>
        <div style={{ fontSize: 11, color: '#334155' }}>{players.length} لاعبين</div>
      </div>

      {/* ── OPPONENTS — ثابت الارتفاع ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        gap: 10, flexWrap: 'wrap',
        padding: '8px 12px',
        flexShrink: 0,
      }}>
        {opponents.map(opp => (
          <OpponentHand
            key={opp.id} player={opp}
            isCurrentPlayer={gameState.currentPlayerId === opp.id}
            onCatchUno={catchUno} canCatch={true}
          />
        ))}
      </div>

      {/* ── CENTER BOARD — يأخذ المساحة الباقية ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <GameBoard gameState={gameState} isMyTurn={isMyTurn && !isMyRoulette} onDraw={handleDraw} />
      </div>

      {/* ── اسم اللاعب ── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexShrink: 0, paddingBottom: 4 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 10, color: '#475569', letterSpacing: 2 }}>
          {myPlayer?.name || 'أنت'}
        </div>
        {isMyTurn && (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }}
          />
        )}
      </div>

      {/* ── HAND — يكبر حسب عدد الأوراق ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.45)',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}>
        <PlayerHand
          hand={myHand}
          isMyTurn={isMyTurn && !isMyRoulette}
          gameState={gameState}
          onPlay={handlePlay}
          onCallUno={handleUno}
        />
      </div>

      {/* Roulette banner */}
      <AnimatePresence>
        {isMyRoulette && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{
              position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)',
              background: '#1E1B4B', border: '1px solid #7C3AED',
              borderRadius: 10, padding: '8px 20px',
              fontFamily: 'var(--font-head)', fontSize: 12, color: '#A78BFA',
              zIndex: 100, letterSpacing: 2, textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            ستسحب حتى تجيب ورقة من اللون المختار
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}