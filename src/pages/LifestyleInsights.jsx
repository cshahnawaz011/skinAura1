import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, isAfter } from 'date-fns';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    }));
  }, [last30Days]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const water = chartData.reduce((a, b) => a + b.water, 0) / chartData.length;
    const sleep = chartData.reduce((a, b) => a + b.sleep, 0) / chartData.length;
    const exercise = chartData.reduce((a, b) => a + b.exercise, 0) / chartData.length;
    const waterGoalMet = chartData.filter(d => d.water >= WATER_GOAL).length;
    const sleepGoalMet = chartData.filter(d => d.sleep >= SLEEP_GOAL).length;
    const exerciseGoalMet = chartData.filter(d => d.exercise >= EXERCISE_GOAL).length;

    return {
      water: { avg: water.toFixed(1), goalMet: waterGoalMet },
      sleep: { avg: sleep.toFixed(1), goalMet: sleepGoalMet },
      exercise: { avg: exercise.toFixed(1), goalMet: exerciseGoalMet },
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
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold mb-2">Water</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-600">{stats.water.avg}</span>
              <span className="text-xs text-gray-500">/ {WATER_GOAL}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{stats.water.goalMet} days met</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 bg-violet-50 border border-violet-100">
            <p className="text-xs text-violet-600 font-semibold mb-2">Sleep</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-violet-600">{stats.sleep.avg}</span>
              <span className="text-xs text-gray-500">/ {SLEEP_GOAL}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{stats.sleep.goalMet} days met</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold mb-2">Exercise</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">{stats.exercise.avg}</span>
              <span className="text-xs text-gray-500">/ {EXERCISE_GOAL}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{stats.exercise.goalMet} days met</p>
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