import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import { PunishmentWheel } from './PunishmentWheel';

const BURST_COLORS = ['#F43F5E', '#7C3AED', '#A78BFA', '#FCD34D', '#22C55E', '#60A5FA', '#FB923C', '#F472B6'];

const BURST_ORIGINS = [
  { cx: 50, cy: 38, delay: 0 },
  { cx: 22, cy: 28, delay: 0.45 },
  { cx: 78, cy: 22, delay: 0.8 },
  { cx: 16, cy: 58, delay: 1.15 },
  { cx: 84, cy: 52, delay: 0.95 },
  { cx: 50, cy: 68, delay: 1.5 },
];

function BurstParticle({ angle, dist, color, delay, size, isRect, repeatDelay }) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * dist;
  const ty = Math.sin(rad) * dist;

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: angle }}
      animate={{
        x: [0, tx * 0.55, tx],
        y: [0, ty * 0.4 - 22, ty + 50],
        scale: [0, 1.6, 0],
        opacity: [1, 1, 0],
        rotate: [angle, angle + 200],
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: [0.15, 0, 0.75, 1],
        repeat: Infinity,
        repeatDelay,
      }}
      style={{
        position: 'absolute',
        width: isRect ? size * 2.2 : size,
        height: isRect ? size * 0.55 : size,
        borderRadius: isRect ? 2 : '50%',
        background: color,
        boxShadow: `0 0 8px ${color}`,
        pointerEvents: 'none',
      }}
    />
  );
}

function FireworkBurst({ cx, cy, delay }) {
  const particles = useMemo(() => {
    const count = 16;
    return Array.from({ length: count }, (_, i) => ({
      angle:       (i / count) * 360 + (Math.random() * 22 - 11),
      dist:        55 + Math.random() * 95,
      color:       BURST_COLORS[i % BURST_COLORS.length],
      delay:       delay + Math.random() * 0.35,
      size:        3.5 + Math.random() * 5,
      isRect:      Math.random() > 0.55,
      repeatDelay: 2.8 + Math.random() * 1.5,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      position: 'absolute',
      left: `${cx}%`, top: `${cy}%`,
      pointerEvents: 'none',
    }}>
      {particles.map((p, i) => <BurstParticle key={i} {...p} />)}
    </div>
  );
}

export function WinnerScreen({ socket }) {
  const { winner, loser, playerId, reset, punishment, showWheel, wheelResult, setShowWheel } = useGameStore();
  const game = useGame(socket);
  const sound = useSound();
  const isWinner = winner?.id === playerId;

  useEffect(() => {
    if (punishment?.enabled && loser) {
      const t = setTimeout(() => setShowWheel(true), 1200);
      return () => clearTimeout(t);
    }
  }, [punishment?.enabled, loser?.id]);

  useEffect(() => { sound.win(); }, []);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden', direction: 'rtl',
    }}>
      {/* Multi-burst fireworks */}
      {BURST_ORIGINS.map((b, i) => <FireworkBurst key={i} {...b} />)}

      {/* Radial background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 38%, ${
          isWinner ? 'rgba(244,63,94,0.2)' : 'rgba(124,58,237,0.12)'
        } 0%, transparent 62%)`,
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ scale: 0.45, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        {/* Trophy */}
        <motion.div
          animate={{ y: [-10, 0, -10], rotate: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
          style={{ fontSize: 80, marginBottom: 16, lineHeight: 1 }}
        >
          🏆
        </motion.div>

        <motion.h1
          animate={{
            textShadow: [
              '0 0 20px rgba(244,63,94,0.5)',
              '0 0 50px rgba(244,63,94,1), 0 0 100px rgba(244,63,94,0.5)',
              '0 0 20px rgba(244,63,94,0.5)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 'clamp(36px, 8vw, 72px)',
            color: '#F43F5E', letterSpacing: 4, marginBottom: 14,
          }}
        >
          {isWinner ? 'فزت!' : 'انتهت اللعبة'}
        </motion.h1>

        {/* Winner badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.35)',
            borderRadius: 30, padding: '10px 22px', marginBottom: 18,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-head)', fontSize: 13, color: '#fff',
            boxShadow: '0 0 12px rgba(124,58,237,0.5)',
          }}>
            {winner?.name?.[0]?.toUpperCase()}
          </div>
          <p style={{
            fontFamily: 'var(--font-head)', fontSize: 19,
            color: '#A78BFA', letterSpacing: 2, margin: 0,
          }}>
            {winner?.name} فاز!
          </p>
        </motion.div>

        {!isWinner && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ color: '#64748B', fontSize: 13, marginBottom: 16, fontStyle: 'italic' }}
          >
            لا رحمة أُعطيت. لا رحمة تُؤخذ.
          </motion.p>
        )}

        {punishment?.enabled && loser && !showWheel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ marginBottom: 18 }}
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ fontFamily: 'var(--font-head)', fontSize: 12, color: '#F43F5E', letterSpacing: 2 }}
            >
              جاري فتح عجلة العقوبات…
            </motion.div>
          </motion.div>
        )}

        <div style={{ height: 20 }} />
        <motion.button
          whileHover={{ scale: 1.06, boxShadow: '0 0 36px rgba(244,63,94,0.8), 0 10px 28px rgba(0,0,0,0.35)' }}
          whileTap={{ scale: 0.94 }}
          onClick={reset}
          style={{
            background: 'linear-gradient(135deg, #F43F5E, #BE123C)',
            border: '1px solid rgba(251,113,133,0.3)',
            borderRadius: 16, padding: '18px 52px',
            fontFamily: 'var(--font-head)', fontSize: 17, color: '#fff',
            cursor: 'pointer', letterSpacing: 2,
            boxShadow: '0 0 24px rgba(244,63,94,0.5), 0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          العب مجدداً
        </motion.button>
      </motion.div>

      <PunishmentWheel
        open={showWheel}
        wheelResult={wheelResult}
        loser={loser}
        playerId={playerId}
        segments={punishment?.segments || []}
        onSpin={() => game.spinWheel()}
        onClose={() => setShowWheel(false)}
      />
    </div>
  );
}
