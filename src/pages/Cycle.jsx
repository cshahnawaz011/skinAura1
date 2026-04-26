import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, differenceInDays } from 'date-fns';
import {
  Heart, Calendar, Zap, Moon, Droplets, Brain, TrendingUp,
  ChevronLeft, ChevronRight, Check, Plus, Sparkles, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PHASES = [
  { key: 'menstrual', name: 'Menstrual', emoji: '🔴', days: 1, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { key: 'follicular', name: 'Follicular', emoji: '🌱', days: 7, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'ovulation', name: 'Ovulation', emoji: '⚡', days: 3, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { key: 'luteal', name: 'Luteal', emoji: '🌙', days: 12, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
];

const SYMPTOMS_BY_PHASE = {
  menstrual: ['Cramps', 'Fatigue', 'Bloating', 'Heavy flow', 'Mood swings', 'Back pain', 'Headache'],
  follicular: ['Energy boost', 'Clear skin', 'Positive mood', 'Appetite', 'Better sleep', 'Focus'],
  ovulation: ['Peak energy', 'Libido increase', 'Clear skin', 'Confidence', 'Glowing', 'Sociable'],
  luteal: ['Energy drop', 'Cravings', 'Mood shifts', 'Bloating', 'Sleep issues', 'Skin sensitivity', 'Anxiety'],
};

const SKINCARE_GUIDE = {
  menstrual: {
    focus: 'Barrier Repair',
    tips: ['Gentle cleansing', 'Rich moisturizers', 'Hydrating masks', 'Skip active ingredients'],
    color: '#ef4444',
  },
  follicular: {
    focus: 'Active Treatment',
    tips: ['Vitamin C serum', 'Light exfoliants', 'Treatment serums', 'Introduce actives'],
    color: '#10b981',
  },
  ovulation: {
    focus: 'Peak Performance',
    tips: ['Retinol (if tolerated)', 'Strong actives', 'SPF 50+', 'Hydrating layers'],
    color: '#f59e0b',
  },
  luteal: {
    focus: 'Calming Care',
    tips: ['Calming serums', 'Rich creams', 'Soothing masks', 'Skip harsh actives'],
    color: '#8b5cf6',
  },
};

function CycleRing({ cycleData, currentDay }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (currentDay / 28) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {PHASES.map((phase, idx) => {
          const startAngle = (phase.days / 28) * 360 * (idx);
          const endAngle = startAngle + (phase.days / 28) * 360;
          const start = (startAngle * Math.PI) / 180;
          const end = (endAngle * Math.PI) / 180;
          const x1 = 50 + 45 * Math.cos(start);
          const y1 = 50 + 45 * Math.sin(start);
          const x2 = 50 + 45 * Math.cos(end);
          const y2 = 50 + 45 * Math.sin(end);
          const largeArc = phase.days > 14 ? 1 : 0;

          return (
            <path
              key={phase.key}
              d={`M ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2}`}
              stroke={phase.color}
              strokeWidth="8"
              fill="none"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-black" style={{ color: PHASES[currentDay <= 5 ? 0 : currentDay <= 12 ? 1 : currentDay <= 15 ? 2 : 3].color }}>
          {currentDay}
        </div>
        <p className="text-[10px] text-gray-400 font-bold">Day</p>
      </div>
    </div>
  );
}

function PhaseCard({ phase, isActive }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 transition-all ${isActive ? 'ring-2' : ''}`}
      style={{
        background: phase.bg,
        borderColor: phase.color,
        border: `2px solid ${phase.color}40`,
        ...(isActive && { boxShadow: `0 0 20px ${phase.color}40`, ring: `2px solid ${phase.color}` }),
      }}
    >
      <div className="text-3xl mb-2">{phase.emoji}</div>
      <p className="font-bold text-sm" style={{ color: phase.color }}>{phase.name}</p>
      <p className="text-[10px] text-gray-400">{phase.days} days</p>
    </motion.div>
  );
}

function SymptomTracker({ cycleData, onUpdate }) {
  const [selected, setSelected] = useState(cycleData?.symptoms || []);
  const currentPhase = cycleData?.current_phase || 'follicular';
  const availableSymptoms = SYMPTOMS_BY_PHASE[currentPhase] || [];

  const toggleSymptom = (sym) => {
    const updated = selected.includes(sym) ? selected.filter(s => s !== sym) : [...selected, sym];
    setSelected(updated);
    onUpdate({ ...cycleData, symptoms: updated });
  };

  return (
    <div className="rounded-3xl p-5 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-pink-500" />
        <h3 className="font-black text-sm">Today's Symptoms</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableSymptoms.map(sym => (
          <button
            key={sym}
            onClick={() => toggleSymptom(sym)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: selected.includes(sym) ? '#f472b6' : '#f0f0f0',
              color: selected.includes(sym) ? '#fff' : '#9ca3af',
            }}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}

function SkinCareCard({ phase, skinGuide }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${skinGuide.color}15, ${skinGuide.color}08)`,
        border: `2px solid ${skinGuide.color}30`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Skincare Focus</p>
          <p className="text-lg font-black mt-1" style={{ color: skinGuide.color }}>{skinGuide.focus}</p>
        </div>
        <Sparkles className="w-5 h-5" style={{ color: skinGuide.color }} />
      </div>
      <div className="space-y-2">
        {skinGuide.tips.map((tip, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: skinGuide.color }} />
            {tip}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CycleInsights({ cycleData, last30Days }) {
  const stats = useMemo(() => {
    if (!last30Days?.length) return null;
    const withSymptoms = last30Days.filter(d => d.symptoms?.length > 0).length;
    const avgSymptoms = last30Days.reduce((sum, d) => sum + (d.symptoms?.length || 0), 0) / last30Days.length;
    return {
      trackedDays: last30Days.length,
      withSymptoms,
      avgSymptoms: avgSymptoms.toFixed(1),
    };
  }, [last30Days]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-violet-500" />
        <h3 className="font-black text-sm">Cycle Insights</h3>
      </div>
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-violet-500">{stats.trackedDays}</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Days Logged</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-purple-500">{stats.withSymptoms}</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">With Symptoms</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-pink-500">{stats.avgSymptoms}</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Avg per Day</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Cycle() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: cycleData, refetch } = useQuery({
    queryKey: ['cycleData', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const cycles = await base44.entities.CycleData.filter({ user_email: user.email }, '-created_date', 1);
      if (cycles.length > 0) return cycles[0];
      const initial = {
        user_email: user.email,
        start_date: format(addDays(new Date(), -10), 'yyyy-MM-dd'),
        cycle_length: 28,
        current_phase: 'follicular',
        symptoms: [],
        energy_level: 5,
      };
      return base44.entities.CycleData.create(initial);
    },
    enabled: !!user?.email,
  });

  const { data: last30Days = [] } = useQuery({
    queryKey: ['cycleHistory', user?.email],
    queryFn: async () => {
      const logs = await base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 30);
      return logs;
    },
    enabled: !!user?.email,
  });

  const updateCycleMutation = useMutation({
    mutationFn: async (data) => {
      if (cycleData?.id) {
        return base44.entities.CycleData.update(cycleData.id, data);
      }
      return base44.entities.CycleData.create(data);
    },
    onSuccess: () => refetch(),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Heart className="w-16 h-16 mx-auto text-pink-500" />
          <h2 className="text-3xl font-black">Cycle Tracker</h2>
          <p className="text-gray-500">Sign in to start tracking your cycle</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!cycleData) return null;

  const currentDay = differenceInDays(new Date(), new Date(cycleData.start_date)) % 28 + 1;
  const currentPhaseConfig = PHASES.find(p => {
    if (currentDay <= 5) return p.key === 'menstrual';
    if (currentDay <= 12) return p.key === 'follicular';
    if (currentDay <= 15) return p.key === 'ovulation';
    return p.key === 'luteal';
  });
  const skinGuide = SKINCARE_GUIDE[currentPhaseConfig?.key];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl">{currentPhaseConfig?.emoji}</span>
          <h1 className="text-3xl font-black">{currentPhaseConfig?.name} Phase</h1>
        </div>
        <p className="text-gray-500 text-sm">Day {currentDay} of your cycle</p>
      </motion.div>

      {/* Cycle Ring Visualization */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center">
        <CycleRing cycleData={cycleData} currentDay={currentDay} />
      </motion.div>

      {/* Phase Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PHASES.map(phase => (
          <PhaseCard key={phase.key} phase={phase} isActive={phase.key === currentPhaseConfig?.key} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <SymptomTracker cycleData={cycleData} onUpdate={updateCycleMutation.mutate} />
          <CycleInsights cycleData={cycleData} last30Days={last30Days} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SkinCareCard phase={currentPhaseConfig?.key} skinGuide={skinGuide} />

          {/* Wellness Tips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="font-black text-sm">Wellness Tips</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {currentPhaseConfig?.key === 'menstrual' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span>Prioritize rest — lower intensity workouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span>Increase iron intake with leafy greens</span>
                  </li>
                </>
              )}
              {currentPhaseConfig?.key === 'follicular' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span>Great time for challenging workouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span>Introduce new skincare steps</span>
                  </li>
                </>
              )}
              {currentPhaseConfig?.key === 'ovulation' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span>Peak energy — schedule important tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span>Best time for professional photos</span>
                  </li>
                </>
              )}
              {currentPhaseConfig?.key === 'luteal' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span>Prioritize self-care and rest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">✓</span>
                    <span>Plan nourishing meals</span>
                  </li>
                </>
              )}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}