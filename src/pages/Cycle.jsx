import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, differenceInDays, isSameDay } from 'date-fns';
import {
  Heart, Calendar, Zap, Moon, Droplets, Brain, TrendingUp, Plus, Check,
  ChevronDown, ChevronUp, Clock, Activity, AlertCircle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PHASES = [
  { key: 'menstrual', name: 'Menstrual', emoji: '🔴', color: '#ef4444', symptoms: ['Cramps', 'Fatigue', 'Bloating', 'Heavy flow', 'Mood swings', 'Back pain'] },
  { key: 'follicular', name: 'Follicular', emoji: '🌱', color: '#10b981', symptoms: ['Energy boost', 'Clear skin', 'Positive mood', 'Appetite', 'Better sleep'] },
  { key: 'ovulation', name: 'Ovulation', emoji: '⚡', color: '#f59e0b', symptoms: ['Peak energy', 'Libido', 'Clear skin', 'Confidence', 'Glowing'] },
  { key: 'luteal', name: 'Luteal', emoji: '🌙', color: '#8b5cf6', symptoms: ['Energy drop', 'Cravings', 'Mood shifts', 'Bloating', 'Skin issues'] },
];

function RealTimePhaseIndicator({ currentDay, phaseConfig, cycleData }) {
  const daysInCurrentPhase = currentDay <= 5 ? currentDay : currentDay <= 12 ? currentDay - 5 : currentDay <= 15 ? currentDay - 12 : currentDay - 15;
  const phaseDuration = currentDay <= 5 ? 5 : currentDay <= 12 ? 7 : currentDay <= 15 ? 3 : 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${phaseConfig.color}20, ${phaseConfig.color}08)`,
        border: `2px solid ${phaseConfig.color}40`,
        boxShadow: `0 8px 32px ${phaseConfig.color}15`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{phaseConfig.emoji}</span>
          <div>
            <h2 className="text-2xl font-black" style={{ color: phaseConfig.color }}>{phaseConfig.name} Phase</h2>
            <p className="text-sm text-gray-500 mt-1">Day {currentDay} of 28-day cycle</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-gray-900">{daysInCurrentPhase}/{phaseDuration}</p>
          <p className="text-xs text-gray-500 font-semibold">Days in Phase</p>
        </div>
      </div>

      {/* Phase Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.1)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${phaseConfig.color}, ${phaseConfig.color}cc)` }}
            initial={{ width: '0%' }}
            animate={{ width: `${(daysInCurrentPhase / phaseDuration) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-xs text-gray-500 font-semibold">
          {28 - currentDay} days until next phase
        </p>
      </div>
    </motion.div>
  );
}

function DailyTrackerCard({ date, cycleData, onLog, isToday }) {
  const [expanded, setExpanded] = useState(isToday);
  const [symptoms, setSymptoms] = useState([]);
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(5);
  const [saving, setSaving] = useState(false);

  const currentDay = differenceInDays(date, new Date(cycleData.start_date)) % 28 + 1;
  const phaseConfig = PHASES[currentDay <= 5 ? 0 : currentDay <= 12 ? 1 : currentDay <= 15 ? 2 : 3];

  const handleSave = async () => {
    setSaving(true);
    await onLog({
      date: format(date, 'yyyy-MM-dd'),
      symptoms,
      mood,
      energy,
    });
    setSaving(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.9)',
        border: expanded ? `2px solid ${phaseConfig.color}` : '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{phaseConfig.emoji}</span>
            <div>
              <p className="font-bold text-sm text-gray-900">
                {isToday ? 'Today' : format(date, 'MMM d')}
              </p>
              <p className="text-xs text-gray-500">Day {currentDay} • {phaseConfig.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {symptoms.length > 0 && <Badge className="bg-pink-100 text-pink-700 text-xs">{symptoms.length} symptoms</Badge>}
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              {/* Symptoms */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {phaseConfig.symptoms.map(sym => (
                    <button
                      key={sym}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: symptoms.includes(sym) ? phaseConfig.color : '#f0f0f0',
                        color: symptoms.includes(sym) ? '#fff' : '#9ca3af',
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Mood</p>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => {
                    e.stopPropagation();
                    setMood(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="e.g., Happy, Anxious"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2"
                  style={{ focusRing: `${phaseConfig.color}40` }}
                />
              </div>

              {/* Energy */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Energy Level: {energy}/10</p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => {
                    e.stopPropagation();
                    setEnergy(Number(e.target.value));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full"
                  style={{ accentColor: phaseConfig.color }}
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={saving}
                className="w-full font-bold text-sm"
                style={{
                  background: phaseConfig.color,
                  color: '#fff',
                }}
              >
                {saving ? 'Saving...' : <><Check className="w-4 h-4 mr-2" />Save Entry</>}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LiveRoutineAdjustments({ phase }) {
  const routines = {
    menstrual: { emoji: '🛡️', focus: 'Recovery Mode', color: '#ef4444', tips: ['Skip actives', 'Rich moisturizers', 'Barrier support', 'Hydrating masks'] },
    follicular: { emoji: '✨', focus: 'Active Treatment', color: '#10b981', tips: ['Vitamin C serum', 'Light exfoliants', 'Treatment serums', 'Build tolerance'] },
    ovulation: { emoji: '💫', focus: 'Peak Performance', color: '#f59e0b', tips: ['Retinol safe', 'Strong actives', 'SPF 50+', 'Hydrating layers'] },
    luteal: { emoji: '🌙', focus: 'Calming Care', color: '#8b5cf6', tips: ['Skip strong actives', 'Soothing serums', 'Rich creams', 'Anti-inflammatory'] },
  };

  const routine = routines[phase];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-t-3xl border-t border-gray-200 p-6"
      style={{
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{routine.emoji}</span>
        <div>
          <h3 className="font-black text-base">Real-Time Routine Adjustments</h3>
          <p className="text-xs text-gray-500">{routine.focus}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {routine.tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-3 text-center font-bold text-xs"
            style={{
              background: `${routine.color}15`,
              border: `1.5px solid ${routine.color}30`,
              color: routine.color,
            }}
          >
            {tip}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function LiveHormoneIndicators({ currentDay, phaseConfig }) {
  const indicators = [
    { name: 'Estrogen', phase: 'ovulation', emoji: '📈', currentPhase: currentDay <= 5 ? 3 : currentDay <= 12 ? 8 : currentDay <= 15 ? 9 : 5 },
    { name: 'Progesterone', phase: 'luteal', emoji: '⚙️', currentPhase: currentDay <= 5 ? 2 : currentDay <= 12 ? 2 : currentDay <= 15 ? 3 : 8 },
    { name: 'Androgens', phase: 'luteal', emoji: '💢', currentPhase: currentDay <= 5 ? 5 : currentDay <= 12 ? 6 : currentDay <= 15 ? 7 : 8 },
    { name: 'Inflammation', phase: 'menstrual', emoji: '🔥', currentPhase: currentDay <= 5 ? 6 : currentDay <= 12 ? 3 : currentDay <= 15 ? 2 : 7 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {indicators.map((ind, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl p-3 text-center"
          style={{
            background: `${phaseConfig.color}12`,
            border: `1.5px solid ${phaseConfig.color}25`,
          }}
        >
          <p className="text-2xl mb-1">{ind.emoji}</p>
          <p className="text-xs font-bold text-gray-700">{ind.name}</p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-gray-200">
            <motion.div
              className="h-full rounded-full"
              style={{ background: phaseConfig.color }}
              initial={{ width: '0%' }}
              animate={{ width: `${(ind.currentPhase / 10) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-bold">{ind.currentPhase}/10</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function Cycle() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: cycleData } = useQuery({
    queryKey: ['cycleData', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const cycles = await base44.entities.CycleData.filter({ user_email: user.email }, '-created_date', 1);
      if (cycles.length > 0) return cycles[0];
      const initial = {
        user_email: user.email,
        start_date: format(addDays(new Date(), -10), 'yyyy-MM-dd'),
        cycle_length: 28,
      };
      return base44.entities.CycleData.create(initial);
    },
    enabled: !!user?.email,
  });

  const logEntryMutation = useMutation({
    mutationFn: async (data) => {
      return base44.integrations.Core.InvokeLLM({
        prompt: `Log this cycle tracker entry: Date: ${data.date}, Symptoms: ${data.symptoms.join(', ')}, Mood: ${data.mood}, Energy: ${data.energy}/10. Store as a brief note.`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cycleData']);
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Heart className="w-16 h-16 mx-auto text-pink-500" />
          <h2 className="text-3xl font-black">Cycle Tracker</h2>
          <p className="text-gray-500">Sign in to track your cycle in real-time</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!cycleData) return null;

  const currentDay = differenceInDays(new Date(), new Date(cycleData.start_date)) % 28 + 1;
  const currentPhase = currentDay <= 5 ? 'menstrual' : currentDay <= 12 ? 'follicular' : currentDay <= 15 ? 'ovulation' : 'luteal';
  const phaseConfig = PHASES.find(p => p.key === currentPhase);

  const last7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), -i)).reverse();
  const todayIndex = last7Days.findIndex(d => isSameDay(d, new Date()));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-32 px-4 py-8">
      {/* Live Phase Indicator */}
      <RealTimePhaseIndicator currentDay={currentDay} phaseConfig={phaseConfig} cycleData={cycleData} />

      {/* Live Hormone Indicators */}
      <LiveHormoneIndicators currentDay={currentDay} phaseConfig={phaseConfig} />

      {/* Daily Tracker Cards */}
      <div>
        <h2 className="font-black text-lg mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: phaseConfig.color }} />
          Daily Tracking (Last 7 Days)
        </h2>
        <div className="space-y-3">
          {last7Days.map((date, idx) => (
            <DailyTrackerCard
              key={idx}
              date={date}
              cycleData={cycleData}
              onLog={(data) => logEntryMutation.mutate(data)}
              isToday={isSameDay(date, new Date())}
            />
          ))}
        </div>
      </div>

      {/* Live Routine Adjustments - Sticky Footer */}
      <LiveRoutineAdjustments phase={currentPhase} />
    </div>
  );
}