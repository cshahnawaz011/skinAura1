import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, Plus, Sparkles, Check, Trophy, Flame, Loader2, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/ui/GlassCard';

const GOAL_TEMPLATES = [
  { title: 'Clear Acne in 4 Weeks', category: 'acne', target: 28, emoji: '🎯' },
  { title: 'Drink 8 Glasses Daily', category: 'hydration', target: 30, emoji: '💧' },
  { title: 'No Sugar for 2 Weeks', category: 'diet', target: 14, emoji: '🚫' },
  { title: 'SPF Every Day', category: 'protection', target: 30, emoji: '☀️' },
  { title: 'Consistent Night Routine', category: 'routine', target: 21, emoji: '🌙' },
  { title: 'Reduce Screen Time', category: 'lifestyle', target: 14, emoji: '📵' },
  { title: '8 Hours Sleep Streak', category: 'sleep', target: 7, emoji: '😴' },
  { title: 'Weekly Exfoliation', category: 'routine', target: 30, emoji: '✨' },
];

export default function GlowGoals() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', target_days: 30, category: 'routine', emoji: '🎯' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['glowGoals', user?.email],
    queryFn: () => base44.entities.GlowGoal.filter({ user_email: user.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const { data: analysis } = useQuery({
    queryKey: ['analysisForGoals', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0]),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GlowGoal.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['glowGoals']); setShowForm(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GlowGoal.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['glowGoals'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GlowGoal.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['glowGoals'])
  });

  const checkIn = (goal) => {
    const today = new Date().toISOString().split('T')[0];
    const checkins = goal.checkins || [];
    if (checkins.includes(today)) return;
    updateMutation.mutate({ id: goal.id, data: { ...goal, checkins: [...checkins, today], current_streak: (goal.current_streak || 0) + 1 } });
  };

  const getAiGoals = async () => {
    if (!analysis) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this skin profile: skin type ${analysis.skin_type}, acne ${analysis.acne_level}/10, oiliness ${analysis.oiliness}/10, dryness ${analysis.dryness}/10, dark spots ${analysis.dark_spots}/10.
Suggest 4 personalized skin improvement goals. Return JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          goals: {
            type: "array",
            items: { type: "object", properties: { title: { type: "string" }, category: { type: "string" }, target_days: { type: "number" }, emoji: { type: "string" }, reason: { type: "string" } } }
          }
        }
      }
    });
    setAiSuggestions(res.goals);
    setAiLoading(false);
  };

  const progressPct = (goal) => {
    const done = (goal.checkins || []).length;
    return Math.min(100, Math.round((done / goal.target_days) * 100));
  };

  if (!user) return (
    <div className="max-w-3xl mx-auto">
      <GlassCard className="text-center py-12">
        <Target className="w-12 h-12 text-pink-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Glow Goals</h2>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">Sign In</Button>
      </GlassCard>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="w-7 h-7 text-pink-500" /> Glow Goals</h1>
          <p className="text-gray-500 mt-1">Set skin & wellness goals, track streaks, glow up!</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={getAiGoals} disabled={aiLoading || !analysis} className="gap-1">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Goals
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-pink-500 to-amber-500">
            <Plus className="w-4 h-4 mr-2" /> Add Goal
          </Button>
        </div>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions && (
        <GlassCard>
          <p className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> AI Suggested Goals</p>
          <div className="space-y-2">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white/50 dark:bg-white/5 rounded-xl">
                <div>
                  <p className="font-medium text-sm">{s.emoji} {s.title}</p>
                  <p className="text-xs text-gray-500">{s.reason} • {s.target_days} days</p>
                </div>
                <Button size="sm" onClick={() => createMutation.mutate({ user_email: user.email, ...s, checkins: [], current_streak: 0 })} className="bg-pink-500 text-xs">
                  Add
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Quick Templates */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <h3 className="font-bold mb-3">Quick Templates</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {GOAL_TEMPLATES.map(t => (
                <button key={t.title} onClick={() => setForm({ title: t.title, target_days: t.target, category: t.category, emoji: t.emoji })}
                  className={`p-2 rounded-xl border-2 text-left transition-all ${form.title === t.title ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-pink-200'}`}>
                  <span className="text-xl">{t.emoji}</span>
                  <p className="text-xs font-medium mt-1">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.target} days</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Or write custom goal..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="flex-1" />
              <Input type="number" min="1" max="365" value={form.target_days} onChange={e => setForm(f => ({ ...f, target_days: +e.target.value }))} className="w-20" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={() => createMutation.mutate({ user_email: user.email, ...form, checkins: [], current_streak: 0 })} disabled={!form.title} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">
                Create Goal
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Goals List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <GlassCard key={i} className="animate-pulse h-24" />)}</div>
      ) : goals.length === 0 ? (
        <GlassCard className="text-center py-10">
          <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No goals yet! Add your first glow goal.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {goals.map((goal, i) => {
            const pct = progressPct(goal);
            const today = new Date().toISOString().split('T')[0];
            const checkedToday = (goal.checkins || []).includes(today);
            const completed = pct >= 100;
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className={completed ? 'border-2 border-amber-300' : ''}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goal.emoji || '🎯'}</span>
                      <div>
                        <h3 className="font-bold">{goal.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-gray-500">{goal.current_streak || 0} day streak</span>
                          <span className="text-xs text-gray-400">• {(goal.checkins || []).length}/{goal.target_days} days</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {completed && <Trophy className="w-5 h-5 text-amber-500" />}
                      <button onClick={() => deleteMutation.mutate(goal.id)}><Trash2 className="w-4 h-4 text-gray-300 hover:text-red-400" /></button>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{pct}% complete</span>
                    {!completed && (
                      <Button size="sm" onClick={() => checkIn(goal)} disabled={checkedToday}
                        className={checkedToday ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-gradient-to-r from-pink-500 to-amber-500'}>
                        {checkedToday ? <><Check className="w-3 h-3 mr-1" /> Done Today</> : '✅ Check In'}
                      </Button>
                    )}
                    {completed && <Badge className="bg-amber-500">🏆 Completed!</Badge>}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}