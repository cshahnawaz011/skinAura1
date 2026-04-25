import React from 'react';
import { motion } from 'framer-motion';

export default function SignalLayerToggles({ layers, activeLayer, onSelect, analysis }) {
  const getScore = (layer) => {
    if (!analysis) return 0;
    const raw = analysis[layer.dataKey] || 0;
    return layer.invert ? Math.max(0, 10 - raw) : raw;
  };

  const getSeverityLabel = (score) => {
    if (score <= 2) return { label: 'Optimal', color: '#34d399' };
    if (score <= 4) return { label: 'Mild', color: '#a3e635' };
    if (score <= 6) return { label: 'Moderate', color: '#facc15' };
    if (score <= 8) return { label: 'Elevated', color: '#fb923c' };
    return { label: 'Severe', color: '#ef4444' };
  };

  // Sort layers by severity (highest first)
  const sorted = [...layers].sort((a, b) => getScore(b) - getScore(a));

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Signal Layers</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Sorted by severity</p>
        </div>
        <div className="flex gap-0.5">
          {['🟢', '🟡', '🔴'].map((e, i) => <span key={i} className="text-[10px]">{e}</span>)}
        </div>
      </div>

      <div className="p-1.5 space-y-0.5">
        {sorted.map((layer, idx) => {
          const score = getScore(layer);
          const sev = getSeverityLabel(score);
          const isActive = activeLayer === layer.key;
          const pct = (score / 10) * 100;

          return (
            <motion.button
              key={layer.key}
              onClick={() => onSelect(layer.key)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all relative overflow-hidden"
              style={{
                background: isActive ? `${layer.color}18` : 'transparent',
                border: isActive ? `1.5px solid ${layer.color}55` : '1.5px solid transparent',
              }}>

              {/* Background fill indicator */}
              <div className="absolute left-0 top-0 bottom-0 rounded-xl transition-all"
                style={{ width: `${pct}%`, background: `${layer.color}08`, zIndex: 0 }} />

              <span className="text-base flex-shrink-0 relative z-10">{layer.emoji}</span>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold truncate" style={{ color: isActive ? layer.color : '#374151' }}>
                    {layer.label}
                  </p>
                  <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: sev.color }} />
                    <span className="text-[10px] font-black" style={{ color: layer.color }}>{score.toFixed(1)}</span>
                  </div>
                </div>
                {/* Micro bar */}
                <div className="w-full h-1 rounded-full mt-1" style={{ background: 'rgba(0,0,0,0.07)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${layer.color}99, ${layer.color})` }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }} />
                </div>
              </div>

              {isActive && (
                <motion.div className="w-1.5 h-1.5 rounded-full flex-shrink-0 relative z-10"
                  style={{ background: layer.color }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-3 pb-2.5 pt-1 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between text-[9px] text-gray-400">
          <span>🟢 Optimal (0–2)</span>
          <span>🟡 Moderate (5–6)</span>
          <span>🔴 Severe (9–10)</span>
        </div>
      </div>
    </div>
  );
}