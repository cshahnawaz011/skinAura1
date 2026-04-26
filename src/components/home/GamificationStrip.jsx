import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Award } from 'lucide-react';

export default function GamificationStrip() {
  // Mock data - in real app would come from database
  const streakDays = 7;
  const badges = ['first_scan', 'consistency_5', 'glow_master'];
  const consistencyScore = 5; // out of 7

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.29 }}>
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Flame, label: 'Day Streak', value: streakDays, color: 'text-orange-500', bgGradient: 'rgba(249, 115, 22, 0.08), rgba(239, 68, 68, 0.05)' },
          { icon: Award, label: 'Badges Earned', value: badges.length, color: 'text-purple-500', bgGradient: 'rgba(168, 85, 247, 0.08), rgba(244, 114, 182, 0.05)' },
          { icon: Star, label: 'This Week', value: `${consistencyScore}/7`, color: 'text-amber-500', bgGradient: 'rgba(251, 191, 36, 0.08), rgba(244, 114, 182, 0.05)' }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.30 + i * 0.01 }}
              className="p-5 rounded-2xl text-center backdrop-blur-sm"
              style={{
                background: `linear-gradient(135deg, ${item.bgGradient})`,
                border: '1px solid rgba(244, 114, 182, 0.12)',
                boxShadow: '0 4px 12px rgba(244, 114, 182, 0.05)'
              }}>
              <Icon className={`w-6 h-6 mx-auto mb-2.5 ${item.color}`} />
              <p className="text-2xl font-black text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-600 font-semibold mt-1.5">{item.label}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}