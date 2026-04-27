import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const INGREDIENTS = [
  {
    name: 'Salicylic Acid (BHA)',
    benefit: 'Oil-soluble exfoliation, acne control',
    phase1: '0.5%',
    phase2: '1%',
    phase3: '1.5%',
    phase4Max: '2%',
    optimalPh: '3.0-4.0',
    frequency: 'Start 1x/week, increase to 2-3x weekly',
    waitTime: '5-10 min',
    caution: 'Never with retinoids same night. Not for very dry skin initially.',
  },
  {
    name: 'L-Ascorbic Acid (Vitamin C)',
    benefit: 'Antioxidant, brightening, collagen synthesis',
    phase1: 'N/A',
    phase2: '5%',
    phase3: '10-15%',
    phase4Max: '15-20%',
    optimalPh: '<3.5 (critical)',
    frequency: 'Morning only, daily',
    waitTime: '5 min dry skin',
    caution: 'Must be <pH 3.5. Never with copper peptides. Store in cool/dark. Unstable at night.',
  },
  {
    name: 'Retinol',
    benefit: 'Anti-aging, cell turnover, texture',
    phase1: '0.1%',
    phase2: '0.25-0.5%',
    phase3: '0.5-0.75%',
    phase4Max: '0.75-1%',
    optimalPh: 'N/A (stable pH-independent)',
    frequency: 'Start 1x/week, build to 3-5x weekly',
    waitTime: '15-20 min',
    caution: 'Never with BHA/AHA same night. Start low—retinization takes 2-4 weeks. Expect mild peeling.',
  },
  {
    name: 'Retinal',
    benefit: 'Stronger than retinol, faster results',
    phase1: 'N/A',
    phase2: 'N/A',
    phase3: '0.01-0.05%',
    phase4Max: '0.05-0.1%',
    optimalPh: 'N/A',
    frequency: '2-3x weekly in Phase 3+',
    waitTime: '15-20 min',
    caution: 'Stronger than retinol—more irritation risk. Skip if retinol irritates.',
  },
  {
    name: 'Azelaic Acid',
    benefit: 'Anti-inflammatory, antibacterial, melasma treatment',
    phase1: 'N/A',
    phase2: '5%',
    phase3: '10-15%',
    phase4Max: '15-20%',
    optimalPh: '3.5-4.5',
    frequency: 'Start 1-2x/week, increase to 3-5x weekly',
    waitTime: '3-5 min',
    caution: 'Less irritating than BHA/AHA. Good for rosacea. Can combine with other actives if staggered timing.',
  },
  {
    name: 'Niacinamide',
    benefit: 'Barrier repair, sebum control, pore minimization',
    phase1: '2%',
    phase2: '4-5%',
    phase3: '5%',
    phase4Max: '10%',
    optimalPh: '6.0-7.0',
    frequency: 'Daily, can use with any active',
    waitTime: '1-2 min',
    caution: 'Plays well with others. Minimal irritation. Can be used all phases/daily.',
  },
  {
    name: 'Hyaluronic Acid (Multi-weight)',
    benefit: 'Hydration, plumping, barrier support',
    phase1: '0.5-1%',
    phase2: '1-1.5%',
    phase3: '1.5-2%',
    phase4Max: '2%+',
    optimalPh: 'Neutral (5-7)',
    frequency: 'Daily, morning and night',
    waitTime: 'Apply to damp skin, 1 min dry',
    caution: 'APPLY TO DAMP SKIN for max efficacy. Multi-weight (1kDa, 10kDa, 1000kDa) ideal.',
  },
  {
    name: 'Peptides (General)',
    benefit: 'Barrier repair, stimulates collagen',
    phase1: 'N/A',
    phase2: '0.1-0.3%',
    phase3: '0.5-1%',
    phase4Max: '1-1.5%',
    optimalPh: 'N/A (pH-stable)',
    frequency: 'Daily in Night 3 (barrier repair)',
    waitTime: '2-3 min',
    caution: 'Works synergistically with ceramides. Safe to layer with anything except acids on same step.',
  },
  {
    name: 'Copper Peptides',
    benefit: 'Anti-aging, skin renewal, wound healing',
    phase1: 'N/A',
    phase2: 'N/A',
    phase3: '0.3-0.5%',
    phase4Max: '0.5-1.5%',
    optimalPh: '5.5-7.0',
    frequency: 'Night 3 only, 2-3x weekly',
    waitTime: '3-5 min',
    caution: 'NEVER combine with L-Ascorbic Acid—copper carbonate forms, reduces efficacy. Use separate from Vitamin C.',
  },
  {
    name: 'Matrixyl (Palmitoyl Pentapeptide)',
    benefit: 'Collagen stimulation, anti-wrinkle',
    phase1: 'N/A',
    phase2: 'N/A',
    phase3: '1-2%',
    phase4Max: '3-5%',
    optimalPh: 'N/A',
    frequency: 'Night 3 (barrier repair), 3-5x weekly',
    waitTime: '2 min',
    caution: 'Gentle, pairs well with ceramides and niacinamide. No contraindications.',
  },
  {
    name: 'Alpha Arbutin',
    benefit: 'Brightening, melasma treatment, hyperpigmentation',
    phase1: 'N/A',
    phase2: 'N/A',
    phase3: '1%',
    phase4Max: '2%',
    optimalPh: 'Neutral (5-7)',
    frequency: 'Morning daily + Night 4',
    waitTime: '1-2 min',
    caution: 'Slow results (8-12 weeks). Use with SPF. Combine with vitamin C for synergy.',
  },
  {
    name: 'Tranexamic Acid',
    benefit: 'Anti-inflammatory, brightening, anti-redness',
    phase1: 'N/A',
    phase2: 'N/A',
    phase3: '2-3%',
    phase4Max: '3-5%',
    optimalPh: '3.5-4.5',
    frequency: 'Daily, morning and night',
    waitTime: '2-3 min',
    caution: 'Gentle, pairs well with all actives. Can be used daily even with retinoids.',
  },
  {
    name: 'Ceramides (NP, AP, EOP)',
    benefit: 'Barrier repair, moisture retention',
    phase1: '1-2%',
    phase2: '3-5%',
    phase3: '5%+',
    phase4Max: '5%+',
    optimalPh: 'Neutral (5-7)',
    frequency: 'Daily in moisturizer and barrier repair',
    waitTime: '2-3 min',
    caution: 'Non-irritating. Essential for barrier health. Use at all phases.',
  },
  {
    name: 'Centella Asiatica',
    benefit: 'Calming, anti-inflammatory, barrier strengthening',
    phase1: '2-3%',
    phase2: '3-5%',
    phase3: '5-10%',
    phase4Max: '5-10%',
    optimalPh: 'Neutral (5-7)',
    frequency: 'Daily, especially night',
    waitTime: '1-2 min',
    caution: 'Very gentle, safe for all skin types. Use daily, especially for sensitive/rosacea-prone skin.',
  },
  {
    name: 'Panthenol (Pro-Vitamin B5)',
    benefit: 'Hydration, soothing, barrier support',
    phase1: '2-3%',
    phase2: '3-5%',
    phase3: '5%',
    phase4Max: '5%+',
    optimalPh: 'Neutral (5-7)',
    frequency: 'Daily in moisturizer',
    waitTime: '1-2 min',
    caution: 'Non-irritating, pairs with everything. Especially soothing after actives.',
  },
];

