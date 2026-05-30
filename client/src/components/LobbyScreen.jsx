import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import { PunishmentSetup } from './PunishmentSetup';

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

const AVATARS = ['#EF4444','#3B82F6','#22C55E','#D97706'];

export function LobbyScreen({ socket }) {
  const { roomCode, roomPlayers, playerId, reset, punishment, setPunishment } = useGameStore();
  const game = useGame(socket);
  const [setupOpen, setSetupOpen] = useState(false);

  const isHost = roomPlayers[0]?.id === playerId;
  const canStart = roomPlayers.length >= 2;
  const myApproved = punishment.approvals?.includes(playerId);
  const allApproved = punishment.enabled
    ? (punishment.approvals?.length || 0) >= (punishment.totalPlayers || roomPlayers.length)
    : true;

  function copyCode() { navigator.clipboard?.writeText(roomCode).catch(() => {}); }

  function togglePunishment() {
    game.setPunishmentMode(!punishment.enabled);
  }

  function handleApprove() {
    game.approvePunishment();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, direction: 'rtl' }}>
      <PunishmentSetup
        open={setupOpen} onClose={() => setSetupOpen(false)}
        punishment={punishment} isHost={isHost} game={game}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(30,27,75,0.8)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 20, padding: '36px 40px', width: '100%', maxWidth: 460,
          backdropFilter: 'blur(10px)', boxShadow: '0 0 40px rgba(124,58,237,0.2)',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, color: '#A78BFA', letterSpacing: 4, textAlign: 'center', marginBottom: 28 }}>
          غرفة الانتظار
        </h2>

        {/* Room code */}
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 4 }}>رمز الغرفة</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, color: '#E2E8F0', letterSpacing: 8 }}>{roomCode}</div>
          </div>
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={copyCode}
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: 10, color: '#7C3AED', cursor: 'pointer' }}>
            <CopyIcon />
          </motion.button>
        </div>

        {/* Players */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 2 }}>اللاعبون ({roomPlayers.length}/4)</div>
          {roomPlayers.map((p, i) => (
            <motion.div key={p.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.07 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: p.id === playerId ? 'rgba(124,58,237,0.15)' : 'rgba(0,0,0,0.2)',
                border: p.id === playerId ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '10px 14px',
              }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: AVATARS[i % 4], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontSize: 13, color: '#fff', flexShrink: 0 }}>
                {p.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{p.name}</span>
                {p.id === playerId && <span style={{ color: '#7C3AED', marginRight: 8, fontSize: 11 }}>(أنت)</span>}
              </div>
              {i === 0 && <span style={{ fontSize: 10, color: '#F43F5E', fontFamily: 'var(--font-head)', background: 'rgba(244,63,94,0.15)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(244,63,94,0.3)' }}>المضيف</span>}
              {punishment.enabled && punishment.approvals?.includes(p.id) && (
                <span style={{ fontSize: 10, color: '#22C55E', fontFamily: 'var(--font-head)' }}>✓</span>
              )}
            </motion.div>
          ))}
          {Array.from({ length: 4 - roomPlayers.length }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.1)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#374151' }}>+</span>
              </div>
              <span style={{ color: '#374151', fontSize: 13 }}>في انتظار لاعب…</span>
            </div>
          ))}
        </div>

        {/* Punishment mode toggle */}
        <div style={{
          background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: punishment.enabled ? 12 : 0 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#E2E8F0', letterSpacing: 1 }}>وضع العقوبات</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>عجلة عقوبات في نهاية كل جولة</div>
            </div>
            {isHost ? (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={togglePunishment}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: punishment.enabled ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s',
                  boxShadow: punishment.enabled ? '0 0 12px rgba(124,58,237,0.5)' : 'none',
                }}
              >
                <motion.div
                  animate={{ right: punishment.enabled ? 4 : undefined, left: punishment.enabled ? undefined : 4 }}
                  style={{
                    position: 'absolute', top: 3,
                    [punishment.enabled ? 'right' : 'left']: 4,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  }}
                />
              </motion.button>
            ) : (
              <div style={{ fontSize: 12, color: punishment.enabled ? '#A78BFA' : '#475569' }}>
                {punishment.enabled ? 'مفعّل' : 'مطفي'}
              </div>
            )}
          </div>

          {punishment.enabled && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setSetupOpen(true)}
                style={{
                  flex: 1, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 8, padding: '8px 12px', color: '#A78BFA',
                  fontFamily: 'var(--font-head)', fontSize: 12, cursor: 'pointer', letterSpacing: 1,
                }}>
                إعداد العقوبات
              </motion.button>
              {!myApproved && (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleApprove}
                  style={{
                    flex: 1, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
                    borderRadius: 8, padding: '8px 12px', color: '#22C55E',
                    fontFamily: 'var(--font-head)', fontSize: 12, cursor: 'pointer', letterSpacing: 1,
                  }}>
                  ✓ أوافق
                </motion.button>
              )}
              {myApproved && (
                <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#22C55E', padding: '8px 12px' }}>
                  ✓ وافقت ({punishment.approvals?.length}/{punishment.totalPlayers || roomPlayers.length})
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Start / Wait */}
        {isHost ? (
          <motion.button
            whileHover={canStart && (!punishment.enabled || allApproved) ? { scale: 1.03, boxShadow: '0 0 28px rgba(244,63,94,0.7)' } : {}}
            whileTap={canStart && (!punishment.enabled || allApproved) ? { scale: 0.97 } : {}}
            onClick={canStart && (!punishment.enabled || allApproved) ? game.startGame : undefined}
            style={{
              width: '100%', padding: '16px',
              background: (canStart && (!punishment.enabled || allApproved))
                ? 'linear-gradient(135deg,#F43F5E,#BE123C)' : '#1E293B',
              border: 'none', borderRadius: 12,
              color: (canStart && (!punishment.enabled || allApproved)) ? '#fff' : '#475569',
              fontFamily: 'var(--font-head)', fontSize: 16, letterSpacing: 2,
              cursor: (canStart && (!punishment.enabled || allApproved)) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {!canStart ? 'في انتظار لاعبين…' : punishment.enabled && !allApproved ? 'في انتظار موافقة الجميع…' : 'ابدأ اللعبة'}
          </motion.button>
        ) : (
          <div style={{ textAlign: 'center', color: '#475569', fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 2, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>في انتظار المضيف…</motion.span>
          </div>
        )}

        <motion.button whileHover={{ opacity: 0.8 }} onClick={reset}
          style={{ width: '100%', marginTop: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, color: '#475569', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
          مغادرة الغرفة
        </motion.button>
      </motion.div>
    </div>
  );
}
