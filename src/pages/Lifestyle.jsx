import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Save, Plus, X, Search, Loader2 } from 'lucide-react';
import MetricCard from '@/components/lifestyle/MetricCard';
import PageIntroPopup from '@/components/PageIntroPopup';

const MOODS = [
  { val: 'Great', emoji: '😄' },
  { val: 'Good', emoji: '🙂' },
  { val: 'Okay', emoji: '😐' },
  { val: 'Tired', emoji: '😴' },
  { val: 'Rough', emoji: '😟' },
];

const VITAMINS_LIST = ['Vitamin C', 'Vitamin D', 'Vitamin E', 'Zinc', 'Omega-3', 'Biotin', 'Iron', 'Magnesium', 'Collagen'];

const GOOD_FOODS = ['Berries', 'Avocado', 'Salmon', 'Spinach', 'Sweet Potato', 'Nuts', 'Green Tea', 'Turmeric', 'Eggs', 'Broccoli', 'Cucumber', 'Olive Oil', 'Flaxseed', 'Yogurt', 'Tomatoes'];
const BAD_FOODS = ['Sugar', 'Dairy', 'Fried Food', 'Alcohol', 'Caffeine', 'White Bread', 'Processed Food', 'Spicy Food', 'Fast Food', 'Soda'];

const SKIN_METRICS = [
  { key: 'acne_level', label: 'Acne Level', emoji: '🔴', color: '#ef4444', values: [0,1,2,3,4,5] },
  { key: 'hydration', label: 'Skin Hydration', emoji: '💧', color: '#0ea5e9', values: ['Low', 'Medium', 'High'] },
  { key: 'oiliness', label: 'Oiliness', emoji: '🛢️', color: '#f59e0b', values: [1,2,3,4,5] },
  { key: 'redness', label: 'Redness/Sensitivity', emoji: '🔥', color: '#f97316', values: [0,1,2,3,4,5] },
  { key: 'texture', label: 'Skin Texture', emoji: '✨', color: '#ec4899', values: ['Smooth', 'Rough', 'Bumpy'] },
  { key: 'dark_circles', label: 'Dark Circles', emoji: '👁️', color: '#8b5cf6', values: [0,1,2,3,4,5] },
  { key: 'puffiness', label: 'Puffiness', emoji: '🫧', color: '#06b6d4', values: [0,1,2,3,4,5] },
  { key: 'radiance', label: 'Glow/Radiance', emoji: '⭐', color: '#fbbf24', values: [1,2,3,4,5] },
  { key: 'breakouts', label: 'New Breakouts', emoji: '⚠️', color: '#e11d48', values: ['None', '1-2', '3+'] },
  { key: 'itching', label: 'Itching/Irritation', emoji: '🤔', color: '#a855f7', values: ['None', 'Mild', 'Severe'] },
];

const DEFAULT_LOG = {
  water_glasses: 0,
  sleep_hours: 0,
  exercise_minutes: 0,
  daily_steps: 0,
  stress_level: 3,
  mood: 'Good',
  screen_time_hours: 0,
  caffeine_cups: 0,
  alcohol_drinks: 0,
  meditation_minutes: 0,
  outdoor_minutes: 0,
  morning_foods: [],
  breakfast_foods: [],
  pm_foods: [],
  foods_good: [],
  foods_bad: [],
  vitamins_taken: [],
  skincare_done_morning: false,
  skincare_done_night: false,
  sunscreen_applied: false,
  acne_level: 0,
  hydration: 'Medium',
  oiliness: 3,
  redness: 0,
  texture: 'Smooth',
  dark_circles: 0,
  puffiness: 0,
  radiance: 3,
  breakouts: 'None',
  itching: 'None',
};

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{title}</p>
      {children}
    </div>
  );
}

