import React from 'react';
import { motion } from 'framer-motion';

const LEVEL_CONFIG = {
  'Level 1': { color: 'text-emerald-600', bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: '1–2x/week 🟢' },
  'Level 2': { color: 'text-amber-600',   bar: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   label: '3–4x/week 🟡' },
  'Level 3': { color: 'text-red-600',     bar: 'bg-red-400',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',           label: '5–7x/week 🔴' },
};

const STEPS = ['Level 1', 'Level 2', 'Level 3'];

export default function UserLevelTracker({ currentLevel, frequencyLabel, daysAtLevel, progressPercent, nextAction, recoveryMode, statusEmoji }) {
  const cfg = LEVEL_CONFIG[currentLevel] || LEVEL_CONFIG['Level 1'];
  const levelIndex = STEPS.indexOf(currentLevel);

  return (
    <div className={`rounded-2xl border-2 p-4 space-y-3 ${
      recoveryMode
        ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
        : 'border-pink-200 dark:border-pink-900/50 bg-gradient-to-r from-pink-50 to-violet-50 dark:from-pink-900/10 dark:to-violet-900/10'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Your Concentration Level</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{statusEmoji}</span>
            <span className={`font-black text-xl ${cfg.color}`}>{currentLevel}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
            {frequencyLabel && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                📅 {frequencyLabel}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Days at this level</p>
          <p className={`text-3xl font-black ${cfg.color}`}>{daysAtLevel}</p>
        </div>
      </div>

      {/* Level Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const isActive = i === levelIndex;
          const isPast   = i < levelIndex;
          return (
            <React.Fragment key={step}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                isActive
                  ? `bg-gradient-to-br ${i === 0 ? 'from-emerald-400 to-teal-500' : i === 1 ? 'from-amber-400 to-orange-400' : 'from-red-400 to-rose-500'} text-white border-transparent shadow-md`
                  : isPast
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600'
                  : 'bg-white dark:bg-gray-800 text-gray-300 border-gray-200 dark:border-gray-700'
              }`}>
                {isPast ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 rounded-full transition-all ${isPast || isActive ? cfg.bar : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress to next level */}
      {currentLevel !== 'Level 3' && !recoveryMode && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress to {STEPS[levelIndex + 1]}</span>
            <span className="font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${cfg.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Next Action */}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
        {nextAction}
      </p>
    </div>
  );
}