import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import { RulesModal } from './RulesModal';

const BG_CARDS = [
  { color: '#DC2626', dark: '#7F1D1D', value: '7',  left: '7%',  top: '14%', rotate: -15, dur: 8 },
  { color: '#2563EB', dark: '#1E3A8A', value: '+2', left: '83%', top: '10%', rotate: 22,  dur: 10 },
  { color: '#16A34A', dark: '#14532D', value: 'W',  left: '80%', top: '65%', rotate: -9,  dur: 11 },
  { color: '#D97706', dark: '#78350F', value: '0',  left: '10%', top: '72%', rotate: 14,  dur: 9 },
  { color: '#F43F5E', dark: '#881337', value: '+4', left: '56%', top: '83%', rotate: -22, dur: 12 },
  { color: '#7C3AED', dark: '#0F0F23', value: 'S',  left: '46%', top: '8%',  rotate: 8,   dur: 13 },
];

function MiniCard({ color, dark, value, left, top, rotate, dur }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        y: [0, -14, 5, -8, 0],
        rotate: [rotate, rotate + 5, rotate - 3, rotate + 2, rotate],
        opacity: [0.18, 0.28, 0.18],
      }}
      transition={{
        y:       { repeat: Infinity, duration: dur,       ease: 'easeInOut' },
        rotate:  { repeat: Infinity, duration: dur + 2,   ease: 'easeInOut' },
        opacity: { repeat: Infinity, duration: dur * 0.5, ease: 'easeInOut' },
      }}
      style={{
        position: 'absolute', left, top,
        width: 46, height: 68, borderRadius: 8,
        background: color,
        border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: `0 0 18px ${color}35, 0 4px 12px rgba(0,0,0,0.3)`,
        pointerEvents: 'none', zIndex: 0,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: 28, height: 42, borderRadius: '50%',
        background: dark,
        transform: 'rotate(-18deg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-head)',
          fontSize: value.length > 1 ? 9 : 13,
          color: '#fff',
          transform: 'rotate(18deg)',
          lineHeight: 1,
        }}>
          {value}
        </span>
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(140deg, rgba(255,255,255,0.14) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
    </motion.div>
  );
}

