import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';
import { PunishmentSetup } from './PunishmentSetup';
import { clearSession } from '../utils/clientId';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #EF4444, #991B1B)',
  'linear-gradient(135deg, #3B82F6, #1E3A8A)',
  'linear-gradient(135deg, #22C55E, #14532D)',
  'linear-gradient(135deg, #F59E0B, #78350F)',
];
const AVATAR_BORDERS = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B'];

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 24 18" fill="#FCD34D" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round">
      <polyline points="2 16 6 4 12 10 18 4 22 16" />
      <line x1="2" y1="16" x2="22" y2="16" />
    </svg>
  );
}

function WaitingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginRight: 4 }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
          style={{ width: 4, height: 4, borderRadius: '50%', background: '#475569', display: 'inline-block' }}
        />
      ))}
    </span>
  );
}

export function LobbyScreen({ socket }) {
  const { roomCode, roomPlayers, playerId, reset, punishment, setPunishment, totalRounds } = useGameStore();
  const game = useGame(socket);
  const [setupOpen, setSetupOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [localSegs, setLocalSegs] = useState(() => punishment.segments || []);
  const opsInFlight = useRef(0);
  const syncTimer = useRef(null);

  useEffect(() => {
    if (opsInFlight.current === 0 && punishment.segments) {
      setLocalSegs(punishment.segments);
    }
  }, [punishment.segments]);

  function sendSegs(newSegs) {
    opsInFlight.current += 1;
    setLocalSegs(newSegs);
    game.setSegments(newSegs);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      opsInFlight.current = Math.max(0, opsInFlight.current - 1);
    }, 3000);
  }

  const isHost = roomPlayers[0]?.id === playerId;
  const canStart = roomPlayers.length >= 2;
  const myApproved = punishment.approvals?.includes(playerId);
  const allApproved = punishment.enabled
    ? (punishment.approvals?.length || 0) >= (punishment.totalPlayers || roomPlayers.length)
    : true;

  function copyCode() {
    const url = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function togglePunishment() { game.setPunishmentMode(!punishment.enabled); }
  function handleApprove()    { game.approvePunishment(); }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', direction: 'rtl' }}>
    <div style={{
      minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <PunishmentSetup
        open={setupOpen} onClose={() => setSetupOpen(false)}
        segments={localSegs} onUpdateSegs={sendSegs} isHost={isHost} game={game}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(18, 14, 52, 0.9)',
          border: '1px solid rgba(124,58,237,0.5)',
          borderRadius: 24, padding: '36px 40px',
          width: '100%', maxWidth: 470,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(124,58,237,0.18), 0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{
          fontFamily: 'var(--font-head)', fontSize: 22,
          color: '#A78BFA', letterSpacing: 4,
          textAlign: 'center', marginBottom: 28,
          textShadow: '0 0 20px rgba(167,139,250,0.4)',
        }}>
          غرفة الانتظار
        </h2>

        {/* Room code */}
        <div style={{
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(124,58,237,0.35)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 4 }}>
              شارك الرابط
            </div>
            <div style={{
              fontFamily: 'var(--font-head)', fontSize: 14,
              color: '#E2E8F0', letterSpacing: 1,
              textShadow: '0 0 16px rgba(124,58,237,0.4)',
              wordBreak: 'break-all',
            }}>
              {window.location.host}?room={roomCode}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}
            whileTap={{ scale: 0.9 }}
            onClick={copyCode}
            style={{
              background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(124,58,237,0.2)',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(124,58,237,0.35)'}`,
              borderRadius: 10, padding: 12,
              color: copied ? '#22C55E' : '#7C3AED',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copied
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              : <CopyIcon />}
          </motion.button>
        </div>

        {/* Players list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 4 }}>
            اللاعبون ({roomPlayers.length}/4)
          </div>

          {roomPlayers.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: p.id === playerId ? 'rgba(124,58,237,0.15)' : 'rgba(0,0,0,0.25)',
                border: p.id === playerId ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '10px 14px',
              }}
            >
              {/* Avatar with ring */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: AVATAR_GRADIENTS[i % 4],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-head)', fontSize: 14, color: '#fff',
                  border: `2px solid ${AVATAR_BORDERS[i % 4]}60`,
                  boxShadow: `0 0 10px ${AVATAR_BORDERS[i % 4]}40`,
                }}>
                  {p.name[0].toUpperCase()}
                </div>
                {/* Host crown */}
                {i === 0 && (
                  <div style={{
                    position: 'absolute', top: -8, left: '50%',
                    transform: 'translateX(-50%)',
                  }}>
                    <CrownIcon />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{p.name}</span>
                {p.id === playerId && (
                  <span style={{ color: '#7C3AED', marginRight: 8, fontSize: 11 }}>(أنت)</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {i === 0 && (
                  <span style={{
                    fontSize: 9, color: '#F43F5E',
                    fontFamily: 'var(--font-head)',
                    background: 'rgba(244,63,94,0.15)',
                    padding: '2px 8px', borderRadius: 20,
                    border: '1px solid rgba(244,63,94,0.35)',
                  }}>
                    المضيف
                  </span>
                )}
                {punishment.enabled && punishment.approvals?.includes(p.id) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      fontSize: 10, color: '#22C55E',
                      background: 'rgba(34,197,94,0.12)',
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(34,197,94,0.4)',
                    }}
                  >
                    ✓
                  </motion.span>
                )}
                {isHost && i !== 0 && (
                  <motion.button
                    whileHover={{ scale: 1.15, background: 'rgba(239,68,68,0.25)' }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => game.kickPlayer(p.id)}
                    title="طرد اللاعب"
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#EF4444',
                      fontSize: 16, lineHeight: 1,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</motion.button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - roomPlayers.length }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(0,0,0,0.12)',
              border: '1px dashed rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '10px 14px',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px dashed rgba(255,255,255,0.1)',
              }}>
                <span style={{ color: '#2D3748', fontSize: 18, lineHeight: 1 }}>+</span>
              </div>
              <span style={{ color: '#2D3748', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <WaitingDots />
                في انتظار لاعب
              </span>
            </div>
          ))}
        </div>

        {/* Rounds selector */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '10px 16px', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#E2E8F0' }}>
            عدد الجولات
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button
              whileHover={isHost && totalRounds > 1 ? { scale: 1.1 } : {}}
              whileTap={isHost && totalRounds > 1 ? { scale: 0.9 } : {}}
              onClick={() => isHost && totalRounds > 1 && game.setRounds(Number(totalRounds) - 1)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 20,
                cursor: isHost && totalRounds > 1 ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (!isHost || totalRounds <= 1) ? 0.3 : 1,
              }}
            >−</motion.button>

            <div style={{
              fontFamily: 'var(--font-head)', fontSize: 22,
              color: '#A78BFA', minWidth: 44, textAlign: 'center',
            }}>
              {totalRounds}
            </div>

            <motion.button
              whileHover={isHost && totalRounds < 10 ? { scale: 1.1 } : {}}
              whileTap={isHost && totalRounds < 10 ? { scale: 0.9 } : {}}
              onClick={() => isHost && totalRounds < 10 && game.setRounds(Number(totalRounds) + 1)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 20,
                cursor: isHost && totalRounds < 10 ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (!isHost || totalRounds >= 10) ? 0.3 : 1,
              }}
            >+</motion.button>
          </div>
        </div>

        {/* Punishment toggle */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: punishment.enabled ? 12 : 0,
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#E2E8F0', letterSpacing: 1 }}>
                وضع العقوبات
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                عجلة عقوبات في نهاية كل جولة
              </div>
            </div>
            {isHost ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePunishment}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: punishment.enabled ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s',
                  boxShadow: punishment.enabled ? '0 0 14px rgba(124,58,237,0.5)' : 'none',
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

          <AnimatePresence>
            {punishment.enabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', overflow: 'hidden' }}
              >
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setSetupOpen(true)}
                  style={{
                    flex: 1, background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.35)',
                    borderRadius: 9, padding: '9px 12px', color: '#A78BFA',
                    fontFamily: 'var(--font-head)', fontSize: 12,
                    cursor: 'pointer', letterSpacing: 1,
                  }}
                >
                  إعداد العقوبات
                </motion.button>
                {!myApproved ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleApprove}
                    style={{
                      flex: 1, background: 'rgba(34,197,94,0.15)',
                      border: '1px solid rgba(34,197,94,0.4)',
                      borderRadius: 9, padding: '9px 12px', color: '#22C55E',
                      fontFamily: 'var(--font-head)', fontSize: 12,
                      cursor: 'pointer', letterSpacing: 1,
                    }}
                  >
                    ✓ أوافق
                  </motion.button>
                ) : (
                  <div style={{
                    flex: 1, textAlign: 'center', fontSize: 12, color: '#22C55E',
                    padding: '9px 12px',
                  }}>
                    ✓ وافقت ({punishment.approvals?.length}/{punishment.totalPlayers || roomPlayers.length})
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Start / Wait */}
        {isHost ? (
          <motion.button
            whileHover={canStart && (!punishment.enabled || allApproved)
              ? { scale: 1.03, boxShadow: '0 0 32px rgba(244,63,94,0.7)' }
              : {}}
            whileTap={canStart && (!punishment.enabled || allApproved) ? { scale: 0.97 } : {}}
            onClick={canStart && (!punishment.enabled || allApproved) ? game.startGame : undefined}
            style={{
              width: '100%', padding: '17px',
              background: (canStart && (!punishment.enabled || allApproved))
                ? 'linear-gradient(135deg, #F43F5E, #BE123C)'
                : '#1E293B',
              border: 'none', borderRadius: 14,
              color: (canStart && (!punishment.enabled || allApproved)) ? '#fff' : '#475569',
              fontFamily: 'var(--font-head)', fontSize: 16, letterSpacing: 2,
              cursor: (canStart && (!punishment.enabled || allApproved)) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: (canStart && (!punishment.enabled || allApproved))
                ? '0 0 20px rgba(244,63,94,0.35)'
                : 'none',
            }}
          >
            {!canStart
              ? 'في انتظار لاعبين…'
              : punishment.enabled && !allApproved
                ? 'في انتظار موافقة الجميع…'
                : 'ابدأ اللعبة'}
          </motion.button>
        ) : (
          <div style={{
            textAlign: 'center', color: '#475569',
            fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 2,
            padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12,
          }}>
            <motion.span animate={{ opacity: [0.45, 1, 0.45] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              في انتظار المضيف…
            </motion.span>
          </div>
        )}

        <motion.button
          whileHover={{ opacity: 0.8 }}
          onClick={() => { clearSession(); reset(); }}
          style={{
            width: '100%', marginTop: 10,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 10, color: '#475569',
            fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
          }}
        >
          مغادرة الغرفة
        </motion.button>
      </motion.div>
    </div>
    </div>
  );
}
