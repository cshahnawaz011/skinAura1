import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Zap, ChevronDown, ChevronUp, TrendingDown, CheckCircle } from 'lucide-react';

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
      if ((a?.dryness || 0) >= 6) alerts.push({ text: 'Barrier moisture loss — prioritize ceramide repair', severity: 'high' });
      if ((a?.redness || 0) >= 5) alerts.push({ text: 'Inflammatory signal — reduce active ingredients frequency', severity: 'medium' });
      if (alerts.length === 0) alerts.push({ text: 'Barrier appears stable — maintain current routine', severity: 'low' });
      return alerts;
    },
    actions: ['Apply ceramide moisturizer twice daily', 'Patch test new products', 'Avoid hot water cleansing', 'Use fragrance-free formulas only'],
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
      if ((a?.acne_level || 0) >= 6) alerts.push({ text: 'Active breakout detected — begin BHA/BP treatment', severity: 'high' });
      if ((a?.oiliness || 0) >= 7) alerts.push({ text: 'Excess sebum — high congestion and pore-clogging risk', severity: 'high' });
      if ((a?.pores || 0) >= 6) alerts.push({ text: 'Enlarged pores visible — use pore-minimizing actives', severity: 'medium' });
      if (alerts.length === 0) alerts.push({ text: 'Breakout risk is low — prevention routine is sufficient', severity: 'low' });
      return alerts;
    },
    actions: ['Use salicylic acid 2% toner', 'Change pillowcase every 2 days', 'Avoid heavy comedogenic products', 'Spot treat with BP 2.5%'],
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
      if ((a?.wrinkles || 0) >= 5) alerts.push({ text: 'Fine lines detected — start retinol protocol', severity: 'medium' });
      if ((a?.dryness || 0) >= 6) alerts.push({ text: 'Dehydration accelerating aging — increase moisturization', severity: 'medium' });
      if (alerts.length === 0) alerts.push({ text: 'Aging signals are minimal — preventive routine is optimal', severity: 'low' });
      return alerts;
    },
    actions: ['Start retinol 0.025% nightly', 'Use Vitamin C serum AM', 'Daily SPF 50+ without fail', 'Add peptide serum to routine'],
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
      if ((a?.dark_spots || 0) >= 5) alerts.push({ text: 'Post-inflammatory hyperpigmentation detected', severity: 'medium' });
      if ((a?.redness || 0) >= 5) alerts.push({ text: 'Inflammation may leave dark marks — treat early', severity: 'medium' });
      if (alerts.length === 0) alerts.push({ text: 'Pigmentation risk is controlled — maintain SPF use', severity: 'low' });
      return alerts;
    },
    actions: ['Apply SPF 50+ daily mandatory', 'Use Vitamin C + Alpha Arbutin serum', 'Avoid sun exposure 10am–2pm', 'Add niacinamide to even tone'],
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

export default function BarrierRiskPanel({ analysis, feedbackHistory, routine }) {
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

                      {/* Suggested Actions */}
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Suggested Actions</p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {cat.actions.map((action, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                                style={{ background: cat.color }}>
                                {i + 1}
                              </span>
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Routine connection */}
                      {routine && (
                        <div className="p-2.5 rounded-xl text-xs" style={{ background: `${cat.color}10` }}>
                          <p className="font-bold mb-1" style={{ color: cat.color }}>🔗 Routine Connection</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            Your {routine.routine_type || 'morning'} routine {score >= 6 ? 'needs adjustment to address this risk' : 'is aligned to manage this concern'}.
                          </p>
                        </div>
                      )}
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