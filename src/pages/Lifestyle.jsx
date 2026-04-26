import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Droplets, Moon, Zap, Activity, Brain, Wind, Heart, Pill, Save, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetricCard from '@/components/lifestyle/MetricCard';

const DEFAULT_LOG = {
  water_glasses: 0,
  sleep_hours: 0,
  exercise_minutes: 0,
  exercise_type: '',
  stress_level: 3,
  mood: '',
  daily_steps: 0,
  skincare_done_morning: false,
  skincare_done_night: false,
  screen_time_minutes: 0,
  caffeine_cups: 0,
  alcohol_drinks: 0,
  outdoor_time_minutes: 0,
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
      <div className="max-w-2xl mx-auto pt-20 text-center px-4">
        <h2 className="text-2xl font-black mb-2">Lifestyle Tracker</h2>
        <p className="text-gray-500 mb-6">Sign in to track your daily wellness</p>
        <Button onClick={() => base44.auth.redirectToLogin()}
          className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-12 space-y-3 px-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 sticky top-20 z-10 pt-3 pb-2"
        style={{ background: 'rgba(255,252,249,0.95)', backdropFilter: 'blur(12px)' }}>
        <div>
          <h1 className="text-2xl font-black">Lifestyle Tracker</h1>
          <p className="text-xs text-gray-500">{format(new Date(selectedDate + 'T12:00:00'), 'MMM d, yyyy')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm"
          className="bg-pink-500 hover:bg-pink-600 text-white gap-1.5">
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving' : 'Save'}
        </Button>
      </div>

      {/* Date Picker */}
      <div className="p-3 rounded-2xl bg-white border border-pink-100">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-pink-400" />
      </div>

      {/* Water Intake */}
      <MetricCard icon="💧" title="Water Intake" subtitle="glasses per day" color="#0ea5e9">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-sky-500">{log.water_glasses || 0}</span>
            <span className="text-xs text-gray-400">glasses</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 4, 8, 12].map(v => (
              <button key={v} onClick={() => updateField('water_glasses', v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  log.water_glasses === v ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                }`}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} onClick={() => updateField('water_glasses', i + 1)}
                className={`flex-1 h-1 rounded-full cursor-pointer transition-colors ${
                  i < (log.water_glasses || 0) ? 'bg-sky-400' : 'bg-gray-200'
                }`} />
            ))}
          </div>
        </div>
      </MetricCard>

      {/* Sleep Hours */}
      <MetricCard icon="🌙" title="Sleep Hours" subtitle="hours per night" color="#a855f7">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-violet-500">{log.sleep_hours || 0}</span>
            <span className="text-xs text-gray-400">hrs</span>
          </div>
          <input type="range" min="0" max="12" value={log.sleep_hours || 0}
            onChange={e => updateField('sleep_hours', parseFloat(e.target.value))}
            className="w-full accent-violet-500" />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0</span> <span>6</span> <span>12</span>
          </div>
        </div>
      </MetricCard>

      {/* Exercise */}
      <MetricCard icon="🏃" title="Exercise" subtitle="minutes today" color="#10b981">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-black text-emerald-500">{log.exercise_minutes || 0}</span>
            <span className="text-xs text-gray-400">min</span>
          </div>
          <div className="flex gap-1.5 mb-2">
            {[0, 15, 30, 60].map(m => (
              <button key={m} onClick={() => updateField('exercise_minutes', m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  log.exercise_minutes === m ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                }`}>
                {m === 0 ? 'None' : `${m}m`}
              </button>
            ))}
          </div>
          <select value={log.exercise_type || ''} onChange={e => updateField('exercise_type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:border-emerald-400">
            <option value="">Type of exercise</option>
            <option value="Walking">Walking</option>
            <option value="Running">Running</option>
            <option value="Yoga">Yoga</option>
            <option value="Gym">Gym</option>
            <option value="Swimming">Swimming</option>
          </select>
        </div>
      </MetricCard>

      {/* Daily Steps */}
      <MetricCard icon="👟" title="Daily Steps" subtitle="goal: 8,000 steps" color="#f59e0b">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-500">{log.daily_steps || 0}</span>
            <span className="text-xs text-gray-400">steps</span>
          </div>
          <input type="range" min="0" max="20000" step="500" value={log.daily_steps || 0}
            onChange={e => updateField('daily_steps', parseInt(e.target.value))}
            className="w-full accent-amber-500" />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0</span> <span>10k</span> <span>20k</span>
          </div>
        </div>
      </MetricCard>

      {/* Stress Level */}
      <MetricCard icon="🧠" title="Stress Level" subtitle="1 = calm, 5 = stressed" color="#ef4444">
        <div className="space-y-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => updateField('stress_level', s)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  log.stress_level === s ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </MetricCard>

      {/* Mood */}
      <MetricCard icon="😊" title="Mood" subtitle="how are you feeling?" color="#ec4899">
        <div className="flex gap-2 flex-wrap">
          {['😄 Great', '🙂 Good', '😐 Okay', '😔 Bad'].map(m => {
            const emoji = m.split(' ')[0];
            const text = m.split(' ')[1];
            return (
              <button key={m} onClick={() => updateField('mood', text)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  log.mood === text ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'
                }`}>
                {emoji}
              </button>
            );
          })}
        </div>
      </MetricCard>

      {/* Caffeine */}
      <MetricCard icon="☕" title="Caffeine" subtitle="cups per day" color="#92400e">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map(c => (
            <button key={c} onClick={() => updateField('caffeine_cups', c)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                log.caffeine_cups === c ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </MetricCard>

      {/* Skincare Checklist */}
      <MetricCard icon="✨" title="Skincare Checklist" subtitle="did you do it?" color="#db2777">
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-2 rounded-lg bg-white/60 cursor-pointer hover:bg-white">
            <input type="checkbox" checked={log.skincare_done_morning || false}
              onChange={e => updateField('skincare_done_morning', e.target.checked)}
              className="accent-pink-500 w-4 h-4 rounded" />
            <span className="text-sm font-semibold text-gray-700">Morning Routine</span>
          </label>
          <label className="flex items-center gap-2 p-2 rounded-lg bg-white/60 cursor-pointer hover:bg-white">
            <input type="checkbox" checked={log.skincare_done_night || false}
              onChange={e => updateField('skincare_done_night', e.target.checked)}
              className="accent-pink-500 w-4 h-4 rounded" />
            <span className="text-sm font-semibold text-gray-700">Night Routine</span>
          </label>
        </div>
      </MetricCard>

      {/* Screen Time */}
      <MetricCard icon="📱" title="Screen Time" subtitle="minutes per day" color="#06b6d4">
        <div className="flex gap-1.5">
          {[0, 120, 180, 240, 300].map(m => (
            <button key={m} onClick={() => updateField('screen_time_minutes', m)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                log.screen_time_minutes === m ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-600'
              }`}>
              {m === 0 ? '0' : `${m}m`}
            </button>
          ))}
        </div>
      </MetricCard>
    </div>
  );
}