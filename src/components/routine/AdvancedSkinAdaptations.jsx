import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Droplet, Zap, Wind, Calendar, Heart } from 'lucide-react';

const ADAPTATIONS = [
  {
    id: 'skin_types',
    title: 'By Skin Type',
    emoji: '🧬',
    icon: Droplet,
    color: '#f472b6',
    entries: [
      {
        type: 'Oily/Acne-Prone',
        phase1: 'BHA 0.5-1% 1-2x/week (start with 1x)',
        phaseAdvanced: 'BHA 2%, Retinol 0.5%, Azelaic 10-15% on cycling',
        morning: 'Lightweight Vitamin C 10-15%, minimal oil moisturizer',
        night: 'Night 1 (BHA) is primary, Nights 2-4 lighter formulations',
        caution: 'Avoid heavy oils, thick occlusives. Use gel-based hydrators.',
      },
      {
        type: 'Dry/Sensitive',
        phase1: 'Skip BHA initially, start with retinol 0.1% 1x/week',
        phaseAdvanced: 'BHA 0.5-1% once every 2 weeks, increase hydrators',
        morning: 'Vitamin C 10%, richer moisturizer with ceramides',
        night: 'Prioritize Nights 3-4. Night 1 (BHA) optional, reduce frequency.',
        caution: 'Barrier repair is essential. Never skip Night 3. Consider monthly active-free weeks.',
      },
      {
        type: 'Combination',
        phase1: 'Alternate: BHA 0.5% T-zone 1x/week, retinol cheeks 1x/week',
        phaseAdvanced: 'Zoned approach: BHA T-zone, retinoid rest of face, customized per zone',
        morning: 'Vitamin C 10-15%, lightweight moisturizer, richer on dry zones',
        night: 'Tailor nights: oily zones get Night 1, dry zones get Night 3-4',
        caution: 'Use different products for different zones if possible. Zonally tailor cycling.',
      },
      {
        type: 'Rosacea-Prone',
        phase1: 'Avoid BHA/AHA initially. Start with niacinamide 4-5%, azelaic 5%',
        phaseAdvanced: 'Azelaic 10-15% (gold standard for rosacea), gentle retinol 0.1-0.25%, minimal exfoliation',
        morning: 'Vitamin C 5-10% (lower pH tolerance), azelaic acid, centella asiatica',
        night: 'Emphasize Nights 3-4. Skip or minimize Night 1. Focus on calming.',
        caution: 'Barrier health is critical. Centella Asiatica 5-10% should be daily. Avoid fragrance, alcohol.',
      },
      {
        type: 'Melasma-Prone',
        phase1: 'Niacinamide 2-4%, alpha arbutin 1%, vitamin C 5% (AM only)',
        phaseAdvanced: 'Alpha arbutin 2%, tranexamic acid 3-5% daily, azelaic 15-20%, retinol 0.5%',
        morning: 'Vitamin C 15-20% (powerful for melasma), daily tranexamic acid, SPF 50+ PA++++ non-negotiable',
        night: 'All 4 nights acceptable, but focus on Night 4 (hydration) + tranexamic. Night 1 (BHA) helpful for surface.',
        caution: 'Sun protection is CRITICAL—even slight UV worsens melasma. Use physical blockers + chemical SPF. Monthly facials optional.',
      },
    ],
  },
  {
    id: 'climate',
    title: 'Climate & Environment',
    emoji: '🌍',
    icon: Wind,
    color: '#10b981',
    entries: [
      {
        env: 'Humid Climate (Monsoon, Tropics)',
        adjustments: 'Reduce occlusives. Use lightweight hydrators. BHA 1-2% can increase frequency (less dryness risk). Skip facial oils or use sparingly. Gel moisturizers preferred.',
        summer: 'Vitamin C 10-15%, lightweight serum-based routines, reduced night occlusives',
        actives: 'All actives tolerated well; more frequent cycling acceptable',
        caution: 'Watch for fungal acne (Malassezia). Use salicylic acid helps prevent. Panthenol + niacinamide essential.',
      },
      {
        env: 'Dry Climate (Desert, Winter)',
        adjustments: 'Increase occlusives, richer moisturizers, reduce active frequency (barrier stress from dryness). BHA 0.5-1% only. Hyaluronic acid on damp skin mandatory.',
        winter: 'Add 2-3 extra hydrating layers, facial oils daily, thick creams',
        actives: 'Reduce all actives by 25-50% frequency. Extend barrier repair weeks to 3 weeks.',
        caution: 'Barrier is compromised by environment; avoid over-treating with actives. Add humidifier. Drink more water.',
      },
    ],
  },
  {
    id: 'hormonal',
    title: 'Hormonal Cycle',
    emoji: '🌙',
    icon: Heart,
    color: '#f59e0b',
    entries: [
      {
        phase: 'Menstrual (Days 1-5)',
        hormoneLevel: 'Estrogen & Progesterone lowest',
        skinState: 'Sensitive, barrier compromised, increased dryness',
        routine: 'Minimal actives. Priority: Nights 3-4 (barrier repair, hydration). Skip or reduce Night 1 (BHA). Retinoid only if tolerated.',
        products: 'Niacinamide, ceramides, centella, panthenol, hyaluronic acid',
      },
      {
        phase: 'Follicular (Days 6-14)',
        hormoneLevel: 'Estrogen rising',
        skinState: 'Improving clarity, better barrier tolerance, skin feels resilient',
        routine: 'Safe to do ALL 4 nights at normal frequency. Can introduce higher concentrations gradually.',
        products: 'Full spectrum okay—BHA, retinoid, vitamin C all acceptable',
      },
      {
        phase: 'Ovulation (Day 15)',
        hormoneLevel: 'Estrogen peaks, progesterone rising',
        skinState: 'Most resilient, clearest. Slight sebum increase.',
        routine: 'BEST TIME for aggressive actives if needed. Full cycling, higher concentrations safe.',
        products: 'Peak for testing new products, increasing concentrations, or dual actives (if staggered timing)',
      },
      {
        phase: 'Luteal (Days 16-28)',
        hormoneLevel: 'Progesterone dominates',
        skinState: 'Increased oiliness, breakout risk, gradually increasing sensitivity toward menstruation',
        routine: 'Reduce to 2-3 nights per week initially, ramp down to Night 3-4 focus as period approaches',
        products: 'Maintain BHA/retinoid in early luteal, shift to barrier repair as period nears. Final week: minimal actives.',
      },
    ],
  },
  {
    id: 'seasonal',
    title: 'Seasonal Adjustments',
    emoji: '🌸',
    icon: Calendar,
    color: '#a78bfa',
    entries: [
      {
        season: 'Spring (Increasing sun)',
        temp: 'Warming, UV increasing',
        approach: 'Maintain/increase SPF strength. Begin ramping up actives if winter was reduced. BHA helpful for spring breakouts.',
        routine: 'Add hydration layer if humidity is increasing. Reduce heavy oils if warming.',
      },
      {
        season: 'Summer (Peak UV, Heat, Humidity)',
        temp: 'Hot, humid, intense UV',
        approach: 'SPF 50+ PA++++ non-negotiable, reapply every 2 hours if outdoors. Reduce concentration if heat exacerbates sensitivity. Lightweight formulations only.',
        routine: 'All actives tolerated in humid summer; reduce if dry climate. Evening-only actives preferred (less UV interaction).',
      },
      {
        season: 'Fall (Decreasing UV, Temperature drop)',
        temp: 'Cooling, humidity dropping',
        approach: 'Barrier begins struggling with temperature drop. Reduce actives frequency by 25% as humidity decreases. Begin adding richer moisturizers.',
        routine: 'Transition toward thicker creams, increase occlusives, prepare for winter barrier stress.',
      },
      {
        season: 'Winter (Minimal UV, Dry, Cold)',
        temp: 'Cold, dry, minimal UV',
        approach: 'Reduce ALL actives by 50%—barrier is maximally stressed. Prioritize hydration + barrier repair. BHA 0.5% maximum, 1x/week max. Retinoids 0.1% minimum.',
        routine: 'Nights 3-4 primary. Add humidifier, facial oils daily, richer night moisturizer, extended barrier weeks (1 per month).',
      },
    ],
  },
  {
    id: 'body',
    title: 'Body Zones (Sensitivity Variations)',
    emoji: '👁️',
    icon: Zap,
    color: '#38bdf8',
    entries: [
      {
        zone: 'Neck & Chest',
        sensitivity: 'HIGHER than face (thinner skin, more sensitive)',
        approach: 'Use ONE PHASE LOWER than face. If face is Optimization (Phase 3), neck/chest stays at Build-up (Phase 2).',
        routine: 'Morning: Same Vitamin C, SPF, niacinamide as face. Night: Skip actives on neck; use only hydration + barrier repair serums.',
        products: 'No retinoids, BHA on neck. Peptides, ceramides, centella asiatica okay. Patch test everything here first.',
      },
      {
        zone: 'Eye Area',
        sensitivity: 'EXTREMELY SENSITIVE (paper-thin skin, delicate)',
        approach: 'NEVER use actives (no BHA, AHA, vitamin C, retinoids directly on lids).',
        routine: 'Gentle hydrating toner → Light peptide serum → SPF (careful around eyes) in AM. Night: peptides + ceramides only.',
        products: 'Use dedicated eye creams (thicker, formulated for sensitivity). Avoid retinoids unless a specific retinol eye serum designed for eyes.',
      },
      {
        zone: 'Forehead (Oily)',
        sensitivity: 'Lower; can tolerate higher concentrations',
        approach: 'Can go ONE PHASE HIGHER than rest of face if oily. BHA 2%, retinoid 0.5-1% acceptable',
        routine: 'Same as face but can increase active frequency on T-zone. Consider zonal exfoliation.',
        products: 'Lightweight BHA serum, minimal occlusion, gel-based hydration',
      },
    ],
  },
];

