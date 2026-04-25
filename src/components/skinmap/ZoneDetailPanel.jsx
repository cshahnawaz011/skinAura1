import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Info, Star, AlertTriangle } from 'lucide-react';
import { SIGNAL_LAYERS } from '@/pages/AdaptiveSkinMap';

const ZONE_INTEL = {
  forehead: {
    primary_concern: 'T-zone oiliness & texture',
    signals: ['Sebum overproduction', 'Enlarged pores', 'Hormonal acne risk'],
    dos: ['Use salicylic acid 2% cleanser', 'Apply niacinamide serum', 'Use oil-control primer'],
    donts: ['Avoid heavy creams', 'No alcohol toners'],
    ingredient: 'Niacinamide 10%',
  },
  nose: {
    primary_concern: 'Sebum & pore congestion',
    signals: ['Blackhead formation', 'Enlarged pores', 'Excess shine'],
    dos: ['Pore strips weekly', 'BHA exfoliant 2x/week', 'Clay mask monthly'],
    donts: ['No comedogenic products', 'Avoid heavy sunscreen'],
    ingredient: 'Salicylic Acid 2%',
  },
  left_cheek: {
    primary_concern: 'Dryness & sensitivity',
    signals: ['Moisture loss', 'Redness', 'Barrier sensitivity'],
    dos: ['Layer ceramide moisturizer', 'Gentle milk cleanser', 'SPF 50+ daily'],
    donts: ['No fragrance products', 'Avoid harsh scrubs'],
    ingredient: 'Ceramides + Hyaluronic Acid',
  },
  right_cheek: {
    primary_concern: 'Dryness & sensitivity',
    signals: ['Moisture loss', 'Redness', 'Barrier sensitivity'],
    dos: ['Layer ceramide moisturizer', 'Gentle milk cleanser', 'SPF 50+ daily'],
    donts: ['No fragrance products', 'Avoid harsh scrubs'],
    ingredient: 'Ceramides + Hyaluronic Acid',
  },
  chin: {
    primary_concern: 'Hormonal acne & oiliness',
    signals: ['Hormonal breakouts', 'Sebum excess', 'Cystic acne risk'],
    dos: ['Spot treat with BP 2.5%', 'Use zinc supplement', 'Gentle BHA toner'],
    donts: ['No picking', 'Avoid high-glycemic foods'],
    ingredient: 'Benzoyl Peroxide 2.5% + Zinc',
  },
  undereye: {
    primary_concern: 'Dehydration & dark circles',
    signals: ['Collagen thinning', 'Fluid retention', 'Pigmentation'],
    dos: ['Apply eye cream morning + night', 'Use caffeine serum', 'Cold compress'],
    donts: ['No retinol near eyes', 'Avoid rubbing'],
    ingredient: 'Caffeine + Peptides + Vitamin K',
  },
};

export default function ZoneDetailPanel({ zone, analysis, activeLayer, onClose }) {
  const intel = ZONE_INTEL[zone.id] || {};
  const layerCfg = SIGNAL_LAYERS.find(l => l.key === activeLayer);
  const score = analysis ? (analysis[layerCfg?.dataKey] || 0) : 0;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.95)', border: `1.5px solid ${layerCfg?.color || '#f472b6'}40`, backdropFilter: 'blur(16px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800"
        style={{ background: `${layerCfg?.color || '#f472b6'}12` }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{zone.emoji}</span>
          <div>
            <p className="font-black text-sm">{zone.label}</p>
            <p className="text-[10px]" style={{ color: layerCfg?.color }}>{intel.primary_concern}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Active signal score */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${layerCfg?.color || '#f472b6'}10` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${layerCfg?.color}20` }}>
            {layerCfg?.emoji}
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Active: {layerCfg?.label}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, background: layerCfg?.color }} />
              </div>
              <span className="text-xs font-black" style={{ color: layerCfg?.color }}>{score}/10</span>
            </div>
          </div>
        </div>

        {/* Signals */}
        {intel.signals?.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Zone Signals</p>
            <div className="flex flex-wrap gap-1">
              {intel.signals.map((sig, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${layerCfg?.color}15`, color: layerCfg?.color }}>
                  {sig}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dos & Donts */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <p className="text-[10px] font-black text-emerald-600 mb-1">✅ Do</p>
            {intel.dos?.slice(0, 2).map((d, i) => <p key={i} className="text-[10px] text-gray-600 leading-tight mb-0.5">• {d}</p>)}
          </div>
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20">
            <p className="text-[10px] font-black text-red-500 mb-1">❌ Don't</p>
            {intel.donts?.slice(0, 2).map((d, i) => <p key={i} className="text-[10px] text-gray-600 leading-tight mb-0.5">• {d}</p>)}
          </div>
        </div>

        {/* Key Ingredient */}
        {intel.ingredient && (
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(244,114,182,0.08)' }}>
            <Star className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black text-pink-600">Key Ingredient for This Zone</p>
              <p className="text-[11px] text-gray-700 font-semibold">{intel.ingredient}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}