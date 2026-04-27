import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, isAfter } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus, Link } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const WATER_GOAL = 8;
const SLEEP_GOAL = 7;
const EXERCISE_GOAL = 30;
const STEPS_GOAL = 8000;
const MEDITATION_GOAL = 10;
const OUTDOOR_GOAL = 30;

const PARAM_META = [
  { key: 'water_glasses', label: 'Water', emoji: '💧', goal: WATER_GOAL, unit: 'g', color: '#0ea5e9', goodDir: 'high', tip: 'Hydration directly affects skin elasticity and glow.' },
  { key: 'sleep_hours', label: 'Sleep', emoji: '🌙', goal: SLEEP_GOAL, unit: 'h', color: '#a855f7', goodDir: 'high', tip: 'Skin repairs itself during sleep — 7+ hours reduces dark circles and puffiness.' },
  { key: 'exercise_minutes', label: 'Exercise', emoji: '🏃', goal: EXERCISE_GOAL, unit: 'm', color: '#10b981', goodDir: 'high', tip: 'Exercise boosts circulation, delivering oxygen and nutrients to skin cells.' },
  { key: 'daily_steps', label: 'Steps', emoji: '👟', goal: STEPS_GOAL, unit: '', color: '#f59e0b', goodDir: 'high', tip: '8000+ steps/day correlates with lower inflammation and better skin tone.' },
  { key: 'stress_level', label: 'Stress', emoji: '🧠', goal: 2, unit: '/5', color: '#ef4444', goodDir: 'low', tip: 'Chronic stress spikes cortisol which breaks down collagen and triggers acne.' },
  { key: 'caffeine_cups', label: 'Caffeine', emoji: '☕', goal: 2, unit: 'cups', color: '#92400e', goodDir: 'low', tip: 'Excess caffeine dehydrates skin and raises cortisol levels.' },
  { key: 'alcohol_drinks', label: 'Alcohol', emoji: '🍷', goal: 0, unit: 'drinks', color: '#b91c1c', goodDir: 'low', tip: 'Alcohol dehydrates, widens pores, and causes puffiness and redness.' },
  { key: 'screen_time_hours', label: 'Screen Time', emoji: '📱', goal: 4, unit: 'h', color: '#6366f1', goodDir: 'low', tip: 'Blue light from screens causes oxidative stress and can worsen pigmentation.' },
  { key: 'meditation_minutes', label: 'Meditation', emoji: '🧘', goal: MEDITATION_GOAL, unit: 'm', color: '#0d9488', goodDir: 'high', tip: 'Meditation reduces cortisol, which directly improves skin clarity over time.' },
  { key: 'outdoor_minutes', label: 'Sunlight', emoji: '☀️', goal: OUTDOOR_GOAL, unit: 'm', color: '#d97706', goodDir: 'high', tip: 'Sunlight boosts Vitamin D which is essential for skin barrier function.' },
];

