import { motion } from 'framer-motion';
import { Card } from './Card';

export function OpponentHand({ player, isCurrentPlayer, onCatchUno, canCatch }) {
  const cards = Math.max(0, player.cardCount);
  const displayCount = Math.min(cards, 7);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '8px 12px', borderRadius: 12,
      background: isCurrentPlayer ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
      border: isCurrentPlayer ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
      boxShadow: isCurrentPlayer ? '0 0 16px rgba(124,58,237,0.3)' : 'none',
      minWidth: 80, transition: 'all 0.3s', direction: 'rtl',
    }}>
      {/* Card stack */}
      <div style={{ position: 'relative', height: 52, width: 52 + Math.max(0, displayCount - 1) * 6 }}>
        {Array.from({ length: displayCount }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', right: i * 6, top: 0,
            transform: `rotate(${(i - displayCount / 2) * 3}deg)`, zIndex: i,
          }}>
            <Card card={{ id: `back-${player.id}-${i}`, color: 'wild', type: 'wild', value: 'wild' }}
              faceDown size="sm" />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-head)', fontSize: 11,
          color: isCurrentPlayer ? '#A78BFA' : '#94A3B8',
          letterSpacing: 1, maxWidth: 80, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {player.name}
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
          {cards} ورقة
        </div>
      </div>

      {cards === 1 && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 10,
            color: player.unoCalled ? '#22C55E' : '#F43F5E',
            background: player.unoCalled ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)',
            padding: '2px 8px', borderRadius: 20,
            border: `1px solid ${player.unoCalled ? '#22C55E' : '#F43F5E'}`,
          }}>
            {player.unoCalled ? '✓ UNO' : '! UNO'}
          </div>
          {canCatch && !player.unoCalled && (
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => onCatchUno(player.id)}
              style={{
                background: '#F43F5E', border: 'none', borderRadius: 6,
                padding: '3px 8px', color: '#fff',
                fontSize: 10, fontFamily: 'var(--font-head)',
                cursor: 'pointer', letterSpacing: 1,
              }}
            >
              امسك!
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}
