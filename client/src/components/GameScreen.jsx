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

  function handleRoulettePick(color) {
    sound.swap();
    colorRoulettePick(color);
  }

  function handleDraw() { sound.drawCard(); drawCard(); }
  function handleUno() { sound.uno(); callUno(); }
  function handleSwap(targetId) { setSwapOpen(false); sound.swap(); sevenSwap(targetId); }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative', direction: 'rtl',
    }}>
      <ErrorToast message={error} />
      <Notification notification={notification} />
      <ColorPicker open={colorPickerOpen} onPick={handleColorPick} />
      <ColorPicker
        open={isMyRoulette}
        onPick={handleRoulettePick}
        title="روليت الألوان — اختر لون"
      />
      <SevenSwapModal open={swapOpen} players={players} myId={playerId} onSwap={handleSwap} />

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)', flexShrink: 0,
      }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: '#F43F5E', letterSpacing: 3 }}>
          UNO<span style={{ color: '#7C3AED' }}>·NM</span>
        </div>
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontFamily: 'var(--font-head)', fontSize: 11, color: isMyTurn ? '#22C55E' : '#94A3B8', letterSpacing: 2, textAlign: 'center' }}
        >
          {isMyRoulette ? '🎲 اختر لون الروليت' : isMyTurn ? '▶ دورك' : `دور ${currentPlayerName}`}
        </motion.div>
        <div style={{ fontSize: 11, color: '#334155' }}>
          {players.length} لاعبين
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 8px 0', gap: 8 }}>
        {/* Opponents */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          gap: 12, flexWrap: 'wrap', flexShrink: 0,
        }}>
          {opponents.map(opp => (
            <OpponentHand
              key={opp.id} player={opp}
              isCurrentPlayer={gameState.currentPlayerId === opp.id}
              onCatchUno={catchUno} canCatch={true}
            />
          ))}
        </div>

        {/* Center board */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <GameBoard gameState={gameState} isMyTurn={isMyTurn && !isMyRoulette} onDraw={handleDraw} />
        </div>

        {/* My info */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexShrink: 0, paddingBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, color: '#475569', letterSpacing: 2 }}>
            {myPlayer?.name || 'أنت'}
          </div>
          {isMyTurn && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }}
            />
          )}
        </div>
      </div>

      {/* Hand */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)',
        padding: '8px 0 12px', flexShrink: 0, maxHeight: '38vh', overflow: 'hidden',
      }}>
        <PlayerHand
          hand={myHand} isMyTurn={isMyTurn && !isMyRoulette}
          gameState={gameState} onPlay={handlePlay} onCallUno={handleUno}
        />
      </div>

      {/* Roulette overlay banner */}
      <AnimatePresence>
        {isMyRoulette && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
              background: '#1E1B4B', border: '1px solid #7C3AED',
              borderRadius: 12, padding: '10px 24px',
              fontFamily: 'var(--font-head)', fontSize: 13, color: '#A78BFA',
              zIndex: 100, letterSpacing: 2, textAlign: 'center',
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              pointerEvents: 'none',
            }}
          >
            اختر لوناً — ستسحب حتى تجيب ورقة منه
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
