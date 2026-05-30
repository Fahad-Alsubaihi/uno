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

  const myHand   = gameState.myHand || [];
  const players  = gameState.players || [];
  const isMyTurn = gameState.currentPlayerId === playerId;
  const myPlayer = players.find(p => p.id === playerId);
  const opponents = players.filter(p => p.id !== playerId);
  const isMyRoulette     = gameState.pendingColorRoulette && gameState.pendingColorRoulettePlayerId === playerId;
  const rouletteNeedPick = isMyRoulette && !gameState.rouletteChosenColor;
  const rouletteDrawing  = isMyRoulette && !!gameState.rouletteChosenColor;
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
  function handleRouletteDraw() { sound.drawCard(); rouletteDraw(); }
  function handleDraw() { sound.drawCard(); if (rouletteDrawing) { rouletteDraw(); } else { drawCard(); } }
  function handleUno() { sound.uno(); callUno(); }
  function handleSwap(targetId) { setSwapOpen(false); sound.swap(); sevenSwap(targetId); }

  return (
    <div style={{
      width: '100vw', height: '100dvh',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
      direction: 'rtl',
    }}>
      <ErrorToast message={error} />
      <Notification notification={notification} />
      <ColorPicker open={colorPickerOpen} onPick={handleColorPick} />
      <ColorPicker open={rouletteNeedPick} onPick={handleRoulettePick} title="روليت الألوان — اختر لون" />
      <SevenSwapModal open={swapOpen} players={players} myId={playerId} onSwap={handleSwap} />

      {/* HEADER */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 16px', height: 46, flexShrink: 0,
        background: 'rgba(0,0,0,0.35)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: '#F43F5E', letterSpacing: 3 }}>
          UNO<span style={{ color: '#7C3AED' }}>·NM</span>
        </div>
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{
            fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: 2,
            color: isMyTurn ? '#22C55E' : '#64748B',
            background: isMyTurn ? 'rgba(34,197,94,0.1)' : 'transparent',
            padding: '3px 10px', borderRadius: 20,
            border: isMyTurn ? '1px solid rgba(34,197,94,0.3)' : 'none',
          }}
        >
          {rouletteNeedPick ? '🎲 اختر لون' : rouletteDrawing ? `🎴 اسحب — ${gameState.rouletteChosenColor}` : isMyTurn ? '◀ دورك' : `دور ${currentPlayerName}`}
        </motion.div>
        <div style={{ fontSize: 10, color: '#334155', fontFamily: 'var(--font-head)' }}>
          {players.length} لاعبين
        </div>
      </div>

      {/* OPPONENTS */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 8, padding: '8px 12px', flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {opponents.map(opp => (
          <OpponentHand
            key={opp.id} player={opp}
            isCurrentPlayer={gameState.currentPlayerId === opp.id}
            onCatchUno={catchUno} canCatch={true}
          />
        ))}
      </div>

      {/* BOARD — flex:1 يأخذ ما تبقى */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <GameBoard gameState={gameState} isMyTurn={isMyTurn && !isMyRoulette} onDraw={handleDraw} />
      </div>

      {/* MY NAME */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 6, flexShrink: 0, padding: '2px 0',
      }}>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 10, color: '#334155', letterSpacing: 2 }}>
          {myPlayer?.name || 'أنت'}
        </span>
        {isMyTurn && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 5px #22C55E' }}
          />
        )}
      </div>

      {/* HAND */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(0,0,0,0.5)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 6px)',
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
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)',
              background: '#1E1B4B', border: '1px solid #7C3AED',
              borderRadius: 10, padding: '6px 18px',
              fontFamily: 'var(--font-head)', fontSize: 11, color: '#A78BFA',
              zIndex: 100, letterSpacing: 1, whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {rouletteNeedPick ? "اختر اللون الذي ستسحب له" : `اسحب حتى يجيك لون ${gameState.rouletteChosenColor || ""}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}