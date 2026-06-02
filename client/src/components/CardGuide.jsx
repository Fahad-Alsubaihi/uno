import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

const GUIDE = [
  {
    card:  { id: 'g-skip',    color: 'red',    type: 'skip',    value: 'skip' },
    name:  'تخطي',
    desc:  'التالي يخسر دوره',
  },
  {
    card:  { id: 'g-skipall', color: 'blue',   type: 'skip-all', value: 'skip-all' },
    name:  'تخطي الكل',
    desc:  'الكل يخسر دوره، أنت تلعب مجدداً',
  },
  {
    card:  { id: 'g-rev',     color: 'green',  type: 'reverse', value: 'reverse' },
    name:  'عكس',
    desc:  'عكس اتجاه اللعب',
  },
  {
    card:  { id: 'g-d2',      color: 'yellow', type: 'draw-two',  value: '+2', drawValue: 2 },
    name:  'اسحب 2',
    desc:  'التالي يسحب 2 ويخسر دوره',
  },
  {
    card:  { id: 'g-d4',      color: 'blue',   type: 'draw-four', value: '+4', drawValue: 4 },
    name:  'اسحب 4',
    desc:  'التالي يسحب 4 ويخسر دوره',
  },
  {
    card:  { id: 'g-dis',     color: 'red',    type: 'discard-all', value: 'discard-all' },
    name:  'رمي الكل',
    desc:  'تتخلص من كل أوراقك بنفس اللون',
  },
  {
    card:  { id: 'g-wd6',     color: 'wild',   type: 'wild-draw-six', value: '+6', drawValue: 6 },
    name:  'وايلد +6',
    desc:  'تختار اللون، التالي يسحب 6',
  },
  {
    card:  { id: 'g-wd10',    color: 'wild',   type: 'wild-draw-ten', value: '+10', drawValue: 10 },
    name:  'وايلد +10',
    desc:  'تختار اللون، التالي يسحب 10',
  },
  {
    card:  { id: 'g-wrev',    color: 'wild',   type: 'wild-reverse-draw-four', value: 'عكس+4', drawValue: 4 },
    name:  'وايلد عكس +4',
    desc:  'عكس الاتجاه، التالي يسحب 4. في لعبة لاعبين: أنت تسحب 4',
  },
  {
    card:  { id: 'g-wrou',    color: 'wild',   type: 'wild-color-roulette', value: 'روليت' },
    name:  'روليت الألوان',
    desc:  'التالي يختار لون ويسحب حتى يجيب ورقة منه',
  },
];

export function CardGuide({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(14, 10, 40, 0.96)',
              border: '1px solid rgba(124,58,237,0.45)',
              borderRadius: 20,
              padding: '20px 18px',
              width: '100%',
              maxWidth: 420,
              maxHeight: '88vh',
              overflowY: 'auto',
              direction: 'rtl',
              boxShadow: '0 0 60px rgba(124,58,237,0.2), 0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 18,
            }}>
              <h2 style={{
                fontFamily: 'var(--font-head)', fontSize: 16,
                color: '#A78BFA', letterSpacing: 3, margin: 0,
                textShadow: '0 0 16px rgba(167,139,250,0.5)',
              }}>
                دليل الأوراق
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, background: 'rgba(244,63,94,0.2)' }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="إغلاق"
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#94A3B8', fontFamily: 'var(--font-head)',
                  fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                ✕
              </motion.button>
            </div>

            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {GUIDE.map((entry, idx) => (
                <motion.div
                  key={entry.card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: '12px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'center',
                  }}
                >
                  {/* Card visual */}
                  <div style={{ pointerEvents: 'none' }}>
                    <Card card={entry.card} size="sm" />
                  </div>

                  {/* Name */}
                  <div style={{
                    fontFamily: 'var(--font-head)', fontSize: 11,
                    color: '#E2E8F0', letterSpacing: 1,
                    lineHeight: 1.3,
                  }}>
                    {entry.name}
                  </div>

                  {/* Desc */}
                  <div style={{
                    fontSize: 10,
                    color: '#64748B',
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-body)',
                  }}>
                    {entry.desc}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stacking rule note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              style={{
                marginTop: 14,
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 10,
                color: '#A78BFA',
                lineHeight: 1.7,
                fontFamily: 'var(--font-body)',
                textAlign: 'center',
              }}
            >
              التراكم: تقدر تلعب ورقة سحب مساوية أو أعلى من التي لُعبت عليك لتمرير العقوبة
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
