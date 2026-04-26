import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';

const OUTCOME_FEATURES = [
  { emoji: '📋', label: 'User Feedback',       desc: 'Daily signals drive frequency & level adjustments in real-time', impact: 'High' },
  { emoji: '⚠️', label: 'R&R Risk',            desc: 'Recovery & Repair risk score halts actives when barrier is compromised', impact: 'Critical' },
  { emoji: '🔢', label: 'Frequency Level',     desc: 'Level 1→3 system controls how many nights actives are applied per week', impact: 'High' },
  { emoji: '⚗️', label: 'Ingredient Conflict', desc: 'Detected conflicts between actives cause automatic routine separation', impact: 'High' },
  { emoji: '⚡', label: 'Trigger Correlation', desc: 'Top trigger patterns trigger frequency reductions and product swaps', impact: 'Medium' },
  { emoji: '🌦️', label: 'Season / Weather',   desc: 'Seasonal mode switches moisturizer weight, SPF level, and exfoliant frequency', impact: 'Medium' },
  { emoji: '📱', label: 'Pages / Access',       desc: 'Features unlocked with usage — more data = smarter recommendations', impact: 'Low' },
];

const IMPACT_STYLE = {
  Critical: 'bg-red-100 text-red-700',
  High:     'bg-amber-100 text-amber-700',
  Medium:   'bg-sky-100 text-sky-700',
  Low:      'bg-gray-100 text-gray-600',
};

export default function OutcomeFeaturesCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-gray-200 overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50">
            <Settings2 className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Outcome Features</p>
            <p className="text-[10px] text-gray-400">What drives your routine changes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{OUTCOME_FEATURES.length} factors</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {OUTCOME_FEATURES.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xl flex-shrink-0">{f.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-black text-gray-800">{f.label}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto ${IMPACT_STYLE[f.impact]}`}>{f.impact}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}