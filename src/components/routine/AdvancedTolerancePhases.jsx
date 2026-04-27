import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertCircle, Check } from 'lucide-react';

const PHASES = [
  {
    id: 1,
    name: 'Sensitization',
    duration: 'Weeks 1-4',
    emoji: '🌱',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.3)',
    description: 'Build baseline tolerance with minimal concentrations.',
    frequency: '1-2x weekly',
    night_routine: 'Gentle rotation, single active max',
    ingredients: [
      { name: 'Salicylic Acid (BHA)', range: '0.5%', frequency: '1x/week' },
      { name: 'Retinol', range: '0.1%', frequency: '1x/week' },
      { name: 'Hyaluronic Acid', range: '0.5%', frequency: 'daily' },
      { name: 'Niacinamide', range: '2%', frequency: 'daily' },
      { name: 'Ceramides', range: '3-5%', frequency: 'daily' },
    ],
    safety: ['Patch test 3 days inner arm', 'Start with single product', 'Monitor for irritation'],
  },
  {
    id: 2,
    name: 'Build-up',
    duration: 'Weeks 5-8',
    emoji: '📈',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
    description: 'Moderate concentrations with increased frequency.',
    frequency: '2-3x weekly',
    night_routine: 'Introduce 4-night cycling protocol',
    ingredients: [
      { name: 'Salicylic Acid (BHA)', range: '1%', frequency: '2x/week' },
      { name: 'L-Ascorbic Acid Vitamin C', range: '5%', frequency: 'morning only' },
      { name: 'Retinol', range: '0.25-0.5%', frequency: '2x/week' },
      { name: 'Azelaic Acid', range: '5%', frequency: '2x/week' },
      { name: 'Niacinamide', range: '4-5%', frequency: 'daily' },
    ],
    safety: ['Space actives by 2 days', 'Never combine acids+retinoids same night', 'Wait 20 min between layers'],
  },
  {
    id: 3,
    name: 'Optimization',
    duration: 'Weeks 9-16',
    emoji: '⚡',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.3)',
    description: 'Higher concentrations, optimized layering.',
    frequency: '3-5x weekly',
    night_routine: 'Full 4-night cycling with multiple actives',
    ingredients: [
      { name: 'Salicylic Acid (BHA)', range: '1.5-2%', frequency: '2-3x/week' },
      { name: 'L-Ascorbic Acid Vitamin C', range: '10-15%', frequency: 'morning daily' },
      { name: 'Retinol or Retinal', range: '0.5-0.75%', frequency: '3x/week' },
      { name: 'Azelaic Acid', range: '10-15%', frequency: '3x/week' },
      { name: 'Tranexamic Acid', range: '2-3%', frequency: 'daily' },
      { name: 'Peptides + Copper Peptides', range: '0.5-1%', frequency: 'night cycling' },
    ],
    safety: ['Monthly skin check', 'Full barrier week every 4-6 weeks', 'Strict patch test for new products'],
  },
  {
    id: 4,
    name: 'Advanced Maintenance',
    duration: '4+ months',
    emoji: '🏆',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.3)',
    description: 'Maximum safe concentrations with skin cycling.',
    frequency: 'Daily + 4-night rotation',
    night_routine: 'Advanced skin cycling with premium actives',
    ingredients: [
      { name: 'Salicylic Acid (BHA)', range: '2%', frequency: 'per cycling' },
      { name: 'L-Ascorbic Acid Vitamin C', range: '15-20%', frequency: 'daily AM' },
      { name: 'Retinoids', range: 'Retinol 0.75-1% or Retinal 0.05-0.1%', frequency: 'per cycling' },
      { name: 'Azelaic Acid', range: '15-20%', frequency: 'per cycling' },
      { name: 'Tranexamic Acid', range: '3-5%', frequency: 'daily' },
      { name: 'Alpha Arbutin', range: '2%', frequency: 'AM daily' },
    ],
    safety: ['Continuous monitoring', 'Seasonal adjustments', 'Hormonal cycle tracking'],
  },
];

export default function AdvancedTolerancePhases() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h3 className="font-black text-sm text-gray-800 mb-1">🚀 4-Phase Tolerance Progression</h3>
        <p className="text-xs text-gray-500">Build advanced skincare safely over 4+ months</p>
      </div>

      {PHASES.map((phase) => (
        <motion.div key={phase.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className="rounded-2xl overflow-hidden cursor-pointer transition-all"
            style={{
              background: phase.bg,
              border: `1.5px solid ${phase.border}`,
              boxShadow: expanded === phase.id ? `0 8px 24px ${phase.color}22` : 'none',
            }}
            onClick={() => setExpanded(expanded === phase.id ? null : phase.id)}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 hover:bg-white/30 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{phase.emoji}</span>
                <div className="min-w-0">
                  <p className="font-black text-sm" style={{ color: phase.color }}>
                    {phase.name}
                  </p>
                  <p className="text-[10px] text-gray-500">{phase.duration} • {phase.frequency}</p>
                </div>
              </div>
              <motion.div animate={{ rotate: expanded === phase.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                {expanded === phase.id ? (
                  <ChevronUp className="w-4 h-4" style={{ color: phase.color }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: phase.color }} />
                )}
              </motion.div>
            </div>

            {/* Expanded content */}
            <AnimatePresence initial={false}>
              {expanded === phase.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t"
                  style={{ borderColor: phase.border }}
                >
                  <div className="p-4 space-y-3">
                    {/* Description */}
                    <p className="text-sm text-gray-700">{phase.description}</p>

                    {/* Night routine */}
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)' }}>
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Night Routine</p>
                      <p className="text-sm text-gray-700">{phase.night_routine}</p>
                    </div>

                    {/* Ingredients table */}
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Ingredients & Concentrations</p>
                      <div className="space-y-1.5">
                        {phase.ingredients.map((ing, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/50">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800">{ing.name}</p>
                              <p className="text-[10px] text-gray-400">{ing.frequency}</p>
                            </div>
                            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white border"
                              style={{ borderColor: phase.border, color: phase.color }}>
                              {ing.range}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Safety notes */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-gray-500 uppercase">Safety Checks</p>
                      {phase.safety.map((note, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: phase.color }} />
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}

      {/* Phase progression note */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Progress only when ready:</strong> Stay in each phase for minimum duration. Never skip phases. Repeat current phase if irritation occurs, then progress.
        </p>
      </div>
    </div>
  );
}