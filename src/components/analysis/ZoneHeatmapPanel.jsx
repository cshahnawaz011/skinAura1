import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ZONES = [
  { id: 'forehead', label: 'Forehead', emoji: '⬆️', cx: 50, cy: 20, rx: 22, ry: 10,
    signals: ['oiliness', 'acne_level', 'pores'], mods: { oiliness: 1.35, acne_level: 1.15, pores: 1.2 } },
  { id: 'nose', label: 'T-Zone / Nose', emoji: '👃', cx: 50, cy: 52, rx: 7, ry: 12,
    signals: ['oiliness', 'pores', 'acne_level'], mods: { oiliness: 1.6, pores: 1.4, acne_level: 1.25 } },
  { id: 'left_cheek', label: 'Left Cheek', emoji: '◀️', cx: 24, cy: 56, rx: 14, ry: 16,
    signals: ['dryness', 'sensitivity', 'redness'], mods: { dryness: 1.3, sensitivity: 1.2, redness: 1.15 } },
  { id: 'right_cheek', label: 'Right Cheek', emoji: '▶️', cx: 76, cy: 56, rx: 14, ry: 16,
    signals: ['dryness', 'sensitivity', 'redness'], mods: { dryness: 1.3, sensitivity: 1.2, redness: 1.15 } },
  { id: 'chin', label: 'Chin & Jaw', emoji: '⬇️', cx: 50, cy: 88, rx: 18, ry: 10,
    signals: ['acne_level', 'oiliness'], mods: { acne_level: 1.35, oiliness: 1.15 } },
  { id: 'undereye', label: 'Under Eye', emoji: '👁️', cx: 50, cy: 46, rx: 22, ry: 5,
    signals: ['dryness', 'dark_spots'], mods: { dryness: 1.45, dark_spots: 1.3 } },
];

function getZoneScore(zone, analysis) {
  if (!analysis) return 0;
  const scores = zone.signals.map(s => (analysis[s] || 0) * (zone.mods[s] || 1));
  return Math.min(10, scores.reduce((a, b) => a + b, 0) / scores.length);
}

function scoreToFill(score, alpha = true) {
  const a = alpha ? 0.08 + (score / 10) * 0.6 : 1;
  if (score <= 2) return `rgba(52,211,153,${a})`;
  if (score <= 4) return `rgba(163,230,53,${a})`;
  if (score <= 6) return `rgba(250,204,21,${a})`;
  if (score <= 8) return `rgba(251,146,60,${a})`;
  return `rgba(239,68,68,${a})`;
}

