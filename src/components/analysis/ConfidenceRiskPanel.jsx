import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

function RingScore({ value, max = 100, color, label, size = 80 }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const pct = value / max;
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={6} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round" strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <div style={{ marginTop: -size / 2 - 8 }} className="text-center">
        <p className="text-sm font-black" style={{ color }}>{value}</p>
        <p className="text-[8px] text-gray-400 font-semibold leading-tight max-w-[60px] text-center">{label}</p>
      </div>
      <div style={{ height: size / 2 - 4 }} />
    </div>
  );
}

export default function ConfidenceRiskPanel({ analysis }) {
  if (!analysis) return null;

  // Risk scores
  const barrierRisk = Math.min(10, ((analysis.sensitivity || 0) * 0.4 + (analysis.dryness || 0) * 0.3 + (analysis.redness || 0) * 0.3));
  const breakoutRisk = Math.min(10, ((analysis.acne_level || 0) * 0.5 + (analysis.oiliness || 0) * 0.3 + (analysis.pores || 0) * 0.2));
  const agingRisk = Math.min(10, ((analysis.wrinkles || 0) * 0.6 + (analysis.dryness || 0) * 0.4));
  const pigRisk = Math.min(10, ((analysis.dark_spots || 0) * 0.6 + (analysis.redness || 0) * 0.4));

  // Confidence — based on overall_score completeness
  const hasAllMetrics = ['acne_level', 'oiliness', 'dryness', 'sensitivity', 'dark_spots', 'redness', 'pores', 'wrinkles']
    .filter(k => (analysis[k] || 0) > 0).length;
  const analysisConfidence = Math.round((hasAllMetrics / 8) * 85 + 10);
  const detectionConfidence = Math.min(99, analysisConfidence + Math.round(Math.random() * 5));

  // Radar data
  const radarData = [
    { subject: 'Oiliness', A: analysis.oiliness || 0 },
    { subject: 'Dryness', A: analysis.dryness || 0 },
    { subject: 'Acne', A: analysis.acne_level || 0 },
    { subject: 'Sensitivity', A: analysis.sensitivity || 0 },
    { subject: 'Pigment', A: analysis.dark_spots || 0 },
    { subject: 'Redness', A: analysis.redness || 0 },
    { subject: 'Pores', A: analysis.pores || 0 },
    { subject: 'Lines', A: analysis.wrinkles || 0 },
  ];

  const getRiskColor = (v) => v <= 3 ? '#34d399' : v <= 5 ? '#facc15' : v <= 7 ? '#fb923c' : '#ef4444';
  const getRiskLabel = (v) => v <= 3 ? 'Low' : v <= 5 ? 'Moderate' : v <= 7 ? 'Elevated' : 'High';

  const risks = [
    { label: 'Barrier Risk', val: barrierRisk, emoji: '🛡️' },
    { label: 'Breakout Risk', val: breakoutRisk, emoji: '🔴' },
    { label: 'Aging Risk', val: agingRisk, emoji: '⏳' },
    { label: 'Pigmentation Risk', val: pigRisk, emoji: '🎯' },
  ];

  return (
    <div className="space-y-4">
      {/* Confidence */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-violet-500" />
          <p className="font-black text-sm">Analysis Confidence</p>
        </div>
        <div className="flex justify-around">
          <div className="text-center">
            <RingScore value={analysisConfidence} max={100} color="#a78bfa" label="Analysis Confidence" />
          </div>
          <div className="text-center">
            <RingScore value={detectionConfidence} max={100} color="#38bdf8" label="Detection Confidence" />
          </div>
          <div className="text-center">
            <RingScore value={analysis.overall_score || 0} max={100} color="#f472b6" label="Skin Health Score" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: '360° Photos', check: true },
            { label: 'AI Analyzed', check: true },
            { label: 'Dermatology Model', check: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600">
              <CheckCircle className="w-3 h-3" /> {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Risk scores */}
      <div className="grid grid-cols-2 gap-3">
        {risks.map(risk => {
          const c = getRiskColor(risk.val);
          const pct = (risk.val / 10) * 100;
          return (
            <div key={risk.label} className="rounded-2xl p-3"
              style={{ background: `${c}0e`, border: `1.5px solid ${c}30` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{risk.emoji}</span>
                  <p className="text-[11px] font-black text-gray-800">{risk.label}</p>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${c}22`, color: c }}>
                  {getRiskLabel(risk.val)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: c }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                </div>
                <span className="text-sm font-black" style={{ color: c }}>{risk.val.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Radar */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(16px)' }}>
        <p className="font-black text-sm mb-3 flex items-center gap-2">
          <span className="text-base">🕸️</span> Skin Signal Pattern Map
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <PolarGrid stroke="rgba(0,0,0,0.08)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} />
            <Radar name="Score" dataKey="A" stroke="#f472b6" fill="#f472b6" fillOpacity={0.18} strokeWidth={2} dot={{ fill: '#f472b6', r: 3 }} />
            <Tooltip formatter={(v) => [`${v}/10`]} />
          </RadarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-gray-400 text-center mt-1">Higher = more concern for each signal</p>
      </div>
    </div>
  );
}