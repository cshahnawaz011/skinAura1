import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { INGREDIENT_REGISTRY, FREQUENCY_LADDER } from '@/lib/adaptiveRoutineEngine';

// Why each ingredient was selected, what to look for when buying
const INGREDIENT_META = {
  niacinamide: {
    why: 'Controls oil, reduces pores & dark spots',
    triggers: ['oiliness ≥ 4', 'pores ≥ 3', 'dark_spots ≥ 3'],
    buyTip: 'Look for: "Niacinamide 5–10%" on label. Avoid if paired with high-dose Vit C (>15%).',
    emoji: '🌿',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.25)',
  },
  ceramides: {
    why: 'Repairs skin barrier, reduces dryness & sensitivity',
    triggers: ['sensitivity ≥ 4', 'dryness ≥ 4', 'redness ≥ 4'],
    buyTip: 'Look for: "Ceramide NP / AP / EOP" in ingredients. Best in cream or lotion format.',
    emoji: '🛡️',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.25)',
  },
  peptides: {
    why: 'Stimulates collagen, reduces fine lines',
    triggers: ['wrinkles ≥ 4', 'dryness ≥ 5'],
    buyTip: 'Look for: "Matrixyl", "Argireline", "Palmitoyl Tripeptide" on label. Use PM only.',
    emoji: '💪',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.25)',
  },
  salicylic: {
    why: 'Unclogs pores, fights acne, reduces oiliness',
    triggers: ['acne ≥ 4', 'oiliness ≥ 5', 'pores ≥ 4'],
    buyTip: 'Look for: "Salicylic Acid 1–2%" (BHA). Start 1×/week. Avoid if skin is dry/flaky.',
    emoji: '⚡',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.25)',
  },
  retinol: {
    why: 'Speeds cell turnover, reduces wrinkles & acne scars',
    triggers: ['wrinkles ≥ 4', 'dryness ≥ 4 + sensitivity < 6'],
    buyTip: 'Look for: "Retinol 0.1–0.3%" for beginners. Apply on DRY skin, 20min post-cleanse. ALWAYS use SPF next morning.',
    emoji: '🌙',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
  },
  azelaic: {
    why: 'Fades dark spots & redness, very gentle',
    triggers: ['dark_spots ≥ 6', 'redness ≥ 5'],
    buyTip: 'Look for: "Azelaic Acid 10–20%". Works on all skin types. Safe to use AM or PM.',
    emoji: '🌸',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.25)',
  },
  tranexamic: {
    why: 'Reduces pigmentation & melasma gently',
    triggers: ['dark_spots ≥ 4', 'redness ≥ 5'],
    buyTip: 'Look for: "Tranexamic Acid 2–5%". Very gentle — great for sensitive skin. Use AM or PM.',
    emoji: '🎯',
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.25)',
  },
  vitaminC: {
    why: 'Brightens, antioxidant protection, fades spots',
    triggers: ['dark_spots ≥ 3', 'acne ≥ 3', 'oiliness ≥ 5'],
    buyTip: 'Look for: "Ascorbic Acid 10–15%" or "Sodium Ascorbyl Phosphate". Use AM only. Must use SPF with it.',
    emoji: '🍋',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
};

