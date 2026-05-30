import { motion, AnimatePresence } from 'framer-motion';

const RULES = [
  {
    icon: '🎯',
    title: 'الهدف',
    text: 'كن أول من يتخلص من جميع أوراقه، أو اطرد الجميع بقاعدة الرحمة. كل لاعب يأخذ 7 أوراق.',
  },
  {
    icon: '▶',
    title: 'قاعدة اللعب',
    text: 'العب ورقة تتطابق مع الورقة العليا باللون أو الرقم/النوع. Wild تُلعب في أي وقت. ما عندك ورقة؟ اسحب حتى تجيب ورقة تنفع. تقدر تختار ما تلعب حتى لو عندك ورقة تنفع.',
  },
  {
    icon: '📦',
    title: 'التراكم',
    text: 'لو لعب عليك +2/+4/+6/+10 العب نفس القيمة أو أعلى وتمررها. يقف عند أول شخص ما يقدر — هو يسحب المجموع كله.',
  },
  {
    icon: '⚰️',
    title: 'قاعدة الرحمة',
    text: '25 ورقة أو أكثر = تُطرد من اللعبة.',
  },
  {
    icon: '7️⃣',
    title: 'قاعدة 7 و 0',
    text: 'ورقة 7 = تبادل يدك مع لاعب تختاره. ورقة 0 = الكل يمررون أوراقهم للتالي بنفس الاتجاه.',
  },
  {
    icon: '📢',
    title: 'UNO',
    text: 'ورقة واحدة؟ صيح UNO وإلا تسحب 2. أي لاعب يقدر يمسكك!',
  },
];

const CARDS_INFO = [
  { name: 'سحب +2', desc: 'التالي يسحب 2 ويخسر دوره' },
  { name: 'تخطي', desc: 'التالي يخسر دوره' },
  { name: 'تخطي الجميع', desc: 'الكل يخسر دوره، أنت تلعب مجدداً' },
  { name: 'عكس', desc: 'عكس اتجاه اللعب' },
  { name: 'تجاهل الكل', desc: 'تتخلص من كل أوراقك بنفس اللون' },
  { name: 'سحب +6', desc: 'التالي يسحب 6 ويخسر دوره' },
  { name: 'سحب +10', desc: 'التالي يسحب 10 ويخسر دوره' },
  { name: 'وايلد', desc: 'تختار اللون التالي' },
  { name: 'وايلد سحب +4', desc: 'تختار اللون، التالي يسحب 4' },
  { name: 'وايلد سحب +6', desc: 'تختار اللون، التالي يسحب 6' },
  { name: 'وايلد سحب +10', desc: 'تختار اللون، التالي يسحب 10' },
  { name: 'وايلد عكس سحب +4', desc: 'عكس + التالي يسحب 4 (في لعبة لاعبين: أنت تسحب 4)' },
  { name: 'وايلد روليت الألوان', desc: 'التالي يختار لون ويسحب حتى يجيب ورقة منه' },
];

export function RulesModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, padding: 16,
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161630', border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 20, padding: '28px 24px',
              width: '100%', maxWidth: 540,
              maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 0 50px rgba(124,58,237,0.3)',
              direction: 'rtl',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, color: '#A78BFA', letterSpacing: 3 }}>
                قواعد اللعبة
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
                  color: '#94A3B8', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </motion.button>
            </div>

            {/* Main rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {RULES.map((r, i) => (
                <div key={i} style={{
                  background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{r.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#A78BFA', marginBottom: 4, letterSpacing: 1 }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>{r.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cards section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#7C3AED', letterSpacing: 2, marginBottom: 14 }}>
                🃏 البطاقات الخاصة
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CARDS_INFO.map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 12, padding: '8px 12px',
                    background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, color: '#E2E8F0', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#94A3B8', textAlign: 'right', flex: 1 }}>
                      {c.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