function ParamCard({ meta, avg, goalMet, total, trend }) {
  const pct = meta.goal > 0 ? Math.min(100, Math.round((avg / meta.goal) * 100)) : 0;
  const isGood = meta.goodDir === 'high' ? avg >= meta.goal : avg <= meta.goal;
  const color = isGood ? '#10b981' : avg > 0 ? '#f59e0b' : '#9ca3af';
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <div>
            <p className="font-bold text-sm">{meta.label}</p>
            <p className="text-[10px] text-gray-400">Goal: {meta.goal}{meta.unit}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black" style={{ color: meta.color }}>{typeof avg === 'number' ? avg.toFixed(avg % 1 !== 0 ? 1 : 0) : avg}</p>
          <div className="flex items-center gap-1 justify-end">
            <TrendIcon className="w-3 h-3" style={{ color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#9ca3af' }} />
            <span className="text-[10px] text-gray-400">{goalMet}/{total} days met</span>
          </div>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
      <p className="text-[10px] text-gray-400 leading-snug">{meta.tip}</p>
    </div>
  );
}

export default function LifestyleInsights() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: last30Days = [] } = useQuery({
    queryKey: ['dietLogs30days', user?.email],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const logs = await base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 100);
      return logs.filter(log => isAfter(new Date(log.log_date), thirtyDaysAgo))
        .sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
    },
    enabled: !!user?.email,
  });

  const { data: skinAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const chartData = useMemo(() => last30Days.map(log => ({
    date: format(new Date(log.log_date + 'T12:00:00'), 'MMM d'),
    water: log.water_glasses || 0,
    sleep: log.sleep_hours || 0,
    exercise: log.exercise_minutes || 0,
    steps: (log.daily_steps || 0) / 1000,
    stress: log.stress_level || 0,
    caffeine: log.caffeine_cups || log.coffee_cups || 0,
    alcohol: log.alcohol_drinks || 0,
    screen: log.screen_time_hours || 0,
    meditation: log.meditation_minutes || 0,
    outdoor: (log.outdoor_minutes || 0) / 10,
  })), [last30Days]);

  const stats = useMemo(() => {
    if (!last30Days.length) return null;
    const n = last30Days.length;
    const avg = (key, alt) => last30Days.reduce((s, l) => s + (l[key] || l[alt] || 0), 0) / n;
    const goalMet = (key, alt, goal, dir) => last30Days.filter(l => {
      const v = l[key] || l[alt] || 0;
      return dir === 'high' ? v >= goal : v <= goal;
    }).length;
    const trend = (key, alt) => {
      if (n < 4) return 0;
      const half = Math.floor(n / 2);
      const first = last30Days.slice(0, half).reduce((s, l) => s + (l[key] || l[alt] || 0), 0) / half;
      const second = last30Days.slice(half).reduce((s, l) => s + (l[key] || l[alt] || 0), 0) / (n - half);
      return second - first;
    };

    return PARAM_META.map(m => ({
      ...m,
      avg: avg(m.key, m.key === 'caffeine_cups' ? 'coffee_cups' : m.key),
      goalMet: goalMet(m.key, m.key === 'caffeine_cups' ? 'coffee_cups' : m.key, m.goal, m.goodDir),
      total: n,
      trend: trend(m.key, m.key === 'caffeine_cups' ? 'coffee_cups' : m.key),
    }));
  }, [last30Days]);

  // Skin correlation insights
  const skinCorrelation = useMemo(() => {
    if (!skinAnalysis || !stats) return [];
    const insights = [];
    const waterStat = stats.find(s => s.key === 'water_glasses');
    const sleepStat = stats.find(s => s.key === 'sleep_hours');
    const stressStat = stats.find(s => s.key === 'stress_level');
    const cafStat = stats.find(s => s.key === 'caffeine_cups');
    const alcStat = stats.find(s => s.key === 'alcohol_drinks');

    if (waterStat && waterStat.avg < 6 && skinAnalysis.dryness > 4)
      insights.push({ icon: '💧', text: 'Low water intake correlates with your dryness score. Aim for 8+ glasses.', severity: 'warn' });
    if (sleepStat && sleepStat.avg < 6 && (skinAnalysis.dark_spots > 4 || skinAnalysis.acne_level > 4))
      insights.push({ icon: '🌙', text: 'Poor sleep linked to your acne/dark circles. Try 7-8h consistently.', severity: 'warn' });
    if (stressStat && stressStat.avg > 3.5 && skinAnalysis.acne_level > 5)
      insights.push({ icon: '🧠', text: 'High stress + high acne detected. Cortisol spikes are likely triggering breakouts.', severity: 'bad' });
    if (cafStat && cafStat.avg > 3 && skinAnalysis.oiliness > 5)
      insights.push({ icon: '☕', text: 'Excess caffeine + high oiliness — caffeine increases cortisol and sebum production.', severity: 'warn' });
    if (alcStat && alcStat.avg > 1 && skinAnalysis.redness > 4)
      insights.push({ icon: '🍷', text: 'Alcohol intake correlates with your redness score. Alcohol dilates blood vessels.', severity: 'bad' });
    if (waterStat && waterStat.avg >= 8 && skinAnalysis.overall_score >= 70)
      insights.push({ icon: '✅', text: 'Good hydration habit — contributing to your strong overall skin score!', severity: 'good' });

    return insights;
  }, [skinAnalysis, stats]);

  const generateInsights = async () => {
    if (!stats) return;
    setAiLoading(true);
    const summary = stats.map(s => `${s.label}: avg ${s.avg.toFixed(1)}${s.unit}, goal met ${s.goalMet}/${s.total} days`).join('; ');
    const skinCtx = skinAnalysis ? `Skin: ${skinAnalysis.skin_type}, score ${skinAnalysis.overall_score}, acne ${skinAnalysis.acne_level}/10, dryness ${skinAnalysis.dryness}/10` : '';
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this 30-day lifestyle data and give personalized skin-health insights:\n${summary}\n${skinCtx}\n\nGive 3 specific insights connecting lifestyle to skin, 3 action steps, and a motivational message.`,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: { type: 'array', items: { type: 'string' } },
          action_steps: { type: 'array', items: { type: 'string' } },
          motivation: { type: 'string' },
          skin_lifestyle_score: { type: 'number' }
        }
      }
    });
    setAiInsights(res);
    setAiLoading(false);
  };

  const TABS = [
    { id: 'overview', label: 'Overview', emoji: '📊' },
    { id: 'charts', label: 'Charts', emoji: '📈' },
    { id: 'skin', label: 'Skin Link', emoji: '🔗' },
    { id: 'ai', label: 'AI Analysis', emoji: '🤖' },
  ];

  if (!user) return (
    <div className="max-w-2xl mx-auto pt-16 text-center px-4">
      <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg,#10b981,#38bdf8)' }}>📊</div>
      <h2 className="text-2xl font-black mb-2">Health Insights</h2>
      <p className="text-gray-500 mb-6">Sign in to view your 30-day trends</p>
      <button onClick={() => base44.auth.redirectToLogin()} className="px-8 py-3 rounded-2xl font-bold text-white ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>Sign In</button>
    </div>
  );

  if (!last30Days.length) return (
    <div className="max-w-2xl mx-auto pt-16 text-center px-4">
      <div className="text-5xl mb-4">🌱</div>
      <h2 className="text-2xl font-black mb-2">No Data Yet</h2>
      <p className="text-gray-500 mb-6">Start logging in Lifestyle to see your insights here</p>
      <RouterLink to="/Lifestyle">
        <button className="px-8 py-3 rounded-2xl font-bold text-white ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>Go to Lifestyle →</button>
      </RouterLink>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#10b981,#38bdf8)' }}>📊</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Health Insights</h1>
            <p className="text-sm text-gray-500">Last 30 days · {last30Days.length} days logged</p>
          </div>
        </div>
        <RouterLink to="/Lifestyle">
          <button className="text-xs px-3 py-1.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 transition-all">+ Log Today</button>
        </RouterLink>
      </div>

      {/* Top stats row */}
      {stats && (
        <div className="grid grid-cols-5 gap-2">
          {stats.slice(0, 5).map(s => {
            const isGood = s.goodDir === 'high' ? s.avg >= s.goal : s.avg <= s.goal;
            return (
              <div key={s.key} className="rounded-2xl p-2.5 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="text-sm">{s.emoji}</p>
                <p className="text-base font-black" style={{ color: isGood ? '#10b981' : '#f59e0b' }}>
                  {s.avg.toFixed(s.avg % 1 !== 0 ? 1 : 0)}
                </p>
                <p className="text-[9px] text-gray-400">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: activeTab === t.id ? 'linear-gradient(135deg,#10b981,#38bdf8)' : 'white', color: activeTab === t.id ? 'white' : '#6b7280', border: activeTab === t.id ? 'none' : '1.5px solid #e5e7eb' }}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

          {/* ── OVERVIEW: all params ── */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.map(s => (
                <ParamCard key={s.key} meta={s} avg={s.avg} goalMet={s.goalMet} total={s.total} trend={s.trend} />
              ))}
            </div>
          )}

          {/* ── CHARTS ── */}
          {activeTab === 'charts' && (
            <div className="space-y-4">
              {[
                { key: 'water', label: '💧 Water', color: '#0ea5e9', goalLine: WATER_GOAL },
                { key: 'sleep', label: '🌙 Sleep', color: '#a855f7', goalLine: SLEEP_GOAL },
                { key: 'exercise', label: '🏃 Exercise (min)', color: '#10b981', goalLine: EXERCISE_GOAL },
                { key: 'steps', label: '👟 Steps (×1000)', color: '#f59e0b', goalLine: STEPS_GOAL / 1000 },
                { key: 'stress', label: '🧠 Stress', color: '#ef4444' },
                { key: 'meditation', label: '🧘 Meditation (min)', color: '#0d9488', goalLine: MEDITATION_GOAL },
                { key: 'caffeine', label: '☕ Caffeine', color: '#92400e' },
                { key: 'alcohol', label: '🍷 Alcohol', color: '#b91c1c' },
                { key: 'screen', label: '📱 Screen Time (h)', color: '#6366f1' },
                { key: 'outdoor', label: '☀️ Outdoor (×10m)', color: '#d97706' },
              ].map(chart => (
                <div key={chart.key} className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <p className="font-bold text-sm mb-3">{chart.label}</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad_${chart.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chart.color} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #f0f0f0' }} />
                      <Area type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} fill={`url(#grad_${chart.key})`} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {/* ── SKIN LINK ── */}
          {activeTab === 'skin' && (
            <div className="space-y-4">
              {!skinAnalysis ? (
                <div className="rounded-2xl p-8 text-center bg-white dark:bg-gray-900 border border-gray-100">
                  <p className="text-4xl mb-3">🔬</p>
                  <p className="font-bold mb-2">No Skin Analysis Yet</p>
                  <p className="text-sm text-gray-400 mb-4">Run a skin analysis to see how your lifestyle is affecting your skin</p>
                  <RouterLink to="/SkinAnalysis">
                    <button className="px-6 py-2.5 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>Run Analysis →</button>
                  </RouterLink>
                </div>
              ) : (
                <>
                  {/* Skin snapshot */}
                  <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="font-bold text-sm mb-3">🧬 Your Skin Profile</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Score', val: skinAnalysis.overall_score, color: '#f472b6' },
                        { label: 'Acne', val: skinAnalysis.acne_level, color: '#ef4444' },
                        { label: 'Oiliness', val: skinAnalysis.oiliness, color: '#f59e0b' },
                        { label: 'Dryness', val: skinAnalysis.dryness, color: '#38bdf8' },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-2 text-center bg-gray-50 dark:bg-gray-800">
                          <p className="text-lg font-black" style={{ color: s.color }}>{s.val}</p>
                          <p className="text-[10px] text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Correlations */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Lifestyle → Skin Correlations</p>
                    {skinCorrelation.length === 0 ? (
                      <div className="rounded-2xl p-5 text-center bg-white border border-gray-100">
                        <p className="text-2xl mb-1">🎉</p>
                        <p className="text-sm text-gray-500">No negative correlations detected. Keep it up!</p>
                      </div>
                    ) : (
                      skinCorrelation.map((c, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                          className={`p-4 rounded-2xl flex items-start gap-3 ${c.severity === 'bad' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200' : c.severity === 'warn' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200' : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200'}`}>
                          <span className="text-xl flex-shrink-0">{c.icon}</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.text}</p>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Per-param skin connection */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Parameter Deep Dive</p>
                    {stats && PARAM_META.map(m => {
                      const s = stats.find(x => x.key === m.key);
                      if (!s) return null;
                      const isGood = m.goodDir === 'high' ? s.avg >= m.goal : s.avg <= m.goal;
                      return (
                        <div key={m.key} className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${m.color}15` }}>{m.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-sm">{m.label}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isGood ? '✓ Good' : '⚠ Needs Work'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 leading-snug">{m.tip}</p>
                          </div>
                          <p className="text-base font-black flex-shrink-0" style={{ color: m.color }}>{s.avg.toFixed(1)}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── AI ANALYSIS ── */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-base">🤖 AI Health & Skin Analysis</p>
                    <p className="text-xs text-gray-400 mt-0.5">Powered by your {last30Days.length}-day lifestyle data</p>
                  </div>
                  <button onClick={generateInsights} disabled={aiLoading || !!aiInsights}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 ios-button-3d" style={{ background: 'linear-gradient(135deg,#10b981,#38bdf8)' }}>
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : aiInsights ? 'Done ✓' : 'Generate'}
                  </button>
                </div>
                {!aiInsights && !aiLoading && (
                  <p className="text-sm text-gray-400 italic">Tap "Generate" for a personalized AI analysis connecting all your lifestyle habits to skin health.</p>
                )}
                {aiLoading && (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                    <p className="text-sm text-gray-500">Analyzing your 30-day patterns…</p>
                  </div>
                )}
              </div>

              {aiInsights && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {aiInsights.skin_lifestyle_score !== undefined && (
                    <div className="rounded-2xl p-5 flex items-center gap-5" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(56,189,248,0.1))', border: '1.5px solid rgba(16,185,129,0.2)' }}>
                      <div className="text-center flex-shrink-0">
                        <p className="text-5xl font-black text-teal-500">{aiInsights.skin_lifestyle_score}</p>
                        <p className="text-xs text-gray-400">Lifestyle Score</p>
                      </div>
                      {aiInsights.motivation && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">"{aiInsights.motivation}"</p>}
                    </div>
                  )}

                  <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">💡 Lifestyle → Skin Insights</p>
                    {aiInsights.insights?.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <span className="text-teal-500 font-bold flex-shrink-0">•</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{ins}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">✅ Action Steps</p>
                    {aiInsights.action_steps?.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick tips */}
              <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="font-bold text-sm mb-3">💡 Science-Backed Skin Tips</p>
                <div className="space-y-2">
                  {[
                    '💧 8+ glasses of water = better elasticity & less dryness',
                    '🌙 7-8h sleep = skin repairs collagen & reduces inflammation',
                    '🏃 30min exercise = better blood flow & natural skin glow',
                    '🧘 10min meditation = lower cortisol = less acne & breakouts',
                    '☀️ 30min sunlight = Vitamin D for skin barrier health',
                    '🍷 Alcohol + caffeine = dehydration, redness, puffiness',
                    '📱 Reduce screen time = less blue light oxidative stress',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="flex-shrink-0 mt-0.5">→</span>
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}