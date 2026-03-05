import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Flame, Zap, Shield, Droplets, Sun, Moon,
  Check, Lock, ChevronRight, Award, Target, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const HABITS = [
  { id: 'water', label: 'Drink 8 glasses of water', icon: '💧', xp: 20, field: 'water_glasses', threshold: 8 },
  { id: 'sleep', label: 'Sleep 7+ hours', icon: '😴', xp: 30, field: 'sleep_hours', threshold: 7 },
  { id: 'exercise', label: 'Exercise 30+ minutes', icon: '🏃', xp: 25, field: 'exercise_minutes', threshold: 30 },
  { id: 'low_stress', label: 'Stress level ≤ 2', icon: '🧘', xp: 20, field: 'stress_level', threshold: 2, compare: 'lte' },
  { id: 'no_bad_foods', label: 'No bad foods logged', icon: '🥗', xp: 15, field: 'foods_bad', threshold: 0, compare: 'empty' },
];

const BADGES = [
  { id: 'first_log', name: 'First Step', icon: '🌱', desc: 'Log your first day', xpRequired: 0, logsRequired: 1 },
  { id: 'hydrated', name: 'Hydration Hero', icon: '💧', desc: '5 days of full water intake', xpRequired: 200, logsRequired: 5 },
  { id: 'sleeper', name: 'Sleep Champion', icon: '😴', desc: 'Log 7+ hours for 7 days', xpRequired: 350, logsRequired: 7 },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', desc: 'Log habits 3 days in a row', xpRequired: 150, logsRequired: 3 },
  { id: 'streak_7', name: 'Week Warrior', icon: '⚔️', desc: 'Log habits 7 days in a row', xpRequired: 500, logsRequired: 7 },
  { id: 'streak_30', name: 'Monthly Master', icon: '👑', desc: '30-day streak', xpRequired: 2000, logsRequired: 30 },
  { id: 'perfect_day', name: 'Perfect Day', icon: '⭐', desc: 'Complete all habits in one day', xpRequired: 100, logsRequired: 1 },
  { id: 'skin_improver', name: 'Glow Getter', icon: '✨', desc: 'Improve skin score by 10+', xpRequired: 300, logsRequired: 0 },
];

const LEVELS = [
  { level: 1, name: 'Skincare Newbie', minXP: 0, color: 'from-gray-400 to-gray-500' },
  { level: 2, name: 'Glow Apprentice', minXP: 200, color: 'from-emerald-400 to-teal-500' },
  { level: 3, name: 'Radiance Seeker', minXP: 500, color: 'from-blue-400 to-cyan-500' },
  { level: 4, name: 'Skincare Devotee', minXP: 1000, color: 'from-violet-400 to-purple-500' },
  { level: 5, name: 'Glow Master', minXP: 2000, color: 'from-pink-400 to-rose-500' },
  { level: 6, name: 'Derma Legend', minXP: 5000, color: 'from-amber-400 to-orange-500' },
];

function getLevel(xp) {
  return [...LEVELS].reverse().find(l => xp >= l.minXP) || LEVELS[0];
}

function nextLevel(xp) {
  return LEVELS.find(l => l.minXP > xp);
}

