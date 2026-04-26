import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, differenceInDays } from 'date-fns';
import {
  Heart, Zap, AlertTriangle, TrendingUp, Brain, Droplets, Flame,
  ChevronDown, Activity, Shield, Sparkles, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PHASES = [
  { key: 'menstrual', name: 'Menstrual', emoji: '🔴', days: 5, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { key: 'follicular', name: 'Follicular', emoji: '🌱', days: 7, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { key: 'ovulation', name: 'Ovulation', emoji: '⚡', days: 3, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { key: 'luteal', name: 'Luteal', emoji: '🌙', days: 8, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
];

const HORMONAL_SIGNALS = {
  menstrual: [
    { type: 'flare', label: 'Flare Risk', severity: 'high', value: 75, desc: 'Hormonal dips may trigger sensitivity' },
    { type: 'sensitivity', label: 'Barrier Sensitivity', severity: 'high', value: 80, desc: 'Estrogen drops increase reactivity' },
    { type: 'oil', label: 'Oil Production', severity: 'low', value: 30, desc: 'Minimal sebum activity' },
    { type: 'pattern', label: 'Skin Pattern', severity: 'medium', value: 50, desc: 'Texture may feel rough' },
  ],
  follicular: [
    { type: 'flare', label: 'Flare Risk', severity: 'low', value: 20, desc: 'Rising estrogen stabilizes skin' },
    { type: 'sensitivity', label: 'Barrier Sensitivity', severity: 'low', value: 25, desc: 'Best barrier tolerance window' },
    { type: 'oil', label: 'Oil Production', severity: 'low', value: 35, desc: 'Controlled sebum levels' },
    { type: 'pattern', label: 'Skin Pattern', severity: 'low', value: 15, desc: 'Clear, glowing complexion' },
  ],
  ovulation: [
    { type: 'flare', label: 'Flare Risk', severity: 'low', value: 15, desc: 'Peak estrogen = clearest skin' },
    { type: 'sensitivity', label: 'Barrier Sensitivity', severity: 'low', value: 20, desc: 'Optimal skin resilience' },
    { type: 'oil', label: 'Oil Production', severity: 'medium', value: 55, desc: 'Slight sebum increase' },
    { type: 'pattern', label: 'Skin Pattern', severity: 'low', value: 10, desc: 'Radiant, glowing phase' },
  ],
  luteal: [
    { type: 'flare', label: 'Flare Risk', severity: 'high', value: 70, desc: 'Progesterone triggers congestion' },
    { type: 'sensitivity', label: 'Barrier Sensitivity', severity: 'high', value: 75, desc: 'Increased inflammatory response' },
    { type: 'oil', label: 'Oil Production', severity: 'high', value: 85, desc: 'Peak sebum production' },
    { type: 'pattern', label: 'Skin Pattern', severity: 'high', value: 80, desc: 'Congestion & texture changes' },
  ],
};

const CORRELATIONS = [
  { key: 'breakout', emoji: '💔', title: 'Breakout Correlation', desc: 'Luteal phase shows 3.2x higher breakout risk', phase: 'luteal' },
  { key: 'sensitivity', emoji: '🔥', title: 'Sensitivity Correlation', desc: 'Menstrual & luteal phases increase reactivity', phase: 'menstrual' },
  { key: 'pattern', emoji: '📊', title: 'Pattern Correlation', desc: 'Texture changes peak at progesterone surge', phase: 'luteal' },
];

function SignalCard({ signal }) {
  const getSeverityColor = (sev) => {
    return sev === 'high' ? '#ef4444' : sev === 'medium' ? '#f59e0b' : '#10b981';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 backdrop-blur-sm overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${getSeverityColor(signal.severity)}15, ${getSeverityColor(signal.severity)}08)`,
        border: `1.5px solid ${getSeverityColor(signal.severity)}30`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-sm" style={{ color: getSeverityColor(signal.severity) }}>{signal.label}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{signal.desc}</p>
        </div>
        <Badge style={{ background: getSeverityColor(signal.severity), color: '#fff' }} className="border-0 text-xs capitalize">
          {signal.severity}
        </Badge>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: getSeverityColor(signal.severity) }}
          initial={{ width: 0 }}
          animate={{ width: `${signal.value}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-2 font-semibold">{signal.value}% Risk</p>
    </motion.div>
  );
}

function CorrelationPanel({ correlation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{correlation.emoji}</span>
        <div className="flex-1">
          <p className="font-bold text-sm text-gray-900">{correlation.title}</p>
          <p className="text-xs text-gray-600 mt-1">{correlation.desc}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.6)' }}>
            <span className="text-xs font-bold">Peak:</span>
            <Badge className="bg-blue-500 text-white text-[10px] border-0 capitalize">{correlation.phase}</Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RiskIndicator({ type, severity, percentage }) {
  const icons = {
    breakout: <Flame className="w-5 h-5" />,
    barrier: <Shield className="w-5 h-5" />,
    flare: <AlertTriangle className="w-5 h-5" />,
  };

  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };

  const labels = {
    breakout: 'Breakout Risk',
    barrier: 'Barrier Stress',
    flare: 'Flare Probability',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${colors[severity]}15, ${colors[severity]}08)`,
        border: `2px solid ${colors[severity]}30`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0" style={{ color: colors[severity] }}>
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: colors[severity] }}>{labels[type]}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <motion.div
              className="h-full rounded-full"
              style={{ background: colors[severity] }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1 font-semibold">{percentage}% {severity.toUpperCase()}</p>
        </div>
      </div>
    </motion.div>
  );
}

function AdaptiveRoutineCard({ phase }) {
  const routineAdjustments = {
    menstrual: { focus: '🛡️ Recovery Mode', tips: ['Skip actives', 'Rich moisturizers', 'Barrier support', 'Gentle cleansing'] },
    follicular: { focus: '✨ Active Treatment', tips: ['Introduce Vitamin C', 'Light exfoliants', 'Treatment serums', 'Build tolerance'] },
    ovulation: { focus: '💫 Peak Performance', tips: ['Use retinol', 'Strong actives safe', 'SPF 50+ essential', 'Hydrating layers'] },
    luteal: { focus: '🌙 Calming Care', tips: ['Skip strong actives', 'Soothing serums', 'Rich creams', 'Anti-inflammatory'] },
  };

  const config = routineAdjustments[phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-500" />
        <h3 className="font-black text-sm">Routine Adjustments</h3>
      </div>
      <p className="text-lg font-black text-purple-600 mb-4">{config.focus}</p>
      <ul className="space-y-2">
        {config.tips.map((tip, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
            {tip}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function CycleRing({ currentDay }) {
  return (
    <div className="relative w-48 h-48 mx-auto mb-6">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {PHASES.map((phase, idx) => {
          const startAngle = (phase.days / 28) * 360 * idx;
          const endAngle = startAngle + (phase.days / 28) * 360;
          const start = (startAngle * Math.PI) / 180;
          const end = (endAngle * Math.PI) / 180;
          const x1 = 50 + 40 * Math.cos(start);
          const y1 = 50 + 40 * Math.sin(start);
          const x2 = 50 + 40 * Math.cos(end);
          const y2 = 50 + 40 * Math.sin(end);
          const largeArc = phase.days > 14 ? 1 : 0;

          return (
            <path
              key={phase.key}
              d={`M ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2}`}
              stroke={phase.color}
              strokeWidth="10"
              fill="none"
              opacity="0.8"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-black text-pink-600">{currentDay}</div>
        <p className="text-xs text-gray-400 font-bold">Day of Cycle</p>
      </div>
    </div>
  );
}

export default function Cycle() {
  const [user, setUser] = useState(null);
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [activeTab, setActiveTab] = useState('signals');

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
        current_phase: 'follicular',
        symptoms: [],
      };
      return base44.entities.CycleData.create(initial);
    },
    enabled: !!user?.email,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Heart className="w-16 h-16 mx-auto text-pink-500" />
          <h2 className="text-3xl font-black">Hormonal Intelligence</h2>
          <p className="text-gray-500">Sign in to unlock cycle insights</p>
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
  const signals = HORMONAL_SIGNALS[currentPhase] || [];

  const tabs = [
    { key: 'tracking', label: '📊 Tracking', icon: '📊' },
    { key: 'signals', label: '⚡ Signals', icon: '⚡' },
    { key: 'correlations', label: '🔗 Correlations', icon: '🔗' },
    { key: 'risks', label: '🛡️ Risks', icon: '🛡️' },
    { key: 'routine', label: '✨ Routine', icon: '✨' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <h1 className="text-4xl font-black text-gray-900">Hormonal Cycle Intelligence</h1>
        <p className="text-gray-500">Advanced cycle tracking with hormonal signal mapping</p>
      </motion.div>

      {/* Current Phase Hero */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-3xl p-8 text-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${phaseConfig.bg}, rgba(255,255,255,0.5))`,
          border: `2px solid ${phaseConfig.color}40`,
        }}
      >
        <CycleRing currentDay={currentDay} />
        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl">{phaseConfig.emoji}</span>
          <div>
            <h2 className="text-3xl font-black" style={{ color: phaseConfig.color }}>{phaseConfig.name} Phase</h2>
            <p className="text-gray-500">Day {currentDay} • {28 - currentDay} days remaining</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.key
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Tracking Tab */}
        {activeTab === 'tracking' && (
          <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PHASES.map(phase => (
                <motion.div
                  key={phase.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-4 transition-all cursor-pointer ${
                    phase.key === currentPhase ? 'ring-2' : ''
                  }`}
                  style={{
                    background: phase.bg,
                    border: `2px solid ${phase.color}40`,
                    ...(phase.key === currentPhase && { boxShadow: `0 0 20px ${phase.color}40` }),
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl mb-1">{phase.emoji}</div>
                      <p className="font-black text-sm" style={{ color: phase.color }}>{phase.name}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{phase.days} days</p>
                    </div>
                    {phase.key === currentPhase && <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">Active</Badge>}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-blue-500" />
                <h3 className="font-black">Cycle Timeline</h3>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="absolute h-full bg-gradient-to-r from-pink-500 to-rose-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(currentDay / 28) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center font-semibold">{currentDay} / 28 days completed</p>
            </motion.div>
          </motion.div>
        )}

        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <motion.div key="signals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {signals.map((signal, i) => (
              <SignalCard key={signal.type} signal={signal} />
            ))}
          </motion.div>
        )}

        {/* Correlations Tab */}
        {activeTab === 'correlations' && (
          <motion.div key="correlations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {CORRELATIONS.map(corr => (
              <CorrelationPanel key={corr.key} correlation={corr} />
            ))}
          </motion.div>
        )}

        {/* Risks Tab */}
        {activeTab === 'risks' && (
          <motion.div key="risks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <RiskIndicator type="breakout" severity={currentPhase === 'luteal' || currentPhase === 'menstrual' ? 'high' : 'low'} percentage={currentPhase === 'luteal' ? 70 : currentPhase === 'menstrual' ? 50 : 20} />
            <RiskIndicator type="barrier" severity={currentPhase === 'luteal' || currentPhase === 'menstrual' ? 'high' : 'low'} percentage={currentPhase === 'luteal' ? 75 : currentPhase === 'menstrual' ? 80 : 25} />
            <RiskIndicator type="flare" severity={currentPhase === 'luteal' ? 'high' : currentPhase === 'menstrual' ? 'medium' : 'low'} percentage={currentPhase === 'luteal' ? 70 : currentPhase === 'menstrual' ? 50 : 15} />
          </motion.div>
        )}

        {/* Routine Tab */}
        {activeTab === 'routine' && (
          <motion.div key="routine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdaptiveRoutineCard phase={currentPhase} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}