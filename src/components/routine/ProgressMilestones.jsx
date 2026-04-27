import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target, CheckCircle2, TrendingUp } from 'lucide-react';

const MILESTONES = [
  {
    timeframe: 'Weeks 1–2',
    emoji: '🧪',
    title: 'Patch Testing & Baseline',
    goals: [
      'Establish baseline skin condition (photo + notes)',
      'Complete patch test without major irritation',
      'Skin feels familiar with new AM/PM structure',
    ],
    measurable: [
      'No persistent redness after 48 hours of treatment',
      'AM routine takes <5 minutes',
      'PM routine takes <10 minutes',
    ],
    color: '#3b82f6',
  },
  {
    timeframe: 'Weeks 3–4',
    emoji: '🔆',
    title: 'Initial Brightening & Adaptation',
    goals: [
      'Skin shows early signs of glow and even tone',
      'Comfortable increasing to 2–3 treatment nights/week',
      'Hydration layer feels effective (no tight skin)',
    ],
    measurable: [
      'Pores look slightly smaller/less prominent',
      'Overall tone is more uniform',
      'No barrier damage (flaking only if expected)',
    ],
    color: '#f59e0b',
  },
  {
    timeframe: 'Weeks 5–8',
    emoji: '✨',
    title: 'Texture Improvement & Clarity',
    goals: [
      'Visible improvement in skin texture (smoother to touch)',
      'Acne or congestion begins to clear',
      'Comfortable with 3–4 treatment nights/week',
    ],
    measurable: [
      'Fine lines appear softer',
      'Breakouts reduced by 30–50%',
      'Skin feels resilient, bouncy hydration returned',
    ],
    color: '#10b981',
  },
  {
    timeframe: 'Weeks 9–12',
    emoji: '🎯',
    title: 'Sustained Improvement & Barrier Strength',
    goals: [
      'Comprehensive skin transformation (all concerns improving)',
      'Barrier function fully restored (no sensitivity)',
      'Consistent radiance and hydration',
    ],
    measurable: [
      'Overall skin tone is brighter, more luminous',
      'Hydration sustained 24+ hours',
      'Comfortable skipping extra hydration on some days',
    ],
    color: '#8b5cf6',
  },
  {
    timeframe: 'Months 4–6',
    emoji: '💪',
    title: 'Advanced Results & Confidence',
    goals: [
      'Foundational skin health established',
      'Ready to introduce second active or upgrade concentration',
      'Long-term sustainable routine locked in',
    ],
    measurable: [
      'Reduced fine lines, improved firmness',
      'Hyperpigmentation and dark spots fading',
      'Skin behaves predictably, minimal surprises',
    ],
    color: '#ec4899',
  },
  {
    timeframe: 'Months 6–12',
    emoji: '⭐',
    title: 'Long-Term Transformation',
    goals: [
      'Skin health at peak (firm, clear, glowing, hydrated)',
      'Maintenance routine refined and personalized',
      'Comfortable managing multiple actives safely',
    ],
    measurable: [
      'Visible reduction in wrinkles and expression lines',
      'Skin texture is refined, pores minimized',
      'Consistent results month-to-month with minimal adjustment',
    ],
    color: '#06b6d4',
  },
];

const MONTHLY_TRACKING = [
  { month: 'Month 1', focus: 'Tolerance & Baseline', check: ['Photo comparison', 'Notes on tolerance', 'Skin texture feel'] },
  { month: 'Month 2', focus: 'Early Improvements', check: ['Pore appearance', 'Tone uniformity', 'Barrier health'] },
  { month: 'Month 3', focus: 'Texture & Clarity', check: ['Acne/breakouts count', 'Fine line visibility', 'Radiance'] },
  { month: 'Month 4-6', focus: 'Sustained Results', check: ['Firmness & elasticity', 'Hyperpigmentation fade', 'Overall resilience'] },
  { month: 'Month 6-12', focus: 'Optimization', check: ['Long-term transformation', 'New concerns addressed', 'Routine refinement'] },
];

export default function ProgressMilestones() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-rose-500" />
        <h2 className="text-lg font-black text-gray-900">Progress Milestones & Tracking</h2>
      </div>

      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
        <p className="text-xs font-bold text-rose-900 mb-1">📸 Tracking Best Practices</p>
        <p className="text-xs text-rose-800 leading-relaxed">
          Take photos on Day 1 (baseline), Week 4, Week 8, and Month 3 in the same lighting, angle, and expression. 
          Keep a simple journal: date, skin condition, active used, any reactions, mood. Compare quarterly.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {MILESTONES.map((milestone, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-2xl overflow-hidden border border-gray-200"
            style={{ background: 'rgba(255,255,255,0.95)' }}
          >
            <div className="px-4 py-3.5 flex items-start gap-3" style={{ background: milestone.color + '08', borderBottom: `2px solid ${milestone.color}30` }}>
              <span className="text-2xl flex-shrink-0">{milestone.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">{milestone.timeframe}</span>
                  <p className="font-black text-sm text-gray-900">{milestone.title}</p>
                </div>
              </div>
              <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ background: milestone.color }} />
            </div>

            <div className="px-4 py-3 space-y-3">
              {/* Goals */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Goals</p>
                <ul className="space-y-1">
                  {milestone.goals.map((goal, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-700">
                      <span className="text-emerald-500 font-black flex-shrink-0 mt-0.5">✓</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Measurable Outcomes */}
              <div className="p-2.5 rounded-lg" style={{ background: milestone.color + '10', border: `1px solid ${milestone.color}30` }}>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: milestone.color }}>📊 Measurable Outcomes</p>
                <ul className="space-y-1">
                  {milestone.measurable.map((outcome, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Monthly Tracking Checklist */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-cyan-500" />
          <h3 className="font-black text-sm text-gray-900">Monthly Check-in Tracker</h3>
        </div>

        <div className="space-y-2">
          {MONTHLY_TRACKING.map((month, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl p-3 border border-gray-200"
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              <div className="flex items-start gap-3 mb-2">
                <span className="text-lg flex-shrink-0">📅</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{month.month}</p>
                  <p className="text-xs text-gray-500">{month.focus}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 ml-7">
                {month.check.map((check, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                    □ {check}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-xs font-bold text-blue-900 mb-1">💡 Pro Tips</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Keep a skin journal:</strong> Simple notes (date, routine, reactions, how skin feels).</li>
          <li>• <strong>Photo timeline:</strong> Take monthly selfies in consistent light to see long-term change.</li>
          <li>• <strong>Don't compare weeks:</strong> Real change takes 4–8 weeks minimum.</li>
          <li>• <strong>Celebrate small wins:</strong> Softer texture, reduced redness, or improved hydration ALL count.</li>
        </ul>
      </div>
    </div>
  );
}