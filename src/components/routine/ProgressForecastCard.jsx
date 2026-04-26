import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

function buildProjection(pastAnalyses = []) {
  if (pastAnalyses.length < 2) {
    const baseScore = pastAnalyses[0]?.overall_score || 60;
    return Array.from({ length: 8 }, (_, i) => ({
      week: `W${i + 1}`,
      actual: i < 2 ? baseScore + i * 2 : null,
      projected: baseScore + i * 2.5,
    }));
  }
  const scores = pastAnalyses.slice(0, 6).map((a, i) => ({ week: `W${i + 1}`, actual: a.overall_score, projected: null })).reverse();
  const lastScore = scores[scores.length - 1]?.actual || 60;
  const trend = scores.length > 1 ? (lastScore - scores[0].actual) / scores.length : 1.5;
  const projections = Array.from({ length: 4 }, (_, i) => ({
    week: `W${scores.length + i + 1}`,
    actual: null,
    projected: Math.min(99, lastScore + (i + 1) * Math.max(0.5, trend)),
  }));
  return [...scores, ...projections];
}

function getStatus(pastAnalyses = []) {
  if (pastAnalyses.length < 2) return { label: 'Tracking', color: '#9ca3af', badge: 'bg-gray-100 text-gray-600', emoji: '📊' };
  const scores = pastAnalyses.map(a => a.overall_score).filter(Boolean);
  const delta = scores[0] - scores[scores.length - 1];
  if (delta >= 10) return { label: 'On Track', color: '#34d399', badge: 'bg-emerald-100 text-emerald-700', emoji: '🚀' };
  if (delta >= 3) return { label: 'Improving', color: '#38bdf8', badge: 'bg-sky-100 text-sky-700', emoji: '📈' };
  if (delta >= 0) return { label: 'Stable', color: '#facc15', badge: 'bg-amber-100 text-amber-700', emoji: '↔️' };
  return { label: 'Needs Review', color: '#f43f5e', badge: 'bg-red-100 text-red-700', emoji: '⚠️' };
}

export default function ProgressForecastCard({ pastAnalyses = [] }) {
  const [open, setOpen] = useState(false);
  const chartData = buildProjection(pastAnalyses);
  const status = getStatus(pastAnalyses);
  const currentScore = pastAnalyses[0]?.overall_score || 0;
  const targetScore = 85;
  const weeksToGo = Math.ceil((targetScore - currentScore) / 2.5);
  const milestoneWeek = chartData.findIndex(d => (d.projected || 0) >= 80) + 1;

  return (
    <div className="rounded-2xl border-2 border-emerald-200 overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Progress Forecast</p>
            <p className="text-[10px] text-gray-400">Skin score trajectory & milestone</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${status.badge}`}>{status.emoji} {status.label}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">

              {/* Sub-cards */}
              <div className="grid grid-cols-3 gap-2">
                {/* Status */}
                <div className="rounded-xl p-3 text-center border" style={{ background: `${status.color}0e`, borderColor: `${status.color}30` }}>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Status</p>
                  <p className="text-xl">{status.emoji}</p>
                  <p className="text-[10px] font-black mt-0.5" style={{ color: status.color }}>{status.label}</p>
                </div>

                {/* Weeks to Go */}
                <div className="rounded-xl p-3 text-center bg-sky-50 border border-sky-100">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Weeks to 85</p>
                  <p className="text-2xl font-black text-sky-600">{currentScore >= targetScore ? '✓' : weeksToGo > 0 ? weeksToGo : '?'}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{currentScore >= targetScore ? 'Achieved!' : 'est.'}</p>
                </div>

                {/* Milestone */}
                <div className="rounded-xl p-3 text-center bg-violet-50 border border-violet-100">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Milestone</p>
                  <p className="text-lg"><Target className="w-5 h-5 text-violet-600 mx-auto" /></p>
                  <p className="text-[10px] font-black text-violet-700 mt-0.5">Score 80</p>
                  <p className="text-[9px] text-gray-400">Week {milestoneWeek > 0 ? milestoneWeek : '—'}</p>
                </div>
              </div>

              {/* Projection Graph */}
              <div className="rounded-xl p-3 bg-white border border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Score Projection</p>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <ReferenceLine y={85} stroke="#34d399" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: 'Target', position: 'right', fontSize: 9, fill: '#34d399' }} />
                    <Line type="monotone" dataKey="actual" stroke="#f472b6" strokeWidth={2} dot={{ r: 3, fill: '#f472b6' }} connectNulls={false} name="Actual" />
                    <Line type="monotone" dataKey="projected" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#a78bfa' }} connectNulls={false} name="Projected" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-1">
                  {[['#f472b6', 'Actual'], ['#a78bfa', 'Projected'], ['#34d399', 'Target (85)']].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1 text-[9px] text-gray-500">
                      <div className="w-3 h-0.5 rounded" style={{ background: c }} />{l}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}