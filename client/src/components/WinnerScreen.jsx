import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import { PunishmentWheel } from './PunishmentWheel';

const COLORS = ['#F43F5E','#7C3AED','#A78BFA','#FCD34D','#22C55E','#60A5FA'];
const FIREWORKS = Array.from({ length: 24 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 60, color: COLORS[i % COLORS.length],
}));

function Firework({ x, y, color }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
      transition={{ duration: 0.8, delay: Math.random() * 0.5 }}
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}`, pointerEvents: 'none' }}
    />
  );
}

export function WinnerScreen({ socket }) {
  const { winner, loser, playerId, reset, punishment, showWheel, wheelResult, setShowWheel } = useGameStore();
  const game = useGame(socket);
  const sound = useSound();
  const isWinner = winner?.id === playerId;

  useEffect(() => { sound.win(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden', direction: 'rtl' }}>
      {FIREWORKS.map(f => <Firework key={f.id} x={f.x} y={f.y} color={f.color} />)}

      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, ${isWinner ? 'rgba(244,63,94,0.15)' : 'rgba(124,58,237,0.1)'} 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <motion.div animate={{ y: [-8, 0, -8] }} transition={{ repeat: Infinity, duration: 2.5 }} style={{ fontSize: 72, marginBottom: 16 }}>🏆</motion.div>

        <motion.h1
          animate={{ textShadow: ['0 0 20px #F43F5E80','0 0 50px #F43F5E','0 0 20px #F43F5E80'] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(36px,8vw,72px)', color: '#F43F5E', letterSpacing: 4, marginBottom: 8 }}
        >
          {isWinner ? 'فزت! 🎉' : 'انتهت اللعبة'}
        </motion.h1>

        <p style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: '#A78BFA', letterSpacing: 2, marginBottom: 12 }}>
          {winner?.name} فاز!
        </p>

        {!isWinner && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ color: '#94A3B8', fontSize: 14, marginBottom: 16 }}>
            لا رحمة أُعطيت. لا رحمة تُؤخذ.
          </motion.p>
        )}

        {/* Punishment mode button — triggers wheel for loser */}
        {punishment?.enabled && loser && !showWheel && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#F43F5E', letterSpacing: 2, marginBottom: 8 }}>
              {loser.name} — حان وقت العقوبة!
            </div>
            {loser.id === playerId && (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(244,63,94,0.7)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWheel(true)}
                style={{
                  background: 'linear-gradient(135deg,#F43F5E,#BE123C)',
                  border: 'none', borderRadius: 12, padding: '12px 32px',
                  fontFamily: 'var(--font-head)', fontSize: 16, color: '#fff',
                  cursor: 'pointer', letterSpacing: 2,
                  boxShadow: '0 0 16px rgba(244,63,94,0.4)',
                }}
              >
                افتح العجلة!
              </motion.button>
            )}
            {loser.id !== playerId && (
              <div style={{ fontSize: 12, color: '#64748B' }}>في انتظار {loser.name} لفتح العجلة…</div>
            )}
          </motion.div>
        )}

        <div style={{ height: 16 }} />
        <motion.button
          whileHover={{ scale: 1.06, boxShadow: '0 0 28px rgba(244,63,94,0.7)' }}
          whileTap={{ scale: 0.94 }} onClick={reset}
          style={{
            background: 'linear-gradient(135deg,#F43F5E,#BE123C)', border: 'none',
            borderRadius: 14, padding: '16px 48px',
            fontFamily: 'var(--font-head)', fontSize: 16, color: '#fff',
            cursor: 'pointer', letterSpacing: 2, boxShadow: '0 0 20px rgba(244,63,94,0.4)',
          }}
        >
          العب مجدداً
        </motion.button>
      </motion.div>

      {/* Punishment Wheel */}
      <PunishmentWheel
        open={showWheel}
        wheelResult={wheelResult}
        loser={loser}
        playerId={playerId}
        punishment={punishment}
        onSpin={() => game.spinWheel()}
        onClose={() => setShowWheel(false)}
      />
    </div>
  );
}
