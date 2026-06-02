import { motion, AnimatePresence } from 'framer-motion';

const RULES = [
  {
    icon: '🎯',
    title: 'الهدف من اللعبة',
    text: 'أن تكون أول لاعب يتخلص من جميع أوراقه، أو أن تُقصي جميع اللاعبين الآخرين لتبقى الوحيد (عبر قاعدة الرحمة). يبدأ كل لاعب بـ 7 أوراق.',
  },
  {
    icon: '▶',
    title: 'طريقة اللعب',
    text: 'في دورك، العب ورقة واحدة تطابق الورقة المكشوفة في اللون أو الرقم أو الرمز. إذا لم تملك ورقة مطابقة، يجب عليك السحب من كوامة السحب ورقة تلو الأخرى حتى تحصل على ورقة قابلة للعب، ثم تلعبها فوراً.',
  },
  {
    icon: '📦',
    title: 'قاعدة التراكم (Stacking)',
    text: 'إذا لُعبت عليك ورقة سحب (+2، +4، +6، +10)، يمكنك تمريرها بلعب ورقة سحب من يدك بقيمة مساوية أو أعلى. تتراكم العقوبة وتنتقل للتالي، حتى يعجز لاعب عن التمرير فيسحب مجموع الأوراق المتراكمة كاملةً.',
  },
  {
    icon: '⚰️',
    title: 'قاعدة الرحمة (Mercy Rule)',
    text: 'إذا وصلت الأوراق في يد أي لاعب إلى 25 ورقة أو أكثر في أي لحظة، يُقصى فوراً من اللعبة وتُستبعد أوراقه.',
  },
  {
    icon: '7️⃣',
    title: 'قواعد الأرقام الخاصة (7 و 0)',
    text: 'لعب الرقم (7) يُجبرك على تبادل كامل أوراقك مع أي لاعب تختاره. لعب الرقم (0) يُجبر جميع اللاعبين على تمرير أوراقهم كاملةً للاعب التالي حسب اتجاه اللعب.',
  },
  {
    icon: '📢',
    title: 'نداء الـ UNO',
    text: 'حين تتبقى لديك ورقة واحدة فقط، يجب أن تصرخ "UNO!". إذا كشفك أحد المنافسين قبل أن يبدأ اللاعب التالي دوره، تسحب ورقتين عقوبةً.',
  },
];

const CARDS_INFO = [
  {
    name: 'سحب +2',
    type: 'action',
    desc: 'اللاعب التالي يسحب ورقتين ويخسر دوره. يمكن مقاومتها بورقة سحب بقيمة 2 أو أعلى.',
  },
  {
    name: 'سحب +4',
    type: 'action',
    desc: 'اللاعب التالي يسحب 4 أوراق ويخسر دوره. يمكن مقاومتها بورقة سحب بقيمة 4 أو أعلى.',
  },
  {
    name: 'تخطي الدور',
    type: 'action',
    desc: 'يُتجاوز دور اللاعب التالي مباشرةً.',
  },
  {
    name: 'تخطي الجميع',
    type: 'action',
    desc: 'يُلغى دور جميع اللاعبين الآخرين وتأخذ دوراً إضافياً فوراً.',
  },
  {
    name: 'عكس الاتجاه',
    type: 'action',
    desc: 'يعكس مسار اللعب. في لعبة لاعبين: تعمل كتخطي دور وتمنحك دوراً إضافياً.',
  },
  {
    name: 'تطهير اللون',
    type: 'action',
    desc: 'تتخلص فوراً من جميع الأوراق التي تحمل نفس لون هذه الورقة في يدك. توضع الأوراق الملقاة تحت بطاقة Discard All في كوامة الرمي.',
  },
  {
    name: 'وايلد سحب +6',
    type: 'wild',
    desc: 'تختار اللون التالي، واللاعب التالي يسحب 6 أوراق ويخسر دوره. يمكن مقاومتها بورقة سحب بقيمة 6 أو أعلى.',
  },
  {
    name: 'وايلد سحب +10',
    type: 'wild',
    desc: 'تختار اللون التالي، واللاعب التالي يسحب 10 أوراق ويخسر دوره. لا يمكن مقاومتها إلا بـ +10.',
  },
  {
    name: 'وايلد عكس وسحب +4',
    type: 'wild',
    desc: 'تعكس اتجاه اللعب، واللاعب التالي (في الاتجاه الجديد) يسحب 4 أوراق ويخسر دوره. في لعبة لاعبين: أنت من يسحب الـ 4! يمكن مقاومتها.',
  },
  {
    name: 'روليت الألوان',
    type: 'wild',
    desc: 'اللاعب الذي تطاله الورقة هو من يختار لوناً بنفسه، ثم يسحب ورقة تلو الأخرى حتى يجد ورقة من اللون الذي اختاره (بطاقات الوايلد لا تُحتسب). يضيف كل الأوراق المسحوبة ليده ويخسر دوره.',
  },
];

