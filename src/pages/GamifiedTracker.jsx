import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Flame, Zap, Shield, Droplets, Sun, Moon,
  Check, Lock, Award, Target, TrendingUp, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

// ─── HABITS ───────────────────────────────────────────────────────────────────
const HABITS = [
  { id: 'water', label: 'Drink 8 glasses of water', icon: '💧', xp: 20, field: 'water_glasses', threshold: 8 },
  { id: 'sleep', label: 'Sleep 7+ hours', icon: '😴', xp: 30, field: 'sleep_hours', threshold: 7 },
  { id: 'exercise', label: 'Exercise 30+ minutes', icon: '🏃', xp: 25, field: 'exercise_minutes', threshold: 30 },
  { id: 'sunscreen', label: 'Apply sunscreen', icon: '🌞', xp: 15, field: 'sunscreen_applied', threshold: true, compare: 'bool' },
  { id: 'skincare_am', label: 'Morning skincare done', icon: '🌸', xp: 20, field: 'skincare_done_morning', threshold: true, compare: 'bool' },
  { id: 'skincare_pm', label: 'Night skincare done', icon: '🌙', xp: 20, field: 'skincare_done_night', threshold: true, compare: 'bool' },
  { id: 'low_stress', label: 'Stress level ≤ 2', icon: '🧘', xp: 20, field: 'stress_level', threshold: 2, compare: 'lte' },
  { id: 'no_bad_foods', label: 'No bad foods logged', icon: '🥗', xp: 15, field: 'foods_bad', threshold: 0, compare: 'empty' },
  { id: 'meditation', label: 'Meditate 10+ mins', icon: '🪷', xp: 20, field: 'meditation_minutes', threshold: 10 },
  { id: 'outdoor', label: '30+ mins outdoor time', icon: '🌿', xp: 15, field: 'outdoor_time_minutes', threshold: 30 },
  { id: 'no_alcohol', label: 'No alcohol', icon: '🚫', xp: 15, field: 'alcohol_drinks', threshold: 0, compare: 'zero' },
  { id: 'steps', label: '8000+ steps', icon: '👟', xp: 20, field: 'steps', threshold: 8000 },
  { id: 'no_coffee', label: 'Coffee ≤ 1 cup', icon: '☕', xp: 10, field: 'coffee_cups', threshold: 1, compare: 'lte' },
];

