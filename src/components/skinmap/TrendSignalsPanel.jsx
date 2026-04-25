import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

const TRACKED_METRICS = [
  { key: 'overall_score', label: 'Overall Score', emoji: '⭐', unit: '/100', multiplier: 1 },
  { key: 'acne_level', label: 'Acne', emoji: '🔴', unit: '/10', multiplier: 1, invert: true },
  { key: 'oiliness', label: 'Oiliness', emoji: '💦', unit: '/10', multiplier: 1, invert: true },
  { key: 'dryness', label: 'Dryness', emoji: '🏜️', unit: '/10', multiplier: 1, invert: true },
  { key: 'dark_spots', label: 'Dark Spots', emoji: '🎯', unit: '/10', multiplier: 1, invert: true },
  { key: 'sensitivity', label: 'Sensitivity', emoji: '⚡', unit: '/10', multiplier: 1, invert: true },
  { key: 'redness', label: 'Redness', emoji: '🌡️', unit: '/10', multiplier: 1, invert: true },
  { key: 'pores', label: 'Pores', emoji: '🔍', unit: '/10', multiplier: 1, invert: true },
];

function MiniSparkline({ values, color }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 80, H = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * W;
        const y = H - ((v - min) / range) * H;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

export default function TrendSignalsPanel({ pastAnalyses, feedbackHistory }) {
  const [activeMetric, setActiveMetric] = useState('overall_score');

  const sorted = [...pastAnalyses].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const getTrend = (metric) => {
    if (sorted.length < 2) return { dir: 'stable', delta: 0 };
    const first = sorted[0][metric] || 0;
    const last = sorted[sorted.length - 1][metric] || 0;
    const delta = last - first;
    const m = TRACKED_METRICS.find(m => m.key === metric);
    const improving = m?.invert ? delta < 0 : delta > 0;
    return { dir: delta === 0 ? 'stable' : improving ? 'improving' : 'declining', delta: Math.abs(delta).toFixed(1) };
  };

  const getValues = (metric) => sorted.map(a => a[metric] || 0);

  const feedbackSignalCounts = {
    positive: feedbackHistory.filter(f => (f.feedback_codes || []).some(c => [1, 2].includes(c))).length,
    damage: feedbackHistory.filter(f => (f.feedback_codes || []).some(c => [4, 5, 6].includes(c))).length,
    breakout: feedbackHistory.filter(f => (f.feedback_codes || []).some(c => [9, 10].includes(c))).length,
  };

  const trendColors = { improving: '#34d399', declining: '#f43f5e', stable: '#94a3b8' };
  const TrendIcon = { improving: TrendingUp, declining: TrendingDown, stable: Minus };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-violet-500" />
        <h2 className="font-black text-lg">Trend Signals</h2>
        {sorted.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">{sorted.length} analyses tracked</span>
        )}
      </div>

      {sorted.length < 2 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-4xl mb-3">📊</p>
          <p className="font-bold text-gray-700">Need 2+ Analyses for Trends</p>
          <p className="text-sm text-gray-400 mt-1">Run another skin analysis to see progress signals</p>
        </div>
      ) : (
        <>
          {/* Feedback signal summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Positive Days', count: feedbackSignalCounts.positive, emoji: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
              { label: 'Damage Signals', count: feedbackSignalCounts.damage, emoji: '⚠️', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
              { label: 'Breakout Days', count: feedbackSignalCounts.breakout, emoji: '🔴', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl p-3 text-center" style={{ background: item.bg, border: `1px solid ${item.color}30` }}>
                <p className="text-2xl font-black" style={{ color: item.color }}>{item.count}</p>
                <p className="text-[10px] text-gray-500 font-semibold">{item.emoji} {item.label}</p>
              </div>
            ))}
          </div>

          {/* Per-metric trend cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRACKED_METRICS.map(metric => {
              const trend = getTrend(metric.key);
              const values = getValues(metric.key);
              const Icon = TrendIcon[trend.dir];
              const trendColor = trendColors[trend.dir];
              const current = values[values.length - 1] || 0;

              return (
                <motion.div key={metric.key} whileTap={{ scale: 0.98 }}
                  className="rounded-2xl p-4 cursor-pointer transition-all"
                  style={{
                    background: activeMetric === metric.key ? `${trendColor}12` : 'rgba(255,255,255,0.85)',
                    border: `1.5px solid ${activeMetric === metric.key ? trendColor : 'rgba(0,0,0,0.06)'}`,
                    backdropFilter: 'blur(12px)'
                  }}
                  onClick={() => setActiveMetric(metric.key)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{metric.emoji}</span>
                      <p className="font-bold text-xs">{metric.label}</p>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: trendColor }}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold capitalize">{trend.dir}</span>
                      {parseFloat(trend.delta) > 0 && <span className="text-xs">({trend.delta})</span>}
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black text-gray-800">{current}<span className="text-xs text-gray-400 font-normal">{metric.unit}</span></p>
                      <p className="text-[10px] text-gray-400">
                        From {sorted[0][metric.key] || 0}{metric.unit} → {current}{metric.unit}
                      </p>
                    </div>
                    <MiniSparkline values={values} color={trendColor} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)' }}>
            <p className="font-black text-sm mb-3">📅 Analysis Timeline</p>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-3">
                {sorted.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 pl-8 relative">
                    <div className="absolute left-3 w-2 h-2 rounded-full border-2 border-white"
                      style={{ background: i === sorted.length - 1 ? '#f472b6' : '#94a3b8' }} />
                    <div className="flex-1 flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)' }}>
                      <div>
                        <p className="text-xs font-bold">{format(new Date(a.created_date), 'MMM d, yyyy')}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{a.skin_type} · {a.analysis_type === 'triple' ? '360°' : 'Standard'}</p>
                      </div>
                      <p className="text-sm font-black text-pink-500">{a.overall_score}/100</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}