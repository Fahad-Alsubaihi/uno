import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WARM = ['#EF4444','#F97316','#EC4899','#DC2626','#B45309','#EA580C','#DB2777','#991B1B'];
const COOL = ['#7C3AED','#2563EB','#0891B2','#4F46E5'];

const PRESETS = [
  'اشرب كوب ماء كامل','قلد صوت حيوان 10 ثواني','قول مدح لكل لاعب',
  'افعل 10 ضغط','غني مقطع','قل سراً محرجاً',
  'العب بيدك العكسية','تخطي دورك مرتين','اصنع وجهاً مضحكاً 30 ثانية',
  'تكلم بصوت أطفال حتى دورك','أخبر بأحرج موقف','افعل 5 قفزات',
];

let _localId = 100;
function newId() { return String(++_localId); }

function nextColor(segs, type) {
  const palette = type === 'punishment' ? WARM : COOL;
  const used = segs.filter(s => s.type === type).length;
  return palette[used % palette.length];
}

export function PunishmentSetup({ open, onClose, segments = [], isHost, game }) {
  const [addType, setAddType] = useState('punishment');
  const [addText, setAddText] = useState('');
  const [addSize, setAddSize] = useState(2);
  const [luckType, setLuckType] = useState('retry');

  function addSegment() {
    const text = addType === 'luck' ? luckType : addText.trim();
    if (!text) return;
    const seg = {
      id: newId(),
      type: addType,
      text,
      size: addSize,
      color: nextColor(segments, addType),
    };
    game.setSegments([...segments, seg]);
    setAddText('');
    setAddSize(2);
  }

  function removeSegment(id) {
    game.setSegments(segments.filter(s => s.id !== id));
  }

  function updateSize(id, size) {
    game.setSegments(segments.map(s => s.id === id ? { ...s, size } : s));
  }

  const totalWeight = segments.reduce((sum, s) => sum + s.size, 0);

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
              borderRadius: 20, padding: '24px 20px',
              width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto',
              direction: 'rtl',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: '#A78BFA', letterSpacing: 2 }}>
                بناء أقسام العجلة
              </h2>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            {/* Current segments */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#475569', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 10 }}>
                أقسام العجلة ({segments.length}) — الاحتمالية الكلية: {totalWeight}
              </div>
              <AnimatePresence>
                {segments.map((seg) => {
                  const pct = totalWeight > 0 ? Math.round((seg.size / totalWeight) * 100) : 0;
                  return (
                    <motion.div
                      key={seg.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'rgba(0,0,0,0.25)', borderRadius: 10,
                        padding: '10px 12px', marginBottom: 8,
                        border: `1px solid ${seg.color}40`,
                      }}
                    >
                      {/* Color swatch */}
                      <div style={{ width: 14, height: 40, borderRadius: 4, background: seg.color, flexShrink: 0 }} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#CBD5E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {seg.type === 'luck'
                              ? (seg.text === 'retry' ? '🍀 حاول مرة أخرى' : '🔄 تنقلب على الفائز')
                              : seg.text}
                          </span>
                          <span style={{
                            fontSize: 10, color: seg.color,
                            background: `${seg.color}20`, padding: '1px 6px', borderRadius: 20,
                            fontFamily: 'var(--font-head)', flexShrink: 0,
                          }}>
                            {seg.type === 'luck' ? 'حظ' : 'عقوبة'}
                          </span>
                        </div>
                        {/* Size bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isHost ? (
                            <input
                              type="range" min={1} max={5} value={seg.size}
                              onChange={e => updateSize(seg.id, Number(e.target.value))}
                              style={{ flex: 1, accentColor: seg.color, height: 4 }}
                            />
                          ) : (
                            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                              <div style={{ width: `${(seg.size / 5) * 100}%`, height: '100%', background: seg.color, borderRadius: 2 }} />
                            </div>
                          )}
                          <span style={{ fontSize: 11, color: '#64748B', flexShrink: 0 }}>{pct}%</span>
                          <span style={{ fontSize: 11, color: seg.color, flexShrink: 0 }}>{'★'.repeat(seg.size)}</span>
                        </div>
                      </div>

                      {/* Delete */}
                      {isHost && (
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => removeSegment(seg.id)}
                          style={{
                            background: 'rgba(244,63,94,0.15)', border: 'none', borderRadius: 6,
                            width: 26, height: 26, cursor: 'pointer', color: '#F43F5E',
                            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >×</motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Add new segment — host only */}
            {isHost && (
              <div style={{
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 12, padding: 16, marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 12 }}>
                  إضافة قسم جديد
                </div>

                {/* Type selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[
                    { id: 'punishment', label: '🚫 عقوبة' },
                    { id: 'luck',       label: '🍀 حظ' },
                  ].map(t => (
                    <motion.button
                      key={t.id}
                      whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setAddType(t.id)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                        background: addType === t.id ? (t.id === 'punishment' ? '#EF4444' : '#7C3AED') : 'rgba(255,255,255,0.06)',
                        color: '#fff', fontFamily: 'var(--font-head)', fontSize: 13, cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >{t.label}</motion.button>
                  ))}
                </div>

                {addType === 'punishment' ? (
                  <>
                    {/* Preset quick-picks */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {PRESETS.map(p => (
                        <motion.button
                          key={p}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setAddText(p)}
                          style={{
                            background: addText === p ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${addText === p ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                            color: '#CBD5E1', fontSize: 11, transition: 'all 0.15s',
                          }}
                        >{p}</motion.button>
                      ))}
                    </div>
                    <input
                      value={addText}
                      onChange={e => setAddText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSegment()}
                      placeholder="أو اكتب عقوبة خاصة…"
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                        padding: '8px 12px', color: '#E2E8F0', fontSize: 13,
                        fontFamily: 'var(--font-body)', textAlign: 'right', marginBottom: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[
                      { id: 'retry',   label: '🍀 حاول مرة أخرى', color: '#7C3AED' },
                      { id: 'reverse', label: '🔄 تنقلب على الفائز', color: '#2563EB' },
                    ].map(l => (
                      <motion.button
                        key={l.id}
                        whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setLuckType(l.id)}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                          background: luckType === l.id ? l.color : 'rgba(255,255,255,0.06)',
                          color: '#fff', fontSize: 13, cursor: 'pointer', transition: 'background 0.2s',
                        }}
                      >{l.label}</motion.button>
                    ))}
                  </div>
                )}

                {/* Size selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: '#64748B', flexShrink: 0 }}>الحجم:</span>
                  {[1, 2, 3, 4, 5].map(n => (
                    <motion.button
                      key={n}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setAddSize(n)}
                      style={{
                        width: 32, height: 32, borderRadius: 6, border: 'none',
                        background: addSize === n ? '#7C3AED' : 'rgba(255,255,255,0.08)',
                        color: '#fff', fontFamily: 'var(--font-head)', fontSize: 12,
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                    >{'★'.repeat(n)}</motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={addSegment}
                  disabled={addType === 'punishment' && !addText.trim()}
                  style={{
                    width: '100%', padding: '10px',
                    background: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
                    border: 'none', borderRadius: 8, color: '#fff',
                    fontFamily: 'var(--font-head)', fontSize: 13, letterSpacing: 1, cursor: 'pointer',
                    opacity: addType === 'punishment' && !addText.trim() ? 0.4 : 1,
                  }}
                >
                  + إضافة للعجلة
                </motion.button>
              </div>
            )}

            <button onClick={onClose} style={{
              width: '100%', padding: 12, background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10,
              color: '#A78BFA', fontFamily: 'var(--font-head)', fontSize: 13,
              letterSpacing: 1, cursor: 'pointer',
            }}>
              حفظ وإغلاق
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
