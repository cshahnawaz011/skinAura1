import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetricCard from '@/components/lifestyle/MetricCard';
import FoodSearchCard from '@/components/lifestyle/FoodSearchCard';

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
  stress_level: 3,
  morning_foods: [],
  breakfast_foods: [],
  pm_foods: [],
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
  skincare_done_morning: false,
  skincare_done_night: false,
};

export default function Lifestyle() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [log, setLog] = useState(DEFAULT_LOG);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: existingLog } = useQuery({
    queryKey: ['dietLog', user?.email, selectedDate],
    queryFn: async () => {
      const logs = await base44.entities.DietLog.filter(
        { user_email: user.email, log_date: selectedDate },
        '-created_date',
        1
      );
      return logs[0] || null;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (existingLog) {
      setLog({ ...DEFAULT_LOG, ...existingLog });
    } else {
      setLog(DEFAULT_LOG);
    }
  }, [existingLog, selectedDate]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingLog?.id) {
        return base44.entities.DietLog.update(existingLog.id, data);
      }
      return base44.entities.DietLog.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dietLog', user?.email, selectedDate]);
      setSaving(false);
    },
  });

  const updateField = (field, value) => {
    setLog(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!user) return;
    setSaving(true);
    saveMutation.mutate({ ...log, user_email: user.email, log_date: selectedDate });
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
    <div className="max-w-md mx-auto pb-12 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🌿</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Lifestyle</h1>
            <p className="text-sm text-gray-500">{format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMM d')}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white ios-button-3d disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Date Picker */}
      <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all" />

      {/* Wellness Metrics */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Wellness</p>
        <MetricCard icon="💧" title="Water" color="#0ea5e9">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-blue-500">{log.water_glasses || 0}</span>
            <span className="text-xs text-gray-500">glasses</span>
          </div>
          <div className="flex gap-1 mt-2">
            {[0, 4, 8, 12].map(v => (
              <button key={v} onClick={() => updateField('water_glasses', v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  log.water_glasses === v ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                {v}
              </button>
            ))}
          </div>
        </MetricCard>

        <MetricCard icon="🌙" title="Sleep" color="#a855f7">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-violet-500">{log.sleep_hours || 0}</span>
            <span className="text-xs text-gray-500">hrs</span>
          </div>
          <input type="range" min="0" max="12" step="0.5" value={log.sleep_hours || 0}
            onChange={e => updateField('sleep_hours', parseFloat(e.target.value))}
            className="w-full mt-2 accent-violet-500" />
        </MetricCard>

        <MetricCard icon="🏃" title="Exercise" color="#10b981">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-emerald-500">{log.exercise_minutes || 0}</span>
            <span className="text-xs text-gray-500">min</span>
          </div>
          <div className="flex gap-1 mt-2">
            {[0, 15, 30, 60].map(m => (
              <button key={m} onClick={() => updateField('exercise_minutes', m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  log.exercise_minutes === m ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                {m === 0 ? '0' : `${m}m`}
              </button>
            ))}
          </div>
        </MetricCard>

        <MetricCard icon="🧠" title="Stress" color="#ef4444">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => updateField('stress_level', s)}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all text-xs ${
                  log.stress_level === s ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </MetricCard>
      </div>

      {/* Food Tracking */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Food & Nutrition</p>
        <FoodSearchCard title="Morning Foods" emoji="🌅" value={log.morning_foods} 
          onChange={v => updateField('morning_foods', v)} color="#f59e0b" />
        <FoodSearchCard title="Breakfast" emoji="🥐" value={log.breakfast_foods} 
          onChange={v => updateField('breakfast_foods', v)} color="#ec4899" />
        <FoodSearchCard title="Lunch & Dinner" emoji="🍽️" value={log.pm_foods} 
          onChange={v => updateField('pm_foods', v)} color="#10b981" />
      </div>

      {/* Skin Metrics */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Skin Health</p>
        {SKIN_METRICS.map(metric => (
          <MetricCard key={metric.key} icon={metric.emoji} title={metric.label} color={metric.color}>
            <div className="flex gap-1 flex-wrap">
              {metric.values.map(val => (
                <button key={val} onClick={() => updateField(metric.key, val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    log[metric.key] === val 
                      ? `bg-black text-white` 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {val}
                </button>
              ))}
            </div>
          </MetricCard>
        ))}
      </div>

      {/* Skincare Checklist */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">Skincare</p>
        <div className="space-y-2">
          {[
            { key: 'skincare_done_morning', label: 'Morning Routine', emoji: '🌅' },
            { key: 'skincare_done_night', label: 'Night Routine', emoji: '🌙' },
          ].map(item => (
            <button key={item.key} onClick={() => updateField(item.key, !log[item.key])}
              className={`w-full p-4 rounded-2xl font-semibold transition-all text-sm flex items-center gap-3 ${
                log[item.key] ? 'bg-black text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}>
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
              <span className="ml-auto">{log[item.key] ? '✓' : '○'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}