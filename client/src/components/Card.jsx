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

// أضفنا xs = 38px
// const CARD_W = { xs: 38, sm: 52, md: 72, lg: 90 };
// const CARD_H = { xs: 57, sm: 78, md: 108, lg: 135 };
// const ICON_S = { xs: 11, sm: 17, md: 24, lg: 32 };
// const NUM_S  = { xs: 14, sm: 20, md: 30, lg: 40 };

const CARD_W = { xs: 46, sm: 62, md: 80, lg: 90 };
const CARD_H = { xs: 69, sm: 93, md: 120, lg: 135 };
const ICON_S = { xs: 14, sm: 20, md: 26, lg: 32 };
const NUM_S  = { xs: 18, sm: 25, md: 33, lg: 40 };

/* ── SVG Icons ── */
function SkipSVG({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff"
      strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="8" y1="8" x2="16" y2="16" />
      <line x1="16" y1="8" x2="8" y2="16" />
    </svg>
  );
}

function SkipAllSVG({ s }) {
  return (
    <svg width={s * 1.5} height={s} viewBox="0 0 36 24" fill="none" stroke="#fff"
      strokeWidth="2.2" strokeLinecap="round">
      <circle cx="9" cy="12" r="8" />
      <line x1="6" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="6" y2="15" />
      <circle cx="24" cy="12" r="8" />
      <line x1="21" y1="9" x2="27" y2="15" /><line x1="27" y1="9" x2="21" y2="15" />
    </svg>
  );
}

function ReverseSVG({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h14a4 4 0 0 1 0 8H7" />
      <polyline points="7 5 3 8 7 11" />
      <path d="M21 16H7a4 4 0 0 1 0-8h10" />
      <polyline points="17 13 21 16 17 19" />
    </svg>
  );
}

function DrawSVG({ s, label }) {
  const arrW = s * 0.7;
  const arrH = s * 0.55;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <svg width={arrW} height={arrH} viewBox="0 0 20 16" fill="none" stroke="#fff"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="1" x2="10" y2="13" />
        <polyline points="4 7 10 13 16 7" />
      </svg>
      <span style={{
        fontFamily: 'var(--font-head)', fontSize: Math.max(9, s * 0.85),
        color: '#fff', lineHeight: 1,
      }}>
        {label}
      </span>
    </div>
  );
}

function DiscardAllSVG({ s }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function WildRevSVG({ s }) {
  const sub = Math.max(8, Math.round(s * 0.55));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <ReverseSVG s={sub} />
      <span style={{
        fontFamily: 'var(--font-head)', fontSize: Math.max(8, sub * 0.9),
        color: '#fff', lineHeight: 1,
      }}>+4</span>
    </div>
  );
}

