import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Sparkles, Flame, Trophy, Share2, Camera, Apple, Moon,
  Droplets, Heart, Zap, TrendingUp, Star, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import GlowScoreRing from '@/components/glowdashboard/GlowScoreRing';
import HabitCard from '@/components/glowdashboard/HabitCard';
import BadgeGrid, { ALL_BADGES } from '@/components/glowdashboard/BadgeGrid';
import GlowTrendChart from '@/components/glowdashboard/GlowTrendChart';
import ShareCard from '@/components/glowdashboard/ShareCard';

// ── Habit definitions ────────────────────────────────────────────
const HABITS = [
  { id: 'water', emoji: '💧', label: 'Drink 8 glasses of water', tip: 'Hydration = glow', points: 15 },
  { id: 'sunscreen', emoji: '🧴', label: 'Apply sunscreen', tip: 'SPF is non-negotiable', points: 15 },
  { id: 'sleep_7', emoji: '😴', label: 'Get 7+ hours of sleep', tip: 'Skin repairs overnight', points: 20 },
  { id: 'skincare_am', emoji: '☀️', label: 'Morning skincare routine', tip: 'Cleanse, tone, moisturise', points: 10 },
  { id: 'skincare_pm', emoji: '🌙', label: 'Night skincare routine', tip: 'Never skip PM routine', points: 10 },
  { id: 'healthy_food', emoji: '🥗', label: 'Eat 3+ skin-loving foods', tip: 'Berries, greens, omega-3', points: 15 },
  { id: 'no_sugar', emoji: '🚫🍬', label: 'Avoid added sugar', tip: 'Sugar = inflammation', points: 15 },
  { id: 'exercise', emoji: '🏃', label: 'Move for 20+ minutes', tip: 'Boosts circulation & glow', points: 10 },
  { id: 'stress', emoji: '🧘', label: 'Manage stress (meditate/breathe)', tip: 'Cortisol spikes cause breakouts', points: 10 },
  { id: 'journal', emoji: '📔', label: 'Log skin in journal', tip: 'Track what works for you', points: 10 },
];

function calcScore(done) {
  const total = HABITS.reduce((s, h) => s + h.points, 0);
  const earned = HABITS.filter(h => done.includes(h.id)).reduce((s, h) => s + h.points, 0);
  return Math.round((earned / total) * 100);
}

function computeStreak(history = []) {
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  const today = format(new Date(), 'yyyy-MM-dd');
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const expected = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (sorted[i].date === expected && (sorted[i].glow_score || 0) > 0) streak++;
    else break;
  }
  return streak;
}

function computeMeta(history = [], dietLogs = []) {
  return {
    totalDays: history.filter(h => (h.glow_score || 0) > 0).length,
    streak: computeStreak(history),
    bestScore: Math.max(0, ...history.map(h => h.glow_score || 0)),
    waterDays: dietLogs.filter(l => (l.water_glasses || 0) >= 8).length,
    sleepDays: dietLogs.filter(l => (l.sleep_hours || 0) >= 7).length,
    goodFoodDays: dietLogs.filter(l => (l.foods_good || []).length >= 5).length,
  };
}

