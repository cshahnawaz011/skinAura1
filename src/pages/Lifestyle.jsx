import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sun, Moon, Droplets, Brain, Apple, Dumbbell, Wind, Heart, Repeat2, Camera, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

import SleepSection from '@/components/lifestyle/SleepSection';
import StressSection from '@/components/lifestyle/StressSection';
import DietNutritionSection from '@/components/lifestyle/DietNutritionSection';
import ExerciseSection from '@/components/lifestyle/ExerciseSection';
import EnvironmentSection from '@/components/lifestyle/EnvironmentSection';
import HabitsSection from '@/components/lifestyle/HabitsSection';
import CycleSection from '@/components/lifestyle/CycleSection';
import SkinLogSection from '@/components/lifestyle/SkinLogSection';
import LifestyleCalendar from '@/components/lifestyle/LifestyleCalendar';

const TABS = [
  { key: 'sleep',       label: 'Sleep',       icon: Moon,        color: '#7c3aed' },
  { key: 'stress',      label: 'Stress',      icon: Brain,       color: '#f43f5e' },
  { key: 'diet',        label: 'Diet',        icon: Apple,       color: '#10b981' },
  { key: 'exercise',    label: 'Exercise',    icon: Dumbbell,    color: '#f59e0b' },
  { key: 'environment', label: 'Env',         icon: Wind,        color: '#38bdf8' },
  { key: 'habits',      label: 'Habits',      icon: Repeat2,     color: '#a78bfa' },
  { key: 'cycle',       label: 'Cycle',       icon: Heart,       color: '#fb7185' },
  { key: 'skin',        label: 'Skin Log',    icon: Camera,      color: '#e879f9' },
  { key: 'calendar',    label: 'Calendar',    icon: CalendarDays,color: '#64748b' },
];

const DEFAULT_LOG = {
  sleep_hours: 7,
  sleep_quality: 'good',
  bedtime: '23:00',
  wake_time: '06:00',
  stress_level: 3,
  mood: 'neutral',
  fatigue_level: 3,
  energy_level: 5,
  water_glasses: 8,
  coffee_cups: 1,
  alcohol_drinks: 0,
  exercise_done: false,
  exercise_minutes: 0,
  exercise_type: '',
  skincare_done_morning: false,
  skincare_done_night: false,
  sunscreen_applied: false,
  foods_good: [],
  foods_bad: [],
  vitamins_taken: [],
  uv_exposure_minutes: 0,
  pollution_exposure: false,
  humidity_level: 'normal',
  smoking: false,
  cycle_phase: '',
  cycle_notes: '',
  skin_feel: '',
  skin_notes: '',
  skin_photo_url: '',
};

export default function Lifestyle() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('sleep');
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
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: selectedDate }, '-created_date', 1);
      const log = logs[0] || null;
      
      // Auto-sync cycle data if available
      if (log && user?.email) {
        const cycles = await base44.entities.CycleData.filter({ user_email: user.email }, '-created_date', 1);
        if (cycles.length > 0) {
          const cycle = cycles[0];
          const daysInCycle = Math.floor((new Date(selectedDate) - new Date(cycle.start_date)) / (1000 * 60 * 60 * 24)) % 28;
          return {
            ...log,
            cycle_phase: cycle.current_phase,
            cycle_notes: cycle.notes,
          };
        }
      }
      return log;
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
      // Auto-sync to other features
      queryClient.invalidateQueries(['cycleData']);
      queryClient.invalidateQueries(['skinRoutine']);
      queryClient.invalidateQueries(['skinAnalysis']);
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

  const glowScore = Math.round(
    ((log.sleep_hours >= 7 ? 20 : (log.sleep_hours / 7) * 20)) +
    ((8 - log.stress_level) / 7 * 20) +
    ((log.water_glasses >= 8 ? 20 : (log.water_glasses / 8) * 20)) +
    (log.exercise_done ? 20 : 0) +
    (log.skincare_done_morning && log.skincare_done_night ? 20 : log.skincare_done_morning || log.skincare_done_night ? 10 : 0)
  );

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center px-4">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🌿</div>
        <h2 className="text-2xl font-black mb-2">Lifestyle Tracker</h2>
        <p className="text-gray-500 mb-6">Sign in to track your daily wellness habits</p>
        <Button onClick={() => base44.auth.redirectToLogin()}
          className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🌿</div>
          <div>
            <h1 className="text-2xl font-black">Lifestyle Tracker</h1>
            <p className="text-sm text-gray-500">{format(new Date(selectedDate + 'T12:00:00'), 'MMMM d, yyyy')}</p>
          </div>
        </div>
        {/* Glow Score */}
        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.1),rgba(167,139,250,0.1))', border: '1.5px solid rgba(244,114,182,0.2)' }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Glow Score</p>
            <p className="text-2xl font-black" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {glowScore}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold">
            {saving ? 'Saving…' : 'Save Log'}
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: isActive ? tab.color : 'rgba(0,0,0,0.04)',
                color: isActive ? '#fff' : '#9ca3af',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        {activeTab === 'sleep'       && <SleepSection log={log} updateField={updateField} />}
        {activeTab === 'stress'      && <StressSection log={log} updateField={updateField} />}
        {activeTab === 'diet'        && <DietNutritionSection log={log} updateField={updateField} />}
        {activeTab === 'exercise'    && <ExerciseSection log={log} updateField={updateField} />}
        {activeTab === 'environment' && <EnvironmentSection log={log} updateField={updateField} />}
        {activeTab === 'habits'      && <HabitsSection log={log} updateField={updateField} />}
        {activeTab === 'cycle'       && <CycleSection log={log} updateField={updateField} />}
        {activeTab === 'skin'        && <SkinLogSection log={log} updateField={updateField} userEmail={user?.email} />}
        {activeTab === 'calendar'    && (
          <LifestyleCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
      </motion.div>
    </div>
  );
}