function FoodTagInput({ label, emoji, value = [], onChange, suggestions, color }) {
  const [input, setInput] = useState('');
  const filtered = input.length > 1 ? suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)) : [];

  const add = (item) => {
    if (!value.includes(item)) onChange([...value, item]);
    setInput('');
  };
  const remove = (item) => onChange(value.filter(v => v !== item));

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
      <p className="font-bold text-sm mb-2">{emoji} {label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(v => (
          <span key={v} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: color }}>
            {v} <button onClick={() => remove(v)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`}
          className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-pink-300 transition-all" />
        {filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 shadow-lg z-10 max-h-36 overflow-y-auto">
            {filtered.map(s => (
              <button key={s} onClick={() => add(s)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">{s}</button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {suggestions.filter(s => !value.includes(s)).slice(0, 6).map(s => (
          <button key={s} onClick={() => add(s)} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-all">
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Lifestyle() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [log, setLog] = useState(DEFAULT_LOG);
  const [saving, setSaving] = useState(false);
  const [aiFood, setAiFood] = useState('');
  const [aiFoodResult, setAiFoodResult] = useState(null);
  const [aiFoodLoading, setAiFoodLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: existingLog } = useQuery({
    queryKey: ['dietLog', user?.email, selectedDate],
    queryFn: async () => {
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: selectedDate }, '-created_date', 1);
      return logs[0] || null;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    setLog(existingLog ? { ...DEFAULT_LOG, ...existingLog } : DEFAULT_LOG);
  }, [existingLog, selectedDate]);

  const saveMutation = useMutation({
    mutationFn: (data) => existingLog?.id
      ? base44.entities.DietLog.update(existingLog.id, data)
      : base44.entities.DietLog.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['dietLog', user?.email, selectedDate]); setSaving(false); },
  });

  const updateField = (field, value) => setLog(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!user) return;
    setSaving(true);
    saveMutation.mutate({ ...log, user_email: user.email, log_date: selectedDate });
  };

  const analyzeFood = async () => {
    if (!aiFood.trim()) return;
    setAiFoodLoading(true);
    setAiFoodResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this food/drink for skin health: "${aiFood}". Is it good or bad for skin? Why? Give a verdict.`,
      response_json_schema: {
        type: 'object',
        properties: {
          verdict: { type: 'string', enum: ['Good for skin', 'Bad for skin', 'Neutral'] },
          reason: { type: 'string' },
          tip: { type: 'string' },
        }
      }
    });
    setAiFoodResult(res);
    setAiFoodLoading(false);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto pt-16 text-center px-4">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🌿</div>
        <h2 className="text-2xl font-black mb-2">Lifestyle Tracker</h2>
        <p className="text-gray-500 mb-6">Sign in to track your wellness & skin</p>
        <button onClick={() => base44.auth.redirectToLogin()} className="px-8 py-3 rounded-2xl font-bold text-white ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-12 space-y-5">

      <PageIntroPopup
        storageKey="intro_Lifestyle"
        emoji="🌿"
        title="Lifestyle Tracker"
        accentColor="#10b981"
        description="Your skin is a mirror of your lifestyle. Log daily habits — water intake, sleep, exercise, stress, and diet — so the AI can identify exactly which lifestyle patterns are improving or harming your skin."
        tips={[
          { icon: '💧', title: 'Log water & sleep every day', text: 'Hydration and sleep are the two most impactful lifestyle factors for skin health. Aim for 8 glasses and 7+ hours nightly.' },
          { icon: '🥗', title: 'Track skin-good & skin-bad foods', text: 'Tagging specific foods allows the AI to correlate your diet with acne flares, dryness spikes, and glow improvements over time.' },
          { icon: '📊', title: 'Check Health Insights weekly', text: 'Visit the Health Insights page each week to receive a full AI analysis of how your lifestyle is impacting your skin score trends.' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🌿</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Lifestyle Tracker</h1>
            <p className="text-sm text-gray-500">Diet impacts your skin & health</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white ios-button-3d disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Date + quick import */}
      <div className="flex gap-2 items-center">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all" />
        <span className="text-xs text-gray-400 font-medium">System Adaptive ✦</span>
      </div>

      {/* Today's Overview chips */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { emoji: '💧', label: 'Water', val: `${log.water_glasses}g`, color: '#0ea5e9' },
          { emoji: '🌙', label: 'Sleep', val: `${log.sleep_hours}h`, color: '#a855f7' },
          { emoji: '🏃', label: 'Exercise', val: `${log.exercise_minutes}m`, color: '#10b981' },
          { emoji: '🧠', label: 'Stress', val: `${log.stress_level}/5`, color: '#ef4444' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-2.5 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
            <p className="text-sm">{c.emoji}</p>
            <p className="text-base font-black" style={{ color: c.color }}>{c.val}</p>
            <p className="text-[9px] text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ─── WELLNESS ─── */}
      <Section title="Wellness">
        {/* Water */}
        <MetricCard icon="💧" title="Water Intake" color="#0ea5e9">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black text-blue-500">{log.water_glasses}</span>
            <span className="text-xs text-gray-500">glasses</span>
          </div>
          <div className="flex gap-1">
            {[0,2,4,6,8,10,12].map(v => (
              <button key={v} onClick={() => updateField('water_glasses', v)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${log.water_glasses === v ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>{v}</button>
            ))}
          </div>
        </MetricCard>

        {/* Sleep */}
        <MetricCard icon="🌙" title="Sleep Hours" color="#a855f7">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black text-violet-500">{log.sleep_hours}</span>
            <span className="text-xs text-gray-500">hrs</span>
          </div>
          <input type="range" min="0" max="12" step="0.5" value={log.sleep_hours}
            onChange={e => updateField('sleep_hours', parseFloat(e.target.value))}
            className="w-full accent-violet-500" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0</span><span>4</span><span>8</span><span>12h</span>
          </div>
        </MetricCard>

        {/* Exercise */}
        <MetricCard icon="🏃" title="Exercise" color="#10b981">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black text-emerald-500">{log.exercise_minutes}</span>
            <span className="text-xs text-gray-500">min</span>
          </div>
          <div className="flex gap-1">
            {[0,15,30,45,60,90].map(m => (
              <button key={m} onClick={() => updateField('exercise_minutes', m)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${log.exercise_minutes === m ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
                {m === 0 ? '0' : `${m}`}
              </button>
            ))}
          </div>
        </MetricCard>

        {/* Daily Steps */}
        <MetricCard icon="👟" title="Daily Steps" color="#f59e0b">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black text-amber-500">{(log.daily_steps || 0).toLocaleString()}</span>
            <span className="text-xs text-gray-500">steps</span>
          </div>
          <div className="flex gap-1">
            {[0, 2000, 5000, 8000, 10000, 15000].map(s => (
              <button key={s} onClick={() => updateField('daily_steps', s)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${log.daily_steps === s ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
                {s === 0 ? '0' : s >= 1000 ? `${s/1000}k` : s}
              </button>
            ))}
          </div>
        </MetricCard>

        {/* Stress Level */}
        <MetricCard icon="🧠" title="Stress Level" color="#ef4444">
          <p className="text-xs text-gray-400 mb-2">Current stress (1 = calm, 5 = very stressed)</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => updateField('stress_level', s)}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${log.stress_level === s ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>{s}</button>
            ))}
          </div>
        </MetricCard>

        {/* Mood */}
        <MetricCard icon="😊" title="Mood" color="#ec4899">
          <div className="flex gap-2 flex-wrap">
            {MOODS.map(m => (
              <button key={m.val} onClick={() => updateField('mood', m.val)}
                className={`flex flex-col items-center px-3 py-2 rounded-2xl transition-all ${log.mood === m.val ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[10px] font-semibold mt-0.5">{m.val}</span>
              </button>
            ))}
          </div>
        </MetricCard>

        {/* Screen Time */}
        <MetricCard icon="📱" title="Screen Time" color="#6366f1">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black text-indigo-500">{log.screen_time_hours || 0}</span>
            <span className="text-xs text-gray-500">hrs</span>
          </div>
          <input type="range" min="0" max="16" step="0.5" value={log.screen_time_hours || 0}
            onChange={e => updateField('screen_time_hours', parseFloat(e.target.value))}
            className="w-full accent-indigo-500" />
        </MetricCard>

        {/* Caffeine */}
        <MetricCard icon="☕" title="Caffeine" color="#a16207">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black" style={{ color: '#a16207' }}>{log.caffeine_cups || 0}</span>
            <span className="text-xs text-gray-500">cups</span>
          </div>
          <div className="flex gap-1">
            {[0,1,2,3,4,5].map(v => (
              <button key={v} onClick={() => updateField('caffeine_cups', v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${(log.caffeine_cups || 0) === v ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}
                style={(log.caffeine_cups || 0) === v ? { background: '#a16207' } : {}}>{v}</button>
            ))}
          </div>
        </MetricCard>

        {/* Alcohol */}
        <MetricCard icon="🍷" title="Alcohol" color="#b91c1c">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black text-red-700">{log.alcohol_drinks || 0}</span>
            <span className="text-xs text-gray-500">drinks</span>
          </div>
          <div className="flex gap-1">
            {[0,1,2,3,4].map(v => (
              <button key={v} onClick={() => updateField('alcohol_drinks', v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${(log.alcohol_drinks || 0) === v ? 'bg-red-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>{v}</button>
            ))}
          </div>
        </MetricCard>

        {/* Meditation */}
        <MetricCard icon="🧘" title="Meditation" color="#0d9488">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black text-teal-600">{log.meditation_minutes || 0}</span>
            <span className="text-xs text-gray-500">min</span>
          </div>
          <div className="flex gap-1">
            {[0,5,10,15,20,30].map(v => (
              <button key={v} onClick={() => updateField('meditation_minutes', v)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${(log.meditation_minutes || 0) === v ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>{v === 0 ? '0' : `${v}m`}</button>
            ))}
          </div>
        </MetricCard>

        {/* Outdoor / Sunlight */}
        <MetricCard icon="☀️" title="Outdoor / Sunlight Time" color="#d97706">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-black text-amber-600">{log.outdoor_minutes || 0}</span>
            <span className="text-xs text-gray-500">min</span>
          </div>
          <div className="flex gap-1">
            {[0,15,30,60,90,120].map(v => (
              <button key={v} onClick={() => updateField('outdoor_minutes', v)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${(log.outdoor_minutes || 0) === v ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>{v === 0 ? '0' : `${v}m`}</button>
            ))}
          </div>
        </MetricCard>
      </Section>

      {/* ─── SKINCARE CHECKLIST ─── */}
      <Section title="Skincare Checklist">
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'skincare_done_morning', label: 'Morning\nRoutine', emoji: '🌅' },
            { key: 'skincare_done_night', label: 'Night\nRoutine', emoji: '🌙' },
            { key: 'sunscreen_applied', label: 'Sunscreen\nApplied', emoji: '🧴' },
          ].map(item => (
            <button key={item.key} onClick={() => updateField(item.key, !log[item.key])}
              className={`p-4 rounded-2xl font-semibold transition-all flex flex-col items-center gap-1.5 ${log[item.key] ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}
              style={log[item.key] ? { background: 'linear-gradient(135deg,#f472b6,#a78bfa)' } : {}}>
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[10px] text-center leading-tight whitespace-pre">{item.label}</span>
              <span className="text-sm">{log[item.key] ? '✓' : '○'}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ─── VITAMINS & SUPPLEMENTS ─── */}
      <Section title="Vitamins & Supplements">
        <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex flex-wrap gap-1.5">
            {VITAMINS_LIST.map(v => (
              <button key={v} onClick={() => {
                const cur = log.vitamins_taken || [];
                updateField('vitamins_taken', cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
              }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  (log.vitamins_taken || []).includes(v) ? 'text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
                style={(log.vitamins_taken || []).includes(v) ? { background: 'linear-gradient(135deg,#6366f1,#a78bfa)' } : {}}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── AI FOOD ANALYZER ─── */}
      <Section title="AI Food Analyzer">
        <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
          <p className="text-xs text-gray-500">Analyze any food or drink for its skin impact</p>
          <div className="flex gap-2">
            <input value={aiFood} onChange={e => setAiFood(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyzeFood()}
              placeholder="Search any food, e.g. matcha, oats…"
              className="flex-1 px-3 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-pink-300 transition-all" />
            <button onClick={analyzeFood} disabled={aiFoodLoading || !aiFood.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#10b981,#38bdf8)' }}>
              {aiFoodLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Go'}
            </button>
          </div>
          {aiFoodResult && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-2xl border text-xs space-y-1 ${aiFoodResult.verdict === 'Good for skin' ? 'bg-emerald-50 border-emerald-200' : aiFoodResult.verdict === 'Bad for skin' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`font-black text-sm ${aiFoodResult.verdict === 'Good for skin' ? 'text-emerald-600' : aiFoodResult.verdict === 'Bad for skin' ? 'text-red-500' : 'text-gray-600'}`}>
                {aiFoodResult.verdict === 'Good for skin' ? '✅' : aiFoodResult.verdict === 'Bad for skin' ? '❌' : '⚖️'} {aiFoodResult.verdict}
              </p>
              <p className="text-gray-600 dark:text-gray-300">{aiFoodResult.reason}</p>
              {aiFoodResult.tip && <p className="text-gray-500 italic">💡 {aiFoodResult.tip}</p>}
            </motion.div>
          )}
        </div>
      </Section>

      {/* ─── FOOD FOR SKIN ─── */}
      <Section title="Food Tracking">
        <FoodTagInput label="Good for Skin" emoji="✅" value={log.foods_good || []} onChange={v => updateField('foods_good', v)} suggestions={GOOD_FOODS} color="#10b981" />
        <FoodTagInput label="Bad for Skin" emoji="❌" value={log.foods_bad || []} onChange={v => updateField('foods_bad', v)} suggestions={BAD_FOODS} color="#ef4444" />
      </Section>

      {/* ─── SKIN HEALTH ─── */}
      <Section title="Skin Health">
        {SKIN_METRICS.map(metric => (
          <MetricCard key={metric.key} icon={metric.emoji} title={metric.label} color={metric.color}>
            <div className="flex gap-1 flex-wrap">
              {metric.values.map(val => (
                <button key={val} onClick={() => updateField(metric.key, val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    log[metric.key] === val ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                  }`}
                  style={log[metric.key] === val ? { background: metric.color } : {}}>
                  {val}
                </button>
              ))}
            </div>
          </MetricCard>
        ))}
      </Section>

      {/* Save button bottom */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-4 rounded-2xl font-black text-white text-base ios-button-3d disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
        {saving ? 'Saving…' : '✨ Save Today\'s Log'}
      </button>
    </div>
  );
}