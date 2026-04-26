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
        {/* Warnings */}
        {alerts.map((alert, i) => {
          const Icon = alert.icon;
          return (
            <div key={`alert-${i}`} className="ios-card p-4 flex items-center gap-3"
              style={{ background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${alert.color}`} />
              <p className="text-sm text-gray-800 font-medium">{alert.text}</p>
            </div>
          );
        })}

        {/* Recommendations */}
        {recommendations.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <div key={`rec-${i}`} className="ios-card p-4 flex items-center gap-3"
              style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${rec.color}`} />
              <p className="text-sm text-gray-800 font-medium flex-1">{rec.text}</p>
            </div>
          );
        })}

        {/* Quick action */}
        <Link to="/Products">
          <div className="ios-card p-4 text-center cursor-pointer hover:shadow-md transition-all bg-gradient-to-r from-blue-50 to-teal-50">
            <p className="text-sm font-semibold text-blue-700">📸 Scan Product Label</p>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}