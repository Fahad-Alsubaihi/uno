import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

// ── Load all card SVGs as raw strings (Vite 5) ──────────────────────────────
const SVG_RAW = import.meta.glob(
  '../assets/cards/**/*.svg',
  { eager: true, query: '?raw', import: 'default' },
);

// ── Color maps ───────────────────────────────────────────────────────────────
const FILL = {
  red:    '#DC2626',
  green:  '#16A34A',
  blue:   '#2563EB',
  yellow: '#D97706',
};

const GLOW = {
  red:    '#EF4444',
  green:  '#22C55E',
  blue:   '#60A5FA',
  yellow: '#FCD34D',
  wild:   '#A78BFA',
};

// ── Card dimensions (unchanged from original) ────────────────────────────────
const CARD_W = { xs: 46, sm: 62, md: 80, lg: 90 };
const CARD_H = { xs: 69, sm: 93, md: 120, lg: 135 };

// ── SVG path lookup ──────────────────────────────────────────────────────────
function svgPath(card) {
  const b = '../assets/cards/';
  if (!card) return null;
  switch (card.type) {
    case 'number':                 return `${b}numbers/card_${card.value}.svg`;
    case 'skip':                   return `${b}action/card-skip.svg`;
    case 'skip-all':               return `${b}action/card-skip-all.svg`;
    case 'reverse':                return `${b}action/card-reverse.svg`;
    case 'draw-two':               return `${b}action/card-draw-two.svg`;
    case 'draw-four':              return `${b}action/card-draw-four.svg`;
    case 'discard-all':            return `${b}action/card-discard-all.svg`;
    case 'wild-draw-six':          return `${b}wilds/card-wild-draw-six.svg`;
    case 'wild-draw-ten':          return `${b}wilds/card-wild-draw-ten.svg`;
    case 'wild-reverse-draw-four': return `${b}wilds/card-wild-reverse-draw-four.svg`;
    case 'wild-color-roulette':    return `${b}wilds/card-wild-color-roulette.svg`;
    default: return null;
  }
}

// ── Make all id/url(#) unique to avoid DOM conflicts ─────────────────────────
let _uid = 0;
function uniquifyIds(svg) {
  const uid = ++_uid;
  const ids = new Set();
  svg.replace(/\bid="([^"]+)"/g, (_, id) => ids.add(id));
  return svg
    .replace(/\bid="([^"]+)"/g,  (_, id) => `id="${id}-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => ids.has(id) ? `url(#${id}-${uid})` : `url(#${id})`);
}

// ── Build the final SVG string ───────────────────────────────────────────────
function buildSvg(card, faceDown, w, h) {
  let raw;
  if (faceDown) {
    raw = SVG_RAW['../assets/cards/card_back.svg'] || '';
  } else {
    const path = svgPath(card);
    raw = (path && SVG_RAW[path]) || '';
    // Replace placeholder background color for non-wild cards
    if (card?.color && card.color !== 'wild') {
      const fill = FILL[card.color];
      if (fill) raw = raw.replace(/#D9D9D9/gi, fill);
    }
  }
  if (!raw) return '';

  // Scale SVG to exact card dimensions (stretch to fill — ratios are close)
  raw = raw
    .replace(/(<svg[^>]*)\s+width="[^"]*"/, `$1 width="${w}"`)
    .replace(/(<svg[^>]*)\s+height="[^"]*"/, `$1 height="${h}"`);

  // Crop the transparent horizontal padding that surrounds the card rect
  // (number/action/wild SVGs have a 3px left + 5px right transparent gap in their 71×94 viewBox)
  raw = raw.replace(/viewBox="0 0 71 94"/g, 'viewBox="3 0 63 94"');

  // Add preserveAspectRatio="none" so SVG fills the container without letterboxing
  if (!raw.includes('preserveAspectRatio')) {
    raw = raw.replace('<svg', '<svg preserveAspectRatio="none"');
  }

  return uniquifyIds(raw);
}

// ── Component ────────────────────────────────────────────────────────────────
export function Card({
  card, onClick, isPlayable = false, isSelected = false,
  size = 'md', customW, customH,
  faceDown = false, layoutId, animate, initial, exit,
}) {
  const w = customW || CARD_W[size] || 72;
  const h = customH || CARD_H[size] || 108;
  const isWild = card?.color === 'wild';
  const glow   = GLOW[card?.color] || GLOW.wild;

  // Memoize SVG string; rebuild only when card identity or size changes
  const svgHtml = useMemo(
    () => buildSvg(card, faceDown, w, h),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card?.type, card?.value, card?.color, faceDown, w, h],
  );

  return (
    <motion.div
      layoutId={layoutId} initial={initial} animate={animate} exit={exit}
      onClick={isPlayable ? onClick : undefined}
      whileHover={isPlayable ? { y: -16, scale: 1.06, transition: { duration: 0.12 } } : {}}
      whileTap={isPlayable  ? { scale: 0.93,           transition: { duration: 0.08 } } : {}}
      style={{
        width: w, height: h,
        borderRadius: 8,
        border: isSelected
          ? '2.5px solid #fff'
          : isPlayable
            ? `2px solid ${glow}`
            : '2px solid transparent',
        boxShadow: isPlayable
          ? `0 0 18px ${glow}60, 0 6px 18px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.45)',
        cursor: isPlayable ? 'pointer' : 'default',
        flexShrink: 0, position: 'relative',
        overflow: 'hidden', userSelect: 'none',
        display: 'flex',
      }}
    >
      {/* SVG card face */}
      <div
        dangerouslySetInnerHTML={{ __html: svgHtml }}
        style={{ width: '100%', height: '100%', display: 'flex', flexShrink: 0 }}
      />

      {/* Playable pulsing glow ring */}
      {isPlayable && !isSelected && (
        <motion.div
          animate={{
            boxShadow: [
              `inset 0 0 10px ${glow}30`,
              `inset 0 0 22px ${glow}55`,
              `inset 0 0 10px ${glow}30`,
            ],
          }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0, borderRadius: 7,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Chosen color dot for wild cards */}
      {isWild && card?.chosenColor && (
        <div style={{
          position: 'absolute', bottom: 3, left: '50%',
          transform: 'translateX(-50%)',
          width: size === 'xs' ? 6 : 8,
          height: size === 'xs' ? 6 : 8,
          borderRadius: '50%',
          background: FILL[card.chosenColor] || '#fff',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: `0 0 6px ${GLOW[card.chosenColor] || '#fff'}`,
          zIndex: 3,
        }} />
      )}
    </motion.div>
  );
}
