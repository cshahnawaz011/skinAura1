import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Moon, Zap } from 'lucide-react';

export default function LifestyleImpactPanel({ dietLog }) {
  if (!dietLog) return null;

  const sleepScore = Math.min(100, ((dietLog.sleep_hours || 0) / 8) * 100);
  const waterScore = Math.min(100, ((dietLog.water_glasses || 0) / 8) * 100);
  const stressScore = Math.max(0, 100 - ((dietLog.stress_level || 3) * 20));

  const impacts = [
    { icon: Moon, label: 'Sleep Impact', value: sleepScore, color: '#7c3aed', hint: `${dietLog.sleep_hours || 0}h sleep` },
    { icon: Droplets, label: 'Hydration Impact', value: waterScore, color: '#06b6d4', hint: `${dietLog.water_glasses || 0}/8 glasses` },
    { icon: Zap, label: 'Stress Correlation', value: stressScore, color: '#f59e0b', hint: `Level ${dietLog.stress_level || 3}/5` },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
      <div className="p-6 rounded-3xl backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,248,246,0.9) 100%)',
          border: '1px solid rgba(244,114,182,0.15)',
          boxShadow: '0 8px 32px rgba(244,114,182,0.06)'
        }}>
        <p className="text-sm font-bold text-gray-900 mb-4">Lifestyle Insights</p>
        
        <div className="space-y-4">
          {impacts.map((impact, i) => {
            const Icon = impact.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 + i * 0.05 }}>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-4 h-4" style={{ color: impact.color }} />
                  <p className="text-xs font-semibold text-gray-700">{impact.label}</p>
                  <p className="text-xs text-gray-500 ml-auto">{Math.round(impact.value)}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(244, 114, 182, 0.1)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: impact.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${impact.value}%` }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }} />
                  </div>
                  <p className="text-[10px] text-gray-500 whitespace-nowrap">{impact.hint}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}