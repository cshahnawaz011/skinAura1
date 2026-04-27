import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const LEVELS = [
  { level: 'Level 1', tag: '1–2x/wk', emoji: '🟢', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', examples: ['Retinol 0.025–0.1%', 'BHA 1–2%', 'AHA 5–8%', 'BP 2.5%'] },
  { level: 'Level 2', tag: '3–4x/wk', emoji: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', examples: ['Retinol 0.025–0.1% (same)', 'BHA 1–2% (same)', 'AHA 5–8% (same)', 'BP 2.5% (same)'] },
  { level: 'Level 3', tag: '5–7x/wk', emoji: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', examples: ['Retinol ↑ discuss derm', 'BHA 1–2%', 'AHA up to 10%', 'BP 2.5%'] },
];

export default function CompactLevelGuide({ currentLevel }) {
  const [open, setOpen] = useState(false);
  const active = LEVELS.find(l => l.level === currentLevel) || LEVELS[0];

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all">
        {/* Current level pill */}
        <div className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-black text-white"
          style={{ background: active.color }}>
          {active.emoji} {active.level}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-black text-gray-700 dark:text-gray-200">Frequency &amp; Concentration Guide</p>
          <p className="text-[10px] text-gray-400">{active.tag} treatment nights · tap to expand all levels</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50">
              {LEVELS.map((lvl) => {
                const isActive = lvl.level === currentLevel;
                return (
                  <div key={lvl.level} className="rounded-xl p-3 transition-all"
                    style={{ background: lvl.bg, border: `1.5px solid ${isActive ? lvl.color : lvl.border}`, boxShadow: isActive ? `0 0 0 2px ${lvl.color}30` : 'none' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{lvl.emoji}</span>
                      <span className="font-black text-xs" style={{ color: lvl.color }}>{lvl.level}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: lvl.color }}>{lvl.tag}</span>
                      {isActive && <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-500 text-white">← You</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {lvl.examples.map((ex, i) => (
                        <div key={i} className="text-[10px] text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: lvl.color }} />
                          {ex}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Quick rules */}
              <div className="rounded-xl p-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700">
                <p className="text-[10px] font-black text-violet-700 dark:text-violet-300 mb-1">⚡ Auto-Adjustment Rules</p>
                <div className="space-y-0.5 text-[10px] text-gray-600 dark:text-gray-400">
                  <p>✅ 7 positive days → Level 1→2 &nbsp; ✅ 21 days → Level 3</p>
                  <p>⚠️ Mild damage → −1 night/week &nbsp; 🚨 High damage → Recovery mode</p>
                  <p>❌ NEVER raise frequency + concentration together</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}