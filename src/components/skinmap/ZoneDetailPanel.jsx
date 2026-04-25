import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Info, Star, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { SIGNAL_LAYERS } from '@/pages/AdaptiveSkinMap';

const ZONE_INTEL = {
  forehead: {
    primary_concern: 'T-zone oiliness, hormonal acne & texture',
    confidence: 94,
    risk_level: 'elevated',
    signals: ['Sebum overproduction', 'Enlarged T-zone pores', 'Hormonal acne risk', 'Blackhead formation'],
    dos: ['Salicylic acid 2% cleanser AM', 'Niacinamide 10% serum', 'Oil-control clay mask weekly', 'Blotting paper midday'],
    donts: ['Heavy creams or occlusive balms', 'Alcohol-based toners', 'Touching face frequently'],
    ingredient: 'Niacinamide 10% + Zinc PCA',
    routine_note: 'Focus BHA exfoliation here 2×/week. Use mattifying moisturizer.',
    product_type: 'Oil-control serum + Clay mask',
    timeline: '3–4 weeks consistent use',
  },
  left_brow_temple: {
    primary_concern: 'Stress-related sensitivity & temple redness',
    confidence: 82,
    risk_level: 'mild',
    signals: ['Stress hormone reactivity', 'Contact sensitivity', 'Mild congestion'],
    dos: ['Gentle fragrance-free moisturizer', 'Cooling gel on redness', 'Green tea compress'],
    donts: ['Tight headbands/hats', 'Pore strips in this area'],
    ingredient: 'Centella Asiatica + Green Tea',
    routine_note: 'Use calming essence here. Patch test all new products.',
    product_type: 'Calming essence + SPF',
    timeline: '2–3 weeks',
  },
  right_brow_temple: {
    primary_concern: 'Stress-related sensitivity & temple redness',
    confidence: 82,
    risk_level: 'mild',
    signals: ['Stress hormone reactivity', 'Contact sensitivity', 'Mild congestion'],
    dos: ['Gentle fragrance-free moisturizer', 'Cooling gel on redness', 'Green tea compress'],
    donts: ['Tight headbands/hats', 'Pore strips in this area'],
    ingredient: 'Centella Asiatica + Green Tea',
    routine_note: 'Mirror the left temple routine. Symmetrical application matters.',
    product_type: 'Calming essence + SPF',
    timeline: '2–3 weeks',
  },
  nose: {
    primary_concern: 'Maximum sebum zone — pore congestion & blackheads',
    confidence: 97,
    risk_level: 'high',
    signals: ['Sebaceous gland overactivity', 'Blackhead & whitehead formation', 'Enlarged pores', 'Surface shine'],
    dos: ['BHA (salicylic acid) 2% toner', 'Charcoal mask 1×/week', 'Gentle physical exfoliation', 'Non-comedogenic sunscreen'],
    donts: ['Heavy moisturizers on nose', 'Comedogenic oils', 'Squeezing blackheads manually'],
    ingredient: 'Salicylic Acid 2% + Witch Hazel',
    routine_note: 'This is your highest sebum zone. BHA is non-negotiable. Use mattifying primer.',
    product_type: 'BHA exfoliant + pore strip + clay mask',
    timeline: '4–6 weeks',
  },
  left_cheek: {
    primary_concern: 'Moisture barrier integrity & sensitivity',
    confidence: 89,
    risk_level: 'moderate',
    signals: ['Transepidermal water loss', 'Barrier compromise', 'Environmental sensitivity', 'Subtle redness patches'],
    dos: ['Ceramide-based moisturizer AM+PM', 'Gentle milk cleanser', 'SPF 50+ mandatory', 'Humectant serum first'],
    donts: ['Fragrance products', 'Harsh scrubs', 'Over-exfoliation in this area'],
    ingredient: 'Ceramides + Hyaluronic Acid + Squalane',
    routine_note: 'Prioritize barrier first. Avoid actives on cheeks until sensitivity reduces.',
    product_type: 'Barrier cream + hydrating serum',
    timeline: '2–4 weeks',
  },
  right_cheek: {
    primary_concern: 'Moisture barrier integrity & sensitivity',
    confidence: 89,
    risk_level: 'moderate',
    signals: ['Transepidermal water loss', 'Barrier compromise', 'Environmental sensitivity', 'Subtle redness patches'],
    dos: ['Ceramide-based moisturizer AM+PM', 'Gentle milk cleanser', 'SPF 50+ mandatory', 'Humectant serum first'],
    donts: ['Fragrance products', 'Harsh scrubs', 'Over-exfoliation'],
    ingredient: 'Ceramides + Hyaluronic Acid + Squalane',
    routine_note: 'Check phone-cheek contact — bacteria transfer is a common trigger here.',
    product_type: 'Barrier cream + hydrating serum',
    timeline: '2–4 weeks',
  },
  undereye: {
    primary_concern: 'Collagen thinning, dark circles & periorbital dehydration',
    confidence: 86,
    risk_level: 'moderate',
    signals: ['Thin skin dehydration', 'Pigmentation pooling', 'Puffiness / lymphatic stagnation', 'Collagen degradation risk'],
    dos: ['Eye cream with caffeine AM', 'Peptide eye serum PM', 'Cold spoon massage', 'Sleep 7–9 hours'],
    donts: ['Retinol directly on undereye', 'Rubbing eye makeup off', 'Sleeping face-down'],
    ingredient: 'Caffeine 5% + Vitamin K + Peptides',
    routine_note: 'Apply eye cream with ring finger — no pulling. Store in fridge for depuffing.',
    product_type: 'Peptide eye cream + cooling roller',
    timeline: '6–8 weeks',
  },
  chin: {
    primary_concern: 'Hormonal cystic acne & jaw congestion',
    confidence: 91,
    risk_level: 'high',
    signals: ['Androgenic hormone sensitivity', 'Deep cystic acne formations', 'Perimenstrual flare pattern', 'Sebum congestion'],
    dos: ['Benzoyl peroxide 2.5% spot treatment', 'Zinc supplement 30mg daily', 'Ice on cysts to reduce size', 'Gentle BHA toner'],
    donts: ['Picking or squeezing cysts', 'High-glycemic diet', 'Heavy chin coverage with makeup'],
    ingredient: 'Benzoyl Peroxide 2.5% + Zinc + Tea Tree',
    routine_note: 'Track your cycle — flares often correlate 5–7 days before menstruation.',
    product_type: 'Spot treatment + anti-inflammatory serum',
    timeline: '4–8 weeks',
  },
  lips_perioral: {
    primary_concern: 'Perioral dryness & sensitivity zone',
    confidence: 78,
    risk_level: 'low',
    signals: ['Dehydration fine lines', 'Product sensitivity accumulation', 'Mild barrier thinning'],
    dos: ['Lip balm with ceramides', 'Petroleum jelly overnight mask', 'Gentle exfoliation 1×/week'],
    donts: ['Matte liquid lipsticks daily', 'Licking lips habitually', 'Spicy foods when irritated'],
    ingredient: 'Ceramides + Lanolin + Hyaluronic Acid',
    routine_note: 'Extend moisturizer slightly past lip line. Apply lip balm before lipstick.',
    product_type: 'Hydrating lip treatment',
    timeline: '1–2 weeks',
  },
};

