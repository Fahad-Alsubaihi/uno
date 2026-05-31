import { motion, AnimatePresence } from 'framer-motion';

const RULES = [
  {
    icon: '🎯',
    title: 'الهدف من اللعبة',
    text: 'أن تكون أول لاعب يتخلص من جميع أوراقه، أو تقوم بإقصاء جميع اللاعبين الآخرين لتكون اللاعب الأخير المتبقي (عبر قاعدة الرحمة). يبدأ كل لاعب بـ 7 أوراق.',
  },
  {
    icon: '▶',
    title: 'طريقة اللعب',
    text: 'في دورك، قم بلعب ورقة واحدة تطابق الورقة المكشوفة في اللون، الرقم، أو الرمز. إذا لم تملك ورقة مطابقة، يجب عليك السحب من كوامة السحب ورقة تلو الأخرى حتى تحصل على ورقة قابلة للعب وتلعبها فوراً لإنهاء دورك. يمكنك الامتناع عن اللعب اختيارياً والسحب بنفس الطريقة.',
  },
  {
    icon: '📦',
    title: 'قاعدة التراكم (Stacking)',
    text: 'إذا لُعبت عليك ورقة سحب (+2، +4، +6، +10)، يمكنك تمرير العقوبة ولعب ورقة سحب من يدك بقيمة مساوية أو أعلى. تتراكم الأوراق وتنتقل العقوبة الإجمالية للاعب التالي، حتى يعجز لاعب عن التمرير فيتحمل سحب مجموع الأوراق المتراكمة كاملة.',
  },
  {
    icon: '⚰️',
    title: 'قاعدة الرحمة (Mercy Rule)',
    text: 'إذا وصلت أوراقك في يدك في أي لحظة إلى 25 ورقة أو أكثر، يتم إقصاؤك فوراً من اللعبة وتخرج من الجولة، وتُستبعد أوراقك تماماً.',
  },
  {
    icon: '7️⃣',
    title: 'قواعد الأرقام الخاصة (7 و 0)',
    text: 'لعب ورقة الرقم (7) يجبرك إجبارياً على تبادل كامل أوراقك مع أي لاعب تختاره. ولعب ورقة الرقم (0) يجبر جميع اللاعبين إجبارياً على تمرير كامل أوراقهم للاعب التالي حسب اتجاه اللعب الحالي.',
  },
  {
    icon: '📢',
    title: 'نداء الـ UNO',
    text: 'في اللحظة التي يتبقى لديك ورقة واحدة فقط في يدك، يجب عليك الهتاف بـ "UNO!". إذا كشفك أحد المنافسين قبل أن يبدأ اللاعب التالي دوره، ستتعرض لعقوبة سحب ورقتين فوراً.',
  },
];

const CARDS_INFO = [
  { name: 'سحب +2', desc: 'اللاعب التالي يسحب ورقتين ويتم تخطي دوره (إلا إذا قام بالتراكم).' },
  { name: 'تخطي الدور', desc: 'يتم تجاوز دور اللاعب التالي مباشرة.' },
  { name: 'تخطي الجميع', desc: 'يُلغى دور جميع اللاعبين الآخرين، وتحصل على دور إضافي فوراً.' },
  { name: 'عكس الاتجاه', desc: 'عكس مسار اللعب. (في نمط لاعبين: تعمل كبطاقة تخطي دور وتمنحك دوراً إضافياً).' },
  { name: 'تطهير اللون (Discard All)', desc: 'تسمح لك بالتخلص من جميع الأوراق التي تحمل نفس لونها من يدك دفعة واحدة بوضعها في كوامة الرمي.' },
  { name: 'سحب +6', desc: 'اللاعب التالي يسحب 6 أوراق ويتم تخطي دوره (إلا إذا قام بالتراكم).' },
  { name: 'سحب +10', desc: 'اللاعب التالي يسحب 10 أوراق ويتم تخطي دوره (إلا إذا قام بالتراكم).' },
  { name: 'وايلد (تغيير اللون)', desc: 'تُلعب على أي ورقة، وتسمح لك باختيار اللون التالي الذي يستمر به اللعب.' },
  { name: 'وايلد سحب +4', desc: 'تسمح باختيار اللون التالي، وتجبر اللاعب التالي على سحب 4 أوراق وتخطي دوره.' },
  { name: 'وايلد سحب +6', desc: 'تسمح باختيار اللون التالي، وتجبر اللاعب التالي على سحب 6 أوراق وتخطي دوره.' },
  { name: 'وايلد سحب +10', desc: 'تسمح باختيار اللون التالي، وتجبر اللاعب التالي على سحب 10 أوراق وتخطي دوره.' },
  { name: 'وايلد عكس وسحب +4', desc: 'تعكس اتجاه اللعب فوراً وتجبر اللاعب التالي (في الاتجاه الجديد) على سحب 4 أوراق وتخطي دوره. (في نمط لاعبين: تجبرك أنت على سحب الـ 4 أوراق!).' },
  { name: 'روليت الألوان (Wild Roulette)', desc: 'تسمح باختيار لون معين، ويجبر اللاعب التالي على السحب من كوامة السحب ورقة تلو الأخرى دون توقف حتى تظهر له ورقة باللون الذي اخترته، ويخسر دوره.' },
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
            backdropFilter: 'blur(4px)',
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
                دليل وقواعد اللعبة الرسمية (No Mercy)
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
                🃏 تفاصيل البطاقات الخاصة والأكشن
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
                      flexWrap: 'nowrap',
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