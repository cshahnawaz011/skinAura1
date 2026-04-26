import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AIInsightStrip({ skinAnalysis, dietLog }) {
  const generateInsights = () => {
    const insights = [];
    
    if (skinAnalysis) {
      if (skinAnalysis.acne_level > 6) {
        insights.push({ text: 'Mild acne activity detected in T-zone', icon: '🔴' });
      }
      if (skinAnalysis.dryness > 6) {
        insights.push({ text: 'Cheek area showing dehydration signs', icon: '💧' });
      }
      if (skinAnalysis.oiliness > 6) {
        insights.push({ text: 'Oil production increased on forehead', icon: '🛢️' });
      }
    }
    
    if (dietLog) {
      if ((dietLog.water_glasses || 0) < 6) {
        insights.push({ text: 'Hydration below target—increase water intake', icon: '💦' });
      }
      if ((dietLog.sleep_hours || 0) < 7) {
        insights.push({ text: 'Sleep deficit may impact skin recovery', icon: '😴' });
      }
    }
    
    if (insights.length === 0) {
      insights.push({ text: 'Your skin is balanced and healthy', icon: '✨' });
    }
    
    return insights.slice(0, 2); // Show top 2 insights
  };

  const insights = generateInsights();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,248,246,0.85) 100%)',
              border: '1px solid rgba(244,114,182,0.12)',
              boxShadow: '0 4px 16px rgba(244,114,182,0.06)'
            }}>
            <span className="text-xl flex-shrink-0">{insight.icon}</span>
            <p className="text-sm text-gray-700 font-medium leading-snug flex-1">{insight.text}</p>
            <Sparkles className="w-3.5 h-3.5 text-pink-300 ml-auto flex-shrink-0 animate-pulse" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}