export default function AdvancedSkinAdaptations() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h3 className="font-black text-sm text-gray-800 mb-1">🔧 Advanced Adaptations & Customization</h3>
        <p className="text-xs text-gray-500">Personalize your routine based on your skin type, climate, hormones, and body zones.</p>
      </div>

      {ADAPTATIONS.map((section) => {
        const Icon = section.icon;
        return (
          <motion.div key={section.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="rounded-2xl overflow-hidden cursor-pointer transition-all"
              style={{
                background: `${section.color}08`,
                border: `1.5px solid ${section.color}30`,
                boxShadow: expandedId === section.id ? `0 8px 24px ${section.color}22` : 'none',
              }}
              onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{section.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-black text-sm" style={{ color: section.color }}>
                      {section.title}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className="w-4 h-4 flex-shrink-0 transition-transform"
                  style={{
                    color: section.color,
                    transform: expandedId === section.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </div>

              {/* Expanded Content */}
              <AnimatePresence initial={false}>
                {expandedId === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t"
                    style={{ borderColor: `${section.color}30` }}
                  >
                    <div className="p-4 space-y-3">
                      {section.entries.map((entry, i) => {
                        const entryKey = Object.keys(entry)[0];
                        return (
                          <div key={i} className="p-3 rounded-xl bg-white/50 border border-gray-100 space-y-2">
                            {/* Entry title */}
                            <p className="font-bold text-sm text-gray-800" style={{ color: section.color }}>
                              {entry[entryKey] || Object.values(entry)[0]}
                            </p>

                            {/* Entry details */}
                            <div className="space-y-1.5 text-xs text-gray-700">
                              {Object.entries(entry).map(([key, value]) => {
                                if (key === entryKey) return null;
                                return (
                                  <div key={key} className="flex gap-2">
                                    <span className="font-semibold capitalize text-gray-600 min-w-fit">{key}:</span>
                                    <span className="text-gray-700">{value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}

      {/* Summary note */}
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-200 text-xs text-blue-700">
        <p>
          <strong>Key Principle:</strong> Skincare is not one-size-fits-all. Use these adaptations to customize phases, concentrations, and frequency to YOUR unique skin, environment, and life cycle.
        </p>
      </div>
    </div>
  );
}