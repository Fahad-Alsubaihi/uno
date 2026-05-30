import { motion, AnimatePresence } from 'framer-motion';

const RULES = [
  {
    icon: '🎯',
    title: 'الهدف من اللعبة',
    text: 'كن أول لاعب يتخلص من جميع أوراقه، أو قم بإقصاء الجميع عبر تفعيل "قاعدة الرحمة". يبدأ كل لاعب بـ 7 أوراق.',
  },
  {
    icon: '▶',
    title: 'طريقة اللعب',
    text: 'العب ورقة تطابق الورقة المكشوفة في اللون، الرقم، أو النوع. أوراق الـ Wild تُلعب في أي وقت. إذا لم تملك ورقة مناسبة، اسحب من السحب حتى تحصل على ورقة قابلة للعب. يمكنك الامتناع عن اللعب تفادياً لكشف استراتيجيتك.',
  },
  {
    icon: '📦',
    title: 'قاعدة التراكم (Stacking)',
    text: 'عند لعب أوراق السحب (+2، +4، +6، +10) عليك، يمكنك تمريرها بلعب ورقة بنفس القيمة أو أعلى. تتراكم العقوبة حتى تعجز عن التمرير، فتضطر لسحب مجموع الأوراق المتراكمة كاملة.',
  },
  {
    icon: '⚰️',
    title: 'قاعدة الرحمة',
    text: 'إذا وصلت أوراقك في أي لحظة إلى 25 ورقة أو أكثر، يتم إقصاؤك فوراً من الجولة.',
  },
  {
    icon: '7️⃣',
    title: 'قواعد الأرقام الخاصة (7 و 0)',
    text: 'ورقة الرقم (7) تمكنك من تبادل كامل أوراقك مع أي لاعب تختاره. ورقة الرقم (0) تجبر جميع اللاعبين على تمرير أوراقهم للاعب التالي حسب اتجاه اللعب الحركي.',
  },
  {
    icon: '📢',
    title: 'نداء الـ UNO',
    text: 'عندما يتبقى لديك ورقة واحدة فقط، يجب عليك الهتاف بـ "UNO!" فوراً، وإلا ستتعرض لعقوبة سحب ورقتين إذا كشفك أحد المنافسين قبل دورك التالي.',
  },
];

const CARDS_INFO = [
  { name: 'سحب +2', desc: 'اللاعب التالي يسحب ورقتين ويتم تخطي دوره.' },
  { name: 'تخطي الدور', desc: 'يتم تجاوز دور اللاعب التالي مباشرة.' },
  { name: 'تخطي الجميع', desc: 'يُلغى دور جميع اللاعبين، وتحصل على دور إضافي فوراً.' },
  { name: 'عكس الاتجاه', desc: 'عكس مسار اللعب (من عقارب الساعة إلى العكس أو العكس صحيح).' },
  { name: 'تطهير اللون', desc: 'تسمح لك بالتخلص من جميع الأوراق التي تحمل نفس اللون في يدك دفعة واحدة.' },
  { name: 'سحب +6', desc: 'اللاعب التالي يسحب 6 أوراق ويتم تخطي دوره.' },
  { name: 'سحب +10', desc: 'اللاعب التالي يسحب 10 أوراق ويتم تخطي دوره.' },
  { name: 'وايلد (تغيير اللون)', desc: 'تغيير اللون الحالي للعب إلى أي لون تختاره.' },
  { name: 'وايلد سحب +4', desc: 'اختيار اللون التالي، وإجبار اللاعب التالي على سحب 4 أوراق.' },
  { name: 'وايلد سحب +6', desc: 'اختيار اللون التالي، وإجبار اللاعب التالي على سحب 6 أوراق.' },
  { name: 'وايلد سحب +10', desc: 'اختيار اللون التالي، وإجبار اللاعب التالي على سحب 10 أوراق.' },
  { name: 'وايلد عكس وسحب +4', desc: 'عكس اتجاه اللعب مع إجبار اللاعب التالي على سحب 4 أوراق (في نمط لاعبين: تسحبها أنت).' },
  { name: 'روليت الألوان (وايلد)', desc: 'يختار اللاعب التالي لوناً مجبراً، ويستمر بالسحب حتى تظهر له ورقة من ذلك اللون.' },
];

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
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '16px',
            backdropFilter: 'blur(4px)', // إضافة تأثير ضبابية خفيف للخلفية لمظهر عصري
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#161630',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              borderRadius: '20px',
              padding: '24px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(124, 58, 237, 0.2)',
              direction: 'rtl',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-head), sans-serif', fontSize: '20px', color: '#A78BFA', fontWeight: 'bold' }}>
                دليل وقواعد اللعبة
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                &times;
              </motion.button>
            </div>

            {/* Main rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {RULES.map((rule, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(124, 58, 237, 0.06)',
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>{rule.icon}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-head), sans-serif', fontSize: '14px', color: '#A78BFA', marginBottom: '4px', fontWeight: '600' }}>
                      {rule.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5', margin: 0 }}>{rule.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cards section */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <div style={{ fontFamily: 'var(--font-head), sans-serif', fontSize: '14px', color: '#C084FC', marginBottom: '12px', fontWeight: '600' }}>
                🃏 تفاصيل البطاقات الخاصة
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {CARDS_INFO.map((card, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      flexWrap: 'nowrap', // منع النزول لسطر جديد للحفاظ على الهيكل التنظيمي للجدول
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-head), sans-serif', fontSize: '12px', color: '#E2E8F0', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {card.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'left' }}>
                      {card.desc}
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