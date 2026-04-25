import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info, Zap, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PARAMETER_GROUPS = [
  {
    id: 'skin_type', label: 'Skin Type', emoji: '🧬', color: '#f472b6',
    params: [
      { key: 'oiliness', label: 'Oiliness', desc: 'Sebum overproduction signal', invert: true },
      { key: 'dryness', label: 'Dryness', desc: 'Moisture deficit signal', invert: true },
      { key: 'sensitivity', label: 'Sensitivity', desc: 'Barrier reactivity signal', invert: true },
    ],
    extras: [
      { label: 'Combination Signals', key: 'combo_signal', derive: a => Math.abs((a.oiliness||0) - (a.dryness||0)) > 3 ? Math.min(10,((a.oiliness||0)+(a.dryness||0))/2*1.1) : (((a.oiliness||0)+(a.dryness||0))/2) },
    ]
  },
  {
    id: 'barrier', label: 'Barrier Condition', emoji: '🛡️', color: '#f43f5e',
    params: [
      { key: 'sensitivity', label: 'Irritation Risk', desc: 'Barrier reactivity level', invert: true },
      { key: 'redness', label: 'Redness Signal', desc: 'Vascular inflammation indicator', invert: true },
    ],
    extras: [
      { label: 'Barrier Stability', key: 'barrier_stability', derive: a => Math.max(0, 10 - ((a.sensitivity||0)*0.5 + (a.dryness||0)*0.3 + (a.redness||0)*0.2)) },
    ]
  },
  {
    id: 'acne', label: 'Acne & Congestion', emoji: '🔴', color: '#ef4444',
    params: [
      { key: 'acne_level', label: 'Active Acne', desc: 'Inflammatory lesion count signal', invert: true },
      { key: 'pores', label: 'Congestion', desc: 'Pore blockage & blackhead signal', invert: true },
      { key: 'oiliness', label: 'Breakout Risk', desc: 'Sebum × congestion combined', invert: true },
    ],
    extras: [
      { label: 'Acne Severity Index', key: 'acne_severity', derive: a => Math.min(10, ((a.acne_level||0)*0.6 + (a.pores||0)*0.25 + (a.oiliness||0)*0.15)) },
    ]
  },
  {
    id: 'texture', label: 'Texture & Pores', emoji: '🔍', color: '#38bdf8',
    params: [
      { key: 'pores', label: 'Pore Appearance', desc: 'Visible pore size signal', invert: true },
    ],
    extras: [
      { label: 'Roughness Index', key: 'roughness', derive: a => Math.min(10, ((a.pores||0)*0.6 + (a.dryness||0)*0.2 + (a.acne_level||0)*0.2)) },
      { label: 'Smoothness Score', key: 'smoothness', derive: a => Math.max(0, 10 - ((a.pores||0)*0.5 + (a.acne_level||0)*0.3 + (a.dryness||0)*0.2)) },
    ]
  },
  {
    id: 'pigmentation', label: 'Pigmentation', emoji: '🎯', color: '#f97316',
    params: [
      { key: 'dark_spots', label: 'Dark Spots', desc: 'Hyperpigmentation signal', invert: true },
      { key: 'redness', label: 'Uneven Tone', desc: 'Redness & tone irregularity', invert: true },
    ],
    extras: [
      { label: 'Post-Blemish Marks', key: 'pih', derive: a => Math.min(10, ((a.dark_spots||0)*0.6 + (a.acne_level||0)*0.4)) },
      { label: 'Pigmentation Risk', key: 'pig_risk', derive: a => Math.min(10, ((a.dark_spots||0)*0.5 + (a.redness||0)*0.5)) },
    ]
  },
  {
    id: 'hydration', label: 'Hydration', emoji: '💧', color: '#34d399',
    params: [
      { key: 'dryness', label: 'Dehydration', desc: 'Transepidermal water loss indicator', invert: true },
    ],
    extras: [
      { label: 'Moisture Support', key: 'moisture', derive: a => Math.max(0, 10 - (a.dryness||0)) },
      { label: 'Hydration Score', key: 'hydration_score', derive: a => Math.max(0, 10 - (a.dryness||0)*1.1 + (a.sensitivity||0)*0.1) },
    ]
  },
];

