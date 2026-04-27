import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

const PROGRESSION_PHASES = [
  {
    phase: 1,
    weeks: '1–2',
    label: 'Foundation & Patch Testing',
    emoji: '🧪',
    color: '#3b82f6',
    goals: [
      'Establish consistent AM/PM routine with basics (cleanse, hydrate, moisturize, SPF)',
      'Introduce ONE active ingredient (e.g., retinol) at lowest concentration',
      'Patch test on small area (jawline, behind ear) to check tolerance',
      'Track skin reactions daily (redness, dryness, irritation)',
    ],
    frequency: '1–2 nights/week of treatment active',
    expectedChanges: 'Slight dryness possible; skin gets acclimated',
    warnings: ['Expect some dryness or mild flaking', 'Avoid other actives during patch test', 'Do NOT increase frequency yet'],
  },
  {
    phase: 2,
    weeks: '3–4',
    label: 'Gradual Frequency Increase',
    emoji: '📈',
    color: '#f59e0b',
    goals: [
      'If no irritation after 2 weeks, increase treatment frequency to 2–3 nights/week',
      'Maintain same concentration; do NOT jump to higher strength yet',
      'Observe cumulative effects (improved texture, slight brightness)',
      'Recovery nights remain hydration-focused only',
    ],
    frequency: '2–3 nights/week of treatment active',
    expectedChanges: 'Smoother texture, possible light exfoliation, improved radiance',
    warnings: ['Still early for concentration increase', 'If irritation appears, drop back to 1x/week', 'Consistent sunscreen is non-negotiable'],
  },
  {
    phase: 3,
    weeks: '5–8',
    label: 'Stabilization & Tolerance Building',
    emoji: '🛡️',
    color: '#10b981',
    goals: [
      'Increase to 3–4 nights/week if skin remains healthy (no persistent redness/irritation)',
      'Consider alternating nights (every other night) if well-tolerated',
      'Evaluate concentration: ready to upgrade to higher %, or stay at current?',
      'Monitor long-term results: improved firmness, clarity, radiance',
    ],
    frequency: '3–4 nights/week OR alternate nights if very tolerant',
    expectedChanges: 'Visible improvement in texture, pore appearance, fine lines beginning to soften',
    warnings: ['Do NOT exceed 4 nights/week of actives without professional guidance', 'Always maintain 2–3 recovery nights/week', 'Barrier must stay healthy'],
  },
  {
    phase: 4,
    weeks: '8+',
    label: 'Long-Term Maintenance & Optimization',
    emoji: '⭐',
    color: '#8b5cf6',
    goals: [
      'Establish sustainable routine: 3–5 treatment nights + 2–4 recovery nights per week',
      'Optional: Upgrade to higher concentration if skin is resilient',
      'Introduce complementary actives (e.g., vitamin C in AM, retinoid in PM)',
      'Track monthly progress with photos to validate effectiveness',
      'Seasonal adjustments (heavier moisturizers in winter, lighter in summer)',
    ],
    frequency: '3–5 nights/week treatment + strategic recovery nights',
    expectedChanges: 'Sustained clarity, firmness, hydration, radiant skin tone',
    warnings: ['Never abandon recovery nights—they are ESSENTIAL', 'Rotate actives if targeting multiple concerns', 'Annual skin check to reassess needs'],
  },
];

const ADJUSTMENT_TRIGGERS = [
  {
    condition: '✅ Skin Improving',
    signal: 'Smooth, hydrated, clear, no redness or irritation',
    action: 'Continue current routine. After 4 weeks, consider upgrading concentration or frequency.',
  },
  {
    condition: '⚠️ Mild Irritation',
    signal: 'Slight redness, minor dryness, slight flaking (within first 2 weeks is normal)',
    action: 'Skip treatment for 3–5 days, use recovery nights only. Resume at same frequency if it settles.',
  },
  {
    condition: '🚨 Moderate-Severe Irritation',
    signal: 'Persistent redness, burning, painful texture, or significant dryness',
    action: 'STOP active treatment immediately. Use only cleanser, hydration, moisturizer, SPF for 1–2 weeks. Restart at HALF frequency (1x/week max).',
  },
  {
    condition: '📉 No Visible Progress After 8 Weeks',
    signal: 'Skin looks unchanged despite consistent routine',
    action: 'Increase frequency (if at 2x/week, move to 3x/week) OR upgrade concentration (if at 0.25%, move to 0.5%). Give it another 4 weeks.',
  },
];

