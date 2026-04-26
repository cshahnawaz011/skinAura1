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
        <div className="p-6 rounded-3xl cursor-pointer backdrop-blur-md hover:shadow-lg transition-all group"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,248,246,0.9) 100%)',
            border: '1px solid rgba(244,114,182,0.15)',
            boxShadow: '0 8px 32px rgba(244,114,182,0.06)'
          }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <p className="text-sm font-bold text-gray-900">Weekly Progress</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
          </div>

          {/* Metrics */}
          <div className="space-y-5">
            {metrics.map((metric, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.05 }}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-semibold text-gray-700">{metric.label}</p>
                  <p className={`text-sm font-bold ${metric.color}`}>{Math.round(metric.value)}%</p>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(244,114,182,0.1)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: metric.barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Insight */}
          <div className="mt-6 p-4 rounded-2xl" style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
            border: '1px solid rgba(16,185,129,0.12)'
          }}>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              💚 Amazing progress! Your skin is responding well. Keep up with your routine for sustained results.
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}