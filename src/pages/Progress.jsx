import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, CheckCircle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildForecast(chartData) {
  if (!chartData.length) return [];
  const trend = chartData.length > 1
    ? (chartData[chartData.length - 1].score - chartData[0].score) / chartData.length
    : 1.5;
  const last = chartData[chartData.length - 1].score;
  return Array.from({ length: 8 }, (_, i) => ({
    week: `F${i + 1}`,
    score: null,
    forecast: Math.min(100, Math.max(0, Math.round(last + trend * (i + 1) * 0.7))),
  }));
}

const PARAMS = [
  { key: 'acne_level',   label: 'Acne',        emoji: '🔴', invertGood: true },
  { key: 'dark_spots',   label: 'Dark Spots',   emoji: '🟤', invertGood: true },
  { key: 'oiliness',    label: 'Oiliness',     emoji: '💧', invertGood: true },
  { key: 'dryness',     label: 'Dryness',      emoji: '🏜️', invertGood: true },
  { key: 'redness',     label: 'Redness',      emoji: '🌹', invertGood: true },
  { key: 'sensitivity', label: 'Sensitivity',  emoji: '⚡', invertGood: true },
  { key: 'wrinkles',    label: 'Wrinkles',     emoji: '〰️', invertGood: true },
  { key: 'pores',       label: 'Pores',        emoji: '🔬', invertGood: true },
];

function getMilestones(analyses, progressPhotos, feedbackHistory) {
  const milestones = [];
  if (analyses.length > 0) {
    milestones.push({
      id: 'start', emoji: '🌱', color: '#34d399',
      bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.22)',
      title: 'Started Barrier-Safe Routine',
      desc: `First skin analysis — Score: ${analyses[0].overall_score}/100`,
      date: analyses[0].created_date, done: true,
    });
  }
  if (progressPhotos.length > 0) {
    milestones.push({
      id: 'photos', emoji: '📸', color: '#f472b6',
      bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.22)',
      title: 'Tracking Consistently',
      desc: `${progressPhotos.length} progress photo${progressPhotos.length > 1 ? 's' : ''} logged`,
      date: progressPhotos[progressPhotos.length - 1]?.created_date, done: true,
    });
  }
  if (analyses.length >= 2) {
    const first = analyses[0].overall_score;
    const last = analyses[analyses.length - 1].overall_score;
    const delta = last - first;
    if (delta > 0) {
      milestones.push({
        id: 'improved', emoji: '✨', color: '#a78bfa',
        bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)',
        title: `Reached Level Up — +${delta.toFixed(1)} pts`,
        desc: `Skin score improved ${first} → ${last}/100. Barrier is strengthening!`,
        date: analyses[analyses.length - 1].created_date, done: true,
      });
    }
    const acneDelta = analyses[0].acne_level - analyses[analyses.length - 1].acne_level;
    if (acneDelta >= 1) {
      milestones.push({
        id: 'acne', emoji: '🎯', color: '#fb923c',
        bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)',
        title: 'Acne Reduced',
        desc: `Acne level dropped by ${acneDelta} points — routine is working!`,
        date: analyses[analyses.length - 1].created_date, done: true,
      });
    }
  }
  const currentScore = analyses.length > 0 ? analyses[analyses.length - 1].overall_score : 0;
  const nextTarget = currentScore < 80 ? 80 : currentScore < 90 ? 90 : 100;
  const trend = analyses.length > 1
    ? (currentScore - analyses[0].overall_score) / analyses.length
    : 2;
  const forecastScore = Math.min(100, Math.round(currentScore + trend * 4));
  milestones.push({
    id: 'goal', emoji: '🏆', color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)',
    title: `Next Goal — Score ${nextTarget}`,
    desc: `8-week forecast: ${forecastScore}/100. Keep your routine consistent!`,
    date: null, done: false,
  });
  return milestones;
}