// ─── 50 BADGES ────────────────────────────────────────────────────────────────
const BADGES = [
  // Logging Milestones
  { id: 'first_log', name: 'First Step', icon: '🌱', desc: 'Log your first day', category: 'Milestones' },
  { id: 'log_7', name: 'Week Logger', icon: '📅', desc: 'Log 7 days total', category: 'Milestones' },
  { id: 'log_30', name: 'Month Logger', icon: '🗓️', desc: 'Log 30 days total', category: 'Milestones' },
  { id: 'log_60', name: 'Bimonthly Beast', icon: '📆', desc: 'Log 60 days total', category: 'Milestones' },
  { id: 'log_100', name: 'Century Glow', icon: '💯', desc: 'Log 100 days total', category: 'Milestones' },
  // Streaks
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', desc: '3 days in a row', category: 'Streaks' },
  { id: 'streak_7', name: 'Week Warrior', icon: '⚔️', desc: '7-day streak', category: 'Streaks' },
  { id: 'streak_14', name: 'Fortnight Force', icon: '💪', desc: '14-day streak', category: 'Streaks' },
  { id: 'streak_21', name: 'Habit Formed', icon: '🧠', desc: '21-day streak', category: 'Streaks' },
  { id: 'streak_30', name: 'Monthly Master', icon: '👑', desc: '30-day streak', category: 'Streaks' },
  { id: 'streak_60', name: 'Streak Legend', icon: '🏆', desc: '60-day streak', category: 'Streaks' },
  { id: 'streak_100', name: 'Unstoppable', icon: '🚀', desc: '100-day streak', category: 'Streaks' },
  // Hydration
  { id: 'hydrated_5', name: 'Hydration Starter', icon: '💧', desc: '5 days full water intake', category: 'Hydration' },
  { id: 'hydrated_15', name: 'Hydration Hero', icon: '🌊', desc: '15 days full water intake', category: 'Hydration' },
  { id: 'hydrated_30', name: 'Water Wizard', icon: '🧙', desc: '30 days full water intake', category: 'Hydration' },
  // Sleep
  { id: 'sleep_7', name: 'Good Sleeper', icon: '😴', desc: '7 nights of 7+ hours', category: 'Sleep' },
  { id: 'sleep_15', name: 'Sleep Champion', icon: '🛌', desc: '15 nights of 7+ hours', category: 'Sleep' },
  { id: 'sleep_30', name: 'Dream Master', icon: '🌙', desc: '30 nights of 7+ hours', category: 'Sleep' },
  // Skincare
  { id: 'skincare_7am', name: 'AM Devotee', icon: '🌸', desc: '7 days morning skincare', category: 'Skincare' },
  { id: 'skincare_7pm', name: 'PM Devotee', icon: '🌙', desc: '7 days night skincare', category: 'Skincare' },
  { id: 'skincare_30am', name: 'Morning Ritual', icon: '☀️', desc: '30 days morning skincare', category: 'Skincare' },
  { id: 'skincare_30pm', name: 'Night Ritual', icon: '✨', desc: '30 days night skincare', category: 'Skincare' },
  { id: 'sunscreen_7', name: 'SPF Guardian', icon: '🕶️', desc: '7 days of sunscreen', category: 'Skincare' },
  { id: 'sunscreen_30', name: 'Sun Shield', icon: '🛡️', desc: '30 days of sunscreen', category: 'Skincare' },
  // Fitness
  { id: 'exercise_10', name: 'Mover', icon: '🏃', desc: '10 days of exercise', category: 'Fitness' },
  { id: 'exercise_30', name: 'Fitness Fan', icon: '🏋️', desc: '30 days of exercise', category: 'Fitness' },
  { id: 'steps_10', name: 'Step Starter', icon: '👟', desc: '10 days of 8000+ steps', category: 'Fitness' },
  { id: 'steps_30', name: 'Walker Pro', icon: '🚶', desc: '30 days of 8000+ steps', category: 'Fitness' },
  // Mental Wellness
  { id: 'meditation_5', name: 'Zen Beginner', icon: '🪷', desc: '5 days of meditation', category: 'Wellness' },
  { id: 'meditation_20', name: 'Mindful Soul', icon: '🧘', desc: '20 days of meditation', category: 'Wellness' },
  { id: 'low_stress_10', name: 'Chill Vibes', icon: '😌', desc: '10 low-stress days', category: 'Wellness' },
  { id: 'low_stress_30', name: 'Zen Master', icon: '☯️', desc: '30 low-stress days', category: 'Wellness' },
  // Nutrition
  { id: 'clean_diet_7', name: 'Clean Eater', icon: '🥗', desc: '7 days no bad foods', category: 'Nutrition' },
  { id: 'clean_diet_30', name: 'Nutrition Guru', icon: '🥦', desc: '30 days no bad foods', category: 'Nutrition' },
  { id: 'no_alcohol_30', name: 'Sober Glow', icon: '🚫', desc: '30 alcohol-free days', category: 'Nutrition' },
  { id: 'low_coffee_30', name: 'Decaf Queen', icon: '☕', desc: '30 days ≤1 cup coffee', category: 'Nutrition' },
  // Perfect Days
  { id: 'perfect_day_1', name: 'Perfect Day', icon: '⭐', desc: 'Complete all habits once', category: 'Special' },
  { id: 'perfect_day_7', name: 'Perfect Week', icon: '🌟', desc: '7 perfect habit days', category: 'Special' },
  { id: 'perfect_day_30', name: 'Flawless Month', icon: '💫', desc: '30 perfect habit days', category: 'Special' },
  // XP Milestones
  { id: 'xp_500', name: 'XP Earner', icon: '⚡', desc: 'Earn 500 XP', category: 'XP' },
  { id: 'xp_1000', name: 'XP Hunter', icon: '🎯', desc: 'Earn 1000 XP', category: 'XP' },
  { id: 'xp_5000', name: 'XP Legend', icon: '🏅', desc: 'Earn 5000 XP', category: 'XP' },
  { id: 'xp_10000', name: 'XP Grandmaster', icon: '👸', desc: 'Earn 10000 XP', category: 'XP' },
  // Outdoor / Nature
  { id: 'outdoor_10', name: 'Nature Lover', icon: '🌿', desc: '10 days of outdoor time', category: 'Wellness' },
  { id: 'outdoor_30', name: 'Outdoor Guru', icon: '🌳', desc: '30 days of outdoor time', category: 'Wellness' },
  // Combos
  { id: 'full_routine_7', name: 'Routine Keeper', icon: '🎀', desc: '7 days full AM+PM routine', category: 'Skincare' },
  { id: 'full_routine_30', name: 'Routine Legend', icon: '💎', desc: '30 days full AM+PM routine', category: 'Skincare' },
  { id: 'healthy_week', name: 'Healthy Week', icon: '🌈', desc: 'Water + Sleep + Exercise for 7 days', category: 'Special' },
  { id: 'glow_up', name: 'Glow Up', icon: '✨', desc: 'Improve skin score by 10+', category: 'Special' },
  { id: 'early_bird', name: 'Early Bird', icon: '🐦', desc: 'Log 20 days of morning skincare before 8AM', category: 'Special' },
];

