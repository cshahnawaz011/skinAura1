import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Moon, Zap, Leaf, BarChart3 } from 'lucide-react';

const PM_SCHEDULE = [
  {
    night: 'Monday',
    dayType: 'Treatment Night',
    emoji: '🔴',
    active: 'Retinoid (or Exfoliant)',
    focus: 'Cell turnover · Anti-aging',
    steps: [
      { name: 'Gentle Cleanser', detail: 'Remove makeup and sunscreen completely' },
      { name: 'Active Treatment', detail: 'Retinoid, AHA, BHA, or vitamin A derivative—choose ONE' },
      { name: 'Wait 20 min', detail: 'Allow treatment to fully absorb; skip hydrating layers initially' },
      { name: 'Moisturizer', detail: 'Non-irritating, barrier-supportive formula' },
      { name: 'Optional Occlusive', detail: 'Petroleum jelly or rich oil if sensitive' },
    ],
  },
  {
    night: 'Tuesday',
    dayType: 'Recovery Night',
    emoji: '🛡️',
    active: 'None — Hydration Focus',
    focus: 'Barrier repair · Skin adaptation',
    steps: [
      { name: 'Gentle Cleanser', detail: 'Soft cleanse, no actives' },
      { name: 'Hydrating Toner or Essence', detail: 'Hyaluronic acid, glycerin, panthenol' },
      { name: 'Nourishing Serum (optional)', detail: 'Peptides, plant extracts, soothing ingredients' },
      { name: 'Rich Moisturizer', detail: 'Ceramides, cholesterol, fatty acids' },
      { name: 'Occlusive Layer', detail: 'Seal in hydration overnight' },
    ],
  },
  {
    night: 'Wednesday',
    dayType: 'Treatment Night',
    emoji: '🔴',
    active: 'Retinoid (or Exfoliant)',
    focus: 'Cell turnover · Anti-aging',
    steps: [
      { name: 'Gentle Cleanser', detail: 'Remove makeup and sunscreen completely' },
      { name: 'Active Treatment', detail: 'Retinoid, AHA, BHA, or vitamin A derivative—choose ONE' },
      { name: 'Wait 20 min', detail: 'Allow treatment to fully absorb; skip hydrating layers initially' },
      { name: 'Moisturizer', detail: 'Non-irritating, barrier-supportive formula' },
      { name: 'Optional Occlusive', detail: 'Petroleum jelly or rich oil if sensitive' },
    ],
  },
  {
    night: 'Thursday',
    dayType: 'Recovery Night',
    emoji: '🛡️',
    active: 'None — Hydration Focus',
    focus: 'Barrier repair · Skin adaptation',
    steps: [
      { name: 'Gentle Cleanser', detail: 'Soft cleanse, no actives' },
      { name: 'Hydrating Toner or Essence', detail: 'Hyaluronic acid, glycerin, panthenol' },
      { name: 'Nourishing Serum (optional)', detail: 'Peptides, plant extracts, soothing ingredients' },
      { name: 'Rich Moisturizer', detail: 'Ceramides, cholesterol, fatty acids' },
      { name: 'Occlusive Layer', detail: 'Seal in hydration overnight' },
    ],
  },
  {
    night: 'Friday',
    dayType: 'Treatment Night',
    emoji: '🔴',
    active: 'Retinoid (or Exfoliant)',
    focus: 'Cell turnover · Anti-aging',
    steps: [
      { name: 'Gentle Cleanser', detail: 'Remove makeup and sunscreen completely' },
      { name: 'Active Treatment', detail: 'Retinoid, AHA, BHA, or vitamin A derivative—choose ONE' },
      { name: 'Wait 20 min', detail: 'Allow treatment to fully absorb; skip hydrating layers initially' },
      { name: 'Moisturizer', detail: 'Non-irritating, barrier-supportive formula' },
      { name: 'Optional Occlusive', detail: 'Petroleum jelly or rich oil if sensitive' },
    ],
  },
  {
    night: 'Saturday',
    dayType: 'Recovery Night',
    emoji: '🛡️',
    active: 'None — Hydration Focus',
    focus: 'Barrier repair · Skin adaptation',
    steps: [
      { name: 'Gentle Cleanser', detail: 'Soft cleanse, no actives' },
      { name: 'Hydrating Toner or Essence', detail: 'Hyaluronic acid, glycerin, panthenol' },
      { name: 'Nourishing Serum (optional)', detail: 'Peptides, plant extracts, soothing ingredients' },
      { name: 'Rich Moisturizer', detail: 'Ceramides, cholesterol, fatty acids' },
      { name: 'Occlusive Layer', detail: 'Seal in hydration overnight' },
    ],
  },
  {
    night: 'Sunday',
    dayType: 'Rest & Reset',
    emoji: '😴',
    active: 'None — Minimal Routine',
    focus: 'Full skin recovery before week restarts',
    steps: [
      { name: 'Gentle Cleanser', detail: 'Very light cleanse' },
      { name: 'Hydrating Toner', detail: 'Simple hydration' },
      { name: 'Light Moisturizer', detail: 'Barrier support only' },
      { name: 'Sleep Mask (optional)', detail: 'Overnight hydrating or nourishing mask' },
    ],
  },
];

