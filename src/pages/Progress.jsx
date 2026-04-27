import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, CheckCircle, Sparkles,
  Camera, Plus, X, Upload, Droplets, Brain, Leaf, Trophy,
  ChevronLeft, ChevronRight, Loader2, ZoomIn, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';
import { computeUserLevel } from '@/lib/routineAdaptation';
import PageIntroPopup from '@/components/PageIntroPopup';

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
  { key: 'acne_level',   label: 'Acne',       emoji: '🔴', invertGood: true },
  { key: 'dark_spots',   label: 'Dark Spots',  emoji: '🟤', invertGood: true },
  { key: 'oiliness',    label: 'Oiliness',    emoji: '💧', invertGood: true },
  { key: 'dryness',     label: 'Dryness',     emoji: '🏜️', invertGood: true },
  { key: 'redness',     label: 'Redness',     emoji: '🌹', invertGood: true },
  { key: 'sensitivity', label: 'Sensitivity', emoji: '⚡', invertGood: true },
  { key: 'wrinkles',    label: 'Wrinkles',    emoji: '〰️', invertGood: true },
  { key: 'pores',       label: 'Pores',       emoji: '🔬', invertGood: true },
];

function getMilestones(analyses, progressPhotos, feedbackHistory, savedRoutine, challenges, goals) {
  const milestones = [];

  if (analyses.length > 0) {
    milestones.push({
      id: 'start', emoji: '🌱', color: '#34d399',
      bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)',
      title: 'Started Barrier-Safe Routine',
      desc: `First skin analysis done — Score: ${analyses[0].overall_score}/100 · ${analyses[0].skin_type || 'skin'} type detected`,
      date: analyses[0].created_date, done: true,
    });
  }

  if (savedRoutine) {
    milestones.push({
      id: 'routine', emoji: '✨', color: '#f472b6',
      bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.22)',
      title: 'AI Routine Generated',
      desc: `Personalized ${savedRoutine.routine_type || 'morning'} routine saved — ${savedRoutine.skin_type || ''} skin protocol active`,
      date: savedRoutine.created_date, done: true,
    });
  }

  if (feedbackHistory.length >= 5) {
    const posCount = feedbackHistory.filter(f => (f.feedback_codes || []).some(c => c === 1 || c === 2)).length;
    milestones.push({
      id: 'feedback', emoji: '📋', color: '#a78bfa',
      bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)',
      title: 'Consistent Feedback Logging',
      desc: `${feedbackHistory.length} days tracked · ${posCount} positive signal days · routine adapting`,
      date: feedbackHistory[0]?.date ? feedbackHistory[0].date + 'T00:00:00' : null, done: true,
    });
  }

  if (progressPhotos.length > 0) {
    milestones.push({
      id: 'photos', emoji: '📸', color: '#60a5fa',
      bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.22)',
      title: 'Visual Progress Documented',
      desc: `${progressPhotos.length} progress photo${progressPhotos.length > 1 ? 's' : ''} captured`,
      date: progressPhotos[progressPhotos.length - 1]?.created_date, done: true,
    });
  }

  if (analyses.length >= 2) {
    const first = analyses[0].overall_score;
    const last = analyses[analyses.length - 1].overall_score;
    const delta = last - first;
    if (delta > 0) {
      milestones.push({
        id: 'improved', emoji: '🚀', color: '#a78bfa',
        bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)',
        title: `Skin Level Up — +${delta.toFixed(1)} pts`,
        desc: `Score improved ${first} → ${last}/100. Barrier is visibly stronger!`,
        date: analyses[analyses.length - 1].created_date, done: true,
      });
    }
    const acneDelta = (analyses[0].acne_level || 0) - (analyses[analyses.length - 1].acne_level || 0);
    if (acneDelta >= 1) {
      milestones.push({
        id: 'acne', emoji: '🎯', color: '#fb923c',
        bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)',
        title: 'Acne Reduced',
        desc: `Acne level dropped by ${acneDelta} pts — routine actives are working!`,
        date: analyses[analyses.length - 1].created_date, done: true,
      });
    }
  }

  const activeChallenge = challenges.find(c => c.status === 'active');
  if (activeChallenge) {
    const daysCompleted = (activeChallenge.completed_days || []).length;
    milestones.push({
      id: 'challenge', emoji: '⚡', color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)',
      title: `21-Day Challenge: ${activeChallenge.goal}`,
      desc: `${daysCompleted}/21 days completed · ${activeChallenge.total_points || 0} points earned`,
      date: activeChallenge.created_date, done: true,
    });
  }

  const activeGoal = goals.find(g => g.status === 'active');
  const currentScore = analyses.length > 0 ? analyses[analyses.length - 1].overall_score : 0;
  const nextTarget = currentScore < 80 ? 80 : currentScore < 90 ? 90 : 100;
  const trend = analyses.length > 1 ? (currentScore - analyses[0]?.overall_score) / analyses.length : 2;
  const forecastScore = Math.min(100, Math.round(currentScore + trend * 4));

  milestones.push({
    id: 'goal', emoji: '🏆', color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)',
    title: activeGoal ? activeGoal.title : `Next Goal — Score ${nextTarget}`,
    desc: activeGoal
      ? `${activeGoal.goal} · ${activeGoal.progress || 0}% progress`
      : `8-week forecast: ${forecastScore}/100. Keep your routine consistent!`,
    date: null, done: false,
  });

  return milestones;
}

