import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Sun, Moon, Plus, Trash2, Bell, Check, Sparkles,
  Calendar, Zap, Timer, ChevronDown, ChevronUp, Play, Pause,
  RotateCcw, Star, AlertCircle, Coffee, Droplets
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';

const DEFAULT_BLOCKS = [
  { id: '1', time: '06:30', label: 'Wake Up & Hydrate', icon: '💧', category: 'morning', duration: 5, color: 'from-blue-400 to-cyan-400', tip: 'Drink 500ml water immediately on waking' },
  { id: '2', time: '07:00', label: 'Morning Skincare Routine', icon: '☀️', category: 'morning', duration: 15, color: 'from-amber-400 to-orange-400', tip: 'Cleanse → Tone → Serum → Moisturizer → SPF' },
  { id: '3', time: '07:30', label: 'Breakfast (Skin-Friendly)', icon: '🥗', category: 'morning', duration: 20, color: 'from-emerald-400 to-green-400', tip: 'Include antioxidants: berries, avocado, green tea' },
  { id: '4', time: '12:30', label: 'SPF Reapplication', icon: '🧴', category: 'afternoon', duration: 3, color: 'from-yellow-400 to-amber-400', tip: 'Reapply SPF every 2-3 hours when outdoors' },
  { id: '5', time: '18:00', label: 'Evening Walk / Exercise', icon: '🏃', category: 'afternoon', duration: 30, color: 'from-teal-400 to-emerald-400', tip: 'Boosts circulation, delivers nutrients to skin cells' },
  { id: '6', time: '20:00', label: 'Night Skincare Routine', icon: '🌙', category: 'night', duration: 20, color: 'from-indigo-500 to-purple-500', tip: 'Double cleanse → Active treatment → Moisturize → Eye cream' },
  { id: '7', time: '21:00', label: 'Screen-Free Wind Down', icon: '📵', category: 'night', duration: 30, color: 'from-violet-400 to-purple-400', tip: 'Blue light ages skin and disrupts melatonin' },
  { id: '8', time: '22:00', label: 'Sleep (Skin Repair Time)', icon: '😴', category: 'night', duration: 480, color: 'from-slate-400 to-indigo-400', tip: 'Growth hormone peaks at 10pm–2am for skin repair' },
];

const AI_INSIGHTS = [
  { icon: '🌙', title: 'Sleep is Skin Repair', text: 'Skin cells regenerate 3x faster at night. 7-9 hours = optimal collagen synthesis.' },
  { icon: '☀️', title: 'Morning SPF is Non-Negotiable', text: '80% of skin aging comes from UV. Apply SPF 30+ every single morning.' },
  { icon: '💧', title: 'Hydration Window', text: 'Drink water 30 min before meals for optimal skin hydration absorption.' },
  { icon: '🥗', title: 'Anti-Inflammatory Dinner', text: 'Avoid high-glycemic foods at dinner. They spike insulin → more sebum → breakouts.' },
  { icon: '🧘', title: 'Stress & Cortisol', text: 'Cortisol breaks down collagen. 10 min evening meditation reduces cortisol by 20%.' },
];

