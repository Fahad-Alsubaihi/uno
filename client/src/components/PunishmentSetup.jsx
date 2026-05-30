import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WARM = ['#EF4444','#F97316','#EC4899','#DC2626','#B45309','#EA580C','#DB2777','#991B1B'];
const COOL = ['#7C3AED','#2563EB','#0891B2','#4F46E5'];

const PRESETS = [
  'اشرب كوب ماء كامل','قلد صوت حيوان 10 ثواني','قول مدح لكل لاعب',
  'افعل 10 ضغط','غني مقطع','قل سراً محرجاً',
  'العب بيدك العكسية','تخطي دورك مرتين','اصنع وجهاً مضحكاً 30 ثانية',
  'تكلم بصوت أطفال حتى دورك','أخبر بأحرج موقف','افعل 5 قفزات',
];

let _localId = 200;
function newId() { return 'local_' + (++_localId); }

function nextColor(segs, type) {
  const palette = type === 'punishment' ? WARM : COOL;
  const used = segs.filter(s => s.type === type).length;
  return palette[used % palette.length];
}

export function PunishmentSetup({ open, onClose, segments = [], isHost, game }) {
  // نسخة محلية من الأقسام — تتزامن مع السيرفر لكن تسمح بتعديل فوري
  const [localSegs, setLocalSegs] = useState(segments);
  const [addType, setAddType]     = useState('punishment');
  const [addText, setAddText]     = useState('');
  const [addSize, setAddSize]     = useState(2);
  const [luckType, setLuckType]   = useState('retry');
  const [localError, setLocalError] = useState('');
  const pendingRef = useRef(false);

  // زامن مع السيرفر لما تتغير segments من برا (إلا لو في عملية محلية جارية)
  useEffect(() => {
    if (!pendingRef.current) {
      setLocalSegs(segments);
    }
  }, [segments]);

  // إعادة تعيين عند الفتح
  useEffect(() => {
    if (open) {
      setLocalSegs(segments);
      setAddText('');
      setAddSize(2);
      setLocalError('');
    }
  }, [open]);

  function sendToServer(newSegs) {
    pendingRef.current = true;
    game.setSegments(newSegs);
    // بعد ثانية نسمح للسيرفر يتحكم مجدداً
    setTimeout(() => { pendingRef.current = false; }, 1000);
  }

  function addSegment() {
    const text = addType === 'luck' ? luckType : addText.trim();
    if (!text) { setLocalError('اكتب نص العقوبة أولاً'); return; }
    setLocalError('');
    const seg = {
      id: newId(),
      type: addType,
      text,
      size: addSize,
      color: nextColor(localSegs, addType),
    };
    const newSegs = [...localSegs, seg];
    setLocalSegs(newSegs);   // تحديث فوري في الواجهة
    sendToServer(newSegs);
    setAddText('');
    setAddSize(2);
  }

  function removeSegment(id) {
    const newSegs = localSegs.filter(s => s.id !== id);
    setLocalSegs(newSegs);
    sendToServer(newSegs);
  }

  function updateSize(id, val) {
    const newSegs = localSegs.map(s => s.id === id ? { ...s, size: val } : s);
    setLocalSegs(newSegs);
    sendToServer(newSegs);
  }

  const totalWeight = localSegs.reduce((sum, s) => sum + s.size, 0);
  const canAdd = addType === 'luck' || addText.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, padding: 16,
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161630', border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 20, padding: '20px 16px',
              width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto',
              direction: 'rtl',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 17, color: '#A78BFA', letterSpacing: 2, margin: 0 }}>
                عجلة العقوبات
              </h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* قائمة الأقسام */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 8 }}>
                الأقسام ({localSegs.length})
              </div>

              {localSegs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#334155', fontSize: 13, padding: '16px 0' }}>
                  لا توجد أقسام — أضف أول عقوبة
                </div>
              )}

              <AnimatePresence>
                {localSegs.map(seg => {
                  const pct = totalWeight > 0 ? Math.round((seg.size / totalWeight) * 100) : 0;
                  return (
                    <motion.div
                      key={seg.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(0,0,0,0.25)', borderRadius: 10,
                        padding: '8px 10px', marginBottom: 6,
                        border: `1px solid ${seg.color}35`,
                      }}
                    >
                      <div style={{ width: 4, height: 36, borderRadius: 4, background: seg.color, flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {seg.type === 'luck'
                            ? (seg.text === 'retry' ? '🍀 حاول مرة أخرى' : '🔄 تنقلب على الفائز')
                            : seg.text}
                          <span style={{ fontSize: 10, color: seg.color, background: `${seg.color}20`, padding: '1px 6px', borderRadius: 20, marginRight: 6 }}>
                            {seg.type === 'luck' ? 'حظ' : 'عقوبة'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isHost ? (
                            <input
                              type="range" min={1} max={5} step={1} value={seg.size}
                              onChange={e => updateSize(seg.id, Number(e.target.value))}
                              style={{ flex: 1, accentColor: seg.color, height: 4 }}
                            />
                          ) : (
                            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                              <div style={{ width: `${(seg.size / 5) * 100}%`, height: '100%', background: seg.color, borderRadius: 2 }} />
                            </div>
                          )}
                          <span style={{ fontSize: 11, color: '#64748B', minWidth: 40, flexShrink: 0 }}>{seg.size}/5 · {pct}%</span>
                        </div>
                      </div>

                      {isHost && (
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => removeSegment(seg.id)}
                          style={{
                            background: 'rgba(244,63,94,0.15)', border: 'none', borderRadius: 6,
                            width: 28, height: 28, cursor: 'pointer', color: '#F43F5E',
                            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >×</motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* إضافة — للمضيف فقط */}
            {isHost && (
              <div style={{
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 12, padding: 14,
              }}>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 10 }}>
                  إضافة قسم
                </div>

                {/* نوع */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[{ id: 'punishment', label: '🚫 عقوبة' }, { id: 'luck', label: '🍀 حظ' }].map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setAddType(t.id); setLocalError(''); }}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                        background: addType === t.id ? (t.id === 'punishment' ? '#EF4444' : '#7C3AED') : 'rgba(255,255,255,0.07)',
                        color: '#fff', fontFamily: 'var(--font-head)', fontSize: 13, cursor: 'pointer',
                      }}
                    >{t.label}</button>
                  ))}
                </div>

                {addType === 'punishment' ? (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                      {PRESETS.map(p => (
                        <button
                          key={p}
                          onClick={() => { setAddText(p); setLocalError(''); }}
                          style={{
                            background: addText === p ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${addText === p ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 20, padding: '3px 9px', cursor: 'pointer',
                            color: '#CBD5E1', fontSize: 11,
                          }}
                        >{p}</button>
                      ))}
                    </div>
                    <input
                      value={addText}
                      onChange={e => { setAddText(e.target.value); setLocalError(''); }}
                      onKeyDown={e => e.key === 'Enter' && addSegment()}
                      placeholder="أو اكتب عقوبة خاصة…"
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${localError ? '#EF4444' : 'rgba(239,68,68,0.3)'}`,
                        borderRadius: 8, padding: '9px 12px', color: '#E2E8F0', fontSize: 13,
                        fontFamily: 'var(--font-body)', textAlign: 'right', marginBottom: localError ? 4 : 10,
                        boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                    {localError && (
                      <div style={{ color: '#F43F5E', fontSize: 12, marginBottom: 8 }}>{localError}</div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[
                      { id: 'retry',   label: '🍀 حاول مرة أخرى',   color: '#7C3AED' },
                      { id: 'reverse', label: '🔄 تنقلب على الفائز', color: '#2563EB' },
                    ].map(l => (
                      <button
                        key={l.id}
                        onClick={() => setLuckType(l.id)}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                          background: luckType === l.id ? l.color : 'rgba(255,255,255,0.07)',
                          color: '#fff', fontSize: 13, cursor: 'pointer',
                        }}
                      >{l.label}</button>
                    ))}
                  </div>
                )}

                {/* الحجم */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#64748B', flexShrink: 0 }}>الاحتمالية:</span>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setAddSize(n)}
                      style={{
                        width: 34, height: 34, borderRadius: 6,
                        border: addSize === n ? '2px solid #A78BFA' : '1px solid rgba(255,255,255,0.1)',
                        background: addSize === n ? '#4C1D95' : 'rgba(255,255,255,0.05)',
                        color: addSize === n ? '#E9D5FF' : '#64748B',
                        fontFamily: 'var(--font-head)', fontSize: 14, cursor: 'pointer',
                      }}
                    >{n}</button>
                  ))}
                </div>

                <motion.button
                  whileHover={canAdd ? { scale: 1.02 } : {}}
                  whileTap={canAdd ? { scale: 0.97 } : {}}
                  onClick={addSegment}
                  style={{
                    width: '100%', padding: '11px',
                    background: canAdd ? 'linear-gradient(135deg, #7C3AED, #4C1D95)' : 'rgba(255,255,255,0.05)',
                    border: 'none', borderRadius: 8,
                    color: canAdd ? '#fff' : '#334155',
                    fontFamily: 'var(--font-head)', fontSize: 14, letterSpacing: 1,
                    cursor: canAdd ? 'pointer' : 'not-allowed',
                  }}
                >
                  + إضافة للعجلة
                </motion.button>
              </div>
            )}

            <button onClick={onClose} style={{
              width: '100%', padding: 11, marginTop: 12,
              background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 10, color: '#A78BFA', fontFamily: 'var(--font-head)',
              fontSize: 13, letterSpacing: 1, cursor: 'pointer',
            }}>
              حفظ وإغلاق
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}