export function HomeScreen({ socket }) {
  const [name, setName] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const autoJoinRoom = useGameStore(s => s.autoJoinRoom);
  const [code, setCode] = useState(autoJoinRoom || '');
  const [tab, setTab] = useState(autoJoinRoom ? 'join' : 'create');
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const { createRoom, joinRoom } = useGame(socket);

  function handleCreate(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlayerName(trimmed);
    createRoom(trimmed);
  }

  function handleJoin(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !code.trim()) return;
    setPlayerName(trimmed);
    joinRoom(code.trim().toUpperCase(), trimmed);
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden', direction: 'rtl',
    }}>
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* Floating decorative cards */}
      {BG_CARDS.map((c, i) => <MiniCard key={i} {...c} />)}

      {/* Animated blobs */}
      <motion.div
        animate={{ x: [-30, 30, -30], y: [-20, 20, -20], scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 13, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 68%)',
          top: '-8%', left: '8%', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ x: [20, -25, 20], y: [16, -18, 16], scale: [1.1, 1, 1.1] }}
        transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.14) 0%, transparent 68%)',
          bottom: '3%', right: '3%', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ x: [-15, 22, -15], y: [18, -12, 18] }}
        transition={{ repeat: Infinity, duration: 19, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 68%)',
          top: '42%', right: '22%', pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 160 }}
        style={{ textAlign: 'center', marginBottom: 44, position: 'relative', zIndex: 1 }}
      >
        {/* Glow halo */}
        <motion.div
          animate={{ opacity: [0.3, 0.65, 0.3], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: '-24px -50px',
            background: 'radial-gradient(ellipse at center, rgba(244,63,94,0.22) 0%, transparent 70%)',
            pointerEvents: 'none', borderRadius: '50%',
          }}
        />
        <motion.h1
          animate={{
            textShadow: [
              '0 0 20px rgba(244,63,94,0.5)',
              '0 0 50px rgba(244,63,94,0.9), 0 0 100px rgba(244,63,94,0.4)',
              '0 0 20px rgba(244,63,94,0.5)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 'clamp(52px, 10vw, 90px)',
            color: '#F43F5E', letterSpacing: 8, lineHeight: 1,
          }}
        >
          UNO
        </motion.h1>
        <motion.p
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ repeat: Infinity, duration: 3.5 }}
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 'clamp(13px, 2.5vw, 21px)',
            color: '#A78BFA', letterSpacing: 10, marginTop: 6,
            textShadow: '0 0 20px rgba(167,139,250,0.7)',
          }}
        >
          لا رحمة
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.5), rgba(124,58,237,0.6), transparent)',
            marginTop: 12,
          }}
        />
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.25, type: 'spring', stiffness: 150 }}
        style={{
          background: 'rgba(18, 14, 52, 0.9)',
          border: '1px solid rgba(124,58,237,0.5)',
          borderRadius: 24,
          padding: '36px 40px',
          width: '100%', maxWidth: 440,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(124,58,237,0.18), 0 24px 64px rgba(0,0,0,0.5)',
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Tab row */}
        <div style={{
          display: 'flex', marginBottom: 28,
          background: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: 4,
        }}>
          {[{ id: 'create', label: 'إنشاء غرفة' }, { id: 'join', label: 'انضمام' }].map(t => (
            <motion.button
              key={t.id} onClick={() => setTab(t.id)}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 9, border: 'none',
                background: tab === t.id
                  ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                  : 'transparent',
                color: tab === t.id ? '#fff' : '#475569',
                fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 1,
                cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: tab === t.id
                  ? '0 0 20px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : 'none',
              }}
            >
              {t.label}
            </motion.button>
          ))}
        </div>

        <form onSubmit={tab === 'create' ? handleCreate : handleJoin}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 11, color: '#7C3AED',
              fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 7,
            }}>
              اسمك
            </label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              maxLength={20} placeholder="أدخل اسمك" required autoFocus
              style={{
                width: '100%', background: 'rgba(0,0,0,0.45)',
                border: '1.5px solid rgba(124,58,237,0.35)', borderRadius: 12,
                padding: '15px 18px', color: '#E2E8F0', fontSize: 16,
                fontFamily: 'var(--font-body)', textAlign: 'right',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#7C3AED';
                e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(124,58,237,0.35)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <AnimatePresence>
            {tab === 'join' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <label style={{
                  display: 'block', fontSize: 11, color: '#7C3AED',
                  fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 7,
                }}>
                  رمز الغرفة
                </label>
                <input
                  value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={6} placeholder="ABC123" required={tab === 'join'}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.45)',
                    border: '1.5px solid rgba(124,58,237,0.35)', borderRadius: 12,
                    padding: '15px 18px', color: '#E2E8F0',
                    fontSize: 26, fontFamily: 'var(--font-head)',
                    letterSpacing: 8, textAlign: 'center',
                    transition: 'border-color 0.25s, box-shadow 0.25s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#7C3AED';
                    e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(124,58,237,0.35)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(244,63,94,0.7), 0 8px 24px rgba(0,0,0,0.4)' }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
              border: '1px solid rgba(251,113,133,0.3)',
              borderRadius: 14, padding: '17px', color: '#fff',
              fontFamily: 'var(--font-head)', fontSize: 16, letterSpacing: 2,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(244,63,94,0.4), 0 4px 16px rgba(0,0,0,0.3)',
              marginTop: 4, transition: 'box-shadow 0.2s',
            }}
          >
            {tab === 'create' ? 'إنشاء غرفة' : 'انضمام'}
          </motion.button>
        </form>

        <motion.button
          whileHover={{ borderColor: 'rgba(124,58,237,0.6)', background: 'rgba(124,58,237,0.18)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setRulesOpen(true)}
          style={{
            width: '100%', marginTop: 14,
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 12, padding: '11px', color: '#A78BFA',
            fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 2,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          القواعد
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{
          marginTop: 24, textAlign: 'center',
          color: '#334155', fontSize: 11, lineHeight: 2,
          zIndex: 1, position: 'relative',
        }}
      >
        ٢–٤ لاعبين · تراكم +2/+4/+6/+10 · سبعة=تبادل · صفر=دوران · اقتحام
      </motion.div>
    </div>
  );
}
