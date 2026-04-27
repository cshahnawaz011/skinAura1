import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, isAfter } from 'date-fns';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, Target, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';

const WATER_GOAL = 8;
const SLEEP_GOAL = 7;
const EXERCISE_GOAL = 30;

function ChartCard({ title, emoji, goal, unit }) {
  return (
    <div className="rounded-2xl p-4 bg-gray-50 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">Goal: {goal} {unit}</p>
          </div>
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      {/* Chart will be inserted here */}
      <div className="h-48 -mx-4 -mb-4" />
    </div>
  );
}

export default function LifestyleInsights() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: last30Days = [] } = useQuery({
    queryKey: ['dietLogs30days', user?.email],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const logs = await base44.entities.DietLog.filter(
        { user_email: user.email },
        '-log_date',
        100
      );
      return logs.filter(log => isAfter(new Date(log.log_date), thirtyDaysAgo))
        .sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
    },
    enabled: !!user?.email,
  });

  // Process data for charts
  const chartData = useMemo(() => {
    return last30Days.map(log => ({
      date: format(new Date(log.log_date + 'T12:00:00'), 'MMM d'),
      water: log.water_glasses || 0,
      sleep: log.sleep_hours || 0,
      exercise: log.exercise_minutes || 0,
      stress: log.stress_level || 0,
      energy: log.energy_level || 0,
      foods: log.morning_foods || log.breakfast_foods || log.pm_foods || [],
    }));
  }, [last30Days]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const water = chartData.reduce((a, b) => a + b.water, 0) / chartData.length;
    const sleep = chartData.reduce((a, b) => a + b.sleep, 0) / chartData.length;
    const exercise = chartData.reduce((a, b) => a + b.exercise, 0) / chartData.length;
    const stress = chartData.reduce((a, b) => a + (b.stress || 0), 0) / chartData.length;
    const energy = chartData.reduce((a, b) => a + (b.energy || 0), 0) / chartData.length;
    const waterGoalMet = chartData.filter(d => d.water >= WATER_GOAL).length;
    const sleepGoalMet = chartData.filter(d => d.sleep >= SLEEP_GOAL).length;
    const exerciseGoalMet = chartData.filter(d => d.exercise >= EXERCISE_GOAL).length;

    return {
      water: { avg: water.toFixed(1), goalMet: waterGoalMet },
      sleep: { avg: sleep.toFixed(1), goalMet: sleepGoalMet },
      exercise: { avg: exercise.toFixed(1), goalMet: exerciseGoalMet },
      stress: { avg: stress.toFixed(1) },
      energy: { avg: energy.toFixed(1) },
      total: chartData.length,
    };
  }, [chartData]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center px-4">
        <h2 className="text-3xl font-black mb-2">Health Insights</h2>
        <p className="text-gray-500 mb-6">Sign in to view your 30-day trends</p>
        <Button onClick={() => base44.auth.redirectToLogin()}
          className="ios-button-3d text-white px-8" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          Sign In
        </Button>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center px-4">
        <h2 className="text-2xl font-black mb-2">No Data Yet</h2>
        <p className="text-gray-500 mb-6">Start logging your lifestyle data to see insights</p>
        <Button onClick={() => window.location.href = '/Lifestyle'}
          className="ios-button-3d text-white px-8" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          Go to Lifestyle
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#10b981,#38bdf8)' }}>📊</div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Health Insights</h1>
          <p className="text-sm text-gray-500">Last 30 days · {stats?.total} days logged</p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: '💧', label: 'Water', val: stats.water.avg, goal: WATER_GOAL, unit: 'g', sub: `${stats.water.goalMet} days met`, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
            { emoji: '🌙', label: 'Sleep', val: stats.sleep.avg, goal: SLEEP_GOAL, unit: 'h', sub: `${stats.sleep.goalMet} days met`, color: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
            { emoji: '🏃', label: 'Exercise', val: stats.exercise.avg, goal: EXERCISE_GOAL, unit: 'm', sub: `${stats.exercise.goalMet} days met`, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
            { emoji: '😰', label: 'Stress', val: stats.stress.avg, goal: 10, unit: '', sub: 'avg level', color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
            { emoji: '⚡', label: 'Energy', val: stats.energy.avg, goal: 10, unit: '', sub: 'avg level', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-3 text-center" style={{ background: s.bg, border: `1.5px solid ${s.color}20` }}>
              <p className="text-sm mb-1">{s.emoji}</p>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className="text-[9px] text-gray-400">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Water Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="mb-3">
          <h2 className="font-bold text-sm flex items-center gap-2"><span>💧</span> Water Intake</h2>
          <p className="text-xs text-gray-400">Daily glasses · Goal: {WATER_GOAL}</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#999" />
            <YAxis tick={{ fontSize: 12 }} stroke="#999" />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="water" stroke="#0ea5e9" fill="url(#colorWater)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-2 text-[10px] text-gray-400">Avg: {stats?.water.avg} glasses/day</p>
      </motion.div>

      {/* Sleep Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="mb-3">
          <h2 className="font-bold text-sm flex items-center gap-2"><span>🌙</span> Sleep Duration</h2>
          <p className="text-xs text-gray-400">Hours slept · Goal: {SLEEP_GOAL}h</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#999" />
            <YAxis tick={{ fontSize: 12 }} stroke="#999" />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="sleep" stroke="#a855f7" fill="url(#colorSleep)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-2 text-[10px] text-gray-400">Avg: {stats?.sleep.avg} hours/night</p>
      </motion.div>

      {/* Exercise Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="mb-3">
          <h2 className="font-bold text-sm flex items-center gap-2"><span>🏃</span> Exercise Time</h2>
          <p className="text-xs text-gray-400">Minutes exercised · Goal: {EXERCISE_GOAL}m</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorExercise" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#999" />
            <YAxis tick={{ fontSize: 12 }} stroke="#999" />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px' }} />
            <Area type="monotone" dataKey="exercise" stroke="#10b981" fill="url(#colorExercise)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-2 text-[10px] text-gray-400">Avg: {stats?.exercise.avg} min/day</p>
      </motion.div>

      {/* AI Insights & Advice */}
      <HealthInsightsCard stats={stats} chartData={chartData} last30Days={last30Days} user={user} />

      {/* Tips */}
      <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold text-sm mb-3">💡 Quick Tips</h3>
        <div className="space-y-2">
          {[`Drink ${WATER_GOAL}+ glasses for skin hydration`, `${SLEEP_GOAL}+ hours sleep improves skin repair & radiance`, `${EXERCISE_GOAL}+ min exercise boosts circulation & glow`].map((tip, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthInsightsCard({ stats, chartData, last30Days, user }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const { data: cycleData } = useQuery({
    queryKey: ['cycleData', user?.email],
    queryFn: async () => {
      const cycles = await base44.entities.CycleData.filter({ user_email: user.email }, '-created_date', 1);
      return cycles.length > 0 ? cycles[0] : null;
    },
    enabled: !!user?.email,
  });

  // Extract food data
  const foodData = last30Days
    .flatMap(log => [...(log.morning_foods || []), ...(log.breakfast_foods || []), ...(log.pm_foods || [])])
    .filter(Boolean);
  const uniqueFoods = [...new Set(foodData)];
  const foodFreq = uniqueFoods.slice(0, 5).join(', ');

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const cycleContext = cycleData 
        ? `\nHORMONAL CYCLE:\n- Current Phase: ${cycleData.current_phase}\n- Symptoms: ${cycleData.symptoms?.join(', ') || 'None logged'}\n- Energy Level: ${cycleData.energy_level}/10`
        : '';

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this comprehensive health data from the last 30 days, provide personalized wellness insights focused on skin health:

WELLNESS METRICS:
- Water intake: Average ${stats?.water.avg} glasses/day (Goal: 8 glasses, ${stats?.water.goalMet} days met)
- Sleep: Average ${stats?.sleep.avg} hours/night (Goal: 7-8 hours, ${stats?.sleep.goalMet} days met)
- Exercise: Average ${stats?.exercise.avg} minutes/day (Goal: 30 minutes, ${stats?.exercise.goalMet} days met)
- Stress Level: Average ${stats?.stress.avg}/10
- Energy Level: Average ${stats?.energy.avg}/10

NUTRITION:
Top foods consumed: ${foodFreq || 'No food data logged'}

${cycleContext}

Total days tracked: ${chartData.length}

Provide exactly this JSON:
{
  "insights": ["insight 1 about their wellness pattern", "insight 2 about stress/energy/cycle correlation", "insight 3 about nutrition impact on skin"],
  "advice": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
  "foodInsights": "brief insight about their food choices and skin health impact",
  "motivation": "motivational message"
}

Keep responses conversational, skin-health focused, and based on their actual data.`,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: { type: 'array', items: { type: 'string' } },
            advice: { type: 'array', items: { type: 'string' } },
            foodInsights: { type: 'string' },
            motivation: { type: 'string' },
          }
        }
      });
      setInsights(res);
    } catch (e) {
      console.error('Error:', e);
      setError(e.message || 'Failed to generate insights');
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-black text-base text-gray-900 dark:text-white">✨ AI Health Insights</h3>
          <p className="text-xs text-gray-400 mt-0.5">Powered by your 30-day data</p>
        </div>
        <button onClick={generateInsights} disabled={loading || !!insights}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 ios-button-3d" style={{ background: 'linear-gradient(135deg,#10b981,#38bdf8)' }}>
          {loading ? 'Analyzing…' : insights ? 'Done ✓' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs font-semibold text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {insights && insights.insights && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Your Wellness Patterns</p>
            <ul className="space-y-1.5">
              {(Array.isArray(insights.insights) ? insights.insights : []).map((insight, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-emerald-600 flex-shrink-0">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Action Steps</p>
            <ol className="space-y-1.5">
              {(Array.isArray(insights.advice) ? insights.advice : []).map((adv, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ol>
          </div>

          {insights.foodInsights && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
              <p className="text-xs font-bold text-amber-700 mb-1">🍎 Food Impact on Skin</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{insights.foodInsights}</p>
            </div>
          )}
          {insights.motivation && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700">💪 {insights.motivation}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}