import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check, AlertTriangle, X } from 'lucide-react';

const SAFETY_RULES = [
  {
    category: 'Never Combine',
    color: '#ef4444',
    icon: X,
    rules: [
      { rule: 'Copper peptides + L-Ascorbic Acid (Vitamin C)', reason: 'Forms copper carbonate, loses efficacy & irritates' },
      { rule: 'Retinoids + BHA/AHA same night', reason: 'Over-exfoliation risk, barrier damage' },
      { rule: 'Multiple actives at max concentration', reason: 'Cumulative irritation, sensitization' },
    ],
  },
  {
    category: 'Wait Times & Layering',
    color: '#f59e0b',
    icon: AlertTriangle,
    rules: [
      { rule: 'BHA: Wait 5-10 min before next layer', reason: 'Ensure exfoliation penetrates, prevent over-occlusion' },
      { rule: 'Vitamin C: Wait 5 min, apply to dry skin <pH 3.5', reason: 'Oxidation prevents efficacy' },
      { rule: 'Retinoid: Wait 15-20 min before moisturizer', reason: 'Allow penetration, minimize irritation' },
      { rule: 'Acids+Retinoid spacing: 20-30 min if same session', reason: 'Prevents excessive irritation' },
      { rule: 'Layer thin to thick, water-based before oil-based', reason: 'Optimal absorption, prevents pilling' },
    ],
  },
  {
    category: 'Patch Testing Protocol',
    color: '#10b981',
    icon: Check,
    rules: [
      { rule: 'Day 1-3: Inner arm small patch', reason: 'Test for allergic reactions, severe irritation' },
      { rule: 'Day 4-6: Jawline small patch', reason: 'Test facial sensitivity, realistic face conditions' },
      { rule: 'Day 7+: Full face if no reaction', reason: 'Safe to introduce into routine' },
      { rule: 'Repeat patch test for new concentration/product', reason: 'Concentration matters; higher = new test required' },
    ],
  },
  {
    category: 'Frequency & Concentration Rules',
    color: '#a78bfa',
    icon: AlertCircle,
    rules: [
      { rule: 'Never increase BOTH frequency AND concentration together', reason: 'Risk of barrier damage, sensitization' },
      { rule: 'Change only ONE variable every 2 weeks', reason: 'Allows proper adaptation assessment' },
      { rule: 'Start minimum concentration, phase up over weeks', reason: 'Build tolerance, assess needs' },
      { rule: 'Full barrier repair week every 4-6 weeks (no actives)', reason: 'Prevents cumulative damage, resets sensitivity' },
    ],
  },
  {
    category: 'Irritation Stop Signals',
    color: '#f472b6',
    icon: AlertTriangle,
    rules: [
      { rule: 'Burning lasting >30 seconds after water rinse', reason: 'STOP—signifies barrier compromise' },
      { rule: 'Visible peeling or texture changes', reason: 'Normal purging vs over-exfoliation; assess & reduce' },
      { rule: 'Stinging with water (unpleasant)', reason: 'Barrier damage—reduce actives, increase moisturizer' },
      { rule: 'Redness not subsiding within 2 hours', reason: 'Reduce frequency, concentration, or pause product' },
      { rule: 'Persistent itching, urticaria, severe swelling', reason: 'STOP & seek dermatologist—may be allergy' },
    ],
  },
  {
    category: 'SPF & Sun Protection',
    color: '#38bdf8',
    icon: Check,
    rules: [
      { rule: 'SPF 50+ PA++++ daily with all actives', reason: 'Acids & retinoids increase photosensitivity significantly' },
      { rule: 'Use zinc oxide or modern filters (Tinosorb, Uvinul)', reason: 'Broad-spectrum, stable, mineral or hybrid' },
      { rule: 'Reapply every 2 hours if outdoors or sweating', reason: 'SPF degrades; sun damage undoes skincare work' },
      { rule: 'Physical barrier: hat, shade, clothing', reason: 'Maximize protection, reduce reliance on SPF alone' },
    ],
  },
];