// ─── 50 LEVELS ────────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, name: 'Skincare Newbie', minXP: 0, color: 'from-gray-400 to-gray-500', emoji: '🌱' },
  { level: 2, name: 'Glow Curious', minXP: 100, color: 'from-lime-400 to-lime-500', emoji: '🌿' },
  { level: 3, name: 'Cleanse Starter', minXP: 250, color: 'from-emerald-400 to-teal-400', emoji: '💦' },
  { level: 4, name: 'Hydration Seeker', minXP: 450, color: 'from-cyan-400 to-blue-400', emoji: '💧' },
  { level: 5, name: 'Routine Beginner', minXP: 700, color: 'from-blue-400 to-indigo-400', emoji: '📋' },
  { level: 6, name: 'Habit Builder', minXP: 1000, color: 'from-violet-400 to-purple-500', emoji: '🔨' },
  { level: 7, name: 'Glow Apprentice', minXP: 1400, color: 'from-purple-400 to-pink-400', emoji: '🌸' },
  { level: 8, name: 'Radiance Rookie', minXP: 1900, color: 'from-pink-400 to-rose-400', emoji: '✨' },
  { level: 9, name: 'SPF Follower', minXP: 2500, color: 'from-rose-400 to-red-400', emoji: '☀️' },
  { level: 10, name: 'Skincare Explorer', minXP: 3200, color: 'from-red-400 to-orange-400', emoji: '🧭' },
  { level: 11, name: 'Glow Enthusiast', minXP: 4000, color: 'from-orange-400 to-amber-400', emoji: '🔥' },
  { level: 12, name: 'Serum Devotee', minXP: 5000, color: 'from-amber-400 to-yellow-400', emoji: '🧴' },
  { level: 13, name: 'Moisture Mage', minXP: 6200, color: 'from-yellow-400 to-lime-400', emoji: '🪄' },
  { level: 14, name: 'Cleanser Pro', minXP: 7600, color: 'from-lime-500 to-emerald-500', emoji: '🫧' },
  { level: 15, name: 'Vitamin C Warrior', minXP: 9200, color: 'from-emerald-500 to-cyan-500', emoji: '🍋' },
  { level: 16, name: 'Skincare Devotee', minXP: 11000, color: 'from-cyan-500 to-blue-500', emoji: '💙' },
  { level: 17, name: 'Antioxidant Ace', minXP: 13000, color: 'from-blue-500 to-indigo-500', emoji: '🫐' },
  { level: 18, name: 'Peptide Pioneer', minXP: 15200, color: 'from-indigo-500 to-violet-500', emoji: '🔬' },
  { level: 19, name: 'Exfoliation Expert', minXP: 17600, color: 'from-violet-500 to-purple-500', emoji: '🌀' },
  { level: 20, name: 'Retinol Ranger', minXP: 20200, color: 'from-purple-500 to-pink-500', emoji: '⚗️' },
  { level: 21, name: 'Glow Alchemist', minXP: 23000, color: 'from-pink-500 to-rose-500', emoji: '🌟' },
  { level: 22, name: 'Skin Whisperer', minXP: 26000, color: 'from-rose-500 to-red-500', emoji: '🗣️' },
  { level: 23, name: 'Hyaluronic Hero', minXP: 29200, color: 'from-red-400 to-orange-500', emoji: '💎' },
  { level: 24, name: 'Barrier Defender', minXP: 32600, color: 'from-orange-500 to-amber-500', emoji: '🛡️' },
  { level: 25, name: 'Glow Specialist', minXP: 36200, color: 'from-amber-500 to-yellow-500', emoji: '⭐' },
  { level: 26, name: 'Niacinamide Ninja', minXP: 40000, color: 'from-yellow-500 to-lime-500', emoji: '🥷' },
  { level: 27, name: 'Ceramide Scholar', minXP: 44000, color: 'from-lime-500 to-green-500', emoji: '📚' },
  { level: 28, name: 'AHA/BHA Boss', minXP: 48200, color: 'from-green-500 to-teal-500', emoji: '👊' },
  { level: 29, name: 'Collagen Captain', minXP: 52600, color: 'from-teal-500 to-cyan-500', emoji: '⚓' },
  { level: 30, name: 'Radiance Master', minXP: 57200, color: 'from-cyan-500 to-blue-600', emoji: '🌠' },
  { level: 31, name: 'Skin Scientist', minXP: 62000, color: 'from-blue-600 to-indigo-600', emoji: '🔭' },
  { level: 32, name: 'Glow Architect', minXP: 67000, color: 'from-indigo-600 to-violet-600', emoji: '🏗️' },
  { level: 33, name: 'Elasticity Expert', minXP: 72200, color: 'from-violet-600 to-purple-600', emoji: '🧬' },
  { level: 34, name: 'Microbiome Maven', minXP: 77600, color: 'from-purple-600 to-pink-600', emoji: '🦠' },
  { level: 35, name: 'Skin Therapist', minXP: 83200, color: 'from-pink-600 to-rose-600', emoji: '💆' },
  { level: 36, name: 'Glow Oracle', minXP: 89000, color: 'from-rose-600 to-red-600', emoji: '🔮' },
  { level: 37, name: 'Age Defier', minXP: 95000, color: 'from-red-500 to-orange-600', emoji: '⏳' },
  { level: 38, name: 'Luminosity Lord', minXP: 101200, color: 'from-orange-600 to-amber-600', emoji: '🌟' },
  { level: 39, name: 'Skin Sage', minXP: 107600, color: 'from-amber-600 to-yellow-600', emoji: '🦉' },
  { level: 40, name: 'Glow Grandmaster', minXP: 114200, color: 'from-yellow-600 to-lime-600', emoji: '🏆' },
  { level: 41, name: 'Derma Virtuoso', minXP: 121000, color: 'from-lime-600 to-green-600', emoji: '🎻' },
  { level: 42, name: 'Radiance Royalty', minXP: 128000, color: 'from-green-600 to-teal-600', emoji: '👸' },
  { level: 43, name: 'Skin Sovereign', minXP: 135200, color: 'from-teal-600 to-cyan-600', emoji: '👑' },
  { level: 44, name: 'Glow Titan', minXP: 142600, color: 'from-cyan-600 to-blue-700', emoji: '🗿' },
  { level: 45, name: 'Luminous Legend', minXP: 150200, color: 'from-blue-700 to-indigo-700', emoji: '🌌' },
  { level: 46, name: 'Skin Immortal', minXP: 158000, color: 'from-indigo-700 to-violet-700', emoji: '♾️' },
  { level: 47, name: 'Glow Demigod', minXP: 166000, color: 'from-violet-700 to-purple-700', emoji: '⚡' },
  { level: 48, name: 'Radiance Supreme', minXP: 174200, color: 'from-purple-700 to-pink-700', emoji: '💠' },
  { level: 49, name: 'Glow Eternal', minXP: 182600, color: 'from-pink-700 to-rose-700', emoji: '🌸' },
  { level: 50, name: 'The Glow Goddess', minXP: 191200, color: 'from-amber-400 via-pink-400 to-violet-400', emoji: '✨' },
];