const RISK_COLORS = {
  low: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.4)', text: '#059669', label: 'Low Risk' },
  mild: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.4)', text: '#d97706', label: 'Mild Risk' },
  moderate: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)', text: '#ea580c', label: 'Moderate Risk' },
  elevated: { bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.4)', text: '#e11d48', label: 'Elevated Risk' },
  high: { bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.5)', text: '#dc2626', label: 'High Risk' },
};

export default function ZoneDetailPanel({ zone, analysis, activeLayer, onClose }) {
  const [tab, setTab] = useState('overview');
  const intel = ZONE_INTEL[zone.id] || {};
  const layerCfg = SIGNAL_LAYERS.find(l => l.key === activeLayer);
  const baseScore = analysis ? (analysis[layerCfg?.dataKey] || 0) : 0;
  const mod = zone.modifiers?.[activeLayer] || 1.0;
  const zoneScore = Math.min(10, (layerCfg?.invert ? Math.max(0, 10 - baseScore) : baseScore) * mod);
  const risk = RISK_COLORS[intel.risk_level || 'low'];
  const color = layerCfg?.color || '#f472b6';

  // All-signals snapshot for this zone
  const allLayerScores = SIGNAL_LAYERS.map(l => {
    const raw = analysis ? (analysis[l.dataKey] || 0) : 0;
    const v = l.invert ? Math.max(0, 10 - raw) : raw;
    const m = zone.modifiers?.[l.key] || 0.85;
    return { ...l, zoneVal: Math.min(10, v * m) };
  }).sort((a, b) => b.zoneVal - a.zoneVal);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'signals', label: 'Signals' },
    { key: 'routine', label: 'Routine' },
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.93, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 8 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: 'rgba(255,255,255,0.97)', border: `1.5px solid ${color}33`, backdropFilter: 'blur(20px)' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: `linear-gradient(135deg, ${color}10, ${color}06)` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              {zone.emoji}
            </div>
            <div>
              <p className="font-black text-sm text-gray-800">{zone.label}</p>
              <p className="text-[10px] font-semibold" style={{ color }}>{intel.primary_concern}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Score + Confidence + Risk */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Zone score gauge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: `${color}15` }}>
            <span className="text-sm font-black" style={{ color }}>{zoneScore.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">/10 zone score</span>
          </div>
          {/* Confidence */}
          {intel.confidence && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <span className="text-[10px] font-bold text-blue-600">AI Confidence: {intel.confidence}%</span>
            </div>
          )}
          {/* Risk badge */}
          <div className="px-2.5 py-1.5 rounded-xl text-[10px] font-black"
            style={{ background: risk.bg, border: `1px solid ${risk.border}`, color: risk.text }}>
            {intel.risk_level === 'high' ? '🔴' : intel.risk_level === 'elevated' ? '🟠' : intel.risk_level === 'moderate' ? '🟡' : '🟢'} {risk.label}
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>{layerCfg?.emoji} {layerCfg?.label} in this zone</span>
            <span style={{ color }}>{zoneScore.toFixed(1)}/10</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
              initial={{ width: 0 }} animate={{ width: `${(zoneScore / 10) * 100}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-xs font-bold transition-all"
            style={{ color: tab === t.key ? color : '#9ca3af', borderBottom: tab === t.key ? `2px solid ${color}` : '2px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Signals */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Active Signals</p>
                <div className="flex flex-wrap gap-1">
                  {intel.signals?.map((sig, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                      {sig}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dos & Donts */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <p className="text-[10px] font-black text-emerald-600 mb-1.5">✅ DO</p>
                  {intel.dos?.map((d, i) => <p key={i} className="text-[10px] text-gray-600 leading-snug mb-0.5">• {d}</p>)}
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                  <p className="text-[10px] font-black text-red-500 mb-1.5">❌ DON'T</p>
                  {intel.donts?.map((d, i) => <p key={i} className="text-[10px] text-gray-600 leading-snug mb-0.5">• {d}</p>)}
                </div>
              </div>

              {/* Key ingredient */}
              {intel.ingredient && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                  <div>
                    <p className="text-[10px] font-black" style={{ color }}>Hero Ingredient for This Zone</p>
                    <p className="text-xs font-bold text-gray-800">{intel.ingredient}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'signals' && (
            <motion.div key="signals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">All Signal Scores — This Zone</p>
              {allLayerScores.map(l => (
                <div key={l.key} className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center">{l.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                      <span className="font-semibold">{l.label}</span>
                      <span className="font-black" style={{ color: l.color }}>{l.zoneVal.toFixed(1)}/10</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: l.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(l.zoneVal / 10) * 100}%` }}
                        transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {tab === 'routine' && (
            <motion.div key="routine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Routine note */}
              {intel.routine_note && (
                <div className="p-3 rounded-xl" style={{ background: `${color}09`, border: `1px solid ${color}22` }}>
                  <p className="text-[10px] font-black mb-1" style={{ color }}>🧠 Routine Intelligence</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{intel.routine_note}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {intel.product_type && (
                  <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                    <p className="text-[10px] font-black text-violet-600 mb-0.5">💊 Product Type</p>
                    <p className="text-[11px] text-gray-700 font-semibold">{intel.product_type}</p>
                  </div>
                )}
                {intel.timeline && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-[10px] font-black text-amber-600 mb-0.5">⏱ Timeline</p>
                    <p className="text-[11px] text-gray-700 font-semibold">{intel.timeline}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}