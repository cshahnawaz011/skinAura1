import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Shield, Zap, AlertTriangle } from 'lucide-react';
import { FREQUENCY_LADDER, PHASES } from '@/lib/adaptiveRoutineEngine';

export default function AdaptiveRoutineCard({ 
  phase, frequencyId, responseScore, irritationRisk, 
  recommendation, streakDays, exposureCount, recoveryMode 
}) {
  const freq = FREQUENCY_LADDER.find(f => f.id === frequencyId) || FREQUENCY_LADDER[1];
  const phaseInfo = PHASES[phase] || PHASES[2];
  const freqIdx = FREQUENCY_LADDER.findIndex(f => f.id === frequencyId);

  const recIcons = {
    increase: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />,
    hold:     <Minus className="w-3.5 h-3.5 text-blue-400" />,
    reduce:   <TrendingDown className="w-3.5 h-3.5 text-orange-400" />,
    recovery: <Shield className="w-3.5 h-3.5 text-red-500" />,
  };
  const recColors = { increase: '#34d399', hold: '#38bdf8', reduce: '#fb923c', recovery: '#ef4444' };
  const recLabels = { increase: 'Ready to progress', hold: 'Hold current pace', reduce: 'Ease back', recovery: 'Recovery needed' };

  const scoreColor = responseScore >= 75 ? '#34d399' : responseScore >= 50 ? '#facc15' : '#ef4444';
  const riskColor = irritationRisk <= 3 ? '#34d399' : irritationRisk <= 6 ? '#facc15' : '#ef4444';

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${recoveryMode ? '#ef4444' : phaseInfo.color}30`, background: recoveryMode ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.95)', boxShadow: `0 4px 20px ${phaseInfo.color}18` }}>
      {/* Top gradient bar */}
      <div className="h-1 w-full" style={{ background: recoveryMode ? 'linear-gradient(90deg,#ef4444,#fb923c)' : `linear-gradient(90deg,${phaseInfo.color},#f472b6)` }} />
      
      <div className="p-4">
        {/* Phase + Recovery */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${phaseInfo.color}20`, color: phaseInfo.color }}>{phaseInfo.label}</span>
            <span className="text-[10px] text-gray-500 font-semibold">{phaseInfo.name}</span>
          </div>
          {recoveryMode && (
            <div className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" /> Recovery Mode
            </div>
          )}
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Frequency */}
          <div className="p-2.5 rounded-xl bg-gray-50">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Frequency</p>
            <p className="text-sm font-black text-gray-800">{freq.label}</p>
            {/* Ladder visual */}
            <div className="flex gap-0.5 mt-1.5">
              {FREQUENCY_LADDER.map((f, i) => (
                <div key={f.id} className="h-1.5 flex-1 rounded-full transition-all" style={{ background: i <= freqIdx ? phaseInfo.color : 'rgba(0,0,0,0.1)' }} />
              ))}
            </div>
          </div>

          {/* Response Score */}
          <div className="p-2.5 rounded-xl bg-gray-50">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Skin Response</p>
            <p className="text-sm font-black" style={{ color: scoreColor }}>{responseScore}/100</p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5">
              <motion.div className="h-full rounded-full" style={{ background: scoreColor }} initial={{ width: 0 }} animate={{ width: `${responseScore}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>

          {/* Irritation Risk */}
          <div className="p-2.5 rounded-xl bg-gray-50">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Irritation Risk</p>
            <p className="text-sm font-black" style={{ color: riskColor }}>{irritationRisk}/10</p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5">
              <motion.div className="h-full rounded-full" style={{ background: riskColor }} initial={{ width: 0 }} animate={{ width: `${irritationRisk * 10}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>

          {/* Streak */}
          <div className="p-2.5 rounded-xl bg-gray-50">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Streak</p>
            <p className="text-sm font-black text-gray-800">{streakDays || 0} days</p>
            <p className="text-[9px] text-gray-400 mt-0.5">{exposureCount || 0} exposures</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${recColors[recommendation]}12`, border: `1px solid ${recColors[recommendation]}30` }}>
          {recIcons[recommendation]}
          <div>
            <p className="text-[10px] font-black" style={{ color: recColors[recommendation] }}>{recLabels[recommendation]}</p>
            <p className="text-[9px] text-gray-500">{phaseInfo.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}