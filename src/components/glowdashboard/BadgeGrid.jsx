import React from 'react';
import { motion } from 'framer-motion';

export const ALL_BADGES = [
  { id: 'first_glow', emoji: '🌱', label: 'First Glow', desc: 'Complete your first day', condition: (m) => m.totalDays >= 1 },
  { id: 'streak_3', emoji: '🔥', label: '3-Day Streak', desc: '3 days in a row', condition: (m) => m.streak >= 3 },
  { id: 'streak_7', emoji: '⚡', label: 'Week Warrior', desc: '7-day streak', condition: (m) => m.streak >= 7 },
  { id: 'streak_21', emoji: '💎', label: 'Diamond Skin', desc: '21-day streak', condition: (m) => m.streak >= 21 },
  { id: 'perfect_score', emoji: '🏆', label: 'Perfect Glow', desc: 'Score 100 in a day', condition: (m) => m.bestScore >= 100 },
  { id: 'hydration', emoji: '💧', label: 'Hydration Hero', desc: '8 glasses/day logged', condition: (m) => m.waterDays >= 5 },
  { id: 'sleep_queen', emoji: '😴', label: 'Sleep Queen', desc: '7h+ sleep for 5 days', condition: (m) => m.sleepDays >= 5 },
  { id: 'diet_star', emoji: '🥗', label: 'Diet Star', desc: 'Log 5 good foods in a day', condition: (m) => m.goodFoodDays >= 3 },
  { id: 'consistent', emoji: '📅', label: 'Consistent', desc: 'Log 10 total days', condition: (m) => m.totalDays >= 10 },
];

export default function BadgeGrid({ earned = [] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ALL_BADGES.map((badge, i) => {
        const isEarned = earned.includes(badge.id);
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
              isEarned
                ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 opacity-40 grayscale'
            }`}
          >
            <span className="text-2xl">{badge.emoji}</span>
            <p className="text-xs font-bold text-center leading-tight">{badge.label}</p>
            <p className="text-[10px] text-gray-400 text-center leading-tight">{badge.desc}</p>
          </motion.div>
        );
      })}
    </div>
  );
}