const TYPE_STYLE = {
  action: { bg: 'rgba(37,99,235,0.12)', border: 'rgba(96,165,250,0.3)', label: 'rgba(147,197,253,0.9)' },
  wild:   { bg: 'rgba(124,58,237,0.12)', border: 'rgba(167,139,250,0.3)', label: 'rgba(196,181,253,0.9)' },
};

export function RulesModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, padding: '16px',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161630',
              border: '1px solid rgba(124,58,237,0.35)',
              borderRadius: 20, padding: '24px',
              width: '100%', maxWidth: 540,
              maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(124,58,237,0.2)',
              direction: 'rtl',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#A78BFA', fontWeight: 'bold', margin: 0, letterSpacing: 1 }}>
                قواعد UNO No Mercy الرسمية
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.12)' }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, width: 32, height: 32,
                  cursor: 'pointer', color: '#94A3B8', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                }}
              >
                ×
              </motion.button>
            </div>

            {/* Main rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {RULES.map((rule, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    background: 'rgba(124,58,237,0.06)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{rule.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#A78BFA', marginBottom: 4, fontWeight: 600 }}>
                      {rule.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                      {rule.text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Cards section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, color: '#C084FC', marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>
                البطاقات الخاصة
              </div>

              {/* Action cards */}
              <div style={{ fontSize: 10, color: '#60A5FA', fontFamily: 'var(--font-head)', letterSpacing: 1, marginBottom: 6 }}>
                أكشن كارد — ملونة
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {CARDS_INFO.filter(c => c.type === 'action').map((card, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', gap: 10, padding: '8px 11px',
                      background: TYPE_STYLE.action.bg,
                      border: `1px solid ${TYPE_STYLE.action.border}`,
                      borderRadius: 9, alignItems: 'flex-start',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-head)', fontSize: 11,
                      color: TYPE_STYLE.action.label,
                      fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                      minWidth: 90,
                    }}>
                      {card.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.55 }}>
                      {card.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Wild cards */}
              <div style={{ fontSize: 10, color: '#A78BFA', fontFamily: 'var(--font-head)', letterSpacing: 1, marginBottom: 6 }}>
                وايلد — تلعب على أي ورقة
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {CARDS_INFO.filter(c => c.type === 'wild').map((card, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', gap: 10, padding: '8px 11px',
                      background: TYPE_STYLE.wild.bg,
                      border: `1px solid ${TYPE_STYLE.wild.border}`,
                      borderRadius: 9, alignItems: 'flex-start',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-head)', fontSize: 11,
                      color: TYPE_STYLE.wild.label,
                      fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                      minWidth: 90,
                    }}>
                      {card.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.55 }}>
                      {card.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Scoring note */}
              <div style={{
                marginTop: 16,
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 11, color: '#A78BFA', lineHeight: 1.7,
                fontFamily: 'var(--font-body)',
              }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 12, marginBottom: 5, color: '#C084FC' }}>
                  نظام النقاط 
                </div>
                أرقام 0–9: قيمتها الظاهرة · أكشن ملونة: 20 نقطة · وايلد: 50 نقطة
                <br />
                إقصاء لاعب: +250 نقطة · الفوز عند الوصول لـ 1000 نقطة
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
