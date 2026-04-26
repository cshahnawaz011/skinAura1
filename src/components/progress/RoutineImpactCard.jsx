import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp } from 'lucide-react';

function deriveImpacts(analyses, feedbackHistory) {
  const impacts = [];

  if (analyses.length >= 2) {
    const first = analyses[0];
    const last = analyses[analyses.length - 1];

    if ((first.acne_level - last.acne_level) >= 1) {
      impacts.push({ emoji: '✅', label: 'Barrier-safe cleanser', result: `Acne dropped ${first.acne_level - last.acne_level} pts`, positive: true });
    }
    if ((first.dryness - last.dryness) >= 1) {
      impacts.push({ emoji: '✅', label: 'Daily moisturizer', result: `Dryness reduced by ${first.dryness - last.dryness} pts`, positive: true });
    }
    if ((first.oiliness - last.oiliness) >= 1) {
      impacts.push({ emoji: '✅', label: 'BHA/Salicylic rotation', result: `Oiliness down ${first.oiliness - last.oiliness} pts`, positive: true });
    }
    if ((first.dark_spots - last.dark_spots) >= 1) {
      impacts.push({ emoji: '✅', label: 'Vitamin C + SPF combo', result: `Dark spots improved by ${first.dark_spots - last.dark_spots} pts`, positive: true });
    }
    if ((last.sensitivity - first.sensitivity) > 1) {
      impacts.push({ emoji: '⚠️', label: 'Active ingredient overuse', result: `Sensitivity rose ${last.sensitivity - first.sensitivity} pts — reduce frequency`, positive: false });
    }
    if (last.overall_score > first.overall_score) {
      impacts.push({ emoji: '🌟', label: 'Consistent routine streak', result: `Overall score +${(last.overall_score - first.overall_score).toFixed(1)} pts`, positive: true });
    }
  }

  const positiveFeedbacks = feedbackHistory.filter(f => (f.feedback_codes || []).some(c => c === 1 || c === 2));
  if (positiveFeedbacks.length >= 3) {
    impacts.push({ emoji: '✅', label: 'Feedback-adaptive routine', result: `${positiveFeedbacks.length} days of positive signals recorded`, positive: true });
  }

  if (impacts.length === 0) {
    impacts.push({ emoji: '🔬', label: 'Starting baseline', result: 'Keep logging daily feedback to track impact', positive: true });
  }

  return impacts;
}

export default function RoutineImpactCard({ analyses = [], feedbackHistory = [] }) {
  const impacts = deriveImpacts(analyses, feedbackHistory);
  const positiveCount = impacts.filter(i => i.positive).length;

  return (
    <div className="rounded-3xl p-5" style={{
      background: 'linear-gradient(145deg,rgba(255,255,255,0.97),rgba(240,253,244,0.9))',
      border: '1.5px solid rgba(52,211,153,0.18)',
      boxShadow: '0 4px 24px rgba(52,211,153,0.08)',
    }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-base">Routine Change Impact</p>
          <p className="text-[10px] text-gray-400 mt-0.5">What's actually helping</p>
        </div>
        <div className="px-3 py-1.5 rounded-2xl bg-emerald-100 text-emerald-700 text-xs font-black">
          {positiveCount} wins 🏆
        </div>
      </div>

      <div className="space-y-2">
        {impacts.map((impact, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-start gap-3 p-3 rounded-2xl"
            style={{
              background: impact.positive ? 'rgba(52,211,153,0.06)' : 'rgba(251,146,60,0.06)',
              border: `1.5px solid ${impact.positive ? 'rgba(52,211,153,0.18)' : 'rgba(251,146,60,0.18)'}`,
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

      {analyses.length < 2 && (
        <p className="text-xs text-gray-400 text-center mt-3">Complete more analyses to see detailed routine impact</p>
      )}
    </div>
  );
}