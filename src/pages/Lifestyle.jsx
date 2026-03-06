import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Droplets, Moon, Dumbbell, Brain, Apple, Coffee,
  Plus, Minus, Check, TrendingUp, Calendar, Smile,
  Monitor, Footprints, Sun, Pill, Sparkles, Wind,
  Wine, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const goodFoods = ['Salmon', 'Avocado', 'Berries', 'Nuts', 'Green Tea', 'Spinach', 'Sweet Potato', 'Olive Oil', 'Turmeric', 'Cucumber', 'Walnuts', 'Dark Chocolate'];
const badFoods = ['Sugar', 'Dairy', 'Fried Food', 'Alcohol', 'Processed Food', 'Soda', 'White Bread', 'Fast Food', 'Chips'];
const vitaminOptions = ['Vitamin C', 'Vitamin D', 'Vitamin E', 'Zinc', 'Omega-3', 'Collagen', 'Biotin', 'Magnesium', 'Iron', 'B12'];
const moodOptions = [
  { value: 'great', emoji: '😄', label: 'Great', color: 'bg-emerald-500' },
  { value: 'good', emoji: '🙂', label: 'Good', color: 'bg-green-400' },
  { value: 'neutral', emoji: '😐', label: 'Okay', color: 'bg-amber-400' },
  { value: 'bad', emoji: '😔', label: 'Bad', color: 'bg-orange-400' },
  { value: 'terrible', emoji: '😫', label: 'Rough', color: 'bg-red-500' },
];

const DEFAULT_LOG = {
  water_glasses: 0,
  sleep_hours: 0,
  exercise_minutes: 0,
  steps: 0,
  stress_level: null,
  mood: null,
  screen_time_hours: 0,
  coffee_cups: 0,
  alcohol_drinks: 0,
  meditation_minutes: 0,
  outdoor_time_minutes: null,
  skincare_done_morning: false,
  skincare_done_night: false,
  sunscreen_applied: false,
  foods_good: [],
  foods_bad: [],
  vitamins_taken: [],
  notes: '',
};

