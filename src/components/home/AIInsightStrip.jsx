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
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="ios-card p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.03) 0%, rgba(15, 23, 42, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
            <span className="text-xl flex-shrink-0">{insight.icon}</span>
            <p className="text-sm text-gray-700 font-medium leading-tight">{insight.text}</p>
            <Sparkles className="w-3.5 h-3.5 text-blue-400 ml-auto flex-shrink-0 animate-pulse" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}