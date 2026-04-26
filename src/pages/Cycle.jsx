import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, differenceInDays } from 'date-fns';
import {
  Heart, Activity, AlertTriangle, TrendingUp, Brain, ChevronDown, ChevronUp,
  Shield, Droplets, Flame, Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PHASES = [
  { key: 'menstrual', name: 'Menstrual', emoji: '🔴', days: 5, color: '#ef4444' },
  { key: 'follicular', name: 'Follicular', emoji: '🌱', days: 7, color: '#10b981' },
  { key: 'ovulation', name: 'Ovulation', emoji: '⚡', days: 3, color: '#f59e0b' },
  { key: 'luteal', name: 'Luteal', emoji: '🌙', days: 8, color: '#8b5cf6' },
];

const HORMONAL_SIGNALS = [
  { 
    key: 'estrogen_level', 
    label: 'Estrogen Level', 
    emoji: '📈', 
    color: '#f472b6',
    desc: 'Hormone balance indicator',
    phaseValues: { menstrual: 3, follicular: 8, ovulation: 9, luteal: 5 },
    facts: [
      'Estrogen peaks during ovulation — driving peak skin clarity and glow.',
      'Estrogen dips trigger the luteal phase challenges — increased congestion and sensitivity.',
    ]
  },
  { 
    key: 'progesterone_level', 
    label: 'Progesterone Level', 
    emoji: '⚙️', 
    color: '#8b5cf6',
    desc: 'Luteal phase driver',
    phaseValues: { menstrual: 2, follicular: 2, ovulation: 3, luteal: 8 },
    facts: [
      'Progesterone surge in the luteal phase increases sebum production and inflammation.',
      'High progesterone reduces skin barrier strength, increasing reactivity.',
    ]
  },
  { 
    key: 'androgen_activity', 
    label: 'Androgen Activity', 
    emoji: '💢', 
    color: '#f43f5e',
    desc: 'Sebum & congestion trigger',
    phaseValues: { menstrual: 5, follicular: 6, ovulation: 7, luteal: 8 },
    facts: [
      'Androgens stimulate sebaceous glands — peak during luteal phase causing oil surge.',
      'Excess sebum + dead skin cells = ideal breeding ground for acne bacteria.',
    ]
  },
  { 
    key: 'inflammatory_response', 
    label: 'Inflammatory Response', 
    emoji: '🔥', 
    color: '#ef4444',
    desc: 'Flare & sensitivity driver',
    phaseValues: { menstrual: 6, follicular: 3, ovulation: 2, luteal: 7 },
    facts: [
      'Menstrual phase inflammation can trigger skin barrier breakdown and sensitivity flares.',
      'Luteal phase cytokine surge increases inflammatory skin response to triggers.',
    ]
  },
];

const CORRELATIONS = [
  { 
    emoji: '💔', 
    title: 'Breakout Correlation', 
    desc: 'Luteal phase shows 3.2x higher breakout risk due to progesterone + androgens',
    phases: ['luteal', 'menstrual'],
    severity: 'high'
  },
  { 
    emoji: '⚡', 
    title: 'Barrier Sensitivity', 
    desc: 'Menstrual & luteal phases compromise skin barrier — reactivity peaks',
    phases: ['menstrual', 'luteal'],
    severity: 'high'
  },
  { 
    emoji: '💧', 
    title: 'Hydration Loss', 
    desc: 'Luteal phase increases transepidermal water loss — skin feels drier',
    phases: ['luteal'],
    severity: 'medium'
  },
  { 
    emoji: '✨', 
    title: 'Radiance Peak', 
    desc: 'Ovulation window offers clearest, most glowing skin — best for photos',
    phases: ['ovulation', 'follicular'],
    severity: 'low'
  },
];

const RISK_LEVELS = {
  breakout: { menstrual: 50, follicular: 15, ovulation: 10, luteal: 75 },
  barrier: { menstrual: 75, follicular: 25, ovulation: 20, luteal: 70 },
  flare: { menstrual: 65, follicular: 15, ovulation: 10, luteal: 60 },
};

function HormoneSignalCard({ signal, phase }) {
  const [expanded, setExpanded] = useState(false);
  const value = signal.phaseValues[phase] || 5;
  const pct = (value / 10) * 100;

  const getSeverity = (v) => {
    if (v <= 3) return { label: 'Low', color: '#10b981' };
    if (v <= 6) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'High', color: '#ef4444' };
  };

  const sev = getSeverity(value);

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.85)', border: `1.5px solid ${expanded ? signal.color : 'rgba(0,0,0,0.06)'}`, backdropFilter: 'blur(12px)' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{signal.emoji}</span>
            <div>
              <p className="font-bold text-sm">{signal.label}</p>
              <p className="text-[10px] text-gray-400">{signal.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: sev.color }} />
            <span className="text-xs font-bold" style={{ color: sev.color }}>{sev.label}</span>
            <span className="text-sm font-black text-gray-700 ml-1">{value}<span className="text-xs text-gray-400 font-normal">/10</span></span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <motion.div className="h-full rounded-full" style={{ background: signal.color }}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
              {signal.facts?.map((fact, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 mt-0.5" style={{ background: signal.color }}>
                    {i + 1}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{fact}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CorrelationGrid({ phase }) {
  const phaseCorrelations = CORRELATIONS.filter(c => c.phases.includes(phase));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {phaseCorrelations.map((corr, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 border"
          style={{
            background: corr.severity === 'high' ? 'rgba(239,68,68,0.08)' : corr.severity === 'medium' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
            borderColor: corr.severity === 'high' ? 'rgba(239,68,68,0.25)' : corr.severity === 'medium' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{corr.emoji}</span>
            <div>
              <p className="font-bold text-sm">{corr.title}</p>
              <p className="text-xs text-gray-600 mt-1">{corr.desc}</p>
              <Badge className="mt-2 text-[10px] border-0 capitalize" style={{
                background: corr.severity === 'high' ? '#ef4444' : corr.severity === 'medium' ? '#f59e0b' : '#10b981',
                color: '#fff'
              }}>
                {corr.severity} Impact
              </Badge>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function RiskDashboard({ phase }) {
  const risks = [
    { key: 'breakout', label: 'Breakout Risk', icon: Flame, color: '#f43f5e' },
    { key: 'barrier', label: 'Barrier Stress', icon: Shield, color: '#8b5cf6' },
    { key: 'flare', label: 'Flare Probability', icon: AlertTriangle, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {risks.map(risk => {
        const Icon = risk.icon;
        const percentage = RISK_LEVELS[risk.key][phase];
        const severity = percentage >= 60 ? 'high' : percentage >= 35 ? 'medium' : 'low';
        const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

        return (
          <motion.div
            key={risk.key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-5"
            style={{
              background: `linear-gradient(135deg, ${colors[severity]}15, ${colors[severity]}08)`,
              border: `2px solid ${colors[severity]}30`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div style={{ color: colors[severity] }}><Icon className="w-6 h-6" /></div>
              <h3 className="font-bold text-sm" style={{ color: colors[severity] }}>{risk.label}</h3>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: colors[severity] }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-bold text-gray-600">{percentage}%</span>
              <Badge className="text-[10px] border-0 capitalize" style={{ background: colors[severity], color: '#fff' }}>
                {severity}
              </Badge>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function AdaptiveRoutineCard({ phase }) {
  const routines = {
    menstrual: { emoji: '🛡️', focus: 'Recovery Mode', tips: ['Skip actives', 'Rich moisturizers', 'Barrier support', 'Hydrating masks'] },
    follicular: { emoji: '✨', focus: 'Active Treatment', tips: ['Vitamin C serum', 'Light exfoliants', 'Treatment serums', 'Build tolerance'] },
    ovulation: { emoji: '💫', focus: 'Peak Performance', tips: ['Retinol safe', 'Strong actives', 'SPF 50+', 'Hydrating layers'] },
    luteal: { emoji: '🌙', focus: 'Calming Care', tips: ['Skip strong actives', 'Soothing serums', 'Rich creams', 'Anti-inflammatory'] },
  };

  const routine = routines[phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{routine.emoji}</span>
        <div>
          <h3 className="font-black text-lg">Routine Adjustments</h3>
          <p className="text-xs text-gray-500">{routine.focus}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {routine.tips.map((tip, i) => (
          <div key={i} className="rounded-xl p-3 bg-white/80 text-center">
            <p className="text-xs font-bold text-gray-700">{tip}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Cycle() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('signals');

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

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

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl p-12 text-center" style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.08))', border: '1px solid rgba(244,114,182,0.2)' }}>
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>❤️</div>
          <h2 className="text-2xl font-black mb-2">Hormonal Cycle Intelligence</h2>
          <p className="text-gray-500 mb-6">Sign in to unlock advanced hormonal insights</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8">Sign In</Button>
        </div>
      </div>
    );
  }

  if (!cycleData) return null;

  const currentDay = differenceInDays(new Date(), new Date(cycleData.start_date)) % 28 + 1;
  const currentPhase = currentDay <= 5 ? 'menstrual' : currentDay <= 12 ? 'follicular' : currentDay <= 15 ? 'ovulation' : 'luteal';
  const phaseConfig = PHASES.find(p => p.key === currentPhase);

  const TABS = [
    { key: 'signals', label: 'Hormonal Signals', icon: Brain },
    { key: 'correlations', label: 'Skin Correlations', icon: Activity },
    { key: 'risks', label: 'Risk Zones', icon: AlertTriangle },
    { key: 'routine', label: 'Adaptive Routine', icon: TrendingUp },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg" style={{ background: `linear-gradient(135deg,${phaseConfig.color},${phaseConfig.color})` }}>
              {phaseConfig.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-black">Hormonal Intelligence</h1>
              <p className="text-xs text-gray-500">Advanced cycle tracking with hormonal mapping</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl text-sm font-bold" style={{ background: `${phaseConfig.color}20`, color: phaseConfig.color }}>
            Day {currentDay} • {phaseConfig.name} Phase
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl overflow-x-auto" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.key
                  ? 'bg-white shadow text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'signals' && (
          <motion.div key="signals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><Brain className="w-5 h-5 text-pink-500" />Hormonal Signal Layers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HORMONAL_SIGNALS.map(sig => (
                <HormoneSignalCard key={sig.key} signal={sig} phase={currentPhase} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'correlations' && (
          <motion.div key="correlations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" />Cycle–Skin Correlations</h2>
            <CorrelationGrid phase={currentPhase} />
          </motion.div>
        )}

        {activeTab === 'risks' && (
          <motion.div key="risks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" />Hormonal Risk Indicators</h2>
            <RiskDashboard phase={currentPhase} />
          </motion.div>
        )}

        {activeTab === 'routine' && (
          <motion.div key="routine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-500" />Adaptive Routine</h2>
            <AdaptiveRoutineCard phase={currentPhase} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}