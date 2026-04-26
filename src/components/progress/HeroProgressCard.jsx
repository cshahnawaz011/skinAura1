import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function buildForecast(chartData) {
  if (!chartData.length) return [];
  const last = chartData[chartData.length - 1];
  const trend = chartData.length > 1
    ? (chartData[chartData.length - 1].score - chartData[0].score) / chartData.length
    : 1.5;
  const forecast = [];
  for (let i = 1; i <= 8; i++) {
    forecast.push({
      week: `F${i}`,
      score: null,
      forecast: Math.min(100, Math.max(0, Math.round(last.score + trend * i * 0.7))),
    });
  }
  return forecast;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const val = payload[0].value ?? payload[1]?.value;
    return (
      <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-lg border border-pink-100 text-xs">
        <p className="font-bold text-gray-700">{label}</p>
        <p className="text-pink-500 font-black text-sm">{val} pts</p>
      </div>
    );
  }
  return null;
};

export default function HeroProgressCard({ analyses = [] }) {
  const chartData = analyses.map((a, i) => ({
    week: `W${i + 1}`,
    score: a.overall_score,
    date: a.created_date ? new Date(a.created_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : `W${i + 1}`,
  }));

  const forecastData = buildForecast(chartData);
  const allData = [
    ...chartData.map(d => ({ ...d, forecast: null })),
    ...forecastData,
  ];

  const currentScore = analyses.length > 0 ? analyses[analyses.length - 1].overall_score : 0;
  const firstScore = analyses.length > 0 ? analyses[0].overall_score : 0;
  const delta = currentScore - firstScore;
  const pct = firstScore > 0 ? ((Math.abs(delta) / firstScore) * 100).toFixed(1) : '0';
  const forecastScore = forecastData.length > 0 ? forecastData[forecastData.length - 1].forecast : currentScore;

  const isImproving = delta >= 0;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? '#10b981' : delta < 0 ? '#f43f5e' : '#9ca3af';

  const trackLabel = delta >= 5 ? 'On Track 🚀' : delta >= 0 ? 'Stable ✅' : 'Needs Review ⚠️';
  const trackBg = delta >= 5 ? 'from-emerald-400 to-teal-400' : delta >= 0 ? 'from-blue-400 to-sky-400' : 'from-amber-400 to-orange-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #fff5fb 0%, #fdf0ff 40%, #f5f0ff 100%)',
        border: '1.5px solid rgba(244,114,182,0.18)',
        boxShadow: '0 8px 40px rgba(244,114,182,0.12), 0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top gradient bar */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />

      <div className="p-5 pb-3">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Skin Progress Score</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {currentScore}
              </span>
              <span className="text-lg text-gray-400 font-semibold mb-1">/100</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendIcon className="w-4 h-4" style={{ color: trendColor }} />
              <span className="text-sm font-bold" style={{ color: trendColor }}>
                {delta > 0 ? '+' : ''}{delta.toFixed(1)} pts ({pct}%)
              </span>
              <span className="text-xs text-gray-400">vs start</span>
            </div>
          </div>

          {/* On Track Pill */}
          <div className={`px-4 py-2 rounded-2xl bg-gradient-to-br ${trackBg} text-white text-xs font-black shadow-md`}>
            {trackLabel}
          </div>
        </div>

        {/* Stat chips */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.15)' }}>
            <p className="text-[10px] text-gray-400 font-semibold mb-0.5">First Score</p>
            <p className="text-xl font-black text-pink-500">{firstScore}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
            <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Now</p>
            <p className="text-xl font-black text-violet-500">{currentScore}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
            <p className="text-[10px] text-gray-400 font-semibold mb-0.5">8-Wk Forecast</p>
            <p className="text-xl font-black text-blue-500">{forecastScore}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Trend + 8-Week Forecast</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={allData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis domain={[Math.max(0, (firstScore || 50) - 20), 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {chartData.length > 0 && (
              <ReferenceLine x={`W${chartData.length}`} stroke="rgba(167,139,250,0.4)" strokeDasharray="4 2" />
            )}
            <Line type="monotone" dataKey="score" stroke="url(#scoreGrad)" strokeWidth={3}
              dot={{ fill: '#f472b6', r: 4, strokeWidth: 0 }} connectNulls={false} name="Actual" />
            <Line type="monotone" dataKey="forecast" stroke="#60a5fa" strokeWidth={2}
              strokeDasharray="5 3" dot={{ fill: '#60a5fa', r: 3, strokeWidth: 0 }} connectNulls={false} name="Forecast" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 px-3 mt-1">
          {[['#f472b6', 'Actual'], ['#60a5fa', '8-Wk Forecast']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1 text-[9px] text-gray-400">
              <div className="w-3 h-0.5 rounded" style={{ background: c }} />{l}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}