const OVER_EXFOLIATION_SIGNS = [
  { sign: 'Persistent tightness', indicator: 'Over-exfoliation' },
  { sign: 'Increased sensitivity to all products', indicator: 'Over-exfoliation' },
  { sign: 'Shiny, reactive appearance', indicator: 'Over-exfoliation' },
  { sign: 'Small whiteheads or closed comedones post-exfoliation', indicator: 'Purging (normal, 4-8 weeks)' },
  { sign: 'Increased breakouts only in already-acne areas', indicator: 'Purging (normal)' },
  { sign: 'Breakouts in NEW areas + redness + stinging', indicator: 'Allergic reaction—STOP' },
];

export default function SafetyGuidelinesChecklist() {
  const [expandedCategory, setExpandedCategory] = useState(null);

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-700">Safety is Non-Negotiable</p>
            <p className="text-xs text-red-600 mt-1">
              Never skip patch tests, exceed concentrations, or ignore irritation signals. Slow progress beats damaged skin.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Rules */}
      <div className="space-y-2">
        {SAFETY_RULES.map((category, idx) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div
                className="rounded-2xl overflow-hidden cursor-pointer transition-all"
                style={{
                  background: `${category.color}08`,
                  border: `1.5px solid ${category.color}30`,
                  boxShadow: expandedCategory === idx ? `0 8px 24px ${category.color}22` : 'none',
                }}
                onClick={() => setExpandedCategory(expandedCategory === idx ? null : idx)}
              >
                <div className="flex items-center justify-between p-4 hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${category.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: category.color }} />
                    </div>
                    <p className="font-black text-sm" style={{ color: category.color }}>
                      {category.category}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/50">
                    {category.rules.length} rules
                  </span>
                </div>

                {expandedCategory === idx && (
                  <div className="px-4 pb-4 pt-1 space-y-2.5 border-t" style={{ borderColor: `${category.color}30` }}>
                    {category.rules.map((item, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-white/50 border border-gray-100">
                        <p className="font-semibold text-sm text-gray-800 mb-0.5">{item.rule}</p>
                        <p className="text-[11px] text-gray-600 italic">💡 {item.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Irritation Signs */}
      <div className="rounded-2xl overflow-hidden border border-pink-200 bg-pink-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-pink-100">
          <span className="text-xl">🚨</span>
          <div>
            <p className="font-black text-sm text-pink-900">Irritation vs Purging vs Allergy</p>
            <p className="text-[10px] text-pink-700">Know the difference to respond correctly</p>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {OVER_EXFOLIATION_SIGNS.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg"
              style={{
                background:
                  item.indicator === 'Over-exfoliation'
                    ? '#fee2e2'
                    : item.indicator === 'Purging (normal, 4-8 weeks)'
                      ? '#fef3c7'
                      : '#fce7f3',
              }}
            >
              <p className="text-sm text-gray-800">{item.sign}</p>
              <span
                className="text-[10px] font-black px-2 py-1 rounded-full text-white"
                style={{
                  background:
                    item.indicator === 'Over-exfoliation'
                      ? '#ef4444'
                      : item.indicator === 'Purging (normal, 4-8 weeks)'
                        ? '#f59e0b'
                        : '#f472b6',
                }}
              >
                {item.indicator}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Protocol */}
      <div className="rounded-2xl overflow-hidden border-2 border-red-500 bg-red-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-red-100">
          <span className="text-xl">🆘</span>
          <p className="font-black text-sm text-red-900">Emergency Barrier Repair Protocol</p>
        </div>

        <div className="p-4 space-y-2">
          <div className="space-y-1.5 text-sm text-gray-800">
            <p className="font-bold">If barrier is compromised (burning, stinging, excessive redness):</p>
            <ol className="space-y-1 ml-4">
              <li>✋ <strong>PAUSE ALL ACTIVES</strong> immediately—Vitamin C, BHA, retinoids, AHA, everything</li>
              <li>🚿 Use only lukewarm water (no cleanser for 2-3 days)</li>
              <li>🧴 Moisturizer-only routine: Hydrating toner → Niacinamide → Ceramide moisturizer → Oil seal</li>
              <li>😴 Night: Add Centella Asiatica 5-10% + Peptides + Panthenol</li>
              <li>☀️ Morning: Water rinse → SPF 50+ only (no actives)</li>
              <li>⏰ Duration: 2 weeks minimum before reintroducing any active</li>
              <li>🔄 When restarting: Begin at PREVIOUS safe concentration, reduce frequency by 50%</li>
              <li>🏥 If no improvement in 2 weeks or worsening: Consult dermatologist</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}