function ModuleCard({ ingKey, isActive, freqLabel, analysis }) {
  const [expanded, setExpanded] = useState(false);
  const ing = INGREDIENT_REGISTRY[ingKey];
  const meta = INGREDIENT_META[ingKey] || {};
  if (!ing) return null;

  // Build reason string based on analysis values
  const reasons = [];
  if (analysis) {
    if (ingKey === 'niacinamide') {
      if (analysis.oiliness >= 4) reasons.push(`Oiliness ${analysis.oiliness}/10`);
      if (analysis.dark_spots >= 3) reasons.push(`Dark spots ${analysis.dark_spots}/10`);
      if (analysis.pores >= 3) reasons.push(`Pores ${analysis.pores}/10`);
    } else if (ingKey === 'ceramides') {
      if (analysis.sensitivity >= 4) reasons.push(`Sensitivity ${analysis.sensitivity}/10`);
      if (analysis.dryness >= 4) reasons.push(`Dryness ${analysis.dryness}/10`);
    } else if (ingKey === 'peptides') {
      if (analysis.wrinkles >= 4) reasons.push(`Wrinkles ${analysis.wrinkles}/10`);
    } else if (ingKey === 'salicylic') {
      if (analysis.acne_level >= 4) reasons.push(`Acne ${analysis.acne_level}/10`);
      if (analysis.oiliness >= 5) reasons.push(`Oiliness ${analysis.oiliness}/10`);
    } else if (ingKey === 'retinol') {
      if (analysis.wrinkles >= 4) reasons.push(`Wrinkles ${analysis.wrinkles}/10`);
    } else if (ingKey === 'azelaic' || ingKey === 'tranexamic') {
      if (analysis.dark_spots >= 4) reasons.push(`Dark spots ${analysis.dark_spots}/10`);
      if (analysis.redness >= 5) reasons.push(`Redness ${analysis.redness}/10`);
    } else if (ingKey === 'vitaminC') {
      if (analysis.dark_spots >= 3) reasons.push(`Dark spots ${analysis.dark_spots}/10`);
    }
  }

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: meta.bg || 'rgba(0,0,0,0.03)', border: `1.5px solid ${meta.border || 'rgba(0,0,0,0.1)'}` }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setExpanded(e => !e)}>
        <span className="text-xl flex-shrink-0">{meta.emoji || '🧴'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-sm text-gray-800">{ing.name}</p>
            {/* CONCENTRATION — prominent */}
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: isActive ? 'rgba(244,114,182,0.18)' : 'rgba(52,211,153,0.18)', color: isActive ? '#db2777' : '#059669' }}>
              {ing.conc}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{meta.why}</p>
          {reasons.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {reasons.map(r => (
                <span key={r} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 text-gray-600">⚠️ {r}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Badge className={`text-[9px] border-none px-1.5 ${isActive ? 'bg-pink-100 text-pink-600' : 'bg-emerald-100 text-emerald-700'}`}>
            {isActive ? 'Active' : 'Support'}
          </Badge>
          <span className="text-[9px] text-gray-400">{ing.timing}</span>
          {isActive && <span className="text-[9px] font-bold text-violet-500">{freqLabel}</span>}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 space-y-2 border-t border-white/50">
              {/* Buy guide */}
              <div className="flex items-start gap-2 rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
                <div>
                  <p className="text-[10px] font-black mb-0.5" style={{ color: meta.color }}>🛒 What to Buy</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{meta.buyTip}</p>
                </div>
              </div>
              {/* Timing info */}
              <div className="flex items-center gap-2 text-[10px] text-gray-500 px-1">
                <span className="font-bold">⏰ When:</span>
                <span>{ing.timing}</span>
                {isActive && <span className="font-bold text-violet-500">· {freqLabel}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ActiveModulesPanel({ modules, currentFreqId, latestAnalysis }) {
  const freqLabel = FREQUENCY_LADDER.find(f => f.id === currentFreqId)?.label || '1×/wk';

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
      <div>
        <p className="font-black text-sm">💊 Your Active Ingredients</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Selected based on your scan · Tap each to see what to buy</p>
      </div>

      {modules.support.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" /> Support Layer — Use Daily
          </p>
          {modules.support.map(key => (
            <ModuleCard key={key} ingKey={key} isActive={false} freqLabel={freqLabel} analysis={latestAnalysis} />
          ))}
        </div>
      )}

      {modules.actives.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-pink-500" /> Active Treatment — {freqLabel}
          </p>
          {modules.actives.map(key => (
            <ModuleCard key={key} ingKey={key} isActive={true} freqLabel={freqLabel} analysis={latestAnalysis} />
          ))}
        </div>
      )}
    </div>
  );
}