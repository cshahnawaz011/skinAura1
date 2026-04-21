import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function HabitCard({ habit, done, onToggle, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
        done
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-white/5 hover:border-rose-200'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-all ${
        done ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        {done ? <Check className="w-4 h-4 text-white" /> : <span>{habit.emoji}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{habit.label}</p>
        <p className="text-xs text-gray-400">{habit.tip}</p>
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
        +{habit.points}
      </span>
    </motion.button>
  );
}