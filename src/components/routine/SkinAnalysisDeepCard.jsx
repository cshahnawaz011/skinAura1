import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Microscope, ChevronDown, ChevronUp } from 'lucide-react';

const CONCERN_INSIGHTS = {
  acne_level:   { label: 'Active Acne',    emoji: '🔴', root: 'Excess sebum + bacterial proliferation (C. acnes)', fix: 'Apply BHA (Salicylic acid 2%) on treatment nights', ingredient: 'Salicylic Acid', timeline: '4–6 weeks' },
  dark_spots:   { label: 'Dark Spots',     emoji: '🎯', root: 'Post-inflammatory hyperpigmentation + UV damage',      fix: 'Use Vitamin C AM + Niacinamide PM consistently',   ingredient: 'Niacinamide',    timeline: '8–12 weeks' },
  dryness:      { label: 'Dryness',        emoji: '🏜️', root: 'Compromised moisture barrier + low ceramide levels',   fix: 'Double moisturize: serum + cream every night',      ingredient: 'Hyaluronic Acid',timeline: '1–2 weeks' },
  oiliness:     { label: 'Oiliness',       emoji: '💦', root: 'Overactive sebaceous glands, often from dehydration', fix: 'Use niacinamide + lightweight gel moisturizer',      ingredient: 'Niacinamide',    timeline: '3–4 weeks' },
  sensitivity:  { label: 'Sensitivity',    emoji: '⚡', root: 'Weakened skin barrier + reactive immune response',     fix: 'Fragrance-free + ceramide-rich products only',       ingredient: 'Ceramides',      timeline: '2–4 weeks' },
  redness:      { label: 'Redness',        emoji: '🌹', root: 'Vascular inflammation + barrier disruption',          fix: 'Centella asiatica + green tea + avoid heat triggers',ingredient: 'Centella',       timeline: '3–5 weeks' },
  wrinkles:     { label: 'Fine Lines',     emoji: '⏳', root: 'Collagen degradation + repeated muscle movements',    fix: 'Add retinol on treatment nights at Level 1',         ingredient: 'Retinol',        timeline: '12–16 weeks' },
  pores:        { label: 'Enlarged Pores', emoji: '🔍', root: 'Excess sebum + loss of skin elasticity around pores', fix: 'BHA exfoliation 2x/week + niacinamide daily',       ingredient: 'Salicylic Acid', timeline: '6–8 weeks' },
};

function getTopConcern(analysis) {
  if (!analysis) return null;
  const metrics = Object.keys(CONCERN_INSIGHTS).map(k => ({ key: k, val: analysis[k] || 0 }));
  return metrics.sort((a, b) => b.val - a.val)[0];
}

export default function SkinAnalysisDeepCard({ analysis }) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(null);

  const topConcern = getTopConcern(analysis);
  const focusKey = selected || topConcern?.key;
  const insight = focusKey ? CONCERN_INSIGHTS[focusKey] : null;
  const focusVal = focusKey && analysis ? analysis[focusKey] || 0 : 0;

  return (
    <div className="rounded-2xl border-2 border-sky-200 overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-50">
            <Microscope className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Skin Analysis Deep Dive</p>
            <p className="text-[10px] text-gray-400">Monday focus · Week 12 analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {topConcern && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 capitalize">
              {CONCERN_INSIGHTS[topConcern.key]?.emoji} {topConcern.key.replace('_', ' ')}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">

              {!analysis ? (
                <p className="text-xs text-gray-400 text-center py-3">Run a skin analysis to unlock this section</p>
              ) : (
                <>
                  {/* Concern selector chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(CONCERN_INSIGHTS).map(([k, v]) => {
                      const val = analysis[k] || 0;
                      if (val < 2) return null;
                      return (
                        <button key={k} onClick={() => setSelected(k === selected ? null : k)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            focusKey === k ? 'bg-sky-600 text-white border-sky-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-sky-300'
                          }`}>
                          {v.emoji} {v.label} <span className="opacity-70">({val}/10)</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detail sub-cards */}
                  {insight && (
                    <motion.div key={focusKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Deep Concern */}
                        <div className="rounded-xl p-3 bg-red-50 border border-red-100">
                          <p className="text-[10px] font-black text-gray-500 mb-1">Deep Concern</p>
                          <p className="text-lg">{insight.emoji}</p>
                          <p className="text-xs font-black text-red-700 mt-0.5">{insight.label}</p>
                          <div className="w-full h-1.5 rounded-full bg-red-200 mt-1.5">
                            <div className="h-full rounded-full bg-red-500" style={{ width: `${(focusVal / 10) * 100}%` }} />
                          </div>
                          <p className="text-[9px] text-red-400 mt-0.5">{focusVal}/10 severity</p>
                        </div>

                        {/* Key Ingredient */}
                        <div className="rounded-xl p-3 bg-violet-50 border border-violet-100">
                          <p className="text-[10px] font-black text-gray-500 mb-1">Key Ingredient</p>
                          <p className="text-xs font-black text-violet-700 mt-1">{insight.ingredient}</p>
                          <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                            ⏱ {insight.timeline}
                          </p>
                          <p className="text-[9px] text-gray-400">Expected timeline</p>
                        </div>
                      </div>

                      {/* Root Cause */}
                      <div className="rounded-xl p-3 bg-amber-50 border border-amber-100 flex items-start gap-2">
                        <span className="text-base flex-shrink-0">🔬</span>
                        <div>
                          <p className="text-[10px] font-black text-amber-700 mb-0.5">Root Cause</p>
                          <p className="text-xs text-gray-700">{insight.root}</p>
                        </div>
                      </div>

                      {/* Quick Fix */}
                      <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                        <span className="text-base flex-shrink-0">⚡</span>
                        <div>
                          <p className="text-[10px] font-black text-emerald-700 mb-0.5">Quick Fix</p>
                          <p className="text-xs text-gray-700">{insight.fix}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}