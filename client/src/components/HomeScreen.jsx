import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import { RulesModal } from './RulesModal';

export function HomeScreen({ socket }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState('create');
  const [rulesOpen, setRulesOpen] = useState(false);
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

      {/* Background blobs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        top: '10%', left: '20%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)',
        bottom: '15%', right: '15%', pointerEvents: 'none',
      }} />

      {/* Logo */}
      <motion.div
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 180 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <motion.h1
          animate={{ textShadow: ['0 0 20px #F43F5E80','0 0 40px #F43F5E','0 0 20px #F43F5E80'] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(42px,8vw,80px)', color: '#F43F5E', letterSpacing: 6, lineHeight: 1 }}
        >
          UNO
        </motion.h1>
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(14px,3vw,22px)', color: '#A78BFA', letterSpacing: 10, marginTop: 4 }}
        >
          لا رحمة
        </motion.p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 160 }}
        style={{
          background: 'rgba(30,27,75,0.8)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 20, padding: '32px 36px', width: '100%', maxWidth: 420,
          backdropFilter: 'blur(10px)', boxShadow: '0 0 40px rgba(124,58,237,0.2)',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 }}>
          {[{ id: 'create', label: 'إنشاء غرفة' }, { id: 'join', label: 'انضمام' }].map(t => (
            <motion.button
              key={t.id} onClick={() => setTab(t.id)} whileHover={{ opacity: 0.9 }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: tab === t.id ? '#7C3AED' : 'transparent',
                color: tab === t.id ? '#fff' : '#64748B',
                fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 1,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: tab === t.id ? '0 0 16px rgba(124,58,237,0.5)' : 'none',
              }}
            >
              {t.label}
            </motion.button>
          ))}
        </div>

        <form onSubmit={tab === 'create' ? handleCreate : handleJoin}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748B', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 6 }}>
              اسمك
            </label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              maxLength={20} placeholder="أدخل اسمك" required autoFocus
              style={{
                width: '100%', background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10,
                padding: '14px 16px', color: '#E2E8F0', fontSize: 16,
                fontFamily: 'var(--font-body)', textAlign: 'right',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
            />
          </div>

          {tab === 'join' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#64748B', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 6 }}>
                رمز الغرفة
              </label>
              <input
                value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6} placeholder="ABC123" required={tab === 'join'}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10,
                  padding: '14px 16px', color: '#E2E8F0',
                  fontSize: 22, fontFamily: 'var(--font-head)',
                  letterSpacing: 6, textAlign: 'center', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
              />
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(244,63,94,0.6)' }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #F43F5E, #BE123C)', border: 'none',
              borderRadius: 12, padding: '16px', color: '#fff',
              fontFamily: 'var(--font-head)', fontSize: 16, letterSpacing: 2,
              cursor: 'pointer', boxShadow: '0 0 16px rgba(244,63,94,0.4)',
              marginTop: 4, transition: 'box-shadow 0.2s',
            }}
          >
            {tab === 'create' ? 'إنشاء غرفة' : 'انضمام'}
          </motion.button>
        </form>

        {/* Rules button */}
        <motion.button
          whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}
          onClick={() => setRulesOpen(true)}
          style={{
            width: '100%', marginTop: 14,
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 10, padding: '10px', color: '#A78BFA',
            fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 2,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          القواعد
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        style={{ marginTop: 24, textAlign: 'center', color: '#334155', fontSize: 12, lineHeight: 1.8 }}
      >
        ٢–٤ لاعبين · تراكم +2/+4/+6/+10 · سبعة=تبادل · صفر=دوران · اقتحام
      </motion.div>
    </div>
  );
}
