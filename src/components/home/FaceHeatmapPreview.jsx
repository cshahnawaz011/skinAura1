import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function FaceHeatmapPreview({ skinAnalysis }) {
  if (!skinAnalysis) return null;

  // Simple SVG face zones with color intensity based on concerns
  const getZoneColor = (value) => {
    if (value > 7) return '#ef4444'; // red - severe
    if (value > 5) return '#f97316'; // orange - moderate
    if (value > 3) return '#fbbf24'; // yellow - mild
    return '#10b981'; // green - healthy
  };

  const primaryConcern = skinAnalysis.acne_level > 5 ? 'acne_level' : 
                         skinAnalysis.oiliness > 5 ? 'oiliness' :
                         skinAnalysis.dryness > 5 ? 'dryness' : 'redness';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
      <Link to="/AdaptiveSkinMap">
        <div className="p-6 rounded-3xl cursor-pointer backdrop-blur-md transition-all group hover:shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,248,246,0.9) 100%)',
            border: '1px solid rgba(244,114,182,0.15)',
            boxShadow: '0 8px 32px rgba(244,114,182,0.06)'
          }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-900">Skin Zone Map</p>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
          </div>

          {/* Simplified Face SVG */}
          <svg viewBox="0 0 120 160" className="w-full h-32 mb-4">
            {/* Face outline */}
            <ellipse cx="60" cy="70" rx="40" ry="50" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
            
            {/* Zones with color intensity */}
            <circle cx="60" cy="35" r="12" fill={getZoneColor(skinAnalysis.redness)} opacity="0.7" />
            <circle cx="40" cy="55" r="10" fill={getZoneColor(skinAnalysis.dryness)} opacity="0.7" />
            <circle cx="80" cy="55" r="10" fill={getZoneColor(skinAnalysis.oiliness)} opacity="0.7" />
            <circle cx="60" cy="75" r="8" fill={getZoneColor(skinAnalysis.acne_level)} opacity="0.7" />
            
            {/* Labels */}
            <text x="60" y="30" textAnchor="middle" fontSize="8" fill="#666">Forehead</text>
            <text x="35" y="68" textAnchor="middle" fontSize="8" fill="#666">Cheek</text>
            <text x="85" y="68" textAnchor="middle" fontSize="8" fill="#666">Cheek</text>
            <text x="60" y="88" textAnchor="middle" fontSize="8" fill="#666">Chin</text>
          </svg>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            {[
              { color: '#10b981', label: 'Healthy' },
              { color: '#fbbf24', label: 'Mild' },
              { color: '#f97316', label: 'Moderate' },
              { color: '#ef4444', label: 'Severe' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }}></div>
                <span className="text-gray-600 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}