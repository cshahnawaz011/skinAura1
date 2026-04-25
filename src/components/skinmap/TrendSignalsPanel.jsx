import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Area, AreaChart
} from 'recharts';

const TRACKED_METRICS = [
  { key: 'overall_score', label: 'Overall Score', emoji: '⭐', unit: '/100', color: '#f472b6', invert: false },
  { key: 'acne_level',    label: 'Acne',          emoji: '🔴', unit: '/10',  color: '#f43f5e', invert: true },
  { key: 'oiliness',     label: 'Oiliness',       emoji: '💦', unit: '/10',  color: '#facc15', invert: true },
  { key: 'dryness',      label: 'Dryness',        emoji: '🏜️', unit: '/10',  color: '#fb923c', invert: true },
  { key: 'dark_spots',   label: 'Dark Spots',     emoji: '🎯', unit: '/10',  color: '#f97316', invert: true },
  { key: 'sensitivity',  label: 'Sensitivity',    emoji: '⚡', unit: '/10',  color: '#e879f9', invert: true },
  { key: 'redness',      label: 'Redness',        emoji: '🌡️', unit: '/10',  color: '#ef4444', invert: true },
  { key: 'pores',        label: 'Pores',          emoji: '🔍', unit: '/10',  color: '#38bdf8', invert: true },
  { key: 'wrinkles',     label: 'Fine Lines',     emoji: '⏳', unit: '/10',  color: '#a78bfa', invert: true },
];

const TREND_COLORS = { improving: '#34d399', declining: '#f43f5e', stable: '#94a3b8' };

function getTrend(sorted, metricKey, invert) {
  if (sorted.length < 2) return { dir: 'stable', delta: '0.0' };
  const first = sorted[0][metricKey] || 0;
  const last  = sorted[sorted.length - 1][metricKey] || 0;
  const delta = last - first;
  const improving = invert ? delta < 0 : delta > 0;
  return {
    dir: delta === 0 ? 'stable' : improving ? 'improving' : 'declining',
    delta: Math.abs(delta).toFixed(1),
    raw: delta,
  };
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-lg text-xs font-bold"
      style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)' }}>
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}{unit}</p>
      ))}
    </div>
  );
}

