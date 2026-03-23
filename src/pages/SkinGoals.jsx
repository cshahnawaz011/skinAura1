import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Check, Trash2, Sparkles, TrendingUp, Star,
  Calendar, Zap, Trophy, ChevronRight, Clock, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format, differenceInDays } from 'date-fns';

const PRESET_GOALS = [
  { title: 'Clear Acne in 30 Days', icon: '🎯', category: 'acne', deadline: 30, steps: ['Use BHA cleanser daily', 'Apply niacinamide serum', 'Avoid touching face', 'Change pillowcase weekly', 'No dairy for 30 days'] },
  { title: 'Glow Up This Month', icon: '✨', category: 'glow', deadline: 30, steps: ['8 glasses water daily', 'Vitamin C serum every morning', 'SPF every day', 'Sleep 7-8 hours', 'Weekly exfoliation'] },
  { title: 'Fade Dark Spots in 60 Days', icon: '🌟', category: 'hyperpigmentation', deadline: 60, steps: ['Vitamin C 15%+ every morning', 'SPF 50 daily (no exceptions)', 'Alpha-arbutin or kojic acid serum', 'No picking or squeezing', 'Retinol 2x per week at night'] },
  { title: 'Minimize Pores in 3 Weeks', icon: '🔬', category: 'pores', deadline: 21, steps: ['BHA toner daily', 'Clay mask 2x per week', 'Oil-free moisturizer only', 'Double cleanse at night', 'Cold water rinse after cleansing'] },
  { title: 'Hydration Boost Goal', icon: '💧', category: 'hydration', deadline: 14, steps: ['Hyaluronic acid serum on damp skin', '8+ glasses water daily', 'Humidifier at night', 'Barrier repair moisturizer', 'Avoid hot showers'] },
  { title: 'Anti-Aging Routine for 90 Days', icon: '⏰', category: 'aging', deadline: 90, steps: ['Retinol 3x per week at night', 'Peptide serum daily', 'Vitamin C every morning', 'SPF 50 mandatory', 'Facial massage 5 min daily'] },
];

export default function SkinGoals() {
  const [goals, setGoals] = useState([]);
  const [showPresets, setShowPresets] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customGoal, setCustomGoal] = useState({ title: '', icon: '🎯', deadline: 30, steps: [''] });
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const saved = localStorage.getItem('skin-goals');
    if (saved) setGoals(JSON.parse(saved));
  }, []);

  const saveGoals = (updated) => {
    setGoals(updated);
    localStorage.setItem('skin-goals', JSON.stringify(updated));
  };

  const addPresetGoal = (preset) => {
    const goal = {
      ...preset,
      id: Date.now().toString(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + preset.deadline * 86400000).toISOString().split('T')[0],
      completedSteps: [],
      progress: 0,
    };
    saveGoals([...goals, goal]);
    setShowPresets(false);
  };

  const toggleStep = (goalId, stepIdx) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      const completed = g.completedSteps.includes(stepIdx)
        ? g.completedSteps.filter(s => s !== stepIdx)
        : [...g.completedSteps, stepIdx];
      return { ...g, completedSteps: completed, progress: Math.round((completed.length / g.steps.length) * 100) };
    });
    saveGoals(updated);
  };

  const deleteGoal = (id) => saveGoals(goals.filter(g => g.id !== id));

  const addCustomStep = () => setCustomGoal(p => ({ ...p, steps: [...p.steps, ''] }));
  const updateStep = (i, val) => setCustomGoal(p => { const s = [...p.steps]; s[i] = val; return { ...p, steps: s }; });

  const saveCustom = () => {
    if (!customGoal.title) return;
    addPresetGoal(customGoal);
    setShowCustom(false);
    setCustomGoal({ title: '', icon: '🎯', deadline: 30, steps: [''] });
  };

  const generateAIGoal = async () => {
    if (!user) return;
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: 'Generate a personalized 30-day skin improvement goal with 5 specific daily action steps for someone wanting clearer, more radiant skin.',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          icon: { type: 'string' },
          deadline: { type: 'number' },
          steps: { type: 'array', items: { type: 'string' } },
          why: { type: 'string' }
        }
      }
    });
    setGenerating(false);
    if (result) addPresetGoal({ ...result, category: 'ai' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="w-7 h-7 text-pink-500" /> Skin Goals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set targets, track progress, transform your skin</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={generateAIGoal} disabled={generating}>
            {generating ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            AI Goal
          </Button>
          <Button variant="outline" onClick={() => setShowPresets(!showPresets)}>Browse Goals</Button>
          <Button onClick={() => setShowCustom(true)} className="bg-gradient-to-r from-pink-500 to-amber-500">
            <Plus className="w-4 h-4 mr-2" /> Custom Goal
          </Button>
        </div>
      </div>

      {/* Preset Goals */}
      <AnimatePresence>
        {showPresets && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard>
              <h3 className="font-bold mb-4">Expert Skin Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_GOALS.map((g, i) => (
                  <button key={i} onClick={() => addPresetGoal(g)}
                    className="flex items-start gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all text-left">
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{g.title}</p>
                      <p className="text-xs text-gray-500">{g.deadline} days • {g.steps.length} steps</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Goal Form */}
      <AnimatePresence>
        {showCustom && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <GlassCard>
              <h3 className="font-bold mb-4">Create Custom Goal</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Input value={customGoal.icon} onChange={e => setCustomGoal(p => ({...p, icon: e.target.value}))} placeholder="Emoji" className="col-span-1" />
                  <Input value={customGoal.title} onChange={e => setCustomGoal(p => ({...p, title: e.target.value}))} placeholder="Goal title..." className="col-span-2" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Deadline:</span>
                  <Input type="number" value={customGoal.deadline} onChange={e => setCustomGoal(p => ({...p, deadline: parseInt(e.target.value)}))} className="w-24" />
                  <span className="text-sm text-gray-500">days</span>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Action Steps</p>
                  {customGoal.steps.map((step, i) => (
                    <Input key={i} value={step} onChange={e => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}...`} className="mb-2" />
                  ))}
                  <Button variant="outline" size="sm" onClick={addCustomStep}><Plus className="w-3 h-3 mr-1" />Add Step</Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveCustom} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">Create Goal</Button>
                  <Button variant="outline" onClick={() => setShowCustom(false)}>Cancel</Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Goals */}
      {goals.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="font-semibold text-lg">No Goals Set Yet</p>
          <p className="text-gray-500 text-sm mt-1">Set your first skin goal and start your transformation journey</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const daysLeft = differenceInDays(new Date(goal.endDate), new Date());
            const isComplete = goal.progress === 100;
            return (
              <GlassCard key={goal.id} animate={false}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{goal.icon}</span>
                    <div>
                      <h3 className="font-bold">{goal.title}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />Started {format(new Date(goal.startDate + 'T00:00:00'), 'MMM d')}</span>
                        {isComplete ? (
                          <Badge className="bg-emerald-500 text-xs">🏆 Completed!</Badge>
                        ) : (
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-pink-500">{goal.progress}%</span>
                    <Button size="sm" variant="ghost" onClick={() => deleteGoal(goal.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <motion.div
                    className="bg-gradient-to-r from-pink-500 to-amber-500 h-2 rounded-full"
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="space-y-2">
                  {goal.steps.map((step, i) => {
                    const done = goal.completedSteps.includes(i);
                    return (
                      <button key={i} onClick={() => toggleStep(goal.id, i)}
                        className={`flex items-center gap-3 w-full p-2 rounded-xl transition-all text-left ${done ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                          {done && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm ${done ? 'line-through text-gray-400' : ''}`}>{step}</span>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}