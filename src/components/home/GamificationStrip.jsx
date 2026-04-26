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
        {/* Streak */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.30 }}
          className="ios-card p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)' }}>
          <div className="flex justify-center mb-2">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600">{streakDays}</p>
          <p className="text-xs text-gray-600 font-semibold mt-1">Day Streak</p>
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.31 }}
          className="ios-card p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)' }}>
          <div className="flex justify-center mb-2">
            <Award className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">{badges.length}</p>
          <p className="text-xs text-gray-600 font-semibold mt-1">Badges Earned</p>
        </motion.div>

        {/* Consistency */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.32 }}
          className="ios-card p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)' }}>
          <div className="flex justify-center mb-2">
            <Star className="w-6 h-6 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-teal-600">{consistencyScore}/7</p>
          <p className="text-xs text-gray-600 font-semibold mt-1">This Week</p>
        </motion.div>
      </div>
    </motion.div>
  );
}