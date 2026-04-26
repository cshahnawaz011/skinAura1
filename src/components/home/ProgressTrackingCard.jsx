import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';

export default function ProgressTrackingCard({ skinAnalysis }) {
  if (!skinAnalysis) return null;

  // Calculate improvement metrics
  const acneImprovement = Math.max(0, 100 - skinAnalysis.acne_level * 10);
  const hydrationLevel = Math.max(0, 100 - Math.abs(50 - skinAnalysis.oiliness - skinAnalysis.dryness) * 5);
  const glowScore = skinAnalysis.overall_score;

  const metrics = [
    { label: 'Acne Reduction', value: acneImprovement, color: 'text-rose-600', barColor: 'bg-rose-500' },
    { label: 'Hydration', value: hydrationLevel, color: 'text-cyan-600', barColor: 'bg-cyan-500' },
    { label: 'Overall Glow', value: glowScore, color: 'text-amber-600', barColor: 'bg-amber-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
      <Link to="/Progress">
        <div className="ios-card p-6 cursor-pointer hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <p className="text-sm font-bold text-gray-900">Weekly Progress</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            {metrics.map((metric, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.05 }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600">{metric.label}</p>
                  <p className={`text-sm font-bold ${metric.color}`}>{Math.round(metric.value)}%</p>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(100, 200, 200, 0.1)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: metric.barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Before/After hint */}
          <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
            <p className="text-xs text-gray-700 font-medium">
              💚 Great progress! Your skin barrier is strengthening. Keep consistent with your routine.
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}