export default function ScienceBasedPMRoutine() {
  const [expanded, setExpanded] = useState(0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Moon className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-black text-gray-900">Evening Routine (PM)</h2>
        <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">7-night cycle</span>
      </div>

      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
        <p className="text-xs font-bold text-indigo-900 mb-1">🌙 Treatment vs Recovery Nights</p>
        <p className="text-xs text-indigo-800 leading-relaxed">
          <strong>Treatment nights (3/week):</strong> Active ingredients like retinoids, AHAs, BHAs to drive cellular change.
          <br />
          <strong>Recovery nights (4/week):</strong> Hydration and barrier support to let skin adapt and heal.
        </p>
      </div>

      {PM_SCHEDULE.map((day, idx) => (
        <motion.div
          key={day.night}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="rounded-2xl overflow-hidden border border-gray-200"
          style={{ background: 'rgba(255,255,255,0.95)' }}
        >
          <button
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all"
          >
            <span className="text-2xl">{day.emoji}</span>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-black text-sm text-gray-900">{day.night}</p>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {day.dayType}
                </span>
              </div>
              <p className="text-xs text-gray-500">{day.focus}</p>
            </div>
            <motion.div animate={{ rotate: expanded === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded === idx && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-gray-100"
              >
                <div className="px-4 py-3 space-y-3">
                  {/* Active highlight */}
                  {day.dayType !== 'Rest & Reset' && (
                    <div className={`p-2.5 rounded-lg ${day.dayType.includes('Treatment') ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: day.dayType.includes('Treatment') ? '#991b1b' : '#065f46' }}>
                        {day.dayType.includes('Treatment') ? '🔴 Treatment Focus' : '🛡️ Recovery Focus'}
                      </p>
                      <p className={`text-xs font-semibold ${day.dayType.includes('Treatment') ? 'text-red-700' : 'text-emerald-700'}`}>
                        {day.active}
                      </p>
                    </div>
                  )}

                  {/* Steps */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Steps</p>
                    {day.steps.map((step, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="font-black text-gray-400 flex-shrink-0">{i + 1}.</span>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800">{step.name}</p>
                          <p className="text-gray-600 text-[11px]">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs font-bold text-amber-900 mb-1">⚠️ Critical Guidelines</p>
        <ul className="text-xs text-amber-800 space-y-1 leading-relaxed">
          <li>• <strong>Never use two actives on the same night</strong> (e.g., retinoid + AHA together).</li>
          <li>• <strong>Patch test first:</strong> Apply treatment to small area for 1 week before full face use.</li>
          <li>• <strong>Start low, go slow:</strong> Begin with lowest concentration, lowest frequency (2x/week).</li>
          <li>• <strong>Stop if irritated:</strong> Red, burning, peeling beyond normal—skip treatment for 1 week, then restart at lower frequency.</li>
        </ul>
      </div>
    </div>
  );
}