function deriveImpacts(analyses, feedbackHistory, savedRoutine, dietLogs, savedProducts) {
  const impacts = [];

  if (analyses.length >= 2) {
    const f = analyses[0], l = analyses[analyses.length - 1];
    if ((f.acne_level || 0) - (l.acne_level || 0) >= 1)
      impacts.push({ emoji: '✅', label: 'Barrier-safe cleanser in routine', result: `Acne dropped ${(f.acne_level || 0) - (l.acne_level || 0)} pts`, positive: true });
    if ((f.dryness || 0) - (l.dryness || 0) >= 1)
      impacts.push({ emoji: '✅', label: 'Daily moisturizer', result: `Dryness reduced by ${(f.dryness || 0) - (l.dryness || 0)} pts`, positive: true });
    if ((f.oiliness || 0) - (l.oiliness || 0) >= 1)
      impacts.push({ emoji: '✅', label: 'BHA / Salicylic rotation', result: `Oiliness down ${(f.oiliness || 0) - (l.oiliness || 0)} pts`, positive: true });
    if ((f.dark_spots || 0) - (l.dark_spots || 0) >= 1)
      impacts.push({ emoji: '✅', label: 'Vitamin C + SPF combo', result: `Dark spots improved by ${(f.dark_spots || 0) - (l.dark_spots || 0)} pts`, positive: true });
    if ((l.sensitivity || 0) - (f.sensitivity || 0) > 1)
      impacts.push({ emoji: '⚠️', label: 'Active ingredient overuse', result: `Sensitivity rose — reduce frequency`, positive: false });
    if ((l.overall_score || 0) > (f.overall_score || 0))
      impacts.push({ emoji: '🌟', label: 'Consistent routine streak', result: `Overall score +${((l.overall_score || 0) - (f.overall_score || 0)).toFixed(1)} pts`, positive: true });
  }

  const positiveFeedbacks = feedbackHistory.filter(fb => (fb.feedback_codes || []).some(c => c === 1 || c === 2));
  if (positiveFeedbacks.length >= 3)
    impacts.push({ emoji: '✅', label: 'Feedback-adaptive routine', result: `${positiveFeedbacks.length} days of positive skin signals`, positive: true });

  // Diet impact
  const waterLogs = dietLogs.filter(d => (d.water_glasses || 0) >= 8);
  if (waterLogs.length >= 5)
    impacts.push({ emoji: '💧', label: 'Hydration habit (8+ glasses)', result: `${waterLogs.length} days of great hydration logged`, positive: true });

  const sleepLogs = dietLogs.filter(d => (d.sleep_hours || 0) >= 7);
  if (sleepLogs.length >= 5)
    impacts.push({ emoji: '😴', label: 'Quality sleep routine', result: `${sleepLogs.length} days of 7+ hrs sleep — skin regenerating`, positive: true });

  const sunscreenDays = dietLogs.filter(d => d.sunscreen_applied).length;
  if (sunscreenDays >= 5)
    impacts.push({ emoji: '☀️', label: 'SPF habit established', result: `Sunscreen applied ${sunscreenDays} days — dark spots protected`, positive: true });

  // Products impact
  if (savedProducts.length > 0)
    impacts.push({ emoji: '🧴', label: `${savedProducts.length} products in shelf`, result: 'Personalized stack tracked — AI monitoring compatibility', positive: true });

  if (impacts.length === 0)
    impacts.push({ emoji: '🔬', label: 'Starting baseline', result: 'Keep logging daily feedback to track routine impact', positive: true });

  return impacts;
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? payload[1]?.value;
  return (
    <div className="bg-white px-3 py-2 rounded-2xl shadow-lg border border-pink-100 text-xs">
      <p className="font-bold text-gray-600">{label}</p>
      <p className="text-pink-500 font-black text-sm mt-0.5">{val} pts</p>
    </div>
  );
}

