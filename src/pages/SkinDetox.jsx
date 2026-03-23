import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Sparkles, Check, X, Calendar, TrendingUp, Zap, Droplets,
  Apple, Moon, Sun, Shield, AlertCircle, Star, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const DETOX_PLANS = [
  {
    id: '3day',
    name: '3-Day Reset',
    emoji: '🌿',
    color: 'from-emerald-400 to-teal-400',
    days: 3,
    description: 'Quick skin reset for when you\'re breaking out or feeling dull',
    rules: [
      { icon: '💧', text: 'Drink 3L water daily' },
      { icon: '🚫', text: 'No sugar, dairy, or alcohol' },
      { icon: '😴', text: 'Sleep by 10pm each night' },
      { icon: '🧘', text: 'No screens 1hr before bed' },
      { icon: '🌿', text: 'Green smoothie every morning' },
      { icon: '🧴', text: 'Minimal skincare: cleanser + moisturizer + SPF only' },
    ]
  },
  {
    id: '7day',
    name: '7-Day Glow Detox',
    emoji: '✨',
    color: 'from-amber-400 to-orange-400',
    days: 7,
    description: 'Full week protocol for noticeable skin transformation',
    rules: [
      { icon: '💧', text: '3L water daily + herbal teas only' },
      { icon: '🚫', text: 'No processed food, sugar, dairy, gluten' },
      { icon: '🥗', text: 'Anti-inflammatory diet: salmon, greens, berries' },
      { icon: '😴', text: '8 hours sleep minimum' },
      { icon: '🏃', text: '30min cardio daily (sweating detoxes skin)' },
      { icon: '🧘', text: '10min meditation for cortisol reduction' },
      { icon: '🌿', text: 'Matcha instead of coffee' },
      { icon: '🧴', text: 'Simplified 3-step routine only' },
    ]
  },
  {
    id: '21day',
    name: '21-Day Skin Transformation',
    emoji: '🌟',
    color: 'from-violet-500 to-pink-500',
    days: 21,
    description: 'Scientifically proven: 21 days to form new skin habits',
    rules: [
      { icon: '💧', text: 'Track water intake (3L min)' },
      { icon: '🚫', text: 'Eliminate all known skin triggers' },
      { icon: '🥗', text: 'Mediterranean + anti-inflammatory diet' },
      { icon: '😴', text: 'Sleep hygiene protocol nightly' },
      { icon: '🏃', text: 'Daily movement minimum 30 min' },
      { icon: '🧘', text: 'Stress management daily' },
      { icon: '📸', text: 'Progress photo every 3 days' },
      { icon: '💊', text: 'Consistent supplement routine' },
      { icon: '🌿', text: 'No alcohol or smoking' },
      { icon: '☀️', text: 'Daily SPF without exception' },
    ]
  }
];

const DAILY_CHECKINS = [
  { id: 'water', label: '3L Water', icon: '💧', points: 10 },
  { id: 'sleep', label: '8hr Sleep', icon: '😴', points: 15 },
  { id: 'exercise', label: '30min Exercise', icon: '🏃', points: 10 },
  { id: 'no_sugar', label: 'No Sugar', icon: '🚫', points: 12 },
  { id: 'no_dairy', label: 'No Dairy', icon: '🥛', points: 12 },
  { id: 'meditation', label: 'Meditation', icon: '🧘', points: 8 },
  { id: 'sunscreen', label: 'SPF Applied', icon: '☀️', points: 10 },
  { id: 'skincare', label: 'Full Routine', icon: '🧴', points: 8 },
  { id: 'greens', label: 'Ate Greens', icon: '🥗', points: 8 },
  { id: 'no_screen', label: 'No Screen 1hr Before Bed', icon: '📵', points: 7 },
];

