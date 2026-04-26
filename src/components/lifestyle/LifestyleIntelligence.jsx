import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, TrendingUp, Zap } from 'lucide-react';

export function WellnessCorrelationCard({ dietLogs, cyclePhase }) {
  const correlations = React.useMemo(() => {
    if (!dietLogs.length) return [];

    const impacts = [];
    const recent = dietLogs.slice(-7);

    // Sleep impact on skin
    const avgSleep = recent.reduce((s, d) => s + (d.sleep_hours || 0), 0) / recent.length;
    if (avgSleep >= 7) {
      impacts.push({
        emoji: '😴',
        label: 'Quality Sleep Habit',
        result: `${avgSleep.toFixed(1)}h avg — skin regenerating optimally`,
        positive: true,
      });
    } else {
      impacts.push({
        emoji: '😴',
        label: 'Sleep Below Target',
        result: `${avgSleep.toFixed(1)}h avg — increase to 7h+ for skin healing`,
        positive: false,
      });
    }

    // Hydration impact
    const avgWater = recent.reduce((s, d) => s + (d.water_glasses || 0), 0) / recent.length;
    if (avgWater >= 8) {
      impacts.push({
        emoji: '💧',
        label: 'Excellent Hydration',
        result: `${avgWater.toFixed(1)} glasses/day — barrier protection strong`,
        positive: true,
      });
    }

    // Stress impact
    const avgStress = recent.reduce((s, d) => s + (d.stress_level || 0), 0) / recent.length;
    if (avgStress <= 3) {
      impacts.push({
        emoji: '😌',
        label: 'Low Stress Levels',
        result: `${avgStress.toFixed(1)}/10 — cortisol in check, skin clear`,
        positive: true,
      });
    } else if (avgStress >= 7) {
      impacts.push({
        emoji: '⚠️',
        label: 'High Stress Detected',
        result: `${avgStress.toFixed(1)}/10 — increase calmness routines, yoga`,
        positive: false,
      });
    }

    // Cycle sync
    if (cyclePhase === 'menstrual' && (avgSleep < 7 || avgWater < 8)) {
      impacts.push({
        emoji: '🔴',
        label: 'Cycle Phase Mismatch',
        result: 'During menstrual phase — prioritize sleep and hydration extra',
        positive: false,
      });
    }

    return impacts;
  }, [dietLogs, cyclePhase]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-3xl p-5"
      style={{
        background: 'linear-gradient(145deg,#ffffff,#f8f4ff)',
        border: '1.5px solid rgba(167,139,250,0.18)',
        boxShadow: '0 4px 24px rgba(167,139,250,0.09)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-base">🧬 Wellness Correlation Engine</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Lifestyle impact on skin health</p>
        </div>
        <Badge className="bg-violet-500 text-white">{correlations.length} insights</Badge>
      </div>

      <div className="space-y-2">
        {correlations.map((impact, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-3 p-3 rounded-2xl"
            style={{
              background: impact.positive ? 'rgba(16,185,129,0.06)' : 'rgba(251,146,60,0.06)',
              border: `1.5px solid ${impact.positive ? 'rgba(16,185,129,0.18)' : 'rgba(251,146,60,0.18)'}`,
            }}
          >
            <span className="text-xl flex-shrink-0">{impact.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">{impact.label}</p>
              <p className="text-xs mt-0.5" style={{ color: impact.positive ? '#059669' : '#d97706' }}>
                {impact.result}
              </p>
            </div>
            {impact.positive && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function CyclePhaseInsightCard({ cyclePhase, dietLogs }) {
  const phaseGuidance = {
    menstrual: {
      emoji: '🔴',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.25)',
      tips: [
        '✓ Prioritize rest — lower intensity workouts',
        '✓ Increase iron intake (spinach, red meat)',
        '✓ Double hydration — more water loss',
        '✓ Heavy moisturizer only (no actives)',
      ],
    },
    follicular: {
      emoji: '🌱',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.25)',
      tips: [
        '✓ Leverage rising energy — challenging workouts',
        '✓ Introduce Vitamin C, light BHA',
        '✓ Best time for new skincare steps',
        '✓ Clear skin window — take progress photos',
      ],
    },
    ovulation: {
      emoji: '⚡',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.25)',
      tips: [
        '✓ Peak energy and confidence — important meetings',
        '✓ Skin clearest — intense workouts optimal',
        '✓ Can use retinol, strong actives',
        '✓ SPF 50+ essential protection',
      ],
    },
    luteal: {
      emoji: '🌙',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.25)',
      tips: [
        '✓ Self-care priority — honor your needs',
        '✓ Calming ingredients (Centella, Niacinamide)',
        '✓ Gentle yoga, walks preferred',
        '✓ Plan nourishing meals, reduce stress',
      ],
    },
  };

  const guidance = phaseGuidance[cyclePhase] || phaseGuidance.follicular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-3xl p-5 overflow-hidden"
      style={{
        background: `linear-gradient(145deg,${guidance.bg},rgba(255,255,255,0.5))`,
        border: `1.5px solid ${guidance.border}`,
        boxShadow: `0 4px 24px ${guidance.color}15`,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{guidance.emoji}</span>
        <div>
          <p className="font-black text-base capitalize" style={{ color: guidance.color }}>
            {cyclePhase} Phase Guidance
          </p>
          <p className="text-[10px] text-gray-400">Optimized lifestyle + skincare recommendations</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {guidance.tips.map((tip, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="text-sm font-medium leading-relaxed"
            style={{ color: guidance.color }}
          >
            {tip}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}

export function HabitStreakCard({ dietLogs }) {
  const streaks = React.useMemo(() => {
    const today = new Date();
    let skincareMorningStreak = 0;
    let skincareNightStreak = 0;
    let exerciseStreak = 0;

    for (let i = 0; i < dietLogs.length; i++) {
      const log = dietLogs[dietLogs.length - 1 - i];
      if (log.skincare_done_morning) skincareMorningStreak++;
      else break;
    }

    for (let i = 0; i < dietLogs.length; i++) {
      const log = dietLogs[dietLogs.length - 1 - i];
      if (log.skincare_done_night) skincareNightStreak++;
      else break;
    }

    for (let i = 0; i < dietLogs.length; i++) {
      const log = dietLogs[dietLogs.length - 1 - i];
      if (log.exercise_done) exerciseStreak++;
      else break;
    }

    return [
      { label: 'Morning Skincare', streak: skincareMorningStreak, emoji: '🌅', color: '#f59e0b' },
      { label: 'Night Skincare', streak: skincareNightStreak, emoji: '🌙', color: '#8b5cf6' },
      { label: 'Exercise', streak: exerciseStreak, emoji: '💪', color: '#10b981' },
    ];
  }, [dietLogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl p-5"
      style={{
        background: 'linear-gradient(145deg,#ffffff,#f0fdf4)',
        border: '1.5px solid rgba(52,211,153,0.18)',
      }}
    >
      <p className="font-black text-base mb-4">🔥 Habit Streaks</p>
      <div className="space-y-3">
        {streaks.map((habit) => (
          <div key={habit.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{habit.emoji}</span>
              <p className="font-semibold text-sm">{habit.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black" style={{ color: habit.color }}>
                {habit.streak}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">days</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}