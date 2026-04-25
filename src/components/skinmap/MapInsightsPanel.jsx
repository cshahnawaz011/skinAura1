import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight, Star, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

function generateInsights(analysis, feedbackHistory, routine) {
  if (!analysis) return [];
  const insights = [];

  // Barrier insight
  if ((analysis.sensitivity || 0) >= 6 && (analysis.dryness || 0) >= 5) {
    insights.push({
      type: 'alert', priority: 'high', emoji: '🛡️',
      title: 'Compromised Barrier Detected',
      desc: 'High sensitivity + dryness signals indicate barrier damage. Pause all actives for 5–7 days.',
      action: 'Switch to ceramide repair routine', link: '/SkinRoutine',
    });
  }

  // Breakout insight
  if ((analysis.acne_level || 0) >= 6 && (analysis.oiliness || 0) >= 5) {
    insights.push({
      type: 'alert', priority: 'high', emoji: '🔴',
      title: 'Active Breakout + Oiliness Pattern',
      desc: 'Congestion risk is elevated. BHA exfoliation 2x/week + oil-control serum recommended.',
      action: 'View BHA routine', link: '/SkinRoutine',
    });
  }

  // Pigmentation opportunity
  if ((analysis.dark_spots || 0) >= 4 && (analysis.redness || 0) >= 3) {
    insights.push({
      type: 'opportunity', priority: 'medium', emoji: '🎯',
      title: 'Pigmentation Pattern Active',
      desc: 'Dark spot + redness combination responds well to Vitamin C AM + SPF50+. Start now.',
      action: 'Set SPF reminder', link: '/GlowDashboard',
    });
  }

  // Hydration gap
  if ((analysis.dryness || 0) >= 5 && (analysis.sensitivity || 0) <= 4) {
    insights.push({
      type: 'opportunity', priority: 'medium', emoji: '💧',
      title: 'Hydration Gap Identified',
      desc: 'Skin is dehydrated but not overly sensitive — ideal to add hyaluronic acid serum layering.',
      action: 'Update routine', link: '/SkinRoutine',
    });
  }

  // Positive signal
  if ((analysis.overall_score || 0) >= 70 && (analysis.sensitivity || 0) <= 4) {
    insights.push({
      type: 'positive', priority: 'low', emoji: '✨',
      title: 'Skin Tolerance Window Open',
      desc: 'Barrier is stable and tolerance is good. This is the right time to introduce new actives gradually.',
      action: 'Explore actives', link: '/IngredientLibrary',
    });
  }

  // Routine connection
  if (routine?.steps?.recovery_mode_active) {
    insights.push({
      type: 'alert', priority: 'high', emoji: '🚨',
      title: 'Recovery Mode Active in Routine',
      desc: 'Your routine is in recovery mode. Match your skincare to skin map signals.',
      action: 'View routine', link: '/SkinRoutine',
    });
  }

  // Feedback correlation
  const recentDamage = feedbackHistory.filter(f => (f.feedback_codes || []).some(c => [4, 5, 6].includes(c))).length;
  if (recentDamage >= 2) {
    insights.push({
      type: 'alert', priority: 'high', emoji: '⚠️',
      title: `${recentDamage} Damage Signals This Week`,
      desc: 'Recent skin feedback shows damage signals. Consider a 5-day barrier reset protocol.',
      action: 'See recovery plan', link: '/SkinRoutine',
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'positive', priority: 'low', emoji: '🌟',
      title: 'Skin Map Looks Stable',
      desc: 'No critical risk signals detected. Continue your current routine and track weekly.',
      action: 'Track progress', link: '/Progress',
    });
  }

  return insights.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

export default function MapInsightsPanel({ analysis, feedbackHistory, routine }) {
  const insights = generateInsights(analysis, feedbackHistory, routine);
  const [expanded, setExpanded] = useState(true);

  const typeStyles = {
    alert: { bg: 'rgba(244,63,94,0.07)', border: 'rgba(244,63,94,0.25)', badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300', icon: AlertTriangle, iconColor: 'text-red-500' },
    opportunity: { bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.25)', badge: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', icon: Zap, iconColor: 'text-amber-500' },
    positive: { bg: 'rgba(52,211,153,0.07)', border: 'rgba(52,211,153,0.25)', badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle, iconColor: 'text-emerald-500' },
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)' }}>
      <button className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <p className="font-black text-sm">Map Intelligence Insights</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 font-bold">{insights.length}</span>
        </div>
        <span className="text-xs text-gray-400">{expanded ? 'Collapse' : 'Expand'}</span>
      </button>

      {expanded && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {insights.map((insight, i) => {
            const style = typeStyles[insight.type];
            const Icon = style.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-xl p-3" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg flex-shrink-0">{insight.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <p className="font-black text-xs text-gray-800 dark:text-gray-100">{insight.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.badge} capitalize`}>{insight.priority}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{insight.desc}</p>
                  </div>
                </div>
                <Link to={insight.link}>
                  <button className="flex items-center gap-1 text-[10px] font-black mt-1" style={{ color: insight.type === 'alert' ? '#f43f5e' : insight.type === 'opportunity' ? '#f59e0b' : '#34d399' }}>
                    {insight.action} <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}