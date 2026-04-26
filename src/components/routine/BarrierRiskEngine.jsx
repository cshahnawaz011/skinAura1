import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, AlertOctagon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const RISK_LEVELS = [
  { max: 2.5, label: 'Stable',   color: '#34d399', bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  { max: 5,   label: 'Moderate', color: '#facc15', bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700' },
  { max: 7.5, label: 'Elevated', color: '#fb923c', bg: 'bg-orange-50',   border: 'border-orange-200',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700' },
  { max: 10,  label: 'High',     color: '#ef4444', bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700' },
];

function getRisk(score) {
  return RISK_LEVELS.find(r => score <= r.max) || RISK_LEVELS[RISK_LEVELS.length - 1];
}

function computeBarrierScore(feedbackHistory, analysis) {
  let score = 3; // baseline
  const recentCodes = feedbackHistory.flatMap(f => f.feedback_codes || []);
  recentCodes.forEach(c => {
    if (c === 4 || c === 6) score += 2.5;
    else if (c === 3 || c === 5) score += 1;
    else if (c === 1 || c === 2) score -= 0.5;
  });
  if (analysis?.sensitivity > 6) score += 1.5;
  if (analysis?.dryness > 6) score += 1;
  return Math.max(0, Math.min(10, score));
}

function buildTrendData(feedbackHistory) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (!feedbackHistory.length) {
    return days.map((d, i) => ({ day: d, risk: 3 + Math.sin(i) * 0.5 }));
  }
  return feedbackHistory.slice(0, 7).map((f, i) => {
    const codes = f.feedback_codes || [];
    let r = 3;
    codes.forEach(c => {
      if (c === 4 || c === 6) r += 2;
      else if (c === 3 || c === 5) r += 1;
      else if (c === 1 || c === 2) r -= 0.5;
    });
    return { day: days[i % 7], risk: Math.max(0, Math.min(10, r)) };
  }).reverse();
}

export default function BarrierRiskEngine({ feedbackHistory = [], analysis, userLevel = {} }) {
  const [open, setOpen] = useState(false);
  const score = computeBarrierScore(feedbackHistory, analysis);
  const risk = getRisk(score);
  const trendData = buildTrendData(feedbackHistory);

  const stableDays = feedbackHistory.filter(f =>
    (f.feedback_codes || []).every(c => c === 1 || c === 2 || c === 8)
  ).length;

  const alertStop = score >= 7.5;
  const prevScore = trendData.length > 1 ? trendData[trendData.length - 2]?.risk : score;
  const delta = score - prevScore;

  const BRIDGE_STEPS = ['Low Sensitivity', 'Stable Barrier', 'Active Ready', 'Level Up'];
  const bridgeIdx = score <= 2.5 ? 3 : score <= 5 ? 2 : score <= 7 ? 1 : 0;

  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${risk.border}`} style={{ background: 'rgba(255,255,255,0.95)' }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${risk.color}20` }}>
            <Shield className="w-4 h-4" style={{ color: risk.color }} />
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Barrier Risk Engine</p>
            <p className="text-[10px] text-gray-400">Skin shield health tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${risk.badge}`}>{risk.label}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4">

              {/* Alert Stop Banner */}
              {alertStop && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-red-700">🚨 Alert Stop — Pause actives immediately. Barrier compromised.</p>
                </div>
              )}

              {/* Sub-cards row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Risk Score */}
                <div className="rounded-xl p-3 text-center" style={{ background: `${risk.color}12`, border: `1px solid ${risk.color}30` }}>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Risk Score</p>
                  <p className="text-2xl font-black" style={{ color: risk.color }}>{score.toFixed(1)}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">/10</p>
                  <div className="flex items-center justify-center gap-0.5 mt-1" style={{ color: delta > 0 ? '#ef4444' : delta < 0 ? '#34d399' : '#9ca3af' }}>
                    {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    <span className="text-[9px] font-bold">{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
                  </div>
                </div>

                {/* Stable Days */}
                <div className="rounded-xl p-3 text-center bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Stable Days</p>
                  <p className="text-2xl font-black text-emerald-600">{stableDays}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">of {feedbackHistory.length || '—'}</p>
                  <p className="text-[9px] text-emerald-600 font-bold mt-1">✓ No damage</p>
                </div>

                {/* Alert Stop */}
                <div className={`rounded-xl p-3 text-center border ${alertStop ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Alert Stop</p>
                  <p className={`text-2xl font-black ${alertStop ? 'text-red-500' : 'text-gray-400'}`}>
                    {alertStop ? '🚨' : '✅'}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{alertStop ? 'Triggered' : 'Clear'}</p>
                  <p className={`text-[9px] font-bold mt-1 ${alertStop ? 'text-red-600' : 'text-emerald-600'}`}>
                    {alertStop ? 'Pause actives' : 'Safe zone'}
                  </p>
                </div>
              </div>

              {/* Status Bridge */}
              <div className="rounded-xl p-3 bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Status Bridge</p>
                <div className="flex items-center gap-1">
                  {BRIDGE_STEPS.map((step, i) => (
                    <React.Fragment key={step}>
                      <div className={`flex-1 text-center px-1 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
                        i === bridgeIdx ? 'text-white shadow-sm' : 'text-gray-400 bg-white border border-gray-200'
                      }`} style={i === bridgeIdx ? { background: risk.color } : {}}>
                        {step}
                      </div>
                      {i < BRIDGE_STEPS.length - 1 && <div className="w-2 h-0.5 bg-gray-200 flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Mini Trend Graph */}
              <div className="rounded-xl p-3 bg-white border border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Risk Trend</p>
                <ResponsiveContainer width="100%" height={64}>
                  <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barrierGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={risk.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={risk.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => [`${v.toFixed(1)}/10`, 'Risk']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="risk" stroke={risk.color} strokeWidth={2}
                      fill="url(#barrierGrad)" dot={{ fill: risk.color, r: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}