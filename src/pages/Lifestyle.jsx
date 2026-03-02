import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Droplets, Moon, Dumbbell, Brain, Apple, Coffee,
  Plus, Minus, Check, TrendingUp, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const goodFoods = ['Salmon', 'Avocado', 'Berries', 'Nuts', 'Green Tea', 'Spinach', 'Sweet Potato', 'Olive Oil'];
const badFoods = ['Sugar', 'Dairy', 'Fried Food', 'Alcohol', 'Processed Food', 'Soda', 'White Bread'];

export default function Lifestyle() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: todayLog, isLoading } = useQuery({
    queryKey: ['dietLog', user?.email, selectedDate],
    queryFn: async () => {
      const logs = await base44.entities.DietLog.filter({ 
        user_email: user.email, 
        log_date: selectedDate 
      });
      return logs[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: weekLogs = [] } = useQuery({
    queryKey: ['weekLogs', user?.email],
    queryFn: async () => {
      const logs = await base44.entities.DietLog.filter(
        { user_email: user.email },
        '-log_date',
        7
      );
      return logs;
    },
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (todayLog) {
        return base44.entities.DietLog.update(todayLog.id, data);
      }
      return base44.entities.DietLog.create({
        user_email: user.email,
        log_date: selectedDate,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dietLog']);
      queryClient.invalidateQueries(['weekLogs']);
    },
  });

  const updateField = (field, value) => {
    saveMutation.mutate({
      ...(todayLog || {}),
      [field]: value,
    });
  };

  const toggleFood = (food, isGood) => {
    const field = isGood ? 'foods_good' : 'foods_bad';
    const currentFoods = todayLog?.[field] || [];
    const newFoods = currentFoods.includes(food)
      ? currentFoods.filter(f => f !== food)
      : [...currentFoods, food];
    updateField(field, newFoods);
  };

  const getWellnessScore = () => {
    if (!todayLog) return 0;
    let score = 0;
    
    // Water (max 30 points)
    score += Math.min(30, (todayLog.water_glasses || 0) * 3.75);
    
    // Sleep (max 25 points)
    const sleepHours = todayLog.sleep_hours || 0;
    if (sleepHours >= 7 && sleepHours <= 9) score += 25;
    else if (sleepHours >= 6) score += 15;
    else if (sleepHours >= 5) score += 10;
    
    // Exercise (max 20 points)
    score += Math.min(20, (todayLog.exercise_minutes || 0) / 3);
    
    // Stress (max 15 points)
    const stress = todayLog.stress_level || 3;
    score += (6 - stress) * 3;
    
    // Good foods (max 10 points)
    score += Math.min(10, (todayLog.foods_good?.length || 0) * 2);
    
    return Math.round(score);
  };

  const chartData = weekLogs.map(log => ({
    date: format(new Date(log.log_date), 'EEE'),
    water: log.water_glasses || 0,
    sleep: log.sleep_hours || 0,
    exercise: (log.exercise_minutes || 0) / 10,
  })).reverse();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <Droplets className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Lifestyle Tracker</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Sign in to track how your lifestyle affects your skin
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-pink-500 to-amber-500"
          >
            Sign In to Start Tracking
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lifestyle Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track habits that impact your skin health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Wellness Score */}
      <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Today's Wellness Score</p>
            <p className="text-4xl font-bold text-gray-800 dark:text-white">
              {getWellnessScore()}<span className="text-lg text-gray-400">/100</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Impact on Skin</p>
            <p className={`font-semibold ${
              getWellnessScore() >= 70 ? 'text-emerald-500' :
              getWellnessScore() >= 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {getWellnessScore() >= 70 ? 'Excellent' :
               getWellnessScore() >= 50 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Main Trackers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Tracker */}
        <GlassCard delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Water Intake</h3>
              <p className="text-sm text-gray-500">Goal: 8 glasses</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateField('water_glasses', Math.max(0, (todayLog?.water_glasses || 0) - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500">
                {todayLog?.water_glasses || 0}
              </p>
              <p className="text-sm text-gray-500">glasses</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateField('water_glasses', (todayLog?.water_glasses || 0) + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-center gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-8 rounded-full border-2 transition-colors ${
                  i < (todayLog?.water_glasses || 0)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-blue-200 dark:border-blue-800'
                }`}
              />
            ))}
          </div>
        </GlassCard>

        {/* Sleep Tracker */}
        <GlassCard delay={0.2}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold">Sleep Hours</h3>
              <p className="text-sm text-gray-500">Goal: 7-9 hours</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-indigo-500">
              {todayLog?.sleep_hours || 0}
              <span className="text-lg text-gray-400"> hrs</span>
            </p>
          </div>

          <Slider
            value={[todayLog?.sleep_hours || 0]}
            onValueChange={([value]) => updateField('sleep_hours', value)}
            max={12}
            step={0.5}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
          </div>
        </GlassCard>

        {/* Exercise Tracker */}
        <GlassCard delay={0.3}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold">Exercise</h3>
              <p className="text-sm text-gray-500">Goal: 30+ minutes</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-emerald-500">
              {todayLog?.exercise_minutes || 0}
              <span className="text-lg text-gray-400"> min</span>
            </p>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {[15, 30, 45, 60].map((min) => (
              <Button
                key={min}
                variant={todayLog?.exercise_minutes === min ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateField('exercise_minutes', min)}
                className={todayLog?.exercise_minutes === min ? 'bg-emerald-500' : ''}
              >
                {min}m
              </Button>
            ))}
          </div>
        </GlassCard>

        {/* Stress Tracker */}
        <GlassCard delay={0.4}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold">Stress Level</h3>
              <p className="text-sm text-gray-500">How stressed are you?</p>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => updateField('stress_level', level)}
                className={`w-12 h-12 rounded-xl font-bold transition-all ${
                  todayLog?.stress_level === level
                    ? level <= 2 ? 'bg-emerald-500 text-white' :
                      level <= 3 ? 'bg-amber-500 text-white' :
                      'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
            <span>Calm</span>
            <span>Very Stressed</span>
          </div>
        </GlassCard>
      </div>

      {/* Food Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard delay={0.5}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Apple className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold">Good for Skin</h3>
              <p className="text-sm text-gray-500">Foods that help your skin</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {goodFoods.map((food) => (
              <Badge
                key={food}
                variant={todayLog?.foods_good?.includes(food) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  todayLog?.foods_good?.includes(food)
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'hover:bg-emerald-50'
                }`}
                onClick={() => toggleFood(food, true)}
              >
                {todayLog?.foods_good?.includes(food) && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {food}
              </Badge>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.6}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold">Bad for Skin</h3>
              <p className="text-sm text-gray-500">Foods to limit</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {badFoods.map((food) => (
              <Badge
                key={food}
                variant={todayLog?.foods_bad?.includes(food) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  todayLog?.foods_bad?.includes(food)
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'hover:bg-red-50'
                }`}
                onClick={() => toggleFood(food, false)}
              >
                {todayLog?.foods_bad?.includes(food) && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {food}
              </Badge>
            ))}
          </div>
        </GlassCard>
      </div>

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
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="water" fill="#3b82f6" name="Water (glasses)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sleep" fill="#6366f1" name="Sleep (hours)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exercise" fill="#10b981" name="Exercise (×10 min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}
    </div>
  );
}