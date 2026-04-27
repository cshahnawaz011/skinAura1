import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle } from 'lucide-react';

const CYCLING_NIGHTS = [
  {
    night: 1,
    label: 'Exfoliation Night',
    emoji: '🧪',
    color: '#f472b6',
    focus: 'BHA Exfoliation',
    products: ['0.5-2% Salicylic Acid (BHA)', 'Optional: Low % Azelaic Acid'],
    steps: [
      'Gentle cleanser',
      'Wait 1-2 min to fully dry',
      'Apply BHA serum',
      'Wait 5-10 min',
      'Optional: Azelaic acid if tolerated',
      'Wait 5 min',
      'Lightweight hydrating toner',
      'Barrier repair serum (peptides)',
      'Moisturizer',
    ],
    caution: 'Never follow with retinoid same night. Never combine with AHA.',
    waitTimes: '5-10 min before next layer',
  },
  {
    night: 2,
    label: 'Retinoid Night',
    emoji: '⚡',
    color: '#a78bfa',
    focus: 'Retinoid Treatment',
    products: [
      'Retinol (0.1% to 1%)',
      'OR Retinal (0.01% to 0.1%)',
      'OR Retinyl Palmitate (lower strength)',
    ],
    steps: [
      'Gentle cleanser',
      'Completely dry face (2-3 min)',
      'Apply hydrating toner first (buffer)',
      'Retinoid serum or cream',
      'Wait 15-20 min before next step',
      'Occlusive moisturizer',
      'Optional: Facial oil lock-in',
    ],
    caution: 'Start 1-2x per week. Increase frequency slowly. Never use with BHA same night.',
    waitTimes: '15-20 min before moisturizer',
  },
  {
    night: 3,
    label: 'Barrier Repair Night',
    emoji: '🛡️',
    color: '#10b981',
    focus: 'Ceramides & Peptides',
    products: [
      'Niacinamide (2-10%)',
      'Peptides (0.1-1.5%, including copper peptides)',
      'Ceramides NP, AP, EOP (3-5%)',
      'Centella Asiatica 5-10%',
      'Panthenol (Pro-vitamin B5)',
    ],
    steps: [
      'Gentle cleanser',
      'Hydrating toner',
      'Niacinamide serum',
      'Peptide serum',
      'Ceramide-rich moisturizer',
      'Heavier occlusive if dehydrated',
      'Facial oil (optional)',
    ],
    caution: 'Perfect recovery night after exfoliation or retinoid nights. Can use daily if needed.',
    waitTimes: '2-3 min between light layers',
  },
  {
    night: 4,
    label: 'Hydration & Protection Night',
    emoji: '💧',
    color: '#38bdf8',
    focus: 'Hyaluronic Acid & Antioxidants',
    products: [
      'Multi-weight Hyaluronic Acid (0.5-2%+)',
      'Tranexamic Acid (2-5%)',
      'Alpha Arbutin (1-2%)',
      'Squalane or Ceramide Oil',
      'Panthenol',
    ],
    steps: [
      'Gentle cleanser',
      'Lightly dampen face',
      'Hyaluronic acid serum on damp skin',
      'Tranexamic acid serum',
      'Hydrating essence or toner',
      'Rich moisturizer',
      'Squalane or ceramide oil seal',
    ],
    caution: 'Apply HA to damp skin for maximum absorption. Great prep night before actives.',
    waitTimes: '1-2 min between layers',
  },
];

const MORNING_ROUTINE = [
  { step: 1, action: 'Gentle cleanser or water only', time: 'N/A', note: 'If oily, use low-pH gentle cleanser' },
  { step: 2, action: 'Pat dry completely', time: 'N/A', note: 'Important for next step' },
  { step: 3, action: 'Vitamin C (L-Ascorbic Acid 5-20%)', time: 'Wait 5 min', note: 'Must be <pH 3.5. Morning only—unstable at night.' },
  { step: 4, action: 'Hydrating essence or toner', time: 'Wait 2 min', note: 'Optional but recommended' },
  { step: 5, action: 'Niacinamide serum (4-5%)', time: '1 min', note: 'Pairs well with Vitamin C' },
  { step: 6, action: 'Hyaluronic acid serum (if needed)', time: '1 min', note: 'On damp skin' },
  { step: 7, action: 'Moisturizer with Ceramides', time: '2 min', note: 'Daily essential' },
  { step: 8, action: 'SPF 50+ PA++++ sunscreen', time: 'Final step', note: 'Zinc oxide or modern filters. Reapply every 2 hours if outdoors.' },
];