export default function IngredientProgressionChart() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h3 className="font-black text-sm text-gray-800 mb-1">📊 Ingredient Concentration Progression</h3>
        <p className="text-xs text-gray-500">Minimum → Maximum safe home-use concentrations across 4 phases</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-200">
        <div className="text-center">
          <p className="text-[10px] font-black text-pink-600 uppercase">Phase 1</p>
          <p className="text-[9px] text-pink-500">Weeks 1-4</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-amber-600 uppercase">Phase 2</p>
          <p className="text-[9px] text-amber-500">Weeks 5-8</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-pink-600 uppercase">Phase 3</p>
          <p className="text-[9px] text-pink-500">Weeks 9-16</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-blue-600 uppercase">Phase 4</p>
          <p className="text-[9px] text-blue-500">4+ Months</p>
        </div>
      </div>

      <div className="space-y-2">
        {INGREDIENTS.map((ing, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
            <div
              className="rounded-xl overflow-hidden cursor-pointer transition-all border bg-white/60 hover:shadow-md"
              style={{ borderColor: expandedId === idx ? '#f472b6' : '#e5e7eb' }}
              onClick={() => setExpandedId(expandedId === idx ? null : idx)}
            >
              {/* Collapsed */}
              <div className="p-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800">{ing.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{ing.benefit}</p>
                </div>

                {/* Phase badges */}
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">{ing.phase1}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{ing.phase2}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">{ing.phase3}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{ing.phase4Max}</span>
                </div>

                <ChevronDown
                  className="w-4 h-4 ml-2 flex-shrink-0 text-gray-400 transition-transform"
                  style={{ transform: expandedId === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </div>

              {/* Expanded */}
              {expandedId === idx && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-red-50">
                      <p className="text-[9px] font-black text-red-600 uppercase mb-1">Optimal pH</p>
                      <p className="text-red-700 font-semibold">{ing.optimalPh}</p>
                    </div>
                    <div className="p-2 rounded bg-blue-50">
                      <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Wait Time</p>
                      <p className="text-blue-700 font-semibold">{ing.waitTime}</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-gray-50 text-xs text-gray-700 space-y-1">
                    <p>
                      <strong>Frequency:</strong> {ing.frequency}
                    </p>
                    <p>
                      <strong>⚠️ Caution:</strong> {ing.caution}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-[11px] text-purple-800 space-y-1">
        <p>
          <strong>Key Rules:</strong>
        </p>
        <ul className="list-disc list-inside space-y-0.5 text-purple-700">
          <li>Phase progression is minimum 4 weeks per phase</li>
          <li>Never skip phases; repeat current phase if irritation occurs</li>
          <li>Change only ONE variable (concentration OR frequency) every 2 weeks</li>
          <li>Always patch test when increasing concentration</li>
          <li>Maintain barrier health with Phase-appropriate barrier repair weeks</li>
        </ul>
      </div>
    </div>
  );
}