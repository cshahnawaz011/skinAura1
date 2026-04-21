import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function ShareCard({ score, streak, badge, userName, onClose }) {
  const cardRef = useRef(null);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'My GlowAI Daily Score',
        text: `🌟 My Glow Score today is ${score}/100! Streak: ${streak} days 🔥 #GlowAI #SkincareRoutine`,
        url: window.location.origin,
      });
    }
  };

  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const bg = score >= 75
    ? 'from-emerald-400 via-teal-400 to-cyan-400'
    : score >= 50
    ? 'from-amber-400 via-orange-400 to-rose-400'
    : 'from-rose-400 via-pink-400 to-purple-400';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-4 w-full max-w-sm">
        {/* Share Card */}
        <div ref={cardRef} className={`w-full rounded-3xl bg-gradient-to-br ${bg} p-[2px] shadow-2xl`}>
          <div className="bg-white dark:bg-gray-900 rounded-[22px] p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg text-gray-800 dark:text-gray-100">GlowAI</span>
            </div>
            <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMM d yyyy')}</p>
            <div className="flex flex-col items-center">
              <span className="text-7xl font-black" style={{ color: scoreColor }}>{score}</span>
              <span className="text-gray-400 text-sm font-medium">Glow Score / 100</span>
            </div>
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-orange-500">🔥{streak}</span>
                <span className="text-xs text-gray-400">Day Streak</span>
              </div>
              {badge && (
                <div className="flex flex-col items-center">
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="text-xs text-gray-400">{badge.label}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 italic">"{userName ? `@${userName.split(' ')[0]}` : 'Glowing'}'s Daily Glow Report"</p>
            <div className="text-xs text-gray-300 dark:text-gray-600">#GlowAI #SkincareRoutine #GlowUp</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <Button onClick={handleShare} className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          <Button variant="outline" onClick={onClose} className="px-4">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}