// ── Main Component ────────────────────────────────────────────────
export default function GlowDashboard() {
  const [user, setUser] = useState(null);
  const [tasksDone, setTasksDone] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [aiTip, setAiTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // ── Queries ────────────────────────────────────────────────────
  const { data: todayMetric } = useQuery({
    queryKey: ['glowMetric', user?.email, today],
    queryFn: () => base44.entities.DailyGlowMetrics.filter({ user_email: user.email, date: today }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['glowHistory', user?.email],
    queryFn: () => base44.entities.DailyGlowMetrics.filter({ user_email: user.email }, '-date', 30),
    enabled: !!user?.email,
  });

  const { data: dietLogs = [] } = useQuery({
    queryKey: ['glowDietLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 30),
    enabled: !!user?.email,
  });

  const { data: skinAnalysis } = useQuery({
    queryKey: ['glowSkinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  // ── Sync tasks from DB ─────────────────────────────────────────
  useEffect(() => {
    if (todayMetric?.tasks_done) setTasksDone(todayMetric.tasks_done);
  }, [todayMetric]);

  // ── Auto-prefill from Lifestyle ────────────────────────────────
  const todayDietLog = dietLogs.find(l => l.log_date === today);
  useEffect(() => {
    if (!todayDietLog || tasksDone.length > 0) return;
    const auto = [];
    if ((todayDietLog.water_glasses || 0) >= 8) auto.push('water');
    if ((todayDietLog.sleep_hours || 0) >= 7) auto.push('sleep_7');
    if (todayDietLog.skincare_done_morning) auto.push('skincare_am');
    if (todayDietLog.skincare_done_night) auto.push('skincare_pm');
    if (todayDietLog.sunscreen_applied) auto.push('sunscreen');
    if ((todayDietLog.exercise_minutes || 0) >= 20) auto.push('exercise');
    if ((todayDietLog.foods_good || []).length >= 3) auto.push('healthy_food');
    if (auto.length) setTasksDone(auto);
  }, [todayDietLog]);

  // ── Save mutation ──────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (done) => {
      const score = calcScore(done);
      const payload = { user_email: user.email, date: today, glow_score: score, tasks_done: done };
      if (todayMetric?.id) {
        return base44.entities.DailyGlowMetrics.update(todayMetric.id, payload);
      } else {
        return base44.entities.DailyGlowMetrics.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glowMetric'] });
      queryClient.invalidateQueries({ queryKey: ['glowHistory'] });
    },
  });

  const toggleTask = (id) => {
    const next = tasksDone.includes(id) ? tasksDone.filter(x => x !== id) : [...tasksDone, id];
    setTasksDone(next);
    saveMutation.mutate(next);
  };

  // ── Derived stats ──────────────────────────────────────────────
  const score = calcScore(tasksDone);
  const meta = useMemo(() => computeMeta(history, dietLogs), [history, dietLogs]);
  const streak = meta.streak;
  const earnedBadgeIds = ALL_BADGES.filter(b => b.condition(meta)).map(b => b.id);
  const latestBadge = ALL_BADGES.find(b => earnedBadgeIds.includes(b.id) && ['streak_7', 'perfect_score', 'hydration', 'sleep_queen'].includes(b.id));

  // ── AI Tip ──────────────────────────────────────────────────────
  const getAiTip = async () => {
    setLoadingTip(true);
    const context = [
      skinAnalysis ? `Skin type: ${skinAnalysis.skin_type}, acne: ${skinAnalysis.acne_level}/10, score: ${skinAnalysis.overall_score}` : '',
      todayDietLog ? `Today: water=${todayDietLog.water_glasses}g, sleep=${todayDietLog.sleep_hours}h, stress=${todayDietLog.stress_level}` : '',
      `Glow score: ${score}/100. Incomplete habits: ${HABITS.filter(h => !tasksDone.includes(h.id)).map(h => h.label).join(', ')}`,
    ].filter(Boolean).join('. ');
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this user's skin & lifestyle data: ${context}. Give ONE ultra-specific, motivating, actionable tip for today to improve their glow score. 2 sentences max. Be warm and personal.`,
    });
    setAiTip(res);
    setLoadingTip(false);
  };

  const TABS = [
    { id: 'today', label: "Today's Habits", emoji: '🌟' },
    { id: 'progress', label: 'Progress', emoji: '📈' },
    { id: 'badges', label: 'Badges', emoji: '🏆' },
  ];

  if (!user) return (
    <div className="max-w-xl mx-auto mt-16">
      <GlassCard className="text-center py-12">
        <Sparkles className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Glow Dashboard</h2>
        <p className="text-gray-500 mb-6">Sign in to track your daily glow habits</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="ios-button-3d text-white" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>Sign In</Button>
      </GlassCard>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#f59e0b)' }}>✨</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Glow Dashboard</h1>
            <p className="text-sm text-gray-400">{format(new Date(), 'EEEE, MMM d')}</p>
          </div>
        </div>
      </div>

      {/* Score + Streak hero */}
      <GlassCard className="bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-violet-900/20">
        <div className="flex items-center justify-around">
          <div className="relative flex flex-col items-center">
            <GlowScoreRing score={score} />
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-black text-orange-500">🔥{streak}</p>
              <p className="text-xs text-gray-400 font-medium">Day Streak</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-amber-500">{earnedBadgeIds.length}</p>
              <p className="text-xs text-gray-400 font-medium">Badges</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-indigo-500">{tasksDone.length}/{HABITS.length}</p>
              <p className="text-xs text-gray-400 font-medium">Done Today</p>
            </div>
          </div>
        </div>

        {/* Connected data chips */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/40 dark:border-white/10">
          {[
            { ok: !!skinAnalysis, label: 'Skin', href: '/SkinAnalysis', emoji: '📊' },
            { ok: !!todayDietLog, label: 'Lifestyle', href: '/Lifestyle', emoji: '🌿' },
            { ok: dietLogs.length > 0, label: 'Diet Log', href: '/Diet', emoji: '🥗' },
          ].map(c => (
            <Link key={c.label} to={c.href}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                c.ok
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600'
              }`}>
              {c.emoji} {c.label} {c.ok ? '✅' : '➕'}
            </Link>
          ))}
        </div>
      </GlassCard>

      {/* AI Tip */}
      <GlassCard className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-violet-600 mb-1">✨ AI Glow Tip for Today</p>
            {aiTip ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{aiTip}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Tap to get your personalized glow tip...</p>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={getAiTip} disabled={loadingTip} className="flex-shrink-0 text-violet-600">
            {loadingTip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          </Button>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                : 'bg-white/60 dark:bg-white/5 text-gray-500 hover:bg-white dark:hover:bg-white/10'
            }`}>
            <span>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* TODAY'S HABITS */}
          {activeTab === 'today' && (
            <div className="space-y-2">
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-xs text-gray-400">{tasksDone.length} of {HABITS.length} habits done</span>
                <span className="text-xs font-bold text-rose-500">{score} pts</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400"
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              {HABITS.map((habit, i) => (
                <HabitCard key={habit.id} habit={habit} done={tasksDone.includes(habit.id)} onToggle={() => toggleTask(habit.id)} index={i} />
              ))}
              {score === 100 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-4">
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="text-lg font-black text-emerald-500">Perfect Glow Day!</p>
                  <p className="text-sm text-gray-400">You completed every habit today. Your skin thanks you!</p>
                </motion.div>
              )}

              {/* Shortcuts to log data */}
              <GlassCard className="mt-2">
                <p className="text-xs font-bold text-gray-500 mb-2">📲 Quick Links to Log Your Data</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Lifestyle Log', href: '/Lifestyle', emoji: '🌿' },
                    { label: 'Diet & Glow', href: '/Diet', emoji: '🥗' },
                    { label: 'Skin Journal', href: '/SkinJournal', emoji: '📔' },
                    { label: 'Skin Analysis', href: '/SkinAnalysis', emoji: '🔬' },
                  ].map(l => (
                    <Link key={l.href} to={l.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-sm font-medium text-gray-600 dark:text-gray-300">
                      <span>{l.emoji}</span> {l.label}
                      <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                    </Link>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* PROGRESS */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <GlassCard>
                <h4 className="font-bold mb-3 text-sm">📈 30-Day Glow Trend</h4>
                <GlowTrendChart data={history} />
              </GlassCard>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Days Logged', value: meta.totalDays, emoji: '📅', color: 'text-indigo-500' },
                  { label: 'Best Score Ever', value: `${meta.bestScore}/100`, emoji: '🏆', color: 'text-amber-500' },
                  { label: 'Hydration Days (8g)', value: meta.waterDays, emoji: '💧', color: 'text-blue-500' },
                  { label: 'Good Sleep Days', value: meta.sleepDays, emoji: '😴', color: 'text-violet-500' },
                ].map(s => (
                  <GlassCard key={s.label} className="text-center p-4">
                    <p className="text-3xl mb-1">{s.emoji}</p>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </GlassCard>
                ))}
              </div>

              {/* Last 7 days log */}
              <GlassCard>
                <h4 className="font-bold mb-3 text-sm">📋 Recent Days</h4>
                <div className="space-y-2">
                  {history.slice(0, 7).map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <p className="text-xs text-gray-400 w-16 flex-shrink-0">{format(new Date(d.date + 'T00:00:00'), 'EEE, dd')}</p>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400" style={{ width: `${d.glow_score || 0}%` }} />
                      </div>
                      <p className="text-xs font-bold text-rose-500 w-10 text-right">{d.glow_score || 0}</p>
                    </div>
                  ))}
                  {history.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Start logging today! 🌱</p>}
                </div>
              </GlassCard>
            </div>
          )}

          {/* BADGES */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              {earnedBadgeIds.length > 0 && (
                <GlassCard className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🏆</span>
                    <div>
                      <p className="font-bold text-amber-700 dark:text-amber-300">{earnedBadgeIds.length} Badge{earnedBadgeIds.length > 1 ? 's' : ''} Earned!</p>
                      <p className="text-xs text-gray-500">Keep going to unlock more achievements</p>
                    </div>
                  </div>
                </GlassCard>
              )}
              <GlassCard>
                <h4 className="font-bold mb-4 text-sm">🏅 Your Achievement Collection</h4>
                <BadgeGrid earned={earnedBadgeIds} />
              </GlassCard>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <ShareCard
            score={score}
            streak={streak}
            badge={latestBadge}
            userName={user?.full_name}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}