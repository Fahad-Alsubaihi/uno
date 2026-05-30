import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useGame } from '../hooks/useGame';

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

const AVATARS = ['#EF4444','#3B82F6','#22C55E','#D97706'];

export function LobbyScreen({ socket }) {
  const { roomCode, roomPlayers, playerId, reset } = useGameStore();
  const { startGame } = useGame(socket);
  const isHost = roomPlayers[0]?.id === playerId;
  const canStart = roomPlayers.length >= 2;

  function copyCode() {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, direction: 'rtl',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(30,27,75,0.8)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 20, padding: '36px 40px', width: '100%', maxWidth: 460,
          backdropFilter: 'blur(10px)', boxShadow: '0 0 40px rgba(124,58,237,0.2)',
        }}
      >
        <h2 style={{
          fontFamily: 'var(--font-head)', fontSize: 22, color: '#A78BFA',
          letterSpacing: 4, textAlign: 'center', marginBottom: 28,
        }}>
          غرفة الانتظار
        </h2>

        {/* Room code */}
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 4 }}>
              رمز الغرفة
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 32, color: '#E2E8F0', letterSpacing: 8 }}>
              {roomCode}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.08, color: '#A78BFA' }} whileTap={{ scale: 0.92 }}
            onClick={copyCode} aria-label="نسخ الرمز"
            style={{
              background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 8, padding: 10, color: '#7C3AED', cursor: 'pointer', transition: 'color 0.2s',
            }}
          >
            <CopyIcon />
          </motion.button>
        </div>

        {/* Players */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 4 }}>
            اللاعبون ({roomPlayers.length}/4)
          </div>
          {roomPlayers.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: p.id === playerId ? 'rgba(124,58,237,0.15)' : 'rgba(0,0,0,0.2)',
                border: p.id === playerId ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '12px 16px',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: AVATARS[i % AVATARS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-head)', fontSize: 14, color: '#fff', flexShrink: 0,
              }}>
                {p.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>
                  {p.name}
                  {p.id === playerId && <span style={{ color: '#7C3AED', marginRight: 8, fontSize: 12 }}>(أنت)</span>}
                </div>
              </div>
              {i === 0 && (
                <div style={{
                  fontSize: 10, color: '#F43F5E', fontFamily: 'var(--font-head)', letterSpacing: 1,
                  background: 'rgba(244,63,94,0.15)', padding: '2px 8px', borderRadius: 20,
                  border: '1px solid rgba(244,63,94,0.3)',
                }}>
                  المضيف
                </div>
              )}
            </motion.div>
          ))}
          {Array.from({ length: 4 - roomPlayers.length }).map((_, i) => (
            <div key={`e-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(0,0,0,0.1)', border: '1px dashed rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '12px 16px',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#374151', fontSize: 18 }}>+</span>
              </div>
              <span style={{ color: '#374151', fontSize: 13 }}>في انتظار لاعب…</span>
            </div>
          ))}
        </div>

        {/* Start / Wait */}
        {isHost ? (
          <motion.button
            whileHover={canStart ? { scale: 1.03, boxShadow: '0 0 28px rgba(244,63,94,0.7)' } : {}}
            whileTap={canStart ? { scale: 0.97 } : {}}
            onClick={canStart ? startGame : undefined}
            style={{
              width: '100%', padding: '16px',
              background: canStart ? 'linear-gradient(135deg, #F43F5E, #BE123C)' : '#1E293B',
              border: canStart ? 'none' : '1px solid #1E293B',
              borderRadius: 12, color: canStart ? '#fff' : '#475569',
              fontFamily: 'var(--font-head)', fontSize: 16, letterSpacing: 2,
              cursor: canStart ? 'pointer' : 'not-allowed',
              boxShadow: canStart ? '0 0 16px rgba(244,63,94,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {canStart ? 'ابدأ اللعبة' : 'في انتظار لاعبين…'}
          </motion.button>
        ) : (
          <div style={{
            textAlign: 'center', color: '#475569', fontFamily: 'var(--font-head)',
            fontSize: 13, letterSpacing: 2, padding: '16px',
            background: 'rgba(0,0,0,0.2)', borderRadius: 12,
          }}>
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              في انتظار المضيف…
            </motion.span>
          </div>
        )}

        <motion.button
          whileHover={{ opacity: 0.8 }} onClick={reset}
          style={{
            width: '100%', marginTop: 12, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
            padding: '10px', color: '#475569', fontFamily: 'var(--font-body)',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          مغادرة الغرفة
        </motion.button>
      </motion.div>
    </div>
  );
}