function RouletteSVG({ s }) {
  return (
    <div style={{
      position: 'relative', width: s, height: s,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.8"
        strokeLinecap="round" strokeDasharray="2 2">
        <circle cx="12" cy="12" r="10" />
      </svg>
      <span style={{
        position: 'absolute',
        fontFamily: 'var(--font-head)', fontSize: Math.max(10, s * 0.7),
        color: '#fff', lineHeight: 1,
      }}>?</span>
    </div>
  );
}

/* ── Corner label ── */
function Corner({ card, flip, size }) {
  const s = size === 'xs' ? 8 : 10;
  const style = {
    position: 'absolute',
    fontSize: s, fontFamily: 'var(--font-head)',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transform: flip ? 'rotate(180deg)' : 'none',
    ...(flip ? { bottom: 2, left: 3 } : { top: 2, right: 3 }),
  };
  switch (card.type) {
    case 'number':               return <div style={style}>{card.value}</div>;
    case 'skip':
    case 'skip-all':             return <div style={style}><SkipSVG s={s} /></div>;
    case 'reverse':              return <div style={style}><ReverseSVG s={s} /></div>;
    case 'draw-two':             return <div style={style}>+2</div>;
    case 'draw-four':            return <div style={style}>+4</div>;
    case 'draw-six':             return <div style={style}>+6</div>;
    case 'draw-ten':             return <div style={style}>+10</div>;
    case 'discard-all':          return <div style={style}><DiscardAllSVG s={s} /></div>;
    case 'wild':                 return <div style={style}>W</div>;
    case 'wild-draw-four':       return <div style={style}>+4</div>;
    case 'wild-draw-six':        return <div style={style}>+6</div>;
    case 'wild-draw-ten':        return <div style={style}>+10</div>;
    case 'wild-reverse-draw-four': return <div style={style}><ReverseSVG s={s} /></div>;
    case 'wild-color-roulette':  return <div style={style}>?</div>;
    default: return null;
  }
}

/* ── Center content ── */
function Center({ card, size }) {
  const s  = ICON_S[size] || 24;
  const ns = NUM_S[size]  || 30;
  switch (card.type) {
    case 'number':
      return (
        <span style={{
          fontFamily: 'var(--font-head)', fontSize: ns,
          color: '#fff', lineHeight: 1,
          textShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}>{card.value}</span>
      );
    case 'skip':           return <SkipSVG s={s} />;
    case 'skip-all':       return <SkipAllSVG s={s} />;
    case 'reverse':        return <ReverseSVG s={s} />;
    case 'draw-two':       return <DrawSVG s={s} label="+2" />;
    case 'draw-four':      return <DrawSVG s={s} label="+4" />;
    case 'draw-six':       return <DrawSVG s={s} label="+6" />;
    case 'draw-ten':       return <DrawSVG s={s} label="+10" />;
    case 'discard-all':    return <DiscardAllSVG s={s} />;
    case 'wild':
      return (
        <span style={{
          fontFamily: 'var(--font-head)', fontSize: ns,
          color: '#fff', lineHeight: 1,
        }}>W</span>
      );
    case 'wild-draw-four': return <DrawSVG s={s} label="+4" />;
    case 'wild-draw-six':  return <DrawSVG s={s} label="+6" />;
    case 'wild-draw-ten':  return <DrawSVG s={s} label="+10" />;
    case 'wild-reverse-draw-four': return <WildRevSVG s={s} />;
    case 'wild-color-roulette':    return <RouletteSVG s={s} />;
    default: return null;
  }
}

/* ── Card ── */
export function Card({
  card, onClick, isPlayable = false, isSelected = false,
  size = 'md', customW, customH,
  faceDown = false, layoutId, animate, initial, exit,
}) {
  const w = customW || CARD_W[size] || 72;
  const h = customH || CARD_H[size] || 108;
  const dynamicSize = w < 50 ? 'xs' : w < 65 ? 'sm' : w < 85 ? 'md' : 'lg';
  const scheme = SCHEME[card?.color] || SCHEME.wild;
  const isWild = card?.color === 'wild';

  if (faceDown) {
    return (
      <motion.div
        layoutId={layoutId} initial={initial} animate={animate} exit={exit}
        style={{
          width: w, height: h, borderRadius: 8,
          background: 'linear-gradient(135deg,#1E1B4B,#7C3AED 50%,#1E1B4B)',
          border: '2px solid rgba(167,139,250,0.25)',
          boxShadow: '0 3px 12px rgba(0,0,0,0.55)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-head)',
          fontSize: Math.max(8, w * 0.22),
          color: 'rgba(167,139,250,0.38)',
        }}>UNO</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={layoutId} initial={initial} animate={animate} exit={exit}
      onClick={isPlayable ? onClick : undefined}
      whileHover={isPlayable ? { y: -16, scale: 1.06, transition: { duration: 0.12 } } : {}}
      whileTap={isPlayable ? { scale: 0.93, transition: { duration: 0.08 } } : {}}
      style={{
        width: w, height: h, borderRadius: 8,
        background: isWild ? WILD_GRADIENT : scheme.bg,
        border: isSelected
          ? '2.5px solid #fff'
          : isPlayable
            ? `2px solid ${scheme.glow}`
            : '2px solid rgba(255,255,255,0.12)',
        boxShadow: isPlayable
          ? `0 0 18px ${scheme.glow}60, 0 6px 18px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.45)',
        cursor: isPlayable ? 'pointer' : 'default',
        flexShrink: 0, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', overflow: 'hidden',
      }}
    >
      {/* Playable pulsing glow ring */}
      {isPlayable && !isSelected && (
        <motion.div
          animate={{
            boxShadow: [
              `inset 0 0 10px ${scheme.glow}30`,
              `inset 0 0 22px ${scheme.glow}55`,
              `inset 0 0 10px ${scheme.glow}30`,
            ],
          }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0, borderRadius: 7,
            pointerEvents: 'none', zIndex: 0,
          }}
        />
      )}

      {/* Shine */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(140deg,rgba(255,255,255,0.16) 0%,transparent 52%)',
        pointerEvents: 'none',
      }} />

      {/* Wild rainbow shimmer overlay */}
      {isWild && (
        <motion.div
          animate={{ opacity: [0, 0.15, 0], x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', repeatDelay: 1 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
            pointerEvents: 'none', zIndex: 2,
          }}
        />
      )}

      {/* Oval */}
      <div style={{
        width: w * 0.6, height: h * 0.6, borderRadius: '50%',
        background: isWild ? 'rgba(0,0,0,0.48)' : scheme.dark,
        transform: 'rotate(-18deg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          transform: 'rotate(18deg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Center card={card} size={dynamicSize} />
        </div>
      </div>

      {/* Corners */}
      <Corner card={card} flip={false} size={dynamicSize} />
      <Corner card={card} flip={true}  size={dynamicSize} />

      {/* Chosen color dot for wild */}
      {isWild && card.chosenColor && (
        <div style={{
          position: 'absolute', bottom: 3, left: '50%',
          transform: 'translateX(-50%)',
          width: size === 'xs' ? 6 : 8,
          height: size === 'xs' ? 6 : 8,
          borderRadius: '50%',
          background: SCHEME[card.chosenColor]?.bg || '#fff',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: `0 0 6px ${SCHEME[card.chosenColor]?.glow || '#fff'}`,
          zIndex: 3,
        }} />
      )}
    </motion.div>
  );
}