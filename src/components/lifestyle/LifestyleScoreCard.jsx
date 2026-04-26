import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Heart, Droplets, Brain, Apple, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const METRICS = [
  { key: 'sleep_hours', label: 'Sleep', emoji: '😴', color: '#7c3aed', icon: '🌙' },
  { key: 'water_glasses', label: 'Hydration', emoji: '💧', color: '#38bdf8', icon: '💧' },
  { key: 'stress_level', label: 'Stress', emoji: '😰', color: '#f43f5e', icon: '⚡', invert: true },
  { key: 'energy_level', label: 'Energy', emoji: '⚡', color: '#f59e0b', icon: '✨' },
];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-pink-100 text-xs">
      <p className="font-bold text-gray-600">{payload[0]?.payload?.label || 'Value'}</p>
      <p className="text-pink-500 font-black text-sm mt-0.5">{payload[0]?.value}</p>
    </div>
  );
}

export default function LifestyleScoreCard({ dietLogs }) {
  // Calculate glow score
  const glowScore = useMemo(() => {
    if (!dietLogs.length) return 50;
    const latest = dietLogs[dietLogs.length - 1];
    return Math.round(
      ((latest.sleep_hours >= 7 ? 20 : (latest.sleep_hours / 7) * 20)) +
      ((8 - (latest.stress_level || 5)) / 7 * 20) +
      ((latest.water_glasses >= 8 ? 20 : (latest.water_glasses / 8) * 20)) +
      (latest.exercise_done ? 20 : 0) +
      (latest.skincare_done_morning && latest.skincare_done_night ? 20 : 0)
    );
  }, [dietLogs]);

  // Prepare chart data
  const chartData = dietLogs.slice(-7).map((log, i) => ({
    label: `Day ${i + 1}`,
    sleep: log.sleep_hours || 0,
    water: log.water_glasses || 0,
    stress: log.stress_level || 5,
    energy: log.energy_level || 5,
  }));

  const trend = dietLogs.length > 1
    ? dietLogs[dietLogs.length - 1].sleep_hours - dietLogs[0].sleep_hours
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg,#fff5fb,#fdf0ff 45%,#f0f5ff)',
        border: '1.5px solid rgba(244,114,182,0.18)',
        boxShadow: '0 8px 48px rgba(244,114,182,0.14)',
      }}
    >
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wellness Glow Score</p>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-black leading-none" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {glowScore}
              </span>
              <span className="text-xl text-gray-400 font-semibold mb-1">/100</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {trend > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : trend < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-gray-400" />}
              <span className="text-sm font-black" style={{ color: trend > 0 ? '#10b981' : trend < 0 ? '#f43f5e' : '#9ca3af' }}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)} hrs sleep trend
              </span>
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-black shadow-lg">
            {glowScore > 75 ? '💪 Thriving' : glowScore > 50 ? '✅ Good' : '⚠️ Needs Care'}
          </div>
        </div>

        {/* Metric chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Sleep', val: dietLogs[dietLogs.length - 1]?.sleep_hours || 0, max: 10, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
            { label: 'Water', val: dietLogs[dietLogs.length - 1]?.water_glasses || 0, max: 10, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
            { label: 'Stress', val: 10 - (dietLogs[dietLogs.length - 1]?.stress_level || 5), max: 10, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
            { label: 'Energy', val: dietLogs[dietLogs.length - 1]?.energy_level || 5, max: 10, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl p-3 text-center" style={{ background: m.bg, border: `1.5px solid ${m.color}40` }}>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-1">{m.label}</p>
              <p className="text-2xl font-black" style={{ color: m.color }}>{m.val.toFixed(1)}</p>
              <div className="h-1 rounded-full overflow-hidden bg-black/5 mt-1.5">
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(m.val / m.max) * 100}%` }} transition={{ duration: 0.6 }} style={{ background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pb-5">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Last 7 Days Trend</p>
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="sleep" stroke="#7c3aed" fill="url(#sleepGrad)" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}