import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { INGREDIENT_REGISTRY } from '@/lib/adaptiveRoutineEngine';

const CONCERN_MAP = {
  acne_level:   { label: 'Acne',         emoji: '🔴', color: '#ef4444', active: 'salicylic' },
  dark_spots:   { label: 'Dark Spots',   emoji: '🎯', color: '#f97316', active: 'azelaic' },
  dryness:      { label: 'Dryness',      emoji: '🌵', color: '#38bdf8', active: 'ceramides' },
  sensitivity:  { label: 'Sensitivity',  emoji: '⚡', color: '#fb923c', active: 'ceramides' },
  redness:      { label: 'Redness',      emoji: '🌹', color: '#f43f5e', active: 'niacinamide' },
  oiliness:     { label: 'Oiliness',     emoji: '💦', color: '#a78bfa', active: 'salicylic' },
  wrinkles:     { label: 'Fine Lines',   emoji: '⏳', color: '#8b5cf6', active: 'retinol' },
  pores:        { label: 'Pores',        emoji: '🔍', color: '#6366f1', active: 'salicylic' },
};

export default function SkinConcernsSummary({ analysis, modules, generatedDate }) {
  if (!analysis) return null;

  const concerns = Object.entries(CONCERN_MAP)
    .map(([key, cfg]) => ({ ...cfg, key, value: analysis[key] || 0 }))
    .filter(c => c.value >= 3)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.06),rgba(167,139,250,0.06))', border: '1px solid rgba(244,114,182,0.15)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-black text-sm text-gray-800">🔬 Routine Generated From Your Scan</p>
          {generatedDate && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Generated: {format(new Date(generatedDate), 'MMM d, yyyy')} · {analysis.skin_type}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: '#f472b6' }}>{analysis.overall_score || '—'}</p>
          <p className="text-[9px] text-gray-400">Skin Score</p>
        </div>
      </div>

      {/* Concerns */}
      {concerns.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Detected Concerns → Module Assignments</p>
          <div className="space-y-1.5">
            {concerns.map((c, i) => {
              const ingredient = INGREDIENT_REGISTRY[c.active];
              const barWidth = (c.value / 10) * 100;
              return (
                <motion.div key={c.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white/60">
                  <span className="text-base flex-shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-black text-gray-700">{c.label}</span>
                      <span className="text-[10px] font-black" style={{ color: c.color }}>{c.value}/10</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-full">
                      <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: c.color }} />
                    </div>
                  </div>
                  {ingredient && (
                    <div className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap" style={{ background: `${c.color}15`, color: c.color }}>
                      → {ingredient.name} {ingredient.conc}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modules assigned */}
      {modules?.actives?.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-white/50">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Active Modules Enabled</p>
          <div className="flex flex-wrap gap-1.5">
            {[...(modules.support || []), ...(modules.actives || [])].map(key => {
              const ing = INGREDIENT_REGISTRY[key];
              if (!ing) return null;
              return (
                <span key={key} className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-gray-700 border border-gray-200">
                  {ing.name} <span className="text-pink-500">{ing.conc}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}