export default function SkinCyclingProtocol() {
  const [expandedNight, setExpandedNight] = useState(null);

  return (
    <div className="space-y-4">
      {/* Morning Routine */}
      <div className="rounded-2xl overflow-hidden border border-amber-200 bg-amber-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-100">
          <span className="text-2xl">☀️</span>
          <div>
            <p className="font-black text-sm text-amber-900">Fixed Morning Routine (Daily)</p>
            <p className="text-[10px] text-amber-700">Same every day. Non-negotiable antioxidant protection.</p>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {MORNING_ROUTINE.map((item, i) => (
            <div key={i} className="flex items-start gap-3 pb-2 border-b border-amber-100 last:border-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 bg-amber-400">
                {item.step}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{item.action}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.note}</p>
                <p className="text-[9px] text-amber-600 font-semibold mt-1">⏱ {item.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 text-[10px] text-amber-700 space-y-1">
          <p>
            <strong>Critical:</strong> Vitamin C efficacy depends on pH &lt;3.5 and consistent AM application. This is your antioxidant anchor.
          </p>
          <p>
            <strong>SPF is non-negotiable</strong> when using any active ingredients. Omitting SPF can increase photodamage and hyperpigmentation.
          </p>
        </div>
      </div>

      {/* 4-Night Cycling */}
      <div className="mb-3">
        <h4 className="font-black text-sm text-gray-800 mb-2">🌙 4-Night Cycling (Repeat Weekly)</h4>
        <p className="text-xs text-gray-500 mb-3">
          After Phase 1 (Sensitization), rotate through these 4 nights. Each serves a distinct purpose.
        </p>
      </div>

      {CYCLING_NIGHTS.map((night) => (
        <motion.div key={night.night} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className="rounded-2xl overflow-hidden cursor-pointer transition-all"
            style={{
              background: `${night.color}08`,
              border: `1.5px solid ${night.color}30`,
              boxShadow: expandedNight === night.night ? `0 8px 24px ${night.color}22` : 'none',
            }}
            onClick={() => setExpandedNight(expandedNight === night.night ? null : night.night)}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 hover:bg-white/20 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{night.emoji}</span>
                <div className="min-w-0">
                  <p className="font-black text-sm" style={{ color: night.color }}>
                    Night {night.night}: {night.label}
                  </p>
                  <p className="text-[10px] text-gray-500">{night.focus}</p>
                </div>
              </div>
              <motion.div animate={{ rotate: expandedNight === night.night ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4" style={{ color: night.color }} />
              </motion.div>
            </div>

            {/* Expanded */}
            <AnimatePresence initial={false}>
              {expandedNight === night.night && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t"
                  style={{ borderColor: `${night.color}30` }}
                >
                  <div className="p-4 space-y-3">
                    {/* Products */}
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Key Products</p>
                      <div className="space-y-1">
                        {night.products.map((prod, i) => (
                          <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: night.color }} />
                            {prod}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Steps */}
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Application Steps</p>
                      <ol className="space-y-1.5">
                        {night.steps.map((step, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-700">
                            <span className="font-bold flex-shrink-0">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Wait times */}
                    <div className="p-2.5 rounded-lg bg-white/50">
                      <p className="text-[10px] font-black text-gray-600 uppercase mb-1">⏱ Wait Times</p>
                      <p className="text-xs text-gray-700">{night.waitTimes}</p>
                    </div>

                    {/* Caution */}
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-600" />
                      <p className="text-xs text-red-700">{night.caution}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}

      {/* Cycling schedule */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Weekly Cycling Schedule</p>
        <div className="grid grid-cols-4 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu'].map((day, i) => (
            <div key={day} className="text-center p-2 rounded-lg bg-white border-2" style={{ borderColor: CYCLING_NIGHTS[i].color }}>
              <p className="text-[10px] font-bold text-gray-600">{day}</p>
              <p className="text-[9px] font-black" style={{ color: CYCLING_NIGHTS[i].color }}>
                Night {i + 1}
              </p>
              <p className="text-[8px] text-gray-500 mt-0.5">{CYCLING_NIGHTS[i].label.split(' ')[0]}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-blue-700 mt-3">
          <strong>Fri-Sun:</strong> Repeat cycle. Days 5-7 can be barrier repair (Night 3) or rest days for very sensitive skin.
        </p>
      </div>
    </div>
  );
}