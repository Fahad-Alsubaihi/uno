import { motion } from 'framer-motion';

const SCHEME = {
  red:    { bg: '#DC2626', dark: '#7F1D1D', glow: '#EF4444' },
  green:  { bg: '#16A34A', dark: '#14532D', glow: '#22C55E' },
  blue:   { bg: '#2563EB', dark: '#1E3A8A', glow: '#60A5FA' },
  yellow: { bg: '#D97706', dark: '#78350F', glow: '#FCD34D' },
  wild:   { bg: '#1E1B4B', dark: '#0F0F23', glow: '#A78BFA' },
};

const WILD_GRADIENT =
  'conic-gradient(from 0deg, #DC2626 0deg 90deg, #2563EB 90deg 180deg, #16A34A 180deg 270deg, #D97706 270deg 360deg)';

const CARD_LABELS = {
  'skip':                   'تخطي',
  'reverse':                'عكس',
  'draw-two':               '+2',
  'draw-six':               '+6',
  'draw-ten':               '+10',
  'skip-all':               'تخطي الكل',
  'discard-all':            'تجاهل الكل',
  'wild':                   'W',
  'wild-draw-four':         '+4',
  'wild-draw-six':          '+6',
  'wild-draw-ten':          '+10',
  'wild-reverse-draw-four': 'عكس+4',
  'wild-color-roulette':    'روليت',
};

function SkipIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

function ReverseIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function CardContent({ card, size }) {
  const iconSize = size === 'sm' ? 18 : 28;
  const fontSize = size === 'sm' ? 13 : 22;
  if (card.type === 'skip') return <SkipIcon size={iconSize} />;
  if (card.type === 'reverse') return <ReverseIcon size={iconSize} />;
  if (card.type === 'number') return (
    <span style={{ fontSize: size === 'sm' ? 22 : 36, fontFamily: 'var(--font-head)', color: '#fff', lineHeight: 1 }}>
      {card.value}
    </span>
  );
  const label = CARD_LABELS[card.type] || card.value;
  return (
    <span style={{ fontSize, fontFamily: 'var(--font-head)', color: '#fff', lineHeight: 1, textAlign: 'center', direction: 'rtl' }}>
      {label}
    </span>
  );
}

function CardCorner({ card, rotate = false, small = false }) {
  const fontSize = small ? 9 : 11;
  const style = {
    position: 'absolute',
    fontSize,
    fontFamily: 'var(--font-head)',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 1,
    transform: rotate ? 'rotate(180deg)' : 'none',
    ...(rotate ? { bottom: 4, left: 6 } : { top: 4, right: 6 }),
    display: 'flex',
    alignItems: 'center',
  };
  if (card.type === 'skip') return <div style={style}><SkipIcon size={fontSize + 2} /></div>;
  if (card.type === 'reverse') return <div style={style}><ReverseIcon size={fontSize + 2} /></div>;
  const label = card.type === 'number' ? String(card.value) : (CARD_LABELS[card.type] || card.value);
  return <div style={style}>{label}</div>;
}

export function Card({
  card, onClick, isPlayable = false, isSelected = false,
  size = 'md', faceDown = false, layoutId, animate, initial, exit,
}) {
  const scheme = SCHEME[card?.color] || SCHEME.wild;
  const w = size === 'sm' ? 52 : size === 'lg' ? 90 : 72;
  const h = size === 'sm' ? 78 : size === 'lg' ? 135 : 108;
  const isWild = card?.color === 'wild';

  if (faceDown) {
    return (
      <motion.div layoutId={layoutId} initial={initial} animate={animate} exit={exit}
        style={{
          width: w, height: h, borderRadius: 10,
          background: 'linear-gradient(135deg, #1E1B4B 0%, #7C3AED 50%, #1E1B4B 100%)',
          border: '2px solid rgba(167,139,250,0.3)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <span style={{ fontFamily: 'var(--font-head)', fontSize: size === 'sm' ? 12 : 18, color: 'rgba(167,139,250,0.5)' }}>
          UNO
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={layoutId} initial={initial} animate={animate} exit={exit}
      onClick={isPlayable ? onClick : undefined}
      whileHover={isPlayable ? { y: -14, scale: 1.06, transition: { duration: 0.15 } } : {}}
      whileTap={isPlayable ? { scale: 0.93, transition: { duration: 0.08 } } : {}}
      style={{
        width: w, height: h, borderRadius: 10,
        background: isWild ? WILD_GRADIENT : scheme.bg,
        border: isSelected
          ? '2px solid #fff'
          : isPlayable ? `2px solid ${scheme.glow}` : '2px solid rgba(255,255,255,0.15)',
        boxShadow: isPlayable
          ? `0 0 18px ${scheme.glow}60, 0 6px 20px rgba(0,0,0,0.5)`
          : '0 3px 10px rgba(0,0,0,0.5)',
        cursor: isPlayable ? 'pointer' : 'default',
        flexShrink: 0, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      {/* Center oval */}
      <div style={{
        width: w * 0.62, height: h * 0.62, borderRadius: '50%',
        background: isWild ? 'rgba(0,0,0,0.5)' : scheme.dark,
        transform: 'rotate(-20deg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ transform: 'rotate(20deg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CardContent card={card} size={size} />
        </div>
      </div>
      <CardCorner card={card} small={size === 'sm'} />
      <CardCorner card={card} rotate small={size === 'sm'} />
      {isWild && card.chosenColor && (
        <div style={{
          position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
          width: 10, height: 10, borderRadius: '50%',
          background: SCHEME[card.chosenColor]?.bg || '#fff',
          border: '1px solid rgba(255,255,255,0.5)', zIndex: 2,
        }} />
      )}
    </motion.div>
  );
}
