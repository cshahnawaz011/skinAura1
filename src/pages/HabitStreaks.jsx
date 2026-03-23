import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Trophy, Droplets, Moon, Sun, Dumbbell, Shield, Sparkles, Check, X } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';

const HABITS = [
  { key: 'water', label: 'Water Goal', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', check: (l) => (l.water_glasses || 0) >= 8 },
  { key: 'sleep', label: 'Sleep 7h+', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30', check: (l) => (l.sleep_hours || 0) >= 7 },
  { key: 'sunscreen', label: 'Sunscreen', icon: Shield, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', check: (l) => l.sunscreen_applied },
  { key: 'morning_routine', label: 'Morning Routine', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', check: (l) => l.skincare_done_morning },
  { key: 'night_routine', label: 'Night Routine', icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', check: (l) => l.skincare_done_night },
  { key: 'exercise', label: 'Exercise', icon: Dumbbell, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', check: (l) => (l.exercise_minutes || 0) >= 30 },
];

function getStreak(logs, checkFn) {
  let streak = 0;
  const sorted = [...logs].sort((a, b) => b.log_date?.localeCompare(a.log_date));
  for (const log of sorted) {
    if (checkFn(log)) streak++;
    else break;
  }
  return streak;
}

function getLast14(logs, checkFn) {
  const sorted = [...logs].sort((a, b) => a.log_date?.localeCompare(b.log_date)).slice(-14);
  return sorted.map(l => ({ date: l.log_date, done: checkFn(l) }));
}

export default function HabitStreaks() {
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['allLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 60),
    enabled: !!user?.email,
  });

  if (!user) return (
    <div className="max-w-2xl mx-auto">
      <GlassCard className="text-center py-12">
        <Flame className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Habit Streaks</h2>
        <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold">Sign In</button>
      </GlassCard>
    </div>
  );

  const maxStreak = Math.max(...HABITS.map(h => getStreak(logs, h.check)));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Flame className="w-7 h-7 text-orange-500" /> Habit Streaks</h1>
        <p className="text-gray-500 mt-1">Build consistent habits for glowing skin</p>
      </div>

      {/* Best Streak Banner */}
      {maxStreak > 0 && (
        <GlassCard className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 text-center">
          <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-1" />
          <p className="text-4xl font-black text-amber-500">{maxStreak}</p>
          <p className="text-sm text-gray-500">Best current streak 🔥</p>
        </GlassCard>
      )}

      {/* Habits Grid */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5,6].map(i => <GlassCard key={i} className="animate-pulse h-20" />)}</div>
      ) : (
        <div className="space-y-3">
          {HABITS.map((habit, i) => {
            const streak = getStreak(logs, habit.check);
            const history = getLast14(logs, habit.check);
            const Icon = habit.icon;
            const totalDone = logs.filter(habit.check).length;
            const pct = logs.length ? Math.round((totalDone / logs.length) * 100) : 0;

            return (
              <motion.div key={habit.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <GlassCard>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${habit.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${habit.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">{habit.label}</h3>
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className={`font-black text-lg ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{streak}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{pct}% consistency over {logs.length} days</p>
                    </div>
                  </div>

                  {/* 14-day grid */}
                  <div className="flex gap-1 flex-wrap">
                    {history.map((day, di) => (
                      <div key={di} title={day.date}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${day.done ? `${habit.bg} border border-current` : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {day.done
                          ? <Check className={`w-3 h-3 ${habit.color}`} />
                          : <X className="w-3 h-3 text-gray-300" />
                        }
                      </div>
                    ))}
                    {history.length === 0 && <p className="text-xs text-gray-400">Log lifestyle data to see streaks</p>}
                  </div>

                  {streak >= 7 && (
                    <div className="mt-2">
                      <Badge className="bg-amber-500 text-xs">🏆 {streak >= 30 ? 'Legendary' : streak >= 14 ? 'On Fire!' : 'Week Warrior'}</Badge>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}