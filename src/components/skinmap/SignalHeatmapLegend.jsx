import React from 'react';

export default function SignalHeatmapLegend({ activeLayer, score, layerConfig }) {
  const steps = [
    { label: 'Optimal', range: '0-2', alpha: 0.15 },
    { label: 'Mild', range: '3-4', alpha: 0.3 },
    { label: 'Moderate', range: '5-6', alpha: 0.5 },
    { label: 'Elevated', range: '7-8', alpha: 0.7 },
    { label: 'Severe', range: '9-10', alpha: 0.9 },
  ];

  const color = layerConfig?.color || '#f472b6';

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{layerConfig?.emoji} {layerConfig?.label} Intensity Scale</p>
        <p className="text-[10px] text-gray-400">Current: <span className="font-black" style={{ color }}>{score?.toFixed(1)}/10</span></p>
      </div>
      {/* Gradient bar */}
      <div className="relative">
        <div className="w-full h-3 rounded-full" style={{
          background: `linear-gradient(to right, ${color}20, ${color}40, ${color}70, ${color}bb, ${color}ee)`
        }} />
        {/* Indicator */}
        <div className="absolute top-0 h-3 w-1 rounded-full bg-gray-800 dark:bg-white transform -translate-x-1/2 transition-all"
          style={{ left: `${Math.min(98, Math.max(2, (score / 10) * 100))}%` }} />
      </div>
      <div className="flex justify-between">
        {steps.map(s => (
          <div key={s.label} className="text-center flex-1">
            <p className="text-[9px] text-gray-400 font-semibold">{s.label}</p>
            <p className="text-[8px] text-gray-300">{s.range}</p>
          </div>
        ))}
      </div>
    </div>
  );
}