export default function ToleranceProgressionGuide() {
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [expandedTrigger, setExpandedTrigger] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-violet-500" />
        <h2 className="text-lg font-black text-gray-900">Tolerance Building & Progression</h2>
      </div>

      <div className="p-3 rounded-xl bg-violet-50 border border-violet-200">
        <p className="text-xs font-bold text-violet-900 mb-1">🔬 The Science</p>
        <p className="text-xs text-violet-800 leading-relaxed">
          Your skin's tolerance to actives builds gradually over 4–12 weeks. Start low (concentration), go slow (frequency), and let your skin adapt naturally. 
          Rushing leads to irritation, barrier damage, and long-term sensitivity.
        </p>
      </div>

      {/* Progression Phases */}
      <div className="space-y-2">
        {PROGRESSION_PHASES.map((phase, idx) => (
          <motion.div
            key={phase.phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl overflow-hidden border border-gray-200"
            style={{ background: 'rgba(255,255,255,0.95)' }}
          >
            <button
              onClick={() => setExpandedPhase(expandedPhase === idx ? null : idx)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all"
            >
              <span className="text-3xl">{phase.emoji}</span>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-black text-sm text-gray-900">Phase {phase.phase}: {phase.label}</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: phase.color + '20', color: phase.color }}>
                    Weeks {phase.weeks}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{phase.frequency}</p>
              </div>
              <motion.div animate={{ rotate: expandedPhase === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {expandedPhase === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-gray-100"
                >
                  <div className="px-4 py-4 space-y-3">
                    {/* Goals */}
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Goals</p>
                      <ul className="space-y-1">
                        {phase.goals.map((goal, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-700">
                            <span className="text-emerald-500 font-black flex-shrink-0">✓</span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Expected Changes */}
                    <div className="p-2.5 rounded-lg" style={{ background: phase.color + '10', border: `1px solid ${phase.color}30` }}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: phase.color }}>📊 Expected Changes</p>
                      <p className="text-xs text-gray-700 font-semibold">{phase.expectedChanges}</p>
                    </div>

                    {/* Warnings */}
                    {phase.warnings.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-wider mb-1">⚠️ Cautions</p>
                        <ul className="space-y-0.5">
                          {phase.warnings.map((w, i) => (
                            <li key={i} className="text-xs text-amber-800 flex gap-2">
                              <span className="flex-shrink-0">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Adjustment Triggers */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <h3 className="font-black text-sm text-gray-900">How to Adjust Your Routine</h3>
        </div>

        <div className="space-y-2">
          {ADJUSTMENT_TRIGGERS.map((trigger, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl border border-gray-200 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              <button
                onClick={() => setExpandedTrigger(expandedTrigger === idx ? null : idx)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-all"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{trigger.condition.split(' ')[0]}</span>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-bold text-sm text-gray-900">{trigger.condition}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{trigger.signal}</p>
                </div>
                <motion.div animate={{ rotate: expandedTrigger === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedTrigger === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    <div className="px-4 py-3 bg-gray-50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Action to Take</p>
                      <p className="text-xs text-gray-700 font-semibold">{trigger.action}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
        <p className="text-xs font-bold text-green-900 mb-1">✅ Success Metrics (8-Week Mark)</p>
        <ul className="text-xs text-green-800 space-y-0.5">
          <li>✓ Skin is clear, hydrated, and radiant (no persistent irritation)</li>
          <li>✓ Noticeable improvement in texture, pore appearance, or clarity</li>
          <li>✓ Comfortable using active 3–5 nights/week without compromise</li>
          <li>✓ Ready to introduce a second active OR upgrade concentration safely</li>
        </ul>
      </div>
    </div>
  );
}