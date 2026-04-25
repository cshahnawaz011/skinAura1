import React from 'react';
import { motion } from 'framer-motion';

export default function SignalLayerToggles({ layers, activeLayer, onSelect, analysis }) {
  const getScore = (layer) => {
    if (!analysis) return 0;
    const raw = analysis[layer.dataKey] || 0;
    return layer.invert ? Math.max(0, 10 - raw) : raw;
  };

  const getSeverityBg = (score) => {
    if (score <= 3) return 'rgba(52,211,153,0.15)';
    if (score <= 6) return 'rgba(251,191,36,0.15)';
    return 'rgba(244,63,94,0.15)';
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)' }}>
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Signal Layers</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Tap to switch diagnostic overlay</p>
      </div>
      <div className="p-2 space-y-1">
        {layers.map(layer => {
          const score = getScore(layer);
          const isActive = activeLayer === layer.key;
          return (
            <motion.button
              key={layer.key}
              onClick={() => onSelect(layer.key)}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all"
              style={{
                background: isActive ? `${layer.color}22` : getSeverityBg(score),
                border: isActive ? `1.5px solid ${layer.color}` : '1.5px solid transparent',
              }}>
              <span className="text-base flex-shrink-0">{layer.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: isActive ? layer.color : '#374151' }}>{layer.label}</p>
                <div className="w-full h-1 rounded-full mt-1" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(score / 10) * 100}%`, background: layer.color }} />
                </div>
              </div>
              <span className="text-xs font-black flex-shrink-0" style={{ color: layer.color }}>{score.toFixed(1)}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: layer.color }} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}