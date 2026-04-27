import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Droplets, Shield, Zap } from 'lucide-react';

const AM_STEPS = [
  {
    step: 1,
    name: 'Gentle Cleanser',
    emoji: '💧',
    purpose: 'Remove overnight oils and prepare skin',
    actives: null,
    duration: '30 seconds',
    tip: 'Use lukewarm water, avoid over-stripping',
    examples: ['Micellar water', 'Gentle gel cleanser', 'Oil-based cleanser'],
    icon: Droplets,
  },
  {
    step: 2,
    name: 'Antioxidant Support',
    emoji: '✨',
    purpose: 'Environmental protection and free radical defense',
    actives: ['Vitamin C (L-ascorbic acid)', 'Ferulic acid', 'Vitamin E'],
    concentration: '10-20% Vitamin C',
    duration: 'Allow 1-2 min to dry',
    tip: 'Apply to damp skin for better absorption. Stabilize with Vitamin E + ferulic acid',
    examples: ['Vitamin C serum', 'Ascorbyl tetraisopalmitate', 'Kakadu plum extract'],
    icon: Zap,
  },
  {
    step: 3,
    name: 'Hydrating Layer',
    emoji: '💦',
    purpose: 'Deliver humectants and prepare for moisturizer',
    actives: ['Hyaluronic acid', 'Glycerin', 'Panthenol'],
    concentration: '1-3% hyaluronic acid',
    duration: 'Light spritz or toner',
    tip: 'Apply to still-damp skin to maximize humectant function',
    examples: ['Hydrating toner', 'Essence', 'Hydrating serum'],
    icon: Droplets,
  },
  {
    step: 4,
    name: 'Moisturizer',
    emoji: '🛡️',
    purpose: 'Lock in hydration and restore barrier function',
    actives: ['Ceramides', 'Cholesterol', 'Fatty acids', 'Peptides'],
    duration: 'While skin is still slightly damp',
    tip: 'Press into skin, do not rub. Avoid heavy occlusives in AM if you have oily skin',
    examples: ['Lightweight gel moisturizer', 'Hydrating lotion', 'Cream'],
    icon: Shield,
  },
  {
    step: 5,
    name: 'Daily Sunscreen (SPF 30+)',
    emoji: '☀️',
    purpose: 'Photoprotection—most critical anti-aging step',
    actives: ['UVA/UVB filters (mineral or chemical)'],
    concentration: 'Apply generously (1/4 tsp for face)',
    duration: 'Wait 10-15 min before sun exposure',
    tip: 'Reapply every 2 hours if outdoors. Non-negotiable.',
    examples: ['Mineral sunscreen', 'Chemical sunscreen', 'Hybrid SPF'],
    icon: Sun,
  },
];

export default function ScienceBasedAMRoutine() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-black text-gray-900">Morning Routine (AM)</h2>
        <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">5 minutes</span>
      </div>

      {AM_STEPS.map((step, idx) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl p-4 border border-gray-200"
            style={{ background: 'rgba(255,255,255,0.95)' }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-100">
                <span className="text-lg">{step.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-black text-gray-400">STEP {step.step}</span>
                  <p className="font-black text-sm text-gray-900">{step.name}</p>
                </div>
                <p className="text-xs text-gray-500">{step.purpose}</p>
              </div>
              <Icon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-[10px]">
                <span className="font-black text-gray-400 uppercase tracking-wider">Duration</span>
                <p className="text-gray-700 font-semibold">{step.duration}</p>
              </div>
              {step.concentration && (
                <div className="text-[10px]">
                  <span className="font-black text-gray-400 uppercase tracking-wider">Concentration</span>
                  <p className="text-gray-700 font-semibold">{step.concentration}</p>
                </div>
              )}
              {step.actives && (
                <div className="text-[10px] col-span-2">
                  <span className="font-black text-gray-400 uppercase tracking-wider">Key Actives</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {step.actives.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-2">
              <p className="text-xs text-gray-600 font-semibold mb-1">💡 Pro Tip</p>
              <p className="text-xs text-gray-600">{step.tip}</p>
            </div>

            {step.examples && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Examples</p>
                <div className="flex flex-wrap gap-1">
                  {step.examples.map((ex, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-xs font-bold text-blue-900 mb-1">🔬 Why This Order Matters</p>
        <p className="text-xs text-blue-800 leading-relaxed">
          Cleanser → Antioxidant (stabilizing pH) → Hydrating layer (locks in essence) → Moisturizer (final seal) → SPF (protection). 
          Wait 1-2 minutes between each step for absorption. This layering maximizes efficacy and prevents product pilling.
        </p>
      </div>
    </div>
  );
}