function deriveImpacts(analyses, feedbackHistory) {
  const impacts = [];
  if (analyses.length >= 2) {
    const f = analyses[0], l = analyses[analyses.length - 1];
    if (f.acne_level - l.acne_level >= 1)
      impacts.push({ emoji: '✅', label: 'Barrier-safe cleanser', result: `Acne dropped ${f.acne_level - l.acne_level} pts`, positive: true });
    if (f.dryness - l.dryness >= 1)
      impacts.push({ emoji: '✅', label: 'Daily moisturizer', result: `Dryness reduced by ${f.dryness - l.dryness} pts`, positive: true });
    if (f.oiliness - l.oiliness >= 1)
      impacts.push({ emoji: '✅', label: 'BHA/Salicylic rotation', result: `Oiliness down ${f.oiliness - l.oiliness} pts`, positive: true });
    if (f.dark_spots - l.dark_spots >= 1)
      impacts.push({ emoji: '✅', label: 'Vitamin C + SPF combo', result: `Dark spots improved by ${f.dark_spots - l.dark_spots} pts`, positive: true });
    if (l.sensitivity - f.sensitivity > 1)
      impacts.push({ emoji: '⚠️', label: 'Active ingredient overuse', result: `Sensitivity rose ${l.sensitivity - f.sensitivity} pts — reduce frequency`, positive: false });
    if (l.overall_score > f.overall_score)
      impacts.push({ emoji: '🌟', label: 'Consistent routine streak', result: `Overall score +${(l.overall_score - f.overall_score).toFixed(1)} pts`, positive: true });
  }
  const positiveFeedbacks = feedbackHistory.filter(fb => (fb.feedback_codes || []).some(c => c === 1 || c === 2));
  if (positiveFeedbacks.length >= 3)
    impacts.push({ emoji: '✅', label: 'Feedback-adaptive routine', result: `${positiveFeedbacks.length} days of positive signals recorded`, positive: true });
  if (impacts.length === 0)
    impacts.push({ emoji: '🔬', label: 'Starting baseline', result: 'Keep logging daily feedback to track impact', positive: true });
  return impacts;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? payload[1]?.value;
  return (
    <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-lg border border-pink-100 text-xs">
      <p className="font-bold text-gray-600">{label}</p>
      <p className="text-pink-500 font-black text-sm mt-0.5">{val} pts</p>
    </div>
  );
}