export default function SkinDetox() {
  const [activePlan, setActivePlan] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [dailyChecked, setDailyChecked] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('skin-detox-state');
    if (saved) {
      const state = JSON.parse(saved);
      setActivePlan(state.plan);
      setStartDate(state.startDate);
      setTotalPoints(state.totalPoints || 0);
    }
    const todayChecks = localStorage.getItem('detox-today-' + new Date().toDateString());
    if (todayChecks) setDailyChecked(JSON.parse(todayChecks));
  }, []);

  const startPlan = (plan) => {
    const today = new Date().toISOString().split('T')[0];
    setActivePlan(plan);
    setStartDate(today);
    setDailyChecked({});
    localStorage.setItem('skin-detox-state', JSON.stringify({ plan, startDate: today, totalPoints: 0 }));
  };

  const endPlan = () => {
    setActivePlan(null);
    setStartDate(null);
    localStorage.removeItem('skin-detox-state');
  };

  const toggleCheck = (id) => {
    const item = DAILY_CHECKINS.find(c => c.id === id);
    setDailyChecked(prev => {
      const wasChecked = prev[id];
      const next = { ...prev, [id]: !wasChecked };
      localStorage.setItem('detox-today-' + new Date().toDateString(), JSON.stringify(next));
      const pts = !wasChecked ? totalPoints + item.points : totalPoints - item.points;
      setTotalPoints(pts);
      if (activePlan) localStorage.setItem('skin-detox-state', JSON.stringify({ plan: activePlan, startDate, totalPoints: pts }));
      return next;
    });
  };

  const todayScore = Object.entries(dailyChecked).filter(([,v]) => v).reduce((sum, [id]) => {
    const item = DAILY_CHECKINS.find(c => c.id === id);
    return sum + (item?.points || 0);
  }, 0);
  const maxDailyScore = DAILY_CHECKINS.reduce((sum, c) => sum + c.points, 0);
  const dayNumber = startDate ? Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1 : 0;
  const completionPct = activePlan ? Math.min(100, Math.round((dayNumber / activePlan.days) * 100)) : 0;

  const generatePersonalizedPlan = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: 'Create a personalized 7-day skin detox plan with daily specific actions, foods to eat and avoid, and expected results for each day. Focus on acne reduction and glow enhancement.',
      response_json_schema: {
        type: 'object',
        properties: {
          plan_name: { type: 'string' },
          goal: { type: 'string' },
          daily_plan: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'number' },
                focus: { type: 'string' },
                morning_routine: { type: 'string' },
                eat: { type: 'array', items: { type: 'string' } },
                avoid: { type: 'array', items: { type: 'string' } },
                expected_result: { type: 'string' }
              }
            }
          }
        }
      }
    });
    setAiPlan(result);
    setGenerating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">🌿 Skin Detox Programs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Reset your skin with science-backed detox protocols</p>
        </div>
        <Button onClick={generatePersonalizedPlan} disabled={generating} variant="outline">
          {generating ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          AI Personalize
        </Button>
      </div>

      {/* Active Plan Progress */}
      {activePlan && (
        <GlassCard className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Active Detox</p>
              <h3 className="font-bold text-lg">{activePlan.emoji} {activePlan.name}</h3>
              <p className="text-sm text-gray-500">Day {dayNumber} of {activePlan.days}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-emerald-500">{completionPct}%</p>
              <Button variant="outline" size="sm" onClick={endPlan} className="mt-2 text-red-500">End Detox</Button>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <motion.div className={`bg-gradient-to-r ${activePlan.color} h-3 rounded-full`}
              animate={{ width: `${completionPct}%` }} transition={{ duration: 0.8 }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div><p className="text-2xl font-bold text-emerald-500">{todayScore}</p><p className="text-xs text-gray-500">Today's Points</p></div>
            <div><p className="text-2xl font-bold text-amber-500">{totalPoints}</p><p className="text-xs text-gray-500">Total Points</p></div>
            <div><p className="text-2xl font-bold text-blue-500">{activePlan.days - dayNumber + 1}</p><p className="text-xs text-gray-500">Days Left</p></div>
          </div>
        </GlassCard>
      )}

      {/* Daily Checklist */}
      {activePlan && (
        <GlassCard>
          <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-pink-500" />Today's Check-ins</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DAILY_CHECKINS.map((item) => {
              const done = dailyChecked[item.id];
              return (
                <button key={item.id} onClick={() => toggleCheck(item.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${done ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300' : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${done ? 'text-emerald-600' : ''}`}>{item.label}</p>
                    <p className="text-xs text-gray-400">+{item.points}pts</p>
                  </div>
                  {done && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-500">Today's score: <span className="font-bold text-emerald-500">{todayScore}/{maxDailyScore}</span></p>
          </div>
        </GlassCard>
      )}

      {/* AI Plan */}
      {aiPlan && (
        <GlassCard>
          <h3 className="font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" />{aiPlan.plan_name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{aiPlan.goal}</p>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {aiPlan.daily_plan?.map((day) => (
              <div key={day.day} className="p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-pink-500">Day {day.day}</span>
                  <span className="text-xs font-medium text-gray-600">{day.focus}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{day.morning_routine}</p>
                <p className="text-xs text-emerald-600">Eat: {day.eat?.join(', ')}</p>
                <p className="text-xs text-red-500">Avoid: {day.avoid?.join(', ')}</p>
                <p className="text-xs text-amber-600 mt-1 italic">Expected: {day.expected_result}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Plan Selection */}
      {!activePlan && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Choose Your Detox Program</h3>
          {DETOX_PLANS.map((plan) => (
            <GlassCard key={plan.id} animate={false}>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-3xl flex-shrink-0`}>
                  {plan.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <Badge className={`bg-gradient-to-r ${plan.color} text-white`}>{plan.days} Days</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{plan.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.rules.map((rule, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-white/50 dark:bg-white/5 px-2 py-1 rounded-full">
                        {rule.icon} {rule.text}
                      </span>
                    ))}
                  </div>
                </div>
                <Button onClick={() => startPlan(plan)} className={`bg-gradient-to-r ${plan.color} flex-shrink-0 text-white`}>
                  Start
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}