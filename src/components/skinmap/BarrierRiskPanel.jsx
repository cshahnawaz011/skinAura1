import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Zap, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

const RISK_CATEGORIES = [
  {
    id: 'barrier',
    label: 'Barrier Risk',
    emoji: '🛡️',
    color: '#f43f5e',
    description: 'Skin barrier integrity assessment',
    getScore: (a) => Math.max(a?.sensitivity || 0, a?.dryness || 0, a?.redness || 0),
    getAlerts: (a) => {
      const alerts = [];
      if ((a?.sensitivity || 0) >= 6) alerts.push({ text: 'High sensitivity — avoid retinol, AHA/BHA simultaneously', severity: 'high' });
      if ((a?.dryness || 0) >= 6) alerts.push({ text: 'Barrier moisture loss — ceramide repair is critical', severity: 'high' });
      if ((a?.redness || 0) >= 5) alerts.push({ text: 'Inflammatory signal — reduce active ingredients frequency', severity: 'medium' });
      if (alerts.length === 0) alerts.push({ text: 'Barrier appears stable', severity: 'low' });
      return alerts;
    },
    facts: [
      'The skin barrier (stratum corneum) is composed of lipids, ceramides and proteins — when disrupted, allergens and bacteria enter more easily.',
      'A damaged barrier causes a vicious cycle: inflammation weakens it further, which triggers more sensitivity and dryness.',
    ],
  },
  {
    id: 'breakout',
    label: 'Breakout Risk',
    emoji: '🔴',
    color: '#f97316',
    description: 'Acne and congestion breakout probability',
    getScore: (a) => Math.max(a?.acne_level || 0, a?.oiliness || 0, a?.pores || 0),
    getAlerts: (a) => {
      const alerts = [];
      if ((a?.acne_level || 0) >= 6) alerts.push({ text: 'Active breakout detected — excess sebum and bacteria present', severity: 'high' });
      if ((a?.oiliness || 0) >= 7) alerts.push({ text: 'Excess sebum production — high congestion and pore-clogging risk', severity: 'high' });
      if ((a?.pores || 0) >= 6) alerts.push({ text: 'Enlarged pores visible — sebum and dead cells accumulating', severity: 'medium' });
      if (alerts.length === 0) alerts.push({ text: 'Breakout risk is low', severity: 'low' });
      return alerts;
    },
    facts: [
      'Acne lesions begin forming 2–3 weeks before they are visible on the surface — by the time you see a pimple, it has been developing for weeks.',
      'Propionibacterium acnes (P. acnes) bacteria thrive in oxygen-free clogged pores, producing fatty acids that trigger the inflammatory response.',
    ],
  },
  {
    id: 'aging',
    label: 'Aging Risk',
    emoji: '⏳',
    color: '#a78bfa',
    description: 'Fine line and elasticity loss signals',
    getScore: (a) => Math.max(a?.wrinkles || 0, a?.dryness || 0),
    getAlerts: (a) => {
      const alerts = [];
      if ((a?.wrinkles || 0) >= 5) alerts.push({ text: 'Fine lines detected — collagen degradation is active', severity: 'medium' });
      if ((a?.dryness || 0) >= 6) alerts.push({ text: 'Dehydration accelerating visible aging signs', severity: 'medium' });
      if (alerts.length === 0) alerts.push({ text: 'Aging signals are minimal', severity: 'low' });
      return alerts;
    },
    facts: [
      'Collagen production declines by approximately 1% per year after age 25, and UV radiation accelerates this degradation by up to 5× more.',
      'Glycation — sugar molecules bonding to collagen fibers — is a major but overlooked cause of skin stiffness and wrinkle formation.',
    ],
  },
  {
    id: 'pigmentation',
    label: 'Pigmentation Risk',
    emoji: '🎯',
    color: '#f59e0b',
    description: 'Hyperpigmentation and dark spot formation risk',
    getScore: (a) => Math.max(a?.dark_spots || 0, a?.redness || 0),
    getAlerts: (a) => {
      const alerts = [];
      if ((a?.dark_spots || 0) >= 5) alerts.push({ text: 'Post-inflammatory hyperpigmentation pattern detected', severity: 'medium' });
      if ((a?.redness || 0) >= 5) alerts.push({ text: 'Active inflammation increases melanin overproduction risk', severity: 'medium' });
      if (alerts.length === 0) alerts.push({ text: 'Pigmentation risk is currently controlled', severity: 'low' });
      return alerts;
    },
    facts: [
      'Melanocytes produce melanin in response to UV and inflammation — even 10 minutes of unprotected sun exposure can undo weeks of treatment.',
      'Post-inflammatory hyperpigmentation (PIH) is more persistent in deeper skin tones due to higher baseline melanin density in the epidermis.',
    ],
  },
];

function getRiskLevel(score) {
  if (score <= 3) return { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: '#34d399' };
  if (score <= 5) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: '#fbbf24' };
  if (score <= 7) return { label: 'Elevated', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', bar: '#fb923c' };
  return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', bar: '#f43f5e' };
}

function severityStyles(severity) {
  if (severity === 'high') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
  if (severity === 'medium') return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
  return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
}

export default function BarrierRiskPanel({ analysis, feedbackHistory }) {
  const [expanded, setExpanded] = useState('barrier');

  const recentDamageSignals = feedbackHistory.filter(f =>
    (f.feedback_codes || []).some(c => [4, 5, 6].includes(c))
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-red-500" />
        <h2 className="font-black text-lg">Risk Signal Overlays</h2>
        {recentDamageSignals > 0 && (
          <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
            ⚠️ {recentDamageSignals} damage signal{recentDamageSignals > 1 ? 's' : ''} this week
          </span>
        )}
      </div>

      {/* Risk Category Cards */}
      <div className="space-y-3">
        {RISK_CATEGORIES.map(cat => {
          const score = cat.getScore(analysis || {});
          const alerts = cat.getAlerts(analysis || {});
          const risk = getRiskLevel(score);
          const isOpen = expanded === cat.id;

          return (
            <div key={cat.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.9)', border: `1.5px solid ${isOpen ? cat.color : 'rgba(0,0,0,0.06)'}`, backdropFilter: 'blur(12px)' }}>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setExpanded(isOpen ? null : cat.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${cat.color}18` }}>
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{cat.label}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${risk.bg} ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(score / 10) * 100}%`, background: risk.bar }} />
                    </div>
                    <span className="text-xs font-black" style={{ color: cat.color }}>{score.toFixed(1)}/10</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                      {/* Alerts */}
                      <div className="space-y-2">
                        {alerts.map((alert, i) => (
                          <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${severityStyles(alert.severity)}`}>
                            {alert.severity === 'high' ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> :
                             alert.severity === 'medium' ? <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> :
                             <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                            <p>{alert.text}</p>
                          </div>
                        ))}
                      </div>

                      {/* Science Facts */}
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Skin Science</p>
                        <div className="space-y-2">
                          {cat.facts.map((fact, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 mt-0.5"
                                style={{ background: cat.color }}>
                                {i + 1}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{fact}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}