export default function TrendSignalsPanel({ pastAnalyses, feedbackHistory }) {
  const [activeMetric, setActiveMetric] = useState('overall_score');

  const sorted = [...pastAnalyses].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  // Build chart-ready time series data
  const timeSeriesData = sorted.map(a => ({
    date: format(new Date(a.created_date), 'MMM d'),
    ...Object.fromEntries(TRACKED_METRICS.map(m => [m.key, a[m.key] || 0])),
  }));

  // Latest analysis snapshot for the bar chart
  const latest = sorted[sorted.length - 1];
  const snapshotData = latest
    ? TRACKED_METRICS.filter(m => m.key !== 'overall_score').map(m => ({
        name: m.label,
        emoji: m.emoji,
        value: latest[m.key] || 0,
        color: m.color,
      }))
    : [];

  const activeMeta = TRACKED_METRICS.find(m => m.key === activeMetric);
  const activeTrend = getTrend(sorted, activeMetric, activeMeta?.invert);
  const trendColor = TREND_COLORS[activeTrend.dir];
  const TrendIcon = activeTrend.dir === 'improving' ? TrendingUp : activeTrend.dir === 'declining' ? TrendingDown : Minus;

  const feedbackCounts = {
    positive: feedbackHistory.filter(f => (f.feedback_codes || []).some(c => [1, 2].includes(c))).length,
    damage:   feedbackHistory.filter(f => (f.feedback_codes || []).some(c => [4, 5, 6].includes(c))).length,
    breakout: feedbackHistory.filter(f => (f.feedback_codes || []).some(c => [9, 10].includes(c))).length,
  };

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="text-4xl mb-3">📊</p>
        <p className="font-bold text-gray-700">No Skin Analyses Yet</p>
        <p className="text-sm text-gray-400 mt-1">Run your first skin analysis to start tracking trends</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-violet-500" />
        <h2 className="font-black text-lg">Trend Signals</h2>
        <span className="ml-auto text-xs text-gray-400">{sorted.length} analyses · live data</span>
      </div>

      {/* Feedback summary pills */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Positive Days',   count: feedbackCounts.positive, emoji: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
          { label: 'Damage Signals',  count: feedbackCounts.damage,   emoji: '⚠️', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: 'Breakout Days',   count: feedbackCounts.breakout, emoji: '🔴', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl p-3 text-center" style={{ background: item.bg, border: `1px solid ${item.color}30` }}>
            <p className="text-2xl font-black" style={{ color: item.color }}>{item.count}</p>
            <p className="text-[10px] text-gray-500 font-semibold">{item.emoji} {item.label}</p>
          </div>
        ))}
      </div>

      {/* Metric selector chips */}
      <div className="flex flex-wrap gap-1.5">
        {TRACKED_METRICS.map(m => (
          <button key={m.key} onClick={() => setActiveMetric(m.key)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all"
            style={{
              background: activeMetric === m.key ? m.color : `${m.color}15`,
              color: activeMetric === m.key ? 'white' : m.color,
              border: `1px solid ${m.color}44`,
            }}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {/* Selected metric — trend line chart */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: `1.5px solid ${activeMeta?.color}33`, backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeMeta?.emoji}</span>
            <p className="font-black text-sm text-gray-800">{activeMeta?.label} Over Time</p>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: trendColor }}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs font-black capitalize">{activeTrend.dir}</span>
            {parseFloat(activeTrend.delta) > 0 && (
              <span className="text-xs font-bold">({activeTrend.raw > 0 ? '+' : ''}{activeTrend.raw.toFixed(1)})</span>
            )}
          </div>
        </div>

        {sorted.length < 2 ? (
          <div className="h-36 flex items-center justify-center text-sm text-gray-400">
            Run 2+ analyses to see the trend line
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={timeSeriesData} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={activeMeta?.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={activeMeta?.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={activeMetric === 'overall_score' ? [0, 100] : [0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip unit={activeMeta?.unit} />} />
              <Area
                type="monotone"
                dataKey={activeMetric}
                name={activeMeta?.label}
                stroke={activeMeta?.color}
                strokeWidth={2.5}
                fill={`url(#grad-${activeMetric})`}
                dot={{ fill: activeMeta?.color, r: 4, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Latest snapshot — all metrics bar chart */}
      {latest && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-sm text-gray-800">Latest Skin Snapshot</p>
            <span className="text-[10px] text-gray-400">{format(new Date(latest.created_date), 'MMM d, yyyy')}</span>
          </div>

          {/* Overall score big display */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(244,114,182,0.08)' }}>
            <div className="text-3xl font-black text-pink-500">{latest.overall_score || 0}</div>
            <div>
              <p className="text-xs font-black text-gray-700">Overall Skin Score</p>
              <p className="text-[10px] text-gray-400 capitalize">{latest.skin_type} · {latest.skin_tone || '—'}</p>
            </div>
            <div className="ml-auto w-16">
              <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                <motion.div className="h-full rounded-full bg-pink-400"
                  initial={{ width: 0 }} animate={{ width: `${latest.overall_score || 0}%` }} transition={{ duration: 0.8 }} />
              </div>
              <p className="text-[9px] text-gray-400 mt-0.5 text-right">/100</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={snapshotData} margin={{ top: 0, right: 0, left: -28, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = snapshotData.find(s => s.name === payload[0]?.payload?.name);
                return (
                  <div className="px-3 py-2 rounded-xl shadow-lg text-xs font-bold" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <p style={{ color: d?.color }}>{d?.emoji} {d?.name}: {payload[0]?.value}/10</p>
                  </div>
                );
              }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {snapshotData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Analysis timeline */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)' }}>
        <p className="font-black text-sm mb-3">📅 Analysis Timeline</p>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-3">
            {sorted.map((a, i) => {
              const prev = sorted[i - 1];
              const delta = prev ? (a.overall_score || 0) - (prev.overall_score || 0) : null;
              return (
                <div key={a.id} className="flex items-center gap-3 pl-8 relative">
                  <div className="absolute left-3 w-2 h-2 rounded-full border-2 border-white"
                    style={{ background: i === sorted.length - 1 ? '#f472b6' : '#94a3b8' }} />
                  <div className="flex-1 flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)' }}>
                    <div>
                      <p className="text-xs font-bold">{format(new Date(a.created_date), 'MMM d, yyyy')}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{a.skin_type} · {a.analysis_type === 'triple' ? '360°' : 'Standard'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {delta !== null && (
                        <span className="text-[10px] font-black" style={{ color: delta >= 0 ? '#34d399' : '#f43f5e' }}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(0)}
                        </span>
                      )}
                      <p className="text-sm font-black text-pink-500">{a.overall_score}/100</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}