export default function ZoneHeatmapPanel({ analysis }) {
  const [selected, setSelected] = useState(null);

  const selectedZone = ZONES.find(z => z.id === selected);
  const selectedScore = selectedZone ? getZoneScore(selectedZone, analysis) : 0;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-black text-sm flex items-center gap-2">🗺️ Zone Concern Heatmap</p>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Tap zone</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* SVG face */}
        <div className="w-full max-w-[200px] mx-auto">
          <svg viewBox="0 0 100 105" className="w-full" style={{ filter: 'drop-shadow(0 4px 16px rgba(244,114,182,0.15))' }}>
            {/* Face base */}
            <ellipse cx="50" cy="55" rx="38" ry="46" fill="rgba(255,240,248,0.9)" stroke="rgba(220,150,200,0.2)" strokeWidth="0.5" />
            <ellipse cx="50" cy="16" rx="28" ry="10" fill="rgba(255,240,248,0.9)" />
            {/* Eyes */}
            <ellipse cx="34" cy="44" rx="6" ry="3" fill="rgba(60,40,80,0.12)" />
            <ellipse cx="66" cy="44" rx="6" ry="3" fill="rgba(60,40,80,0.12)" />
            <ellipse cx="34" cy="44" rx="2.5" ry="2.5" fill="rgba(40,20,60,0.3)" />
            <ellipse cx="66" cy="44" rx="2.5" ry="2.5" fill="rgba(40,20,60,0.3)" />
            <circle cx="35" cy="43" r="0.8" fill="white" opacity="0.8" />
            <circle cx="67" cy="43" r="0.8" fill="white" opacity="0.8" />
            {/* Brows */}
            <path d="M 28 39 Q 34 36 40 38" stroke="rgba(80,40,80,0.3)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M 60 38 Q 66 36 72 39" stroke="rgba(80,40,80,0.3)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            {/* Nose */}
            <path d="M 48 50 Q 45 58 47 62 M 52 50 Q 55 58 53 62" stroke="rgba(180,120,160,0.2)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <ellipse cx="47" cy="63" rx="2" ry="1.2" fill="rgba(160,100,140,0.2)" />
            <ellipse cx="53" cy="63" rx="2" ry="1.2" fill="rgba(160,100,140,0.2)" />
            {/* Lips */}
            <path d="M 41 72 Q 50 68 59 72 Q 57 78 50 80 Q 43 78 41 72 Z" fill="rgba(220,120,160,0.22)" stroke="rgba(200,100,140,0.25)" strokeWidth="0.4" />
            {/* Ears */}
            <ellipse cx="12" cy="53" rx="3.5" ry="7" fill="rgba(255,230,245,0.7)" stroke="rgba(220,160,200,0.3)" strokeWidth="0.4" />
            <ellipse cx="88" cy="53" rx="3.5" ry="7" fill="rgba(255,230,245,0.7)" stroke="rgba(220,160,200,0.3)" strokeWidth="0.4" />

            {/* Zone ellipses */}
            {ZONES.map(zone => {
              const score = getZoneScore(zone, analysis);
              const fill = scoreToFill(score);
              const stroke = scoreToFill(score, false);
              const isSelected = selected === zone.id;
              return (
                <g key={zone.id} onClick={() => setSelected(isSelected ? null : zone.id)} style={{ cursor: 'pointer' }}>
                  <ellipse cx={zone.cx} cy={zone.cy} rx={zone.rx} ry={zone.ry}
                    fill={fill} stroke={stroke} strokeWidth={isSelected ? 1.2 : 0.4}
                    strokeOpacity={isSelected ? 0.8 : 0.4}
                    style={{ filter: isSelected ? 'brightness(1.1)' : 'none' }} />
                  {isSelected && (
                    <ellipse cx={zone.cx} cy={zone.cy} rx={zone.rx + 2} ry={zone.ry + 2}
                      fill="none" stroke="#f472b6" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.7" />
                  )}
                  {score >= 5 && (
                    <text x={zone.cx} y={zone.cy + 1} textAnchor="middle" fontSize="4" fill="white" fontWeight="bold" opacity="0.9">
                      {score.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend + zone detail */}
        <div className="flex-1 space-y-2 w-full">
          {/* Color legend */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: 'Optimal', color: '#34d399' },
              { label: 'Mild', color: '#a3e635' },
              { label: 'Moderate', color: '#facc15' },
              { label: 'Elevated', color: '#fb923c' },
              { label: 'Severe', color: '#ef4444' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1 text-[9px] font-bold text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} /> {l.label}
              </div>
            ))}
          </div>

          {/* Zone list */}
          <div className="space-y-1.5">
            {ZONES.map(zone => {
              const score = getZoneScore(zone, analysis);
              const fill = scoreToFill(score, false);
              return (
                <button key={zone.id} onClick={() => setSelected(zone.id === selected ? null : zone.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left"
                  style={{ background: zone.id === selected ? `${fill}18` : 'rgba(0,0,0,0.03)', border: `1px solid ${zone.id === selected ? fill : 'transparent'}` }}>
                  <span className="text-sm">{zone.emoji}</span>
                  <p className="text-xs font-bold text-gray-700 flex-1">{zone.label}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden bg-gray-200">
                      <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, background: fill }} />
                    </div>
                    <span className="text-[11px] font-black" style={{ color: fill }}>{score.toFixed(1)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected zone detail */}
          <AnimatePresence>
            {selectedZone && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="p-3 rounded-xl" style={{ background: `${scoreToFill(selectedScore, false)}12`, border: `1px solid ${scoreToFill(selectedScore, false)}33` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-black text-xs text-gray-800">{selectedZone.emoji} {selectedZone.label}</p>
                  <button onClick={() => setSelected(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">Zone score: <strong style={{ color: scoreToFill(selectedScore, false) }}>{selectedScore.toFixed(1)}/10</strong></p>
                <div className="space-y-1">
                  {selectedZone.signals.map(sig => (
                    <div key={sig} className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 capitalize">{sig.replace('_', ' ')}</span>
                      <span className="font-black text-gray-800">{((analysis[sig] || 0) * (selectedZone.mods[sig] || 1)).toFixed(1)}/10</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}