import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Lightbulb, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductAlerts({ skinAnalysis }) {
  if (!skinAnalysis) return null;

  const alerts = [];
  const recommendations = [];

  // Generate alerts and recommendations based on analysis
  if (skinAnalysis.acne_level > 5) {
    recommendations.push({ icon: Lightbulb, text: 'Vitamin C serum recommended for glow', color: 'text-amber-600' });
  }
  if (skinAnalysis.oiliness > 5) {
    alerts.push({ icon: AlertCircle, text: 'Avoid oil-based moisturizers today', color: 'text-orange-600' });
  }
  if (skinAnalysis.dryness > 5) {
    recommendations.push({ icon: Zap, text: 'Hyaluronic acid boost needed', color: 'text-cyan-600' });
  }
  if (skinAnalysis.sensitivity > 5) {
    alerts.push({ icon: AlertCircle, text: 'Skip active ingredients today', color: 'text-red-600' });
  }

  if (alerts.length === 0 && recommendations.length === 0) {
    recommendations.push({ icon: Lightbulb, text: 'Your skin is balanced—maintain routine', color: 'text-green-600' });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
      <div className="space-y-3">
        {alerts.map((alert, i) => {
          const Icon = alert.icon;
          return (
            <div key={`alert-${i}`} className="p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(244,114,182,0.05))',
                border: '1px solid rgba(220,38,38,0.15)'
              }}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${alert.color}`} />
              <p className="text-sm text-gray-800 font-medium">{alert.text}</p>
            </div>
          );
        })}

        {recommendations.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <div key={`rec-${i}`} className="p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
                border: '1px solid rgba(16,185,129,0.15)'
              }}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${rec.color}`} />
              <p className="text-sm text-gray-800 font-medium flex-1">{rec.text}</p>
            </div>
          );
        })}

        <Link to="/Products">
          <div className="p-4 rounded-2xl text-center cursor-pointer hover:shadow-md transition-all backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(196,181,253,0.08))',
              border: '1px solid rgba(244,114,182,0.15)'
            }}>
            <p className="text-sm font-semibold text-pink-600">📸 Scan Ingredients</p>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}