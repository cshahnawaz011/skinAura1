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
          className="bg-black text-white px-8 hover:bg-gray-800">
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
          className="bg-black text-white px-8 hover:bg-gray-800">
          Go to Lifestyle
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12 px-4 space-y-5">
      {/* Header */}
      <div className="pt-6">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Health Insights</h1>
        <p className="text-sm text-gray-500">Last 30 days • {stats?.total} days logged</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold mb-2">💧 Water</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-600">{stats.water.avg}</span>
              <span className="text-xs text-gray-500">/ {WATER_GOAL}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{stats.water.goalMet} days met</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 bg-violet-50 border border-violet-100">
            <p className="text-xs text-violet-600 font-semibold mb-2">🌙 Sleep</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-violet-600">{stats.sleep.avg}</span>
              <span className="text-xs text-gray-500">/ {SLEEP_GOAL}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{stats.sleep.goalMet} days met</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold mb-2">🏃 Exercise</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">{stats.exercise.avg}</span>
              <span className="text-xs text-gray-500">/ {EXERCISE_GOAL}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{stats.exercise.goalMet} days met</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 bg-orange-50 border border-orange-100">
            <p className="text-xs text-orange-600 font-semibold mb-2">😰 Stress</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-orange-600">{stats.stress.avg}</span>
              <span className="text-xs text-gray-500">/ 10</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">avg level</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 bg-yellow-50 border border-yellow-100">
            <p className="text-xs text-yellow-600 font-semibold mb-2">⚡ Energy</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-yellow-600">{stats.energy.avg}</span>
              <span className="text-xs text-gray-500">/ 10</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">avg level</p>
          </motion.div>
        </div>
      )}

      {/* Water Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} delay={0.1}
        className="rounded-2xl p-5 bg-white border border-gray-200">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">💧</span> Water Intake
          </h2>
          <p className="text-xs text-gray-500">Daily glasses consumed</p>
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
        <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
          Goal: {WATER_GOAL} glasses/day • Avg: {stats?.water.avg} glasses
        </div>
      </motion.div>

      {/* Sleep Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} delay={0.2}
        className="rounded-2xl p-5 bg-white border border-gray-200">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🌙</span> Sleep Duration
          </h2>
          <p className="text-xs text-gray-500">Hours slept per night</p>
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
        <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
          Goal: {SLEEP_GOAL} hours/night • Avg: {stats?.sleep.avg} hours
        </div>
      </motion.div>

      {/* Exercise Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} delay={0.3}
        className="rounded-2xl p-5 bg-white border border-gray-200">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🏃</span> Exercise Time
          </h2>
          <p className="text-xs text-gray-500">Minutes exercised per day</p>
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
        <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
          Goal: {EXERCISE_GOAL} min/day • Avg: {stats?.exercise.avg} min
        </div>
      </motion.div>

      {/* AI Insights & Advice */}
      <HealthInsightsCard stats={stats} chartData={chartData} last30Days={last30Days} />

      {/* Tips */}
      <div className="rounded-2xl p-5 bg-gray-50 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Quick Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Drinking {WATER_GOAL}+ glasses helps maintain skin hydration</li>
          <li>✓ Getting {SLEEP_GOAL}+ hours improves skin repair & radiance</li>
          <li>✓ {EXERCISE_GOAL}+ min of exercise boosts blood circulation & glow</li>
        </ul>
      </div>
    </div>
  );
}

function HealthInsightsCard({ stats, chartData, last30Days }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

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

Total days tracked: ${chartData.length}

Provide exactly this JSON:
{
  "insights": ["insight 1 about their wellness pattern", "insight 2 about stress/energy correlation", "insight 3 about nutrition impact"],
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
      setInsights(res.data);
    } catch (e) {
      console.error('Error:', e);
      setError(e.message || 'Failed to generate insights');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
            ✨ Insights & Advice
          </h3>
          <p className="text-xs text-gray-500 mt-1">AI-powered analysis of your health data</p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={loading || insights}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? 'Analyzing...' : insights ? 'Done' : 'Generate'}
        </Button>
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
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-800 mb-1">🍎 Food Impact on Skin</p>
              <p className="text-xs text-amber-900">{insights.foodInsights}</p>
            </div>
          )}

          {insights.motivation && (
            <div className="p-3 rounded-lg bg-white/60 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-800">💪 {insights.motivation}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}