function habitDone(log, habit) {
  const val = log[habit.field];
  if (habit.compare === 'bool') return val === true;
  if (habit.compare === 'lte') return val !== undefined && val !== null && val <= habit.threshold;
  if (habit.compare === 'empty') return !val || (Array.isArray(val) && val.length === 0);
  if (habit.compare === 'zero') return val === 0 || val === undefined || val === null;
  return val !== undefined && val !== null && val >= habit.threshold;
}

function getLevel(xp) {
  return [...LEVELS].reverse().find(l => xp >= l.minXP) || LEVELS[0];
}

function nextLevel(xp) {
  return LEVELS.find(l => l.minXP > xp);
}

function computeAllStats(logs, analyses, today) {
  const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
  const earned = new Set();
  let xp = 0;
  let currentStreak = 0;
  let perfectDays = 0;

  // Streak calculation
  let tempStreak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    if (i === 0) {
      const daysDiff = (new Date(today) - new Date(log.log_date)) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) tempStreak = 1;
      else break;
    } else {
      const diff = (new Date(sorted[i - 1].log_date) - new Date(log.log_date)) / (1000 * 60 * 60 * 24);
      if (diff === 1) tempStreak++;
      else break;
    }
  }
  currentStreak = tempStreak;

  // XP & badge counters
  let waterDays = 0, sleepDays = 0, exerciseDays = 0, sunscreenDays = 0;
  let amDays = 0, pmDays = 0, meditationDays = 0, lowStressDays = 0;
  let cleanDietDays = 0, noAlcoholDays = 0, lowCoffeeDays = 0, outdoorDays = 0, stepsDays = 0;
  let fullRoutineDays = 0, healthyTripleDays = 0;

  sorted.forEach(log => {
    let dayXP = 0;
    let completedCount = 0;

    HABITS.forEach(h => {
      if (habitDone(log, h)) { dayXP += h.xp; completedCount++; }
    });

    if (completedCount === HABITS.length) { dayXP += 100; perfectDays++; }
    xp += dayXP;

    if (log.water_glasses >= 8) waterDays++;
    if (log.sleep_hours >= 7) sleepDays++;
    if (log.exercise_minutes >= 30) exerciseDays++;
    if (log.sunscreen_applied === true) sunscreenDays++;
    if (log.skincare_done_morning === true) amDays++;
    if (log.skincare_done_night === true) pmDays++;
    if (log.meditation_minutes >= 10) meditationDays++;
    if (log.stress_level !== undefined && log.stress_level !== null && log.stress_level <= 2) lowStressDays++;
    if (!log.foods_bad || log.foods_bad.length === 0) cleanDietDays++;
    if (!log.alcohol_drinks || log.alcohol_drinks === 0) noAlcoholDays++;
    if (!log.coffee_cups || log.coffee_cups <= 1) lowCoffeeDays++;
    if (log.outdoor_time_minutes >= 30) outdoorDays++;
    if (log.steps >= 8000) stepsDays++;
    if (log.skincare_done_morning === true && log.skincare_done_night === true) fullRoutineDays++;
    if (log.water_glasses >= 8 && log.sleep_hours >= 7 && log.exercise_minutes >= 30) healthyTripleDays++;
  });

  // Badge logic
  if (sorted.length >= 1) earned.add('first_log');
  if (sorted.length >= 7) earned.add('log_7');
  if (sorted.length >= 30) earned.add('log_30');
  if (sorted.length >= 60) earned.add('log_60');
  if (sorted.length >= 100) earned.add('log_100');

  if (currentStreak >= 3) earned.add('streak_3');
  if (currentStreak >= 7) earned.add('streak_7');
  if (currentStreak >= 14) earned.add('streak_14');
  if (currentStreak >= 21) earned.add('streak_21');
  if (currentStreak >= 30) earned.add('streak_30');
  if (currentStreak >= 60) earned.add('streak_60');
  if (currentStreak >= 100) earned.add('streak_100');

  if (waterDays >= 5) earned.add('hydrated_5');
  if (waterDays >= 15) earned.add('hydrated_15');
  if (waterDays >= 30) earned.add('hydrated_30');

  if (sleepDays >= 7) earned.add('sleep_7');
  if (sleepDays >= 15) earned.add('sleep_15');
  if (sleepDays >= 30) earned.add('sleep_30');

  if (amDays >= 7) earned.add('skincare_7am');
  if (pmDays >= 7) earned.add('skincare_7pm');
  if (amDays >= 30) earned.add('skincare_30am');
  if (pmDays >= 30) earned.add('skincare_30pm');
  if (sunscreenDays >= 7) earned.add('sunscreen_7');
  if (sunscreenDays >= 30) earned.add('sunscreen_30');

  if (exerciseDays >= 10) earned.add('exercise_10');
  if (exerciseDays >= 30) earned.add('exercise_30');
  if (stepsDays >= 10) earned.add('steps_10');
  if (stepsDays >= 30) earned.add('steps_30');

  if (meditationDays >= 5) earned.add('meditation_5');
  if (meditationDays >= 20) earned.add('meditation_20');
  if (lowStressDays >= 10) earned.add('low_stress_10');
  if (lowStressDays >= 30) earned.add('low_stress_30');

  if (cleanDietDays >= 7) earned.add('clean_diet_7');
  if (cleanDietDays >= 30) earned.add('clean_diet_30');
  if (noAlcoholDays >= 30) earned.add('no_alcohol_30');
  if (lowCoffeeDays >= 30) earned.add('low_coffee_30');

  if (outdoorDays >= 10) earned.add('outdoor_10');
  if (outdoorDays >= 30) earned.add('outdoor_30');

  if (perfectDays >= 1) earned.add('perfect_day_1');
  if (perfectDays >= 7) earned.add('perfect_day_7');
  if (perfectDays >= 30) earned.add('perfect_day_30');

  if (xp >= 500) earned.add('xp_500');
  if (xp >= 1000) earned.add('xp_1000');
  if (xp >= 5000) earned.add('xp_5000');
  if (xp >= 10000) earned.add('xp_10000');

  if (fullRoutineDays >= 7) earned.add('full_routine_7');
  if (fullRoutineDays >= 30) earned.add('full_routine_30');
  if (healthyTripleDays >= 7) earned.add('healthy_week');

  // Glow up badge: check if skin score improved 10+
  if (analyses.length >= 2) {
    const latestScore = analyses[0]?.overall_score;
    const earliestScore = analyses[analyses.length - 1]?.overall_score;
    if (latestScore && earliestScore && latestScore - earliestScore >= 10) earned.add('glow_up');
  }

  // Today's habits
  const todayLog = sorted.find(l => l.log_date === today);
  const todayChecked = {};
  if (todayLog) {
    HABITS.forEach(h => { todayChecked[h.id] = habitDone(todayLog, h); });
  }

  return { xp, currentStreak, earnedBadgeIds: [...earned], todayChecked, perfectDays };
}