export default function GamifiedTracker() {
  const [user, setUser] = useState(null);
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState([]);
  const [todayChecked, setTodayChecked] = useState({});
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(null);
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: logs = [] } = useQuery({
    queryKey: ['dietLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 60),
    enabled: !!user?.email,
    onSuccess: (data) => computeStats(data),
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  function computeStats(data) {
    // Calculate XP from all logs
    let xp = 0;
    let currentStreak = 0;
    const sorted = [...data].sort((a, b) => b.log_date.localeCompare(a.log_date));
    const earned = new Set();

    sorted.forEach((log, idx) => {
      let dayXP = 0;
      let completedHabits = 0;

      HABITS.forEach(h => {
        const val = log[h.field];
        let done = false;
        if (h.compare === 'lte') done = val !== undefined && val <= h.threshold;
        else if (h.compare === 'empty') done = !val || val.length === 0;
        else done = val !== undefined && val >= h.threshold;
        if (done) { dayXP += h.xp; completedHabits++; }
      });

      if (completedHabits === HABITS.length) { dayXP += 50; earned.add('perfect_day'); }
      xp += dayXP;

      // Streak calc
      if (idx === 0) {
        if (log.log_date === today) currentStreak = 1;
      } else {
        const prev = sorted[idx - 1];
        const diff = (new Date(prev.log_date) - new Date(log.log_date)) / (1000 * 60 * 60 * 24);
        if (diff === 1) currentStreak++;
        else if (log.log_date !== today) currentStreak = 0;
      }
    });

    if (data.length >= 1) earned.add('first_log');
    if (currentStreak >= 3) earned.add('streak_3');
    if (currentStreak >= 7) earned.add('streak_7');
    if (currentStreak >= 30) earned.add('streak_30');

    // Hydration badge
    const fullWaterDays = data.filter(l => l.water_glasses >= 8).length;
    if (fullWaterDays >= 5) earned.add('hydrated');

    // Sleep badge
    const goodSleepDays = data.filter(l => l.sleep_hours >= 7).length;
    if (goodSleepDays >= 7) earned.add('sleeper');

    const todayLog = data.find(l => l.log_date === today);
    if (todayLog) {
      const checked = {};
      HABITS.forEach(h => {
        const val = todayLog[h.field];
        if (h.compare === 'lte') checked[h.id] = val !== undefined && val <= h.threshold;
        else if (h.compare === 'empty') checked[h.id] = !val || val.length === 0;
        else checked[h.id] = val !== undefined && val >= h.threshold;
      });
      setTodayChecked(checked);
    }

    const prevLvl = getLevel(totalXP);
    const newLvl = getLevel(xp);
    if (prevLvl && newLvl.level > prevLvl.level) {
      setPrevLevel(prevLvl);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 4000);
    }

    setTotalXP(xp);
    setStreak(currentStreak);
    setEarnedBadgeIds([...earned]);
  }

  useEffect(() => {
    if (logs.length > 0) computeStats(logs);
  }, [logs]);

  const currentLevel = getLevel(totalXP);
  const next = nextLevel(totalXP);
  const progressToNext = next ? ((totalXP - currentLevel.minXP) / (next.minXP - currentLevel.minXP)) * 100 : 100;

  const todayXP = Object.values(todayChecked).filter(Boolean).length * 20;
  const allDone = HABITS.every(h => todayChecked[h.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Level Up Toast */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl text-center"
          >
            <p className="text-2xl mb-1">🎉 Level Up!</p>
            <p className="font-bold text-lg">{currentLevel.name}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          Glow Tracker
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Build healthy habits and earn rewards</p>
      </div>

      {/* Level Card */}
      <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentLevel.color} flex items-center justify-center`}>
                <Star className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Level {currentLevel.level}</span>
            </div>
            <h2 className="text-2xl font-bold">{currentLevel.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-500">{totalXP}</p>
            <p className="text-xs text-gray-400">Total XP</p>
          </div>
        </div>

        {next && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{totalXP} XP</span>
              <span>{next.minXP} XP — {next.name}</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${currentLevel.color} rounded-full`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{next.minXP - totalXP} XP to next level</p>
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-white/10 rounded-xl px-4 py-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-lg font-bold">{streak}</p>
              <p className="text-xs text-gray-500">Day Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/50 dark:bg-white/10 rounded-xl px-4 py-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-lg font-bold">+{todayXP}</p>
              <p className="text-xs text-gray-500">Today's XP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/50 dark:bg-white/10 rounded-xl px-4 py-2">
            <Award className="w-5 h-5 text-violet-500" />
            <div>
              <p className="text-lg font-bold">{earnedBadgeIds.length}</p>
              <p className="text-xs text-gray-500">Badges</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Today's Habits */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-500" />
            Today's Habits
          </h3>
          {allDone && (
            <Badge className="bg-emerald-500 text-white">🌟 All Complete! +50 Bonus XP</Badge>
          )}
        </div>
        <div className="space-y-3">
          {HABITS.map((habit) => {
            const done = todayChecked[habit.id];
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  done
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{habit.icon}</span>
                  <div>
                    <p className={`font-medium text-sm ${done ? 'line-through text-gray-400' : ''}`}>{habit.label}</p>
                    <p className="text-xs text-amber-500 font-semibold">+{habit.xp} XP</p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  done ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}>
                  {done ? <Check className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          💡 Log habits in the <span className="font-semibold text-pink-500">Lifestyle</span> section to earn XP automatically
        </p>
      </GlassCard>

      {/* Badges */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Badges & Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGES.map((badge) => {
            const earned = earnedBadgeIds.includes(badge.id);
            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-xl text-center border-2 transition-all ${
                  earned
                    ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-50'
                }`}
              >
                <div className={`text-3xl mb-2 ${earned ? '' : 'grayscale'}`}>
                  {earned ? badge.icon : '🔒'}
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{badge.name}</p>
                <p className="text-xs text-gray-400 mt-1">{badge.desc}</p>
                {earned && <Badge className="mt-2 bg-amber-500 text-white text-xs">Earned!</Badge>}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* Levels Roadmap */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-500" />
          Levels Roadmap
        </h3>
        <div className="space-y-3">
          {LEVELS.map((lvl) => {
            const isCurrentLvl = currentLevel.level === lvl.level;
            const unlocked = totalXP >= lvl.minXP;
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-4 p-3 rounded-xl ${
                  isCurrentLvl ? 'bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 border-2 border-pink-300 dark:border-pink-700' :
                  unlocked ? 'bg-gray-50 dark:bg-gray-800/30' : 'opacity-40'
                }`}
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${lvl.color} flex items-center justify-center flex-shrink-0`}>
                  {unlocked ? <Star className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{lvl.name}</p>
                  <p className="text-xs text-gray-400">{lvl.minXP} XP required</p>
                </div>
                {isCurrentLvl && <Badge className="bg-pink-500 text-white text-xs">Current</Badge>}
                {unlocked && !isCurrentLvl && <Badge variant="outline" className="text-xs text-emerald-500">Unlocked</Badge>}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}