export default function SmartScheduler() {
  const [user, setUser] = useState(null);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [activeBlock, setActiveBlock] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlock, setNewBlock] = useState({ time: '', label: '', icon: '✨', duration: 10, category: 'morning' });
  const [completedToday, setCompletedToday] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [aiSchedule, setAiSchedule] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const saved = localStorage.getItem('scheduler-completed-' + new Date().toDateString());
    if (saved) setCompletedToday(new Set(JSON.parse(saved)));
    const savedBlocks = localStorage.getItem('smart-schedule-blocks');
    if (savedBlocks) setBlocks(JSON.parse(savedBlocks));
  }, []);

  useEffect(() => {
    let interval;
    if (timerRunning && activeBlock) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeBlock]);

  const toggleComplete = (id) => {
    setCompletedToday(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('scheduler-completed-' + new Date().toDateString(), JSON.stringify([...next]));
      return next;
    });
  };

  const addBlock = () => {
    if (!newBlock.time || !newBlock.label) return;
    const block = { ...newBlock, id: Date.now().toString(), color: 'from-pink-400 to-rose-400', tip: 'Custom block' };
    const updated = [...blocks, block].sort((a, b) => a.time.localeCompare(b.time));
    setBlocks(updated);
    localStorage.setItem('smart-schedule-blocks', JSON.stringify(updated));
    setShowAddForm(false);
    setNewBlock({ time: '', label: '', icon: '✨', duration: 10, category: 'morning' });
  };

  const removeBlock = (id) => {
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    localStorage.setItem('smart-schedule-blocks', JSON.stringify(updated));
  };

  const generateAISchedule = async () => {
    if (!user) return;
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a detailed daily skin-optimized schedule for someone who wants glowing skin. Include specific times for skincare, nutrition, hydration, sleep, and exercise. Make it realistic and actionable. Current time context: morning routine focus.`,
      response_json_schema: {
        type: 'object',
        properties: {
          schedule_title: { type: 'string' },
          skin_score_potential: { type: 'number' },
          tips: { type: 'array', items: { type: 'string' } },
          schedule: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: { type: 'string' },
                activity: { type: 'string' },
                skin_benefit: { type: 'string' },
                duration_min: { type: 'number' }
              }
            }
          }
        }
      }
    });
    setAiSchedule(result);
    setGenerating(false);
  };

  const completionRate = Math.round((completedToday.size / blocks.length) * 100);
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const upcomingBlock = blocks.find(b => b.time > currentTimeStr && !completedToday.has(b.id));

  const categories = ['morning', 'afternoon', 'night'];
  const catLabels = { morning: '🌅 Morning', afternoon: '☀️ Afternoon', night: '🌙 Night' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Smart Routine Scheduler</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your daily skin-optimized schedule</p>
        </div>
        <Button onClick={generateAISchedule} disabled={generating} className="bg-gradient-to-r from-violet-500 to-pink-500">
          {generating ? <><Sparkles className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />AI Optimize Schedule</>}
        </Button>
      </div>

      {/* Progress */}
      <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Today's Completion</p>
            <p className="text-4xl font-bold text-pink-500">{completionRate}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{completedToday.size}/{blocks.length} blocks done</p>
            {upcomingBlock && (
              <p className="text-sm font-medium text-amber-600 mt-1">Next: {upcomingBlock.icon} {upcomingBlock.label} at {upcomingBlock.time}</p>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-pink-500 to-amber-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </GlassCard>

      {/* AI Schedule Result */}
      {aiSchedule && (
        <GlassCard>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> {aiSchedule.schedule_title}
            <Badge className="ml-2 bg-emerald-500">+{aiSchedule.skin_score_potential} Glow Score</Badge>
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {aiSchedule.schedule?.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2 bg-white/50 dark:bg-white/5 rounded-xl">
                <span className="text-xs font-bold text-pink-500 w-12 flex-shrink-0">{item.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.activity}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{item.skin_benefit}</p>
                </div>
                <span className="text-xs text-gray-400">{item.duration_min}m</span>
              </div>
            ))}
          </div>
          {aiSchedule.tips?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              {aiSchedule.tips.map((tip, i) => (
                <p key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1 mb-1">
                  <Star className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />{tip}
                </p>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Schedule Blocks by Category */}
      {categories.map(cat => {
        const catBlocks = blocks.filter(b => b.category === cat);
        if (!catBlocks.length) return null;
        return (
          <div key={cat}>
            <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-3">{catLabels[cat]}</h3>
            <div className="space-y-3">
              {catBlocks.map((block) => {
                const isActive = activeBlock?.id === block.id;
                const isDone = completedToday.has(block.id);
                const isPast = block.time < currentTimeStr;
                return (
                  <motion.div key={block.id} layout>
                    <GlassCard className={`p-4 ${isDone ? 'opacity-70' : ''}`} animate={false}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${block.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                          {block.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-semibold ${isDone ? 'line-through text-gray-400' : ''}`}>{block.label}</p>
                            {isPast && !isDone && <Badge variant="outline" className="text-xs text-orange-500 border-orange-300">Missed</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{block.time}</span>
                            <span className="text-xs text-gray-500">{block.duration < 60 ? `${block.duration}min` : `${Math.round(block.duration/60)}hr`}</span>
                          </div>
                          {isActive && (
                            <p className="text-xs text-pink-500 mt-1 italic">{block.tip}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => setActiveBlock(isActive ? null : block)} className="h-8 w-8 p-0">
                            {isActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          <button onClick={() => toggleComplete(block.id)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'}`}>
                            {isDone && <Check className="w-4 h-4" />}
                          </button>
                          <Button size="sm" variant="ghost" onClick={() => removeBlock(block.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add Block */}
      <GlassCard>
        {!showAddForm ? (
          <Button variant="outline" className="w-full" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Custom Block
          </Button>
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold">Add New Block</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input type="time" value={newBlock.time} onChange={e => setNewBlock(p => ({...p, time: e.target.value}))} placeholder="Time" />
              <select value={newBlock.category} onChange={e => setNewBlock(p => ({...p, category: e.target.value}))}
                className="px-3 py-2 rounded-md border border-input bg-transparent text-sm">
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="night">Night</option>
              </select>
              <Input value={newBlock.label} onChange={e => setNewBlock(p => ({...p, label: e.target.value}))} placeholder="Block name..." className="col-span-2" />
              <Input type="number" value={newBlock.duration} onChange={e => setNewBlock(p => ({...p, duration: parseInt(e.target.value)}))} placeholder="Duration (min)" />
              <Input value={newBlock.icon} onChange={e => setNewBlock(p => ({...p, icon: e.target.value}))} placeholder="Emoji icon" />
            </div>
            <div className="flex gap-2">
              <Button onClick={addBlock} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">Add Block</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* AI Skin Insights */}
      <GlassCard>
        <h3 className="font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Skin Timing Science</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AI_INSIGHTS.map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white/40 dark:bg-white/5 rounded-xl">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <p className="font-semibold text-sm">{insight.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{insight.text}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}