import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, differenceInDays } from 'date-fns';
import { Heart, Droplets, Zap, Brain, Pill, Activity, TrendingUp, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CYCLE_PHASES = [
  { key: 'menstrual', label: 'Menstrual', emoji: '🔴', days: '1-5', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', desc: 'Shedding phase — low energy' },
  { key: 'follicular', label: 'Follicular', emoji: '🌱', days: '6-12', color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: 'Rising energy — best for new tasks' },
  { key: 'ovulation', label: 'Ovulation', emoji: '⚡', days: '13-15', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'Peak energy & confidence' },
  { key: 'luteal', label: 'Luteal', emoji: '🌙', days: '16-28', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', desc: 'Wind-down phase — self-care' },
];

const PHASE_SYMPTOMS = {
  menstrual: ['Cramps', 'Fatigue', 'Bloating', 'Heavy flow', 'Mood swings', 'Back pain'],
  follicular: ['Energy boost', 'Clear skin', 'Positive mood', 'Appetite increase', 'Better sleep'],
  ovulation: ['Peak energy', 'Increased libido', 'Clear skin', 'Social confidence', 'Appetite changes'],
  luteal: ['Energy drop', 'Cravings', 'Mood sensitivity', 'Bloating', 'Sleep changes', 'Skin issues'],
};

const SKINCARE_BY_PHASE = {
  menstrual: {
    emoji: '🛡️',
    rec: 'Focus on barrier repair. Use gentle cleansers, rich moisturizers, and avoid active treatments.',
    products: ['Hydrating moisturizer', 'Gentle cleanser', 'Hydrating mask'],
  },
  follicular: {
    emoji: '✨',
    rec: 'Great time for actives! Introduce Vitamin C, light exfoliants, and treatment serums.',
    products: ['Vitamin C serum', 'Gentle BHA', 'Treatment serum'],
  },
  ovulation: {
    emoji: '💫',
    rec: 'Peak skin clarity. Can handle stronger actives. Maintain hydration and SPF.',
    products: ['Retinol (if tolerated)', 'Light serum', 'SPF 50+'],
  },
  luteal: {
    emoji: '🌙',
    rec: 'Skin more sensitive. Use calming ingredients, rich moisturizers, avoid strong actives.',
    products: ['Calming serum', 'Hydrating cream', 'Soothing mask'],
  },
};

function CycleCalendarView({ cycleData, onSelectDay }) {
  const [viewDate, setViewDate] = useState(new Date());
  const monthDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const days = Array.from({ length: monthDays }, (_, i) => i + 1);
  const paddedDays = Array.from({ length: startDay }, () => null).concat(days);

  const getPhaseForDay = (day) => {
    if (!cycleData?.start_date) return null;
    const dayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const daysIntoPhase = differenceInDays(dayDate, new Date(cycleData.start_date));
    const cycleDay = (daysIntoPhase % 28) + 1;

    if (cycleDay <= 5) return 'menstrual';
    if (cycleDay <= 12) return 'follicular';
    if (cycleDay <= 15) return 'ovulation';
    return 'luteal';
  };

  return (
    <div className="rounded-2xl p-4 bg-white/90" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{format(viewDate, 'MMMM yyyy')}</h3>
        <div className="flex gap-2">
          <button onClick={() => setViewDate(addDays(viewDate, -32))} className="p-1 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setViewDate(addDays(viewDate, 32))} className="p-1 rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const phase = getPhaseForDay(day);
          const phaseConfig = CYCLE_PHASES.find(p => p.key === phase);
          const isToday = day === new Date().getDate() && viewDate.getMonth() === new Date().getMonth();

          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className="aspect-square rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{
                background: phaseConfig?.bg,
                border: isToday ? `2px solid ${phaseConfig?.color}` : `1px solid ${phaseConfig?.color}40`,
              }}
            >
              <span style={{ color: phaseConfig?.color }}>{phaseConfig?.emoji}</span>
              <p className="text-[10px] mt-0.5">{day}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhaseCard({ phase }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 overflow-hidden"
      style={{ background: phase.bg, border: `2px solid ${phase.color}40` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{phase.emoji}</span>
            <div>
              <p className="font-black text-sm" style={{ color: phase.color }}>{phase.label}</p>
              <p className="text-xs text-gray-400">{phase.days}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed">{phase.desc}</p>
    </motion.div>
  );
}

function SkinCareInsightCard({ phase }) {
  const insight = SKINCARE_BY_PHASE[phase];
  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-pink-50 to-violet-50 border border-pink-100">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{insight.emoji}</span>
        <div className="flex-1">
          <p className="font-bold text-sm mb-1">Skincare for {CYCLE_PHASES.find(p => p.key === phase)?.label}</p>
          <p className="text-xs text-gray-700 leading-relaxed">{insight.rec}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {insight.products.map((prod, i) => (
          <Badge key={i} className="text-[10px] bg-white/80 text-gray-700">{prod}</Badge>
        ))}
      </div>
    </div>
  );
}

function SymptomLogger({ cycleData, userEmail, onSave }) {
  const [symptoms, setSymptoms] = useState(cycleData?.current_symptoms || []);
  const availableSymptoms = PHASE_SYMPTOMS[cycleData?.current_phase] || [];

  const toggleSymptom = (sym) => {
    setSymptoms(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  return (
    <div className="rounded-2xl p-4 bg-white/90 space-y-3">
      <p className="font-bold text-sm">Today's Symptoms</p>
      <div className="flex flex-wrap gap-2">
        {availableSymptoms.map(sym => (
          <button
            key={sym}
            onClick={() => toggleSymptom(sym)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: symptoms.includes(sym) ? '#f472b6' : '#f0f0f0',
              color: symptoms.includes(sym) ? '#fff' : '#9ca3af',
            }}
          >
            {sym}
          </button>
        ))}
      </div>
      <Button onClick={() => onSave({ ...cycleData, current_symptoms: symptoms })} size="sm" className="w-full bg-pink-500">
        Save Symptoms
      </Button>
    </div>
  );
}

export default function HormoneTracker() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: cycleData } = useQuery({
    queryKey: ['cycleData', user?.email],
    queryFn: async () => {
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: format(new Date(), 'yyyy-MM-dd') }, '-created_date', 1);
      return logs[0] || {
        cycle_phase: 'follicular',
        cycle_notes: '',
        start_date: format(addDays(new Date(), -10), 'yyyy-MM-dd'),
        current_symptoms: [],
      };
    },
    enabled: !!user?.email,
  });

  const getCurrentPhase = () => {
    if (!cycleData?.start_date) return 'follicular';
    const daysInCycle = differenceInDays(new Date(), new Date(cycleData.start_date));
    const cycleDay = (daysInCycle % 28) + 1;

    if (cycleDay <= 5) return 'menstrual';
    if (cycleDay <= 12) return 'follicular';
    if (cycleDay <= 15) return 'ovulation';
    return 'luteal';
  };

  const currentPhase = cycleData ? getCurrentPhase() : 'follicular';
  const phaseConfig = CYCLE_PHASES.find(p => p.key === currentPhase);

  const saveCycleMutation = useMutation({
    mutationFn: (data) => {
      if (cycleData?.id) return base44.entities.DietLog.update(cycleData.id, data);
      return base44.entities.DietLog.create({ ...data, user_email: user.email, log_date: format(new Date(), 'yyyy-MM-dd') });
    },
    onSuccess: () => queryClient.invalidateQueries(['cycleData']),
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center px-4">
        <Heart className="w-16 h-16 mx-auto mb-4 text-pink-500" />
        <h2 className="text-2xl font-black mb-2">Cycle Tracker</h2>
        <p className="text-gray-500 mb-6">Sign in to track your hormonal cycle and get phase-based skincare recommendations</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: phaseConfig?.bg }}>
          {phaseConfig?.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-black">Hormonal Cycle Tracker</h1>
          <p className="text-sm text-gray-500">Sync skincare & wellness with your cycle</p>
        </div>
      </div>

      {/* Current Phase Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 overflow-hidden"
        style={{
          background: `linear-gradient(135deg,${phaseConfig?.bg},rgba(255,255,255,0.5))`,
          border: `2px solid ${phaseConfig?.color}40`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Current Phase</p>
            <p className="text-4xl font-black" style={{ color: phaseConfig?.color }}>{phaseConfig?.label}</p>
          </div>
          <Badge style={{ background: phaseConfig?.color, color: '#fff' }} className="text-sm border-0">
            Cycle Day {cycleData ? differenceInDays(new Date(), new Date(cycleData.start_date)) % 28 + 1 : '—'}
          </Badge>
        </div>
        <p className="text-gray-700 font-medium mb-4">{phaseConfig?.desc}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/60">
            <p className="text-gray-400">Duration</p>
            <p className="font-bold">{phaseConfig?.days}</p>
          </div>
          <div className="p-2 rounded-lg bg-white/60">
            <p className="text-gray-400">Energy Level</p>
            <p className="font-bold">
              {currentPhase === 'menstrual' && '⬇️ Low'}
              {currentPhase === 'follicular' && '⬆️ Rising'}
              {currentPhase === 'ovulation' && '⚡ Peak'}
              {currentPhase === 'luteal' && '↘️ Declining'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Cycle Calendar */}
      <CycleCalendarView cycleData={cycleData} onSelectDay={setSelectedDate} />

      {/* Phase Grid */}
      <div>
        <p className="font-bold text-sm mb-3">Your Cycle Phases</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CYCLE_PHASES.map(phase => (
            <PhaseCard key={phase.key} phase={phase} />
          ))}
        </div>
      </div>

      {/* Skincare by Phase */}
      <div>
        <p className="font-bold text-sm mb-3">💅 Phase-Based Skincare</p>
        <SkinCareInsightCard phase={currentPhase} />
      </div>

      {/* Symptom Logger */}
      {cycleData && (
        <SymptomLogger
          cycleData={cycleData}
          userEmail={user?.email}
          onSave={(data) => saveCycleMutation.mutate(data)}
        />
      )}

      {/* Wellness Tips */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100">
        <p className="font-bold text-sm mb-3">💡 Wellness Tips for {phaseConfig?.label}</p>
        <div className="space-y-2 text-xs text-gray-700">
          {currentPhase === 'menstrual' && (
            <>
              <p>✓ Prioritize rest and recovery — lower intensity workouts work best</p>
              <p>✓ Increase iron intake with leafy greens, red meat, legumes</p>
              <p>✓ Stay hydrated — more water loss during this phase</p>
            </>
          )}
          {currentPhase === 'follicular' && (
            <>
              <p>✓ Great time for challenging workouts and new projects</p>
              <p>✓ Introduce active skincare ingredients</p>
              <p>✓ Leverage the energy boost for important decisions</p>
            </>
          )}
          {currentPhase === 'ovulation' && (
            <>
              <p>✓ Peak confidence and social energy — schedule important meetings</p>
              <p>✓ Workouts feel easiest — push harder if desired</p>
              <p>✓ Skin usually clearest — excellent time for professional photos</p>
            </>
          )}
          {currentPhase === 'luteal' && (
            <>
              <p>✓ Self-care becomes more important — honor your needs</p>
              <p>✓ Food cravings are real — plan nourishing meals</p>
              <p>✓ Reduce intense workouts; gentle yoga or walks are ideal</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}