function getWellnessScore(log) {
  if (!log) return 0;
  let score = 0;
  score += Math.min(25, (log.water_glasses || 0) * 3.1);
  const sleep = log.sleep_hours || 0;
  if (sleep >= 7 && sleep <= 9) score += 20;
  else if (sleep >= 6) score += 12;
  else if (sleep >= 5) score += 6;
  score += Math.min(15, (log.exercise_minutes || 0) / 4);
  const stress = log.stress_level || 3;
  score += (6 - stress) * 2.5;
  score += Math.min(8, (log.foods_good?.length || 0) * 1.5);
  if (log.skincare_done_morning) score += 4;
  if (log.skincare_done_night) score += 4;
  if (log.sunscreen_applied) score += 4;
  if (log.meditation_minutes >= 10) score += 3;
  if ((log.steps || 0) >= 8000) score += 3;
  score -= Math.min(10, (log.screen_time_hours || 0));
  score -= Math.min(6, (log.alcohol_drinks || 0) * 2);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function Lifestyle() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Calcutta' })
  );
  // Local state is the single source of truth for UI
  const [localLog, setLocalLog] = useState(DEFAULT_LOG);
  const logIdRef = useRef(null); // track DB record id
  const saveTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const pendingDataRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load log from DB when date/user changes
  const { data: fetchedLog, isLoading } = useQuery({
    queryKey: ['dietLog', user?.email, selectedDate],
    queryFn: async () => {
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: selectedDate });
      return logs[0] || null;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (fetchedLog) {
      logIdRef.current = fetchedLog.id;
      setLocalLog({ ...DEFAULT_LOG, ...fetchedLog });
    } else {
      logIdRef.current = null;
      setLocalLog(DEFAULT_LOG);
    }
  }, [fetchedLog]);

  const { data: weekLogs = [] } = useQuery({
    queryKey: ['weekLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 7),
    enabled: !!user?.email,
  });

  // Debounced save: merges all pending updates then saves once
  const scheduleSave = useCallback((newLog) => {
    pendingDataRef.current = newLog;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (isSavingRef.current) {
        // retry after a bit if currently saving
        saveTimerRef.current = setTimeout(() => scheduleSave(pendingDataRef.current), 500);
        return;
      }
      const dataToSave = pendingDataRef.current;
      pendingDataRef.current = null;
      isSavingRef.current = true;
      try {
        if (logIdRef.current) {
          await base44.entities.DietLog.update(logIdRef.current, dataToSave);
        } else {
          const created = await base44.entities.DietLog.create({
            user_email: user.email,
            log_date: selectedDate,
            ...dataToSave,
          });
          logIdRef.current = created.id;
        }
        queryClient.invalidateQueries(['weekLogs']);
      } finally {
        isSavingRef.current = false;
      }
    }, 400);
  }, [user, selectedDate, queryClient]);

  // Update local state immediately (instant UI) and schedule save
  const updateField = useCallback((field, value) => {
    setLocalLog(prev => {
      const next = { ...prev, [field]: value };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const toggleFood = useCallback((food, isGood) => {
    const field = isGood ? 'foods_good' : 'foods_bad';
    setLocalLog(prev => {
      const cur = prev[field] || [];
      const next = { ...prev, [field]: cur.includes(food) ? cur.filter(f => f !== food) : [...cur, food] };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const toggleVitamin = useCallback((v) => {
    setLocalLog(prev => {
      const cur = prev.vitamins_taken || [];
      const next = { ...prev, vitamins_taken: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const handleNotesBlur = () => {
    scheduleSave(localLog);
  };

  const chartData = weekLogs.map(log => ({
    date: format(new Date(log.log_date + 'T00:00:00'), 'EEE'),
    water: log.water_glasses || 0,
    sleep: log.sleep_hours || 0,
    steps: Math.round((log.steps || 0) / 1000),
  })).reverse();

  const score = getWellnessScore(localLog);
  const scoreColor = score >= 70 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const scoreLabel = score >= 70 ? 'Excellent 🌟' : score >= 50 ? 'Good 👍' : 'Needs Attention ⚡';

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <Droplets className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Lifestyle Tracker</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in to track how your lifestyle affects your skin</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">
            Sign In to Start Tracking
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Lifestyle Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Daily habits that impact your skin & health</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Wellness Score */}
      <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Today's Wellness Score</p>
            <p className={`text-5xl font-bold ${scoreColor}`}>{score}<span className="text-lg text-gray-400">/100</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Skin Impact</p>
            <p className={`font-semibold text-lg ${scoreColor}`}>{scoreLabel}</p>
          </div>
        </div>
      </GlassCard>

      {/* Row 1: Water, Sleep */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-500" />
            </div>
            <div><h3 className="font-semibold">Water Intake</h3><p className="text-xs text-gray-500">Goal: 8 glasses/day</p></div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button variant="outline" size="icon" onClick={() => updateField('water_glasses', Math.max(0, (localLog.water_glasses || 0) - 1))}>
              <Minus className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500">{localLog.water_glasses || 0}</p>
              <p className="text-sm text-gray-500">glasses</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => updateField('water_glasses', (localLog.water_glasses || 0) + 1)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}
                className={`w-6 h-8 rounded-full border-2 transition-colors cursor-pointer ${i < (localLog.water_glasses || 0) ? 'bg-blue-500 border-blue-500' : 'border-blue-200 dark:border-blue-800'}`}
                onClick={() => updateField('water_glasses', i + 1)}
              />
            ))}
          </div>
        </GlassCard>

        {/* Sleep */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-500" />
            </div>
            <div><h3 className="font-semibold">Sleep Hours</h3><p className="text-xs text-gray-500">Goal: 7–9 hours</p></div>
          </div>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-indigo-500">{localLog.sleep_hours || 0}<span className="text-lg text-gray-400"> hrs</span></p>
          </div>
          <Slider
            value={[localLog.sleep_hours || 0]}
            onValueChange={([v]) => updateField('sleep_hours', v)}
            max={12} step={0.5} className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-400"><span>0h</span><span>6h</span><span>12h</span></div>
        </GlassCard>
      </div>

      {/* Row 2: Exercise, Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exercise */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-500" />
            </div>
            <div><h3 className="font-semibold">Exercise</h3><p className="text-xs text-gray-500">Goal: 30+ minutes</p></div>
          </div>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-emerald-500">{localLog.exercise_minutes || 0}<span className="text-lg text-gray-400"> min</span></p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {[0, 15, 30, 45, 60, 90].map((min) => (
              <Button key={min} size="sm" variant={localLog.exercise_minutes === min ? 'default' : 'outline'}
                onClick={() => updateField('exercise_minutes', min)}
                className={localLog.exercise_minutes === min ? 'bg-emerald-500' : ''}
              >{min === 0 ? 'Rest' : `${min}m`}</Button>
            ))}
          </div>
        </GlassCard>

        {/* Steps */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Footprints className="w-5 h-5 text-teal-500" />
            </div>
            <div><h3 className="font-semibold">Daily Steps</h3><p className="text-xs text-gray-500">Goal: 8,000 steps</p></div>
          </div>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-teal-500">{(localLog.steps || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500">steps</p>
          </div>
          <Slider
            value={[localLog.steps || 0]}
            onValueChange={([v]) => updateField('steps', v)}
            max={20000} step={500} className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-400"><span>0</span><span>10k</span><span>20k</span></div>
        </GlassCard>
      </div>

      {/* Row 3: Stress, Mood */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stress */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-amber-500" />
            </div>
            <div><h3 className="font-semibold">Stress Level</h3><p className="text-xs text-gray-500">Low stress = better skin</p></div>
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button key={level} onClick={() => updateField('stress_level', level)}
                className={`w-12 h-12 rounded-xl font-bold transition-all ${localLog.stress_level === level
                  ? level <= 2 ? 'bg-emerald-500 text-white' : level <= 3 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >{level}</button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-1"><span>😌 Calm</span><span>😤 Stressed</span></div>
        </GlassCard>

        {/* Mood */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Smile className="w-5 h-5 text-purple-500" />
            </div>
            <div><h3 className="font-semibold">Mood</h3><p className="text-xs text-gray-500">How are you feeling?</p></div>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {moodOptions.map((m) => (
              <button key={m.value} onClick={() => updateField('mood', m.value)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all border-2 ${localLog.mood === m.value ? `${m.color} text-white border-transparent` : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'}`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Row 4: Screen Time, Coffee, Alcohol, Meditation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { field: 'screen_time_hours', label: 'Screen Time', icon: <Monitor className="w-7 h-7 text-slate-400" />, unit: 'hours', color: 'text-slate-500', step: 0.5 },
          { field: 'coffee_cups', label: 'Coffee', icon: <Coffee className="w-7 h-7 text-amber-600" />, unit: 'cups', color: 'text-amber-600', step: 1 },
          { field: 'alcohol_drinks', label: 'Alcohol', icon: <Wine className="w-7 h-7 text-purple-400" />, unit: 'drinks', color: 'text-purple-400', step: 1 },
          { field: 'meditation_minutes', label: 'Meditation', icon: <Wind className="w-7 h-7 text-cyan-500" />, unit: 'min', color: 'text-cyan-500', step: 5 },
        ].map(({ field, label, icon, unit, color, step }) => (
          <GlassCard key={field} className="p-4">
            <div className="text-center">
              <div className="mx-auto mb-2 w-fit">{icon}</div>
              <h4 className="font-semibold text-sm mb-3">{label}</h4>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Button variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => updateField(field, Math.max(0, parseFloat(((localLog[field] || 0) - step).toFixed(2))))}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className={`text-2xl font-bold ${color}`}>{localLog[field] || 0}</span>
                <Button variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => updateField(field, parseFloat(((localLog[field] || 0) + step).toFixed(2)))}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-400">{unit}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Outdoor Time */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Sun className="w-5 h-5 text-yellow-500" />
          </div>
          <div><h3 className="font-semibold">Outdoor / Sunlight Time</h3><p className="text-xs text-gray-500">Vitamin D is great for skin!</p></div>
        </div>
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-yellow-500">{localLog.outdoor_time_minutes || 0}<span className="text-lg text-gray-400"> min</span></p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {[0, 15, 30, 60, 90, 120].map((min) => (
            <Button key={min} size="sm" variant={localLog.outdoor_time_minutes === min ? 'default' : 'outline'}
              onClick={() => updateField('outdoor_time_minutes', min)}
              className={localLog.outdoor_time_minutes === min ? 'bg-yellow-500' : ''}
            >{min === 0 ? 'None' : `${min}m`}</Button>
          ))}
        </div>
      </GlassCard>

      {/* Skincare Checklist */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-500" />
          </div>
          <div><h3 className="font-semibold">Skincare Checklist</h3><p className="text-xs text-gray-500">Did you do your routine?</p></div>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { field: 'skincare_done_morning', label: '☀️ Morning Routine', color: 'bg-amber-500' },
            { field: 'skincare_done_night', label: '🌙 Night Routine', color: 'bg-indigo-500' },
            { field: 'sunscreen_applied', label: '🧴 Sunscreen Applied', color: 'bg-orange-400' },
          ].map(({ field, label, color }) => (
            <button key={field} onClick={() => updateField(field, !localLog[field])}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-medium text-sm transition-all ${localLog[field] ? `${color} text-white border-transparent` : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'}`}
            >
              {localLog[field] && <Check className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Vitamins & Supplements */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
            <Pill className="w-5 h-5 text-lime-600" />
          </div>
          <div><h3 className="font-semibold">Vitamins & Supplements</h3><p className="text-xs text-gray-500">What did you take today?</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {vitaminOptions.map((v) => (
            <Badge key={v} variant={localLog.vitamins_taken?.includes(v) ? 'default' : 'outline'}
              className={`cursor-pointer transition-all ${localLog.vitamins_taken?.includes(v) ? 'bg-lime-600 hover:bg-lime-700' : 'hover:bg-lime-50 dark:hover:bg-lime-900/20'}`}
              onClick={() => toggleVitamin(v)}
            >
              {localLog.vitamins_taken?.includes(v) && <Check className="w-3 h-3 mr-1" />}
              {v}
            </Badge>
          ))}
        </div>
      </GlassCard>

      {/* Food Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Apple className="w-5 h-5 text-emerald-500" />
            </div>
            <div><h3 className="font-semibold">Good for Skin</h3><p className="text-xs text-gray-500">Skin-loving foods eaten today</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {goodFoods.map((food) => (
              <Badge key={food} variant={localLog.foods_good?.includes(food) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${localLog.foods_good?.includes(food) ? 'bg-emerald-500 hover:bg-emerald-600' : 'hover:bg-emerald-50'}`}
                onClick={() => toggleFood(food, true)}
              >
                {localLog.foods_good?.includes(food) && <Check className="w-3 h-3 mr-1" />}
                {food}
              </Badge>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-red-500" />
            </div>
            <div><h3 className="font-semibold">Bad for Skin</h3><p className="text-xs text-gray-500">Foods to limit</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {badFoods.map((food) => (
              <Badge key={food} variant={localLog.foods_bad?.includes(food) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${localLog.foods_bad?.includes(food) ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-50'}`}
                onClick={() => toggleFood(food, false)}
              >
                {localLog.foods_bad?.includes(food) && <Check className="w-3 h-3 mr-1" />}
                {food}
              </Badge>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Daily Notes */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Pencil className="w-5 h-5 text-gray-500" />
          </div>
          <div><h3 className="font-semibold">Daily Notes</h3><p className="text-xs text-gray-500">Observations, feelings, skin changes...</p></div>
        </div>
        <Textarea
          placeholder="How does your skin feel today? Any flare-ups, changes, or observations..."
          value={localLog.notes || ''}
          onChange={(e) => setLocalLog(prev => ({ ...prev, notes: e.target.value }))}
          onBlur={handleNotesBlur}
          rows={3}
        />
      </GlassCard>

      {/* Weekly Chart */}
      {chartData.length > 1 && (
        <GlassCard>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Weekly Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="water" fill="#3b82f6" name="Water (glasses)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sleep" fill="#6366f1" name="Sleep (hours)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="steps" fill="#14b8a6" name="Steps (×1000)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}
    </div>
  );
}