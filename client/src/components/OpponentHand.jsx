import { motion, AnimatePresence } from 'framer-motion';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #EF4444, #991B1B)',
  'linear-gradient(135deg, #3B82F6, #1E3A8A)',
  'linear-gradient(135deg, #22C55E, #14532D)',
  'linear-gradient(135deg, #F59E0B, #78350F)',
];

const AVATAR_GLOW = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B'];

export function OpponentHand({ player, isCurrentPlayer, onCatchUno, canCatch, playerIndex = 0, reaction }) {
  const cards = Math.max(0, player.cardCount);
  const displayCount = Math.min(cards, 8);
  const avatarGradient = AVATAR_COLORS[playerIndex % 4];
  const glowColor = AVATAR_GLOW[playerIndex % 4];

  return (
    <motion.div
      animate={{
        boxShadow: isCurrentPlayer
          ? ['0 0 16px rgba(124,58,237,0.4)', '0 0 28px rgba(124,58,237,0.7)', '0 0 16px rgba(124,58,237,0.4)']
          : 'none',
      }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
        padding: '10px 14px 10px',
        borderRadius: 14,
        background: isCurrentPlayer
          ? 'rgba(124,58,237,0.18)'
          : 'rgba(255,255,255,0.04)',
        border: isCurrentPlayer
          ? '1.5px solid rgba(124,58,237,0.6)'
          : '1px solid rgba(255,255,255,0.08)',
        minWidth: 90, maxWidth: 120,
        transition: 'background 0.3s, border-color 0.3s',
        direction: 'rtl', position: 'relative',
      }}
    >
      {/* Current-turn pulse ring */}
      <AnimatePresence>
        {isCurrentPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.04, 1] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={{
              position: 'absolute', inset: -3,
              borderRadius: 17,
              border: '2px solid rgba(124,58,237,0.5)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Reaction bubble */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            key={reaction}
            initial={{ scale: 0, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            style={{
              position: 'absolute', top: reaction.length <= 2 ? -34 : -30,
              left: '50%', transform: 'translateX(-50%)',
              pointerEvents: 'none', zIndex: 20, whiteSpace: 'nowrap',
              ...(reaction.length <= 2
                ? { fontSize: 24, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }
                : {
                    fontSize: 10, color: '#E2E8F0',
                    background: 'rgba(14,10,40,0.95)',
                    border: '1px solid rgba(124,58,237,0.5)',
                    borderRadius: 20, padding: '3px 9px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis',
                  }),
            }}
          >
            {reaction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <motion.div
          animate={isCurrentPlayer
            ? { boxShadow: [`0 0 8px ${glowColor}60`, `0 0 18px ${glowColor}`, `0 0 8px ${glowColor}60`] }
            : {}}
          transition={{ repeat: Infinity, duration: 1.8 }}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: avatarGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-head)', fontSize: 15, color: '#fff',
            border: `2px solid ${glowColor}55`,
          }}
        >
          {player.name[0].toUpperCase()}
        </motion.div>
        {/* Card count badge */}
        {cards > 0 && (
          <div style={{
            position: 'absolute', bottom: -4, right: -6,
            background: cards >= 10 ? '#EF4444' : '#1E1B4B',
            border: `1.5px solid ${cards >= 10 ? '#F87171' : 'rgba(124,58,237,0.5)'}`,
            borderRadius: 10, minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-head)', fontSize: 9, color: '#fff',
            padding: '0 4px',
          }}>
            {cards}
          </div>
        )}
      </div>

      {/* Card stack */}
      <div style={{
        position: 'relative',
        height: 46,
        width: Math.max(36, 36 + Math.max(0, displayCount - 1) * 7),
      }}>
        {Array.from({ length: displayCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              position: 'absolute',
              right: i * 7, top: 0,
              transform: `rotate(${(i - displayCount / 2) * 4}deg)`,
              zIndex: i,
              width: 36, height: 54, borderRadius: 6,
              background: 'linear-gradient(135deg, #2D1B69, #7C3AED 50%, #2D1B69)',
              border: '1.5px solid rgba(167,139,250,0.2)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-head)',
              fontSize: 7,
              color: 'rgba(167,139,250,0.35)',
            }}>UNO</span>
          </motion.div>
        ))}
        {cards === 0 && (
          <div style={{
            width: 36, height: 54, borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }} />
        )}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: 'var(--font-head)', fontSize: 11,
        color: isCurrentPlayer ? '#A78BFA' : '#64748B',
        letterSpacing: 1, maxWidth: 90,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'center',
      }}>
        {player.name}
      </div>

      {/* UNO alert */}
      <AnimatePresence>
        {cards === 1 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
          >
            <motion.div
              animate={!player.unoCalled
                ? { boxShadow: ['0 0 8px rgba(244,63,94,0.5)', '0 0 20px rgba(244,63,94,0.9)', '0 0 8px rgba(244,63,94,0.5)'] }
                : {}}
              transition={{ repeat: Infinity, duration: 0.9 }}
              style={{
                fontFamily: 'var(--font-head)', fontSize: 11, letterSpacing: 1,
                color: player.unoCalled ? '#22C55E' : '#F43F5E',
                background: player.unoCalled
                  ? 'rgba(34,197,94,0.15)'
                  : 'rgba(244,63,94,0.18)',
                padding: '3px 10px', borderRadius: 20,
                border: `1.5px solid ${player.unoCalled ? '#22C55E' : '#F43F5E'}`,
              }}
            >
              {player.unoCalled ? '✓ UNO' : '! UNO'}
            </motion.div>

            {canCatch && !player.unoCalled && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1, boxShadow: '0 0 18px rgba(244,63,94,0.7)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onCatchUno(player.id)}
                style={{
                  background: 'linear-gradient(135deg, #F43F5E, #BE123C)',
                  border: 'none', borderRadius: 8,
                  padding: '4px 10px', color: '#fff',
                  fontSize: 10, fontFamily: 'var(--font-head)',
                  cursor: 'pointer', letterSpacing: 1,
                  boxShadow: '0 0 10px rgba(244,63,94,0.4)',
                }}
              >
                امسك!
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
