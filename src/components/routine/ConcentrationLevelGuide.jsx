import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const LEVELS = [
  {
    level: 'Level 1',
    tag: 'Beginner Safe',
    emoji: '🟢',
    grad: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    when: 'Days 1–7 (Everyone starts here)',
    description: 'Lowest concentration of active ingredients. Your skin is just getting introduced. The goal is tolerance-building, not results.',
    examples: [
      { ingredient: 'Retinol', conc: '0.025% – 0.05%', freq: '1–2x/week' },
      { ingredient: 'Salicylic Acid (BHA)', conc: '0.5% – 1%', freq: '2x/week' },
      { ingredient: 'AHA (Glycolic/Lactic)', conc: '5%', freq: '1x/week' },
      { ingredient: 'Benzoyl Peroxide', conc: '2.5%', freq: '2x/week' },
    ],
    rule: 'Must complete 5–7 days with positive feedback before moving to Level 2.',
  },
  {
    level: 'Level 2',
    tag: 'Moderate',
    emoji: '🟡',
    grad: 'from-amber-400 to-orange-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    when: 'Days 8–21 (Only after proven tolerance)',
    description: 'Moderate concentrations. Your skin has adapted to Level 1 and is ready for slightly stronger actives. Results start becoming visible.',
    examples: [
      { ingredient: 'Retinol', conc: '0.1% – 0.3%', freq: '2–3x/week' },
      { ingredient: 'Salicylic Acid (BHA)', conc: '1.5% – 2%', freq: '3x/week' },
      { ingredient: 'AHA (Glycolic/Lactic)', conc: '8–10%', freq: '2x/week' },
      { ingredient: 'Benzoyl Peroxide', conc: '5%', freq: '3x/week' },
    ],
    rule: 'Never increase frequency AND concentration at the same time. Pick one.',
  },
  {
    level: 'Level 3',
    tag: 'Advanced',
    emoji: '🔴',
    grad: 'from-red-400 to-rose-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    when: 'Day 22+ (Only with sustained tolerance)',
    description: 'High-strength actives for experienced skin. Only reached after weeks of consistent positive response at Level 2. Barrier health is monitored closely.',
    examples: [
      { ingredient: 'Retinol', conc: '0.5% – 1%', freq: '3–5x/week' },
      { ingredient: 'Salicylic Acid (BHA)', conc: '2%+', freq: '4–5x/week' },
      { ingredient: 'AHA (Glycolic/Lactic)', conc: '12–15%', freq: '2–3x/week' },
      { ingredient: 'Benzoyl Peroxide', conc: '10%', freq: 'Daily (if tolerated)' },
    ],
    rule: 'Any negative feedback → immediate step-down to Level 1. No exceptions.',
  },
];

export default function ConcentrationLevelGuide({ currentLevel }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧪</span>
          <span className="font-bold text-sm">Concentration Level Guide</span>
          {currentLevel && (
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              currentLevel === 'Level 1' ? 'bg-emerald-100 text-emerald-700' :
              currentLevel === 'Level 2' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              You are at: {currentLevel}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-white/40 dark:bg-white/3">
              {LEVELS.map((lvl, i) => {
                const isActive = currentLevel === lvl.level;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border-2 p-4 transition-all ${lvl.border} ${lvl.bg} ${
                      isActive ? 'ring-2 ring-pink-400 ring-offset-1' : 'opacity-85'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xl">{lvl.emoji}</span>
                      <span className={`font-black text-base ${lvl.text}`}>{lvl.level}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${lvl.grad} text-white`}>
                        {lvl.tag}
                      </span>
                      {isActive && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white ml-auto">
                          ← Your Level
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">⏰ {lvl.when}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{lvl.description}</p>

                    {/* Concentration Table */}
                    <div className="rounded-xl overflow-hidden border border-white/60 dark:border-white/10 mb-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white/60 dark:bg-black/20">
                            <th className="text-left px-3 py-1.5 font-bold text-gray-600 dark:text-gray-300">Ingredient</th>
                            <th className="text-left px-3 py-1.5 font-bold text-gray-600 dark:text-gray-300">Concentration</th>
                            <th className="text-left px-3 py-1.5 font-bold text-gray-600 dark:text-gray-300">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lvl.examples.map((ex, j) => (
                            <tr key={j} className="border-t border-white/40 dark:border-white/10">
                              <td className="px-3 py-1.5 font-semibold text-gray-800 dark:text-gray-200">{ex.ingredient}</td>
                              <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{ex.conc}</td>
                              <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{ex.freq}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      📌 Rule: <span className={lvl.text}>{lvl.rule}</span>
                    </p>
                  </div>
                );
              })}

              {/* Upgrade/Downgrade Rules */}
              <div className="rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 border border-violet-200 dark:border-violet-800 p-4">
                <p className="font-bold text-sm text-violet-700 dark:text-violet-300 mb-2">⚡ Auto-Adjustment Rules</p>
                <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <p>✅ <strong>5+ positive days</strong> → Upgrade frequency OR concentration (+1 level)</p>
                  <p>⚠️ <strong>Mild damage (3,5)</strong> → Reduce frequency, drop -1 level</p>
                  <p>🚨 <strong>High damage (4,6)</strong> → Stop all actives, recovery mode, restart Level 1</p>
                  <p>⚖️ <strong>Neutral (8)</strong> → Increase frequency first, then concentration after 7–10 days</p>
                  <p>❌ <strong>NEVER</strong> → Jump levels or raise both frequency + concentration together</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}