const BADGE_CATEGORIES = [...new Set(BADGES.map(b => b.category))];

export default function GamifiedTracker() {
  const [user, setUser] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevelRef, setPrevLevelRef] = useState(null);
  const [expandedLevels, setExpandedLevels] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  // Use IST (Asia/Calcutta) local date as today
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Calcutta' }); // YYYY-MM-DD

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: logs = [] } = useQuery({
    queryKey: ['dietLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 100),
    enabled: !!user?.email,
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const stats = useMemo(() => computeAllStats(logs, analyses, today), [logs, analyses, today]);
  const { xp: totalXP, currentStreak, earnedBadgeIds, todayChecked } = stats;

  const currentLevel = getLevel(totalXP);
  const next = nextLevel(totalXP);
  const progressToNext = next ? ((totalXP - currentLevel.minXP) / (next.minXP - currentLevel.minXP)) * 100 : 100;

  // Level-up toast detection
  useEffect(() => {
    if (!prevLevelRef) { setPrevLevelRef(currentLevel); return; }
    if (currentLevel.level > prevLevelRef.level) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 4000);
    }
    setPrevLevelRef(currentLevel);
  }, [totalXP]);

  const todayXP = HABITS.filter(h => todayChecked[h.id]).reduce((sum, h) => sum + h.xp, 0);
  const allDone = HABITS.every(h => todayChecked[h.id]);

  const filteredBadges = activeCategory === 'All' ? BADGES : BADGES.filter(b => b.category === activeCategory);
  const displayedLevels = expandedLevels ? LEVELS : LEVELS.slice(0, 10);

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
            <p className="font-bold text-lg">{currentLevel.emoji} {currentLevel.name}</p>
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
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentLevel.color} flex items-center justify-center text-lg`}>
                {currentLevel.emoji}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Level {currentLevel.level}</span>
            </div>
            <h2 className="text-2xl font-bold">{currentLevel.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-500">{totalXP.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Total XP</p>
          </div>
        </div>

        {next ? (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{totalXP.toLocaleString()} XP</span>
              <span>{next.minXP.toLocaleString()} XP — {next.name}</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${currentLevel.color} rounded-full`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{(next.minXP - totalXP).toLocaleString()} XP to next level</p>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-amber-500 font-bold text-sm">🌟 MAX LEVEL REACHED! You are a Glow Goddess! 🌟</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-white/10 rounded-xl px-4 py-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-lg font-bold">{currentStreak}</p>
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
              <p className="text-lg font-bold">{earnedBadgeIds.length}<span className="text-xs text-gray-400">/{BADGES.length}</span></p>
              <p className="text-xs text-gray-500">Badges</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/50 dark:bg-white/10 rounded-xl px-4 py-2">
            <Star className="w-5 h-5 text-pink-500" />
            <div>
              <p className="text-lg font-bold">Lv.{currentLevel.level}<span className="text-xs text-gray-400">/50</span></p>
              <p className="text-xs text-gray-500">Level</p>
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
            <Badge className="bg-emerald-500 text-white">🌟 All Complete! +100 Bonus XP</Badge>
          )}
        </div>
        <div className="space-y-2">
          {HABITS.map((habit, i) => {
            const done = todayChecked[habit.id];
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  done
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{habit.icon}</span>
                  <div>
                    <p className={`font-medium text-sm ${done ? 'line-through text-gray-400' : ''}`}>{habit.label}</p>
                    <p className="text-xs text-amber-500 font-semibold">+{habit.xp} XP</p>
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  {done ? <Check className="w-4 h-4 text-white" /> : <span className="w-3 h-3 rounded-full bg-gray-400" />}
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
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Badges & Achievements ({earnedBadgeIds.length}/{BADGES.length})
        </h3>
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['All', ...BADGE_CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-amber-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredBadges.map((badge) => {
            const earned = earnedBadgeIds.includes(badge.id);
            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                className={`p-3 rounded-xl text-center border-2 transition-all cursor-default ${
                  earned
                    ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{earned ? badge.icon : '🔒'}</div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-tight">{badge.name}</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{badge.desc}</p>
                {earned && <Badge className="mt-2 bg-amber-500 text-white text-[10px] px-1.5 py-0">Earned!</Badge>}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {/* Levels Roadmap */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-500" />
          Levels Roadmap (50 Levels)
        </h3>
        <div className="space-y-2">
          {displayedLevels.map((lvl) => {
            const isCurrentLvl = currentLevel.level === lvl.level;
            const unlocked = totalXP >= lvl.minXP;
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrentLvl
                    ? 'bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 border-2 border-pink-300 dark:border-pink-700'
                    : unlocked
                    ? 'bg-gray-50 dark:bg-gray-800/30'
                    : 'opacity-40'
                }`}
              >
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${lvl.color} flex items-center justify-center flex-shrink-0 text-base`}>
                  {unlocked ? lvl.emoji : <Lock className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{lvl.name}</p>
                  <p className="text-xs text-gray-400">{lvl.minXP.toLocaleString()} XP — Level {lvl.level}</p>
                </div>
                {isCurrentLvl && <Badge className="bg-pink-500 text-white text-xs flex-shrink-0">Current</Badge>}
                {unlocked && !isCurrentLvl && <Badge variant="outline" className="text-xs text-emerald-500 flex-shrink-0">✓</Badge>}
              </div>
            );
          })}
        </div>
        <Button
          variant="ghost"
          onClick={() => setExpandedLevels(!expandedLevels)}
          className="w-full mt-3 text-sm text-gray-500"
        >
          {expandedLevels ? <><ChevronUp className="w-4 h-4 mr-1" /> Show Less</> : <><ChevronDown className="w-4 h-4 mr-1" /> Show All 50 Levels</>}
        </Button>
      </GlassCard>
    </div>
  );
}