function getLevel(val, invert = false) {
  const v = invert ? val : val; // concern values are high = bad
  if (invert) {
    if (v <= 2) return { label: 'Optimal', color: '#34d399', bg: 'rgba(52,211,153,0.1)' };
    if (v <= 4) return { label: 'Mild', color: '#a3e635', bg: 'rgba(163,230,53,0.1)' };
    if (v <= 6) return { label: 'Moderate', color: '#facc15', bg: 'rgba(250,204,21,0.1)' };
    if (v <= 8) return { label: 'Elevated', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' };
    return { label: 'Severe', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  } else {
    if (v >= 8) return { label: 'Optimal', color: '#34d399', bg: 'rgba(52,211,153,0.1)' };
    if (v >= 6) return { label: 'Good', color: '#a3e635', bg: 'rgba(163,230,53,0.1)' };
    if (v >= 4) return { label: 'Moderate', color: '#facc15', bg: 'rgba(250,204,21,0.1)' };
    return { label: 'Low', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  }
}

function MiniBar({ value, color, max = 10 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
      <motion.div className="h-full rounded-full" style={{ background: color }}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
    </div>
  );
}

export default function SkinParameterGrid({ analysis, insights }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-3">
      {PARAMETER_GROUPS.map(group => {
        const isOpen = expanded === group.id;
        const avgScore = group.params.reduce((acc, p) => acc + (analysis[p.key] || 0), 0) / group.params.length;

        return (
          <div key={group.id} className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.92)', border: `1.5px solid ${isOpen ? group.color : 'rgba(0,0,0,0.07)'}`, backdropFilter: 'blur(16px)' }}>

            <button className="w-full flex items-center gap-3 px-4 py-3.5" onClick={() => setExpanded(isOpen ? null : group.id)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${group.color}18` }}>{group.emoji}</div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="font-black text-sm text-gray-800">{group.label}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black" style={{ color: group.color }}>{avgScore.toFixed(1)}/10</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                <MiniBar value={avgScore} color={group.color} />
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">

                    {/* Primary params from analysis */}
                    <div className="space-y-2">
                      {group.params.map(param => {
                        const val = analysis[param.key] || 0;
                        const lvl = getLevel(val, param.invert !== false);
                        const pct = (val / 10) * 100;
                        return (
                          <div key={param.key} className="p-3 rounded-xl" style={{ background: lvl.bg }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div>
                                <p className="text-xs font-black text-gray-800">{param.label}</p>
                                <p className="text-[10px] text-gray-400">{param.desc}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: lvl.color }} />
                                <span className="text-[10px] font-black" style={{ color: lvl.color }}>{lvl.label}</span>
                                <span className="text-sm font-black text-gray-800">{val}<span className="text-[10px] text-gray-400 font-normal">/10</span></span>
                              </div>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                              <motion.div className="h-full rounded-full" style={{ background: lvl.color }}
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Derived extras */}
                    {group.extras?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Derived Signals</p>
                        <div className="grid grid-cols-2 gap-2">
                          {group.extras.map(extra => {
                            const val = Math.max(0, Math.min(10, extra.derive(analysis)));
                            const lvl = getLevel(val, false);
                            return (
                              <div key={extra.key} className="p-2.5 rounded-xl" style={{ background: `${group.color}09`, border: `1px solid ${group.color}22` }}>
                                <p className="text-[10px] font-bold text-gray-600 mb-1">{extra.label}</p>
                                <p className="text-lg font-black" style={{ color: group.color }}>{val.toFixed(1)}<span className="text-[10px] text-gray-400 font-normal">/10</span></p>
                                <div className="w-full h-1 rounded-full mt-1" style={{ background: 'rgba(0,0,0,0.07)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${(val/10)*100}%`, background: group.color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Insight from AI */}
                    {insights?.[group.params[0]?.key] && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: `${group.color}09` }}>
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: group.color }} />
                        <div>
                          <p className="text-[10px] font-black mb-0.5" style={{ color: group.color }}>AI Root Cause</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{insights[group.params[0].key]?.cause}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}