// ─── Section: Hero Score Card ─────────────────────────────────────────────────
function HeroProgressCard({ analyses }) {
  const chartData = analyses.map((a, i) => ({
    week: `W${i + 1}`,
    score: a.overall_score,
    forecast: null,
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

  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? '#10b981' : delta < 0 ? '#f43f5e' : '#9ca3af';
  const trackLabel = delta >= 5 ? 'On Track 🚀' : delta >= 0 ? 'Stable ✅' : 'Needs Review ⚠️';
  const trackBg = delta >= 5 ? 'from-emerald-400 to-teal-500' : delta >= 0 ? 'from-blue-400 to-sky-500' : 'from-amber-400 to-orange-500';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg,#fff5fb 0%,#fdf0ff 45%,#f0f5ff 100%)',
        border: '1.5px solid rgba(244,114,182,0.15)',
        boxShadow: '0 8px 40px rgba(244,114,182,0.12), 0 2px 8px rgba(0,0,0,0.04)',
      }}>
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />

      <div className="p-5 pb-3">
        {/* Score row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Skin Progress Score</p>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-black leading-none"
                style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {currentScore}
              </span>
              <span className="text-xl text-gray-400 font-semibold mb-1">/100</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <TrendIcon className="w-4 h-4" style={{ color: trendColor }} />
              <span className="text-sm font-black" style={{ color: trendColor }}>
                {delta > 0 ? '+' : ''}{delta.toFixed(1)} pts ({pct}%)
              </span>
              <span className="text-xs text-gray-400">vs start</span>
            </div>
          </div>
          <div className={`px-5 py-2.5 rounded-2xl bg-gradient-to-br ${trackBg} text-white text-sm font-black shadow-lg`}>
            {trackLabel}
          </div>
        </div>

        {/* Mini stat chips */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'First Score', val: firstScore, color: '#f472b6', bg: 'rgba(244,114,182,0.08)', bdr: 'rgba(244,114,182,0.18)' },
            { label: 'Current',     val: currentScore, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', bdr: 'rgba(167,139,250,0.18)' },
            { label: '8-Wk Forecast', val: forecastScore, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', bdr: 'rgba(96,165,250,0.18)' },
          ].map(chip => (
            <div key={chip.label} className="rounded-2xl p-3 text-center"
              style={{ background: chip.bg, border: `1.5px solid ${chip.bdr}` }}>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-1">{chip.label}</p>
              <p className="text-2xl font-black" style={{ color: chip.color }}>{chip.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      <div className="px-3 pb-5">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Trend + 8-Week Forecast</p>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={allData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis domain={[Math.max(0, firstScore - 15), 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            {chartData.length > 0 && (
              <ReferenceLine x={`W${chartData.length}`} stroke="rgba(167,139,250,0.35)" strokeDasharray="4 2" />
            )}
            <Line type="monotone" dataKey="score" stroke="url(#heroGrad)" strokeWidth={3}
              dot={{ fill: '#f472b6', r: 4, strokeWidth: 0 }} connectNulls={false} name="Actual" />
            <Line type="monotone" dataKey="forecast" stroke="#60a5fa" strokeWidth={2}
              strokeDasharray="5 3" dot={{ fill: '#60a5fa', r: 3, strokeWidth: 0 }} connectNulls={false} name="Forecast" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 px-2 mt-1">
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

// ─── Section: Skin Changes Snapshot ──────────────────────────────────────────
function SkinChangesSnapshot({ first, latest }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="rounded-3xl p-5"
      style={{
        background: 'linear-gradient(145deg,rgba(255,255,255,0.97),rgba(248,244,255,0.92))',
        border: '1.5px solid rgba(167,139,250,0.15)',
        boxShadow: '0 4px 24px rgba(167,139,250,0.08)',
      }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-base">Skin Changes Snapshot</p>
          <p className="text-[10px] text-gray-400 mt-0.5">First analysis → Now</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5"><TrendingDown className="w-3 h-3 text-emerald-500" /> Better</span>
          <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3 text-red-400" /> Worse</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PARAMS.map((p, i) => {
          const fVal = first[p.key] ?? 0;
          const lVal = latest[p.key] ?? 0;
          const delta = lVal - fVal;
          const pct = fVal > 0 ? Math.abs(((delta / fVal) * 100)).toFixed(0) : 0;
          const improved = p.invertGood ? delta < 0 : delta > 0;
          const worsened = p.invertGood ? delta > 0 : delta < 0;
          const color = improved ? '#10b981' : worsened ? '#f43f5e' : '#9ca3af';
          const bg = improved ? 'rgba(16,185,129,0.07)' : worsened ? 'rgba(244,63,94,0.07)' : 'rgba(156,163,175,0.07)';
          const border = improved ? 'rgba(16,185,129,0.2)' : worsened ? 'rgba(244,63,94,0.2)' : 'rgba(156,163,175,0.15)';
          const Icon = delta === 0 ? Minus : improved ? TrendingDown : TrendingUp;
          return (
            <motion.div key={p.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: bg, border: `1.5px solid ${border}` }}>
              <div className="flex items-center justify-between">
                <span className="text-base">{p.emoji}</span>
                <div className="flex items-center gap-0.5" style={{ color }}>
                  <Icon className="w-3 h-3" />
                  <span className="text-[10px] font-black">{pct}%</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-gray-700">{p.label}</p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">{fVal}/10</span>
                <span className="text-[9px] text-gray-300">→</span>
                <span className="text-[10px] font-black" style={{ color }}>{lVal}/10</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                  animate={{ width: `${(lVal / 10) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.04 }}
                  style={{ background: color }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Section: Progress Timeline ───────────────────────────────────────────────
function ProgressTimeline({ analyses, progressPhotos }) {
  const milestones = getMilestones(analyses, progressPhotos, []);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="rounded-3xl p-5"
      style={{
        background: 'linear-gradient(145deg,rgba(255,255,255,0.97),rgba(255,245,255,0.92))',
        border: '1.5px solid rgba(244,114,182,0.12)',
        boxShadow: '0 4px 24px rgba(244,114,182,0.07)',
      }}>
      <p className="font-black text-base mb-5">Progress Timeline</p>
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-5 top-4 bottom-4 w-0.5"
          style={{ background: 'linear-gradient(180deg,#f472b6,#a78bfa 60%,rgba(245,158,11,0.3))' }} />
        <div className="space-y-4 pl-14">
          {milestones.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.09 }}
              className="relative">
              {/* Icon dot */}
              <div className="absolute -left-14 top-1 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm flex-shrink-0"
                style={{ background: m.bg, border: `2px solid ${m.border}`, opacity: m.done ? 1 : 0.65 }}>
                {m.emoji}
              </div>
              <div className="rounded-2xl p-3.5" style={{ background: m.bg, border: `1.5px solid ${m.border}` }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-sm" style={{ color: m.color }}>{m.title}</p>
                  {!m.done && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">Upcoming</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{m.desc}</p>
                {m.date && (
                  <p className="text-[10px] text-gray-400 mt-1">{format(new Date(m.date), 'MMM d, yyyy')}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section: Routine Impact Card ─────────────────────────────────────────────
function RoutineImpactCard({ analyses, feedbackHistory }) {
  const impacts = deriveImpacts(analyses, feedbackHistory);
  const positiveCount = impacts.filter(i => i.positive).length;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="rounded-3xl p-5"
      style={{
        background: 'linear-gradient(145deg,rgba(255,255,255,0.97),rgba(240,253,244,0.92))',
        border: '1.5px solid rgba(52,211,153,0.18)',
        boxShadow: '0 4px 24px rgba(52,211,153,0.08)',
      }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-base">Routine Change Impact</p>
          <p className="text-[10px] text-gray-400 mt-0.5">What's actually helping your skin</p>
        </div>
        <div className="px-3 py-1.5 rounded-2xl bg-emerald-100 text-emerald-700 text-xs font-black">
          {positiveCount} wins 🏆
        </div>
      </div>
      <div className="space-y-2">
        {impacts.map((impact, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            className="flex items-start gap-3 p-3 rounded-2xl"
            style={{
              background: impact.positive ? 'rgba(52,211,153,0.06)' : 'rgba(251,146,60,0.06)',
              border: `1.5px solid ${impact.positive ? 'rgba(52,211,153,0.18)' : 'rgba(251,146,60,0.18)'}`,
            }}>
            <span className="text-xl flex-shrink-0">{impact.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">{impact.label}</p>
              <p className="text-xs mt-0.5" style={{ color: impact.positive ? '#059669' : '#d97706' }}>{impact.result}</p>
            </div>
            {impact.positive && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
          </motion.div>
        ))}
      </div>
      {analyses.length < 2 && (
        <p className="text-xs text-gray-400 text-center mt-3">Complete more analyses to see detailed routine impact</p>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Progress() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, 'created_date'),
    enabled: !!user?.email,
  });

  const { data: progressPhotos = [] } = useQuery({
    queryKey: ['progressPhotos', user?.email],
    queryFn: () => base44.entities.ProgressPhoto.filter({ user_email: user.email }, 'created_date'),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 30),
    enabled: !!user?.email,
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto pt-16 text-center">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>📊</div>
        <h2 className="text-2xl font-black mb-2">Your Skin Progress</h2>
        <p className="text-gray-500 mb-6">Sign in to view your personalized skin transformation dashboard</p>
        <Button onClick={() => base44.auth.redirectToLogin()}
          className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8">
          <Sparkles className="w-4 h-4 mr-2" /> Sign In
        </Button>
      </div>
    );
  }

  const firstAnalysis = analyses.length > 0 ? analyses[0] : null;
  const latestAnalysis = analyses.length > 0 ? analyses[analyses.length - 1] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">

      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>📊</div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Skin Progress</h1>
          <p className="text-sm text-gray-500">Score · Forecast · Timeline · Impact</p>
        </div>
      </motion.div>

      {/* Empty state */}
      {analyses.length === 0 && (
        <div className="rounded-3xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(244,114,182,0.15)' }}>
          <div className="text-5xl mb-3">🔬</div>
          <p className="font-black text-lg mb-1">No skin analysis yet</p>
          <p className="text-sm text-gray-500 mb-4">Complete a skin analysis to unlock your progress dashboard</p>
          <Button onClick={() => window.location.href = '/SkinAnalysis'}
            className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
            Start Skin Analysis
          </Button>
        </div>
      )}

      {/* 1 — Hero Progress Score Card */}
      {analyses.length > 0 && <HeroProgressCard analyses={analyses} />}

      {/* 2 — Skin Changes Snapshot */}
      {analyses.length >= 2 && firstAnalysis && latestAnalysis && (
        <SkinChangesSnapshot first={firstAnalysis} latest={latestAnalysis} />
      )}

      {/* 3 — Progress Timeline */}
      {analyses.length > 0 && (
        <ProgressTimeline analyses={analyses} progressPhotos={progressPhotos} />
      )}

      {/* 4 — Routine Impact Card */}
      {analyses.length > 0 && (
        <RoutineImpactCard analyses={analyses} feedbackHistory={feedbackHistory} />
      )}
    </div>
  );
}