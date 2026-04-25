import React from 'react';
import { motion } from 'framer-motion';

export default function SignalHeatmapLegend({ activeLayer, score, layerConfig }) {
  const color = layerConfig?.color || '#f472b6';
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));

  const THRESHOLDS = [
    { label: 'Optimal', from: 0, to: 20, color: '#34d399' },
    { label: 'Mild', from: 20, to: 40, color: '#a3e635' },
    { label: 'Moderate', from: 40, to: 60, color: '#facc15' },
    { label: 'Elevated', from: 60, to: 80, color: '#fb923c' },
    { label: 'Severe', from: 80, to: 100, color: '#ef4444' },
  ];

  const current = THRESHOLDS.find(t => pct >= t.from && pct < t.to) || THRESHOLDS[4];

  return (
    <div className="mt-4 space-y-2 px-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{layerConfig?.emoji}</span>
          <p className="text-xs font-black text-gray-700">{layerConfig?.label} Signal</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: current.color }} />
          <span className="text-xs font-black" style={{ color: current.color }}>{current.label}</span>
          <span className="text-xs font-black ml-1" style={{ color }}>{score?.toFixed(1)}/10</span>
        </div>
      </div>

      {/* Gradient track */}
      <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
        {/* Segment fills */}
        <div className="absolute inset-0 rounded-full overflow-hidden flex">
          {THRESHOLDS.map((t, i) => (
            <div key={i} style={{ flex: 1, background: `${t.color}40` }} />
          ))}
        </div>
        {/* Active fill */}
        <motion.div className="absolute left-0 top-0 bottom-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}55, ${color})` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
        {/* Indicator needle */}
        <motion.div className="absolute top-0 bottom-0 w-1 rounded-full shadow-lg"
          style={{ background: 'white', border: `2px solid ${color}` }}
          animate={{ left: `calc(${pct}% - 2px)` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>

      {/* Threshold labels */}
      <div className="flex justify-between px-0.5">
        {THRESHOLDS.map((t, i) => (
          <div key={i} className="text-center flex-1">
            <p className="text-[9px] font-bold" style={{ color: t.color }}>{t.label}</p>
            <p className="text-[8px] text-gray-300">{t.from/10}–{t.to/10}</p>
          </div>
        ))}
      </div>

      {/* Context message */}
      <div className="text-center py-1.5 px-3 rounded-xl text-[11px] font-semibold"
        style={{ background: `${current.color}12`, color: current.color, border: `1px solid ${current.color}30` }}>
        {pct <= 20 && `✅ ${layerConfig?.label} levels are optimal — maintain current routine.`}
        {pct > 20 && pct <= 40 && `🟡 Mild ${layerConfig?.label} signal — monitor and consider preventive steps.`}
        {pct > 40 && pct <= 60 && `⚠️ Moderate ${layerConfig?.label} detected — targeted treatment recommended.`}
        {pct > 60 && pct <= 80 && `🟠 Elevated ${layerConfig?.label} signal — active intervention needed.`}
        {pct > 80 && `🔴 Severe ${layerConfig?.label} signal — consult a dermatologist.`}
      </div>
    </div>
  );
}