// ─── 1. Hero Score Card ───────────────────────────────────────────────────────
function HeroProgressCard({ analyses, feedbackHistory, dietLogs }) {
  const chartData = analyses.map((a, i) => ({
    week: `W${i + 1}`,
    score: a.overall_score,
    forecast: null,
  }));
  const forecastData = buildForecast(chartData);
  const allData = [...chartData.map(d => ({ ...d, forecast: null })), ...forecastData];

  const currentScore = analyses.length > 0 ? analyses[analyses.length - 1].overall_score : 0;
  const firstScore = analyses.length > 0 ? analyses[0].overall_score : 0;
  const delta = currentScore - firstScore;
  const pct = firstScore > 0 ? ((Math.abs(delta) / firstScore) * 100).toFixed(1) : '0';
  const forecastScore = forecastData.length > 0 ? forecastData[forecastData.length - 1].forecast : currentScore;

  const userLevel = computeUserLevel([...feedbackHistory].slice(0, 14));
  const posStreak = feedbackHistory.filter(fb => (fb.feedback_codes || []).some(c => c === 1 || c === 2)).length;
  const avgWater = dietLogs.length > 0 ? (dietLogs.reduce((s, d) => s + (d.water_glasses || 0), 0) / dietLogs.length).toFixed(1) : '—';
  const avgSleep = dietLogs.length > 0 ? (dietLogs.reduce((s, d) => s + (d.sleep_hours || 0), 0) / dietLogs.length).toFixed(1) : '—';

  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? '#10b981' : delta < 0 ? '#f43f5e' : '#9ca3af';
  const trackLabel = delta >= 5 ? 'On Track 🚀' : delta >= 0 ? 'Stable ✅' : 'Needs Review ⚠️';
  const trackBg = delta >= 5 ? 'from-emerald-400 to-teal-500' : delta >= 0 ? 'from-blue-400 to-sky-500' : 'from-amber-400 to-orange-500';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg,#fff5fb,#fdf0ff 45%,#f0f5ff)',
        border: '1.5px solid rgba(244,114,182,0.18)',
        boxShadow: '0 8px 48px rgba(244,114,182,0.14), 0 2px 8px rgba(0,0,0,0.04)',
      }}>
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
      <div className="p-5 pb-3">
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
          <div className={`px-4 py-2.5 rounded-2xl bg-gradient-to-br ${trackBg} text-white text-sm font-black shadow-lg`}>
            {trackLabel}
          </div>
        </div>

        {/* Score chips */}
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

        {/* Lifestyle mini row */}
        {dietLogs.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-1">
            {[
              { emoji: '💧', label: 'Avg Water', val: `${avgWater}g` },
              { emoji: '😴', label: 'Avg Sleep', val: `${avgSleep}h` },
              { emoji: '📋', label: 'Feedback', val: `${posStreak}d` },
              { emoji: '⚡', label: 'Level', val: userLevel.currentLevel.replace('Level ', 'L') },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2 text-center bg-white/60 border border-white/80">
                <p className="text-base">{s.emoji}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
                <p className="text-xs font-black text-gray-700">{s.val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
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

// ─── 2. Skin Changes Snapshot ─────────────────────────────────────────────────
function SkinChangesSnapshot({ first, latest }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
      className="rounded-3xl p-5"
      style={{
        background: 'linear-gradient(145deg,#ffffff,#f8f4ff)',
        border: '1.5px solid rgba(167,139,250,0.18)',
        boxShadow: '0 4px 24px rgba(167,139,250,0.09)',
      }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-base">Skin Changes Snapshot</p>
          <p className="text-[10px] text-gray-400 mt-0.5">First analysis → Now</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-emerald-500" />Better</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-red-400" />Worse</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PARAMS.map((p, i) => {
          const fVal = first[p.key] ?? 0;
          const lVal = latest[p.key] ?? 0;
          const delta = lVal - fVal;
          const pct = fVal > 0 ? Math.abs(((delta / fVal) * 100)).toFixed(0) : '—';
          const improved = p.invertGood ? delta < 0 : delta > 0;
          const worsened = p.invertGood ? delta > 0 : delta < 0;
          const color = improved ? '#10b981' : worsened ? '#f43f5e' : '#9ca3af';
          const bg = improved ? 'rgba(16,185,129,0.07)' : worsened ? 'rgba(244,63,94,0.07)' : 'rgba(156,163,175,0.06)';
          const border = improved ? 'rgba(16,185,129,0.2)' : worsened ? 'rgba(244,63,94,0.2)' : 'rgba(156,163,175,0.14)';
          const Icon = delta === 0 ? Minus : improved ? TrendingDown : TrendingUp;
          return (
            <motion.div key={p.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: bg, border: `1.5px solid ${border}` }}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{p.emoji}</span>
                <div className="flex items-center gap-0.5" style={{ color }}>
                  <Icon className="w-3 h-3" />
                  <span className="text-[10px] font-black">{pct}{pct !== '—' ? '%' : ''}</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-gray-700">{p.label}</p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">{fVal}/10</span>
                <span className="text-[9px] text-gray-300">→</span>
                <span className="text-[10px] font-black" style={{ color }}>{lVal}/10</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-black/5">
                <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                  animate={{ width: `${(lVal / 10) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04 }}
                  style={{ background: color }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Photo Grid with Lightbox ─────────────────────────────────────────────────
function PhotoGrid({ progressPhotos, analyses }) {
  const [lightbox, setLightbox] = useState(null);

  // Merge analysis photos automatically
  const analysisPhotos = analyses
    .filter(a => a.photo_url)
    .map(a => ({
      id: 'analysis_' + a.id,
      photo_url: a.photo_url,
      skin_score: a.overall_score,
      created_date: a.created_date,
      source: 'analysis',
      label: `Analysis · ${a.overall_score}/100`,
    }));

  const allPhotos = [
    ...progressPhotos.map(p => ({ ...p, source: 'manual', label: `Week ${p.week_number}` })),
    ...analysisPhotos.filter(ap => !progressPhotos.some(pp => pp.photo_url === ap.photo_url)),
  ].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  if (!allPhotos.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
      className="rounded-3xl p-5"
      style={{ background: '#ffffff', border: '1.5px solid rgba(96,165,250,0.18)', boxShadow: '0 4px 24px rgba(96,165,250,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-base">📸 Progress Photos</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Manual uploads + auto-synced from analyses</p>
        </div>
        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-600">{allPhotos.length} total</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {allPhotos.map((photo, i) => {
          const isLatest = i === allPhotos.length - 1;
          return (
            <div key={photo.id} className="relative flex-shrink-0 w-32 cursor-pointer"
              onClick={() => setLightbox(photo)}>
              <div className={`rounded-2xl overflow-hidden border-2 hover:scale-105 transition-transform ${
                isLatest ? 'border-pink-400 shadow-md shadow-pink-200/40' : 'border-gray-200'
              }`}>
                <div className="relative">
                  <img src={photo.photo_url} alt={photo.label} className="w-full h-28 object-cover" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gray-800/80 text-white">START</span>}
                  {isLatest && <span className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-pink-500 text-white">LATEST</span>}
                  {photo.source === 'analysis' && <span className="absolute bottom-1.5 right-1.5 text-[9px] font-black px-1 py-0.5 rounded bg-violet-500/80 text-white">AI</span>}
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/30 text-white flex items-center justify-center">
                    <ZoomIn className="w-3 h-3" />
                  </div>
                </div>
                <div className="p-2 bg-white">
                  <p className="text-[10px] font-bold text-gray-700 truncate">{photo.label}</p>
                  {photo.skin_score && <p className="text-[9px] text-pink-500 font-black">{photo.skin_score} pts</p>}
                  <p className="text-[9px] text-gray-400">{format(new Date(photo.created_date), 'MMM d')}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale: 0.88 }} animate={{ scale: 1 }} exit={{ scale: 0.88 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl">
              <img src={lightbox.photo_url} alt="" className="w-full max-h-80 object-cover" />
              <div className="p-4">
                <p className="font-black text-sm">{lightbox.label}</p>
                {lightbox.skin_score && <p className="text-pink-500 font-black mt-0.5">Score: {lightbox.skin_score}/100</p>}
                <p className="text-xs text-gray-400 mt-1">{format(new Date(lightbox.created_date), 'MMM d, yyyy')}</p>
                {lightbox.notes && <p className="text-sm text-gray-600 mt-2">{lightbox.notes}</p>}
              </div>
              <button onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── 3. Progress Timeline ─────────────────────────────────────────────────────
function ProgressTimeline({ analyses, progressPhotos, feedbackHistory, savedRoutine, challenges, goals }) {
  const milestones = getMilestones(analyses, progressPhotos, feedbackHistory, savedRoutine, challenges, goals);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="rounded-3xl p-5"
      style={{ background: 'linear-gradient(145deg,#ffffff,#fff5fb)', border: '1.5px solid rgba(244,114,182,0.14)', boxShadow: '0 4px 24px rgba(244,114,182,0.08)' }}>
      <p className="font-black text-base mb-5">Progress Timeline</p>
      <div className="relative">
        <div className="absolute left-5 top-4 bottom-4 w-0.5"
          style={{ background: 'linear-gradient(180deg,#f472b6,#a78bfa 60%,rgba(245,158,11,0.3))' }} />
        <div className="space-y-4 pl-14">
          {milestones.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }} className="relative">
              <div className="absolute -left-14 top-1 w-10 h-10 rounded-2xl flex items-center justify-center text-base shadow-sm"
                style={{ background: m.bg, border: `2px solid ${m.border}`, opacity: m.done ? 1 : 0.65 }}>
                {m.emoji}
              </div>
              <div className="rounded-2xl p-3.5" style={{ background: m.bg, border: `1.5px solid ${m.border}` }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-sm" style={{ color: m.color }}>{m.title}</p>
                  {!m.done && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">Upcoming</span>}
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{m.desc}</p>
                {m.date && <p className="text-[10px] text-gray-400 mt-1">{format(new Date(m.date), 'MMM d, yyyy')}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── 4. Routine Impact Card ───────────────────────────────────────────────────
function RoutineImpactCard({ analyses, feedbackHistory, savedRoutine, dietLogs, savedProducts }) {
  const impacts = deriveImpacts(analyses, feedbackHistory, savedRoutine, dietLogs, savedProducts);
  const positiveCount = impacts.filter(i => i.positive).length;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
      className="rounded-3xl p-5"
      style={{ background: 'linear-gradient(145deg,#ffffff,#f0fdf4)', border: '1.5px solid rgba(52,211,153,0.2)', boxShadow: '0 4px 24px rgba(52,211,153,0.09)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-base">Routine + Lifestyle Impact</p>
          <p className="text-[10px] text-gray-400 mt-0.5">All sources — what's actually helping</p>
        </div>
        <div className="px-3 py-1.5 rounded-2xl bg-emerald-100 text-emerald-700 text-xs font-black">
          {positiveCount} wins 🏆
        </div>
      </div>
      <div className="space-y-2">
        {impacts.map((impact, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
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
    </motion.div>
  );
}

// ─── Upload Modal (solid, premium) ────────────────────────────────────────────
function UploadModal({ onClose, onUpload, uploading }) {
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(15,10,30,0.72)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 60, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#ffffff' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
        <div className="p-5 pb-0 flex items-center justify-between">
          <div>
            <p className="font-black text-lg">Add Progress Photo</p>
            <p className="text-xs text-gray-400 mt-0.5">Capture your skin's transformation</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-all hover:border-pink-400"
            style={{ borderColor: previewUrl ? 'rgba(244,114,182,0.5)' : '#e5e7eb', background: previewUrl ? 'transparent' : '#fafafa' }}>
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full h-52 object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-bold">Change photo</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.1),rgba(167,139,250,0.1))' }}>
                  <Camera className="w-7 h-7 text-pink-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">Tap to capture or upload</p>
                  <p className="text-xs text-gray-400 mt-0.5">Drag & drop · or browse files</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="px-2 py-1 rounded-lg bg-gray-100">📸 Camera</span>
                  <span className="px-2 py-1 rounded-lg bg-gray-100">🖼 Gallery</span>
                  <span className="px-2 py-1 rounded-lg bg-gray-100">📁 Files</span>
                </div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="user"
            onChange={e => handleFile(e.target.files[0])} className="hidden" />

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How does your skin feel this week? Any changes..."
              rows={3}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
              style={{ background: '#fafafa' }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onUpload({ photo, notes })}
              disabled={!photo || uploading}
              className="flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
              {uploading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Uploading...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Upload className="w-4 h-4" />Save Photo</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Progress() {
  const [user, setUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // ── All data sources ──────────────────────────────────────────────────────
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

  const { data: savedRoutine } = useQuery({
    queryKey: ['skinRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: dietLogs = [] } = useQuery({
    queryKey: ['dietLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 30),
    enabled: !!user?.email,
  });

  const { data: savedProducts = [] } = useQuery({
    queryKey: ['savedProducts', user?.email],
    queryFn: () => base44.entities.SavedProduct.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', user?.email],
    queryFn: () => base44.entities.SkinChallenge.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['glowGoals', user?.email],
    queryFn: () => base44.entities.GlowGoals.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  // ── Auto-upload analysis photos to progress ───────────────────────────────
  useEffect(() => {
    if (!user || !analyses.length || !progressPhotos.length === undefined) return;
    const existingUrls = new Set(progressPhotos.map(p => p.photo_url));
    const toSync = analyses.filter(a => a.photo_url && !existingUrls.has(a.photo_url));
    toSync.forEach(async (a, idx) => {
      await base44.entities.ProgressPhoto.create({
        user_email: user.email,
        photo_url: a.photo_url,
        skin_score: a.overall_score,
        week_number: progressPhotos.length + idx + 1,
        notes: `Auto-synced from skin analysis — Score: ${a.overall_score}/100`,
        photo_date: (a.created_date || '').split('T')[0],
      });
    });
    if (toSync.length > 0) {
      queryClient.invalidateQueries(['progressPhotos']);
    }
  }, [analyses, progressPhotos, user]);

  // ── Upload mutation ───────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async ({ photo, notes }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
      const latestScore = analyses.length > 0 ? analyses[analyses.length - 1].overall_score : 50;
      return base44.entities.ProgressPhoto.create({
        user_email: user.email,
        photo_url: file_url,
        skin_score: latestScore,
        week_number: progressPhotos.length + 1,
        notes,
        photo_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progressPhotos']);
      setShowUpload(false);
    },
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center px-4">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>📊</div>
        <h2 className="text-2xl font-black mb-2">Your Skin Progress</h2>
        <p className="text-gray-500 mb-6">Sign in to view your personalized skin transformation dashboard</p>
        <Button onClick={() => base44.auth.redirectToLogin()}
          className="ios-button-3d text-white px-8" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          <Sparkles className="w-4 h-4 mr-2" />Sign In
        </Button>
      </div>
    );
  }

  const firstAnalysis = analyses.length > 0 ? analyses[0] : null;
  const latestAnalysis = analyses.length > 0 ? analyses[analyses.length - 1] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">

      <PageIntroPopup
        storageKey="intro_Progress"
        emoji="📊"
        title="Skin Progress Tracker"
        accentColor="#a78bfa"
        description="Track your skin transformation journey with AI-powered scoring, photo comparisons, and lifestyle correlation — all in one professional dashboard."
        tips={[
          { icon: '📸', title: 'Log daily progress photos', text: 'Upload a photo each day to visually track how your skin responds to your routine and lifestyle changes.' },
          { icon: '🗓️', title: 'Full skin analysis weekly', text: 'Perform a complete 360° AI skin scan once per week to measure your overall score improvement accurately.' },
          { icon: '📈', title: 'Correlate lifestyle habits', text: 'Your sleep, hydration, and diet logs are automatically linked to your skin score trends for deeper insights.' },
        ]}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="Progress" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">Skin Progress</h1>
            <p className="text-sm text-gray-500">Score · Photos · Timeline · Impact</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black text-white shadow-lg ios-button-3d"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          <Plus className="w-4 h-4" /> Add Photo
        </button>
      </motion.div>

      {/* Empty state */}
      {analyses.length === 0 && (
        <div className="rounded-3xl p-10 text-center"
          style={{ background: '#ffffff', border: '1.5px solid rgba(244,114,182,0.18)', boxShadow: '0 4px 24px rgba(244,114,182,0.08)' }}>
          <div className="text-5xl mb-3">🔬</div>
          <p className="font-black text-lg mb-1">No skin analysis yet</p>
          <p className="text-sm text-gray-500 mb-4">Complete a skin analysis — photos auto-sync here</p>
          <Button onClick={() => window.location.href = '/SkinAnalysis'}
            className="ios-button-3d text-white" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            Start Skin Analysis
          </Button>
        </div>
      )}

      {/* 1 — Hero Progress Score Card */}
      {analyses.length > 0 && (
        <HeroProgressCard analyses={analyses} feedbackHistory={feedbackHistory} dietLogs={dietLogs} />
      )}

      {/* 2 — Skin Changes Snapshot */}
      {analyses.length >= 2 && firstAnalysis && latestAnalysis && (
        <SkinChangesSnapshot first={firstAnalysis} latest={latestAnalysis} />
      )}

      {/* Photo Grid — auto-synced */}
      {(progressPhotos.length > 0 || analyses.some(a => a.photo_url)) && (
        <PhotoGrid progressPhotos={progressPhotos} analyses={analyses} />
      )}

      {/* 3 — Progress Timeline */}
      {analyses.length > 0 && (
        <ProgressTimeline
          analyses={analyses}
          progressPhotos={progressPhotos}
          feedbackHistory={feedbackHistory}
          savedRoutine={savedRoutine}
          challenges={challenges}
          goals={goals}
        />
      )}

      {/* 4 — Routine + Lifestyle Impact */}
      {analyses.length > 0 && (
        <RoutineImpactCard
          analyses={analyses}
          feedbackHistory={feedbackHistory}
          savedRoutine={savedRoutine}
          dietLogs={dietLogs}
          savedProducts={savedProducts}
        />
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUpload={(data) => uploadMutation.mutate(data)}
            uploading={uploadMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}