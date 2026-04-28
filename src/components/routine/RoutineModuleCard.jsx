import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, Clock, Zap, Info } from 'lucide-react';
import { INGREDIENT_REGISTRY } from '@/lib/adaptiveRoutineEngine';

const CATEGORY_STYLES = {
  support:       { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  emoji: '🛡️' },
  acne:          { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   emoji: '🔴' },
  pigmentation:  { color: '#f97316', bg: 'rgba(249,115,22,0.1)', emoji: '🎯' },
  renewal:       { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', emoji: '✨' },
  antioxidant:   { color: '#facc15', bg: 'rgba(250,204,21,0.1)',  emoji: '⚡' },
};

export default function RoutineModuleCard({ step, isActive = false, isBase = false }) {
  const [open, setOpen] = useState(false);

  // Find ingredient info if this is an active
  const ingredientKey = step.ingredientKey;
  const ingredient = ingredientKey ? INGREDIENT_REGISTRY[ingredientKey] : null;
  const catStyle = ingredient ? CATEGORY_STYLES[ingredient.category] : CATEGORY_STYLES.support;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: isActive ? `${catStyle?.color || '#f472b6'}08` : 'rgba(255,255,255,0.96)',
        border: `1.5px solid ${isActive ? catStyle?.color + '40' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: isActive ? `0 4px 16px ${catStyle?.color}18` : '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Step number or emoji */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
          style={{ background: isBase ? 'rgba(244,114,182,0.12)' : catStyle?.bg || 'rgba(167,139,250,0.1)' }}>
          {step.emoji || (isBase ? '🌿' : catStyle?.emoji || '💊')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-gray-800 truncate">{step.name}</p>
            {ingredient && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: catStyle?.bg, color: catStyle?.color }}>
                {ingredient.conc}
              </span>
            )}
            {isBase && <span className="text-[9px] text-emerald-600 font-black bg-emerald-100 px-1.5 py-0.5 rounded-full flex-shrink-0">BASE</span>}
          </div>
          <p className="text-[10px] text-gray-400 truncate">{step.type || step.product_type}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {step.timing && (
            <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{step.timing}</span>
            </div>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-3.5 pt-2.5 space-y-2">
              {step.tip && (
                <div className="flex gap-2 text-xs text-gray-600">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{step.tip}</span>
                </div>
              )}
              {(step.ingredients || step.key_ingredients)?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Key Ingredients</p>
                  <div className="flex flex-wrap gap-1">
                    {(step.ingredients || step.key_ingredients).map((ing, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              {ingredient && (
                <div className="flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg" style={{ background: catStyle?.bg }}>
                  <Zap className="w-3 h-3" style={{ color: catStyle?.color }} />
                  <span style={{ color: catStyle?.color }} className="font-semibold">Fixed concentration: {ingredient.conc} — frequency adapts, concentration stays the same</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}