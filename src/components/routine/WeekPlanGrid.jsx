import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import StepProductPicker from './StepProductPicker';

const TYPE_STYLE = {
  treatment: {
    border: 'border-violet-300 dark:border-violet-700',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    grad: 'from-violet-500 to-purple-500',
    label: '💊 Treatment',
  },
  recovery: {
    border: 'border-emerald-300 dark:border-emerald-700',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    grad: 'from-emerald-400 to-teal-500',
    label: '🌿 Recovery',
  },
  hydration: {
    border: 'border-blue-300 dark:border-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    grad: 'from-blue-400 to-cyan-500',
    label: '💧 Hydration',
  },
};

const LEVEL_COLORS = {
  'Level 1': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Level 2': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Level 3': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function WeekPlanGrid({ weekPlan, userEmail }) {
  const todayIndex = new Date().getDay();
  const todayDayIndex = (todayIndex + 6) % 7;

  // selectedProducts[dayIndex][stepIndex] = product object or null
  const [selectedProducts, setSelectedProducts] = useState({});
  const [country, setCountry] = useState('IN');

  const setProduct = (dayIdx, stepIdx, product) => {
    setSelectedProducts(prev => ({
      ...prev,
      [dayIdx]: { ...(prev[dayIdx] || {}), [stepIdx]: product },
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {(weekPlan || []).map((day, i) => {
        const type = day.day_type || 'recovery';
        const style = TYPE_STYLE[type] || TYPE_STYLE.recovery;
        const isToday = i === todayDayIndex;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative rounded-2xl border-2 p-4 ${style.border} ${style.bg} ${
              isToday ? 'ring-2 ring-pink-400 ring-offset-1 shadow-lg' : ''
            }`}
          >
            {isToday && (
              <span className="absolute -top-2.5 right-4 text-xs font-bold px-3 py-0.5 rounded-full bg-pink-500 text-white shadow">
                ⭐ TODAY
              </span>
            )}

            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${style.grad} flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5`}>
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <p className="font-bold text-sm">{day.day_label || `Day ${i + 1}`}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{style.label}</span>
                  {day.active_name && (
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                      • {day.active_name}
                    </span>
                  )}
                  {day.concentration_level && (
                    <Badge className={`text-xs ml-auto ${LEVEL_COLORS[day.concentration_level] || LEVEL_COLORS['Level 1']}`}>
                      {day.concentration_level}
                    </Badge>
                  )}
                </div>

                {/* Frequency note for treatment days */}
                {day.day_type === 'treatment' && day.frequency_note && (
                  <p className="text-[11px] text-violet-600 dark:text-violet-400 mb-2 font-medium">
                    📅 {day.frequency_note}
                  </p>
                )}

                {/* Steps + product picker */}
                <div className="space-y-3">
                  {(day.steps || []).map((step, si) => {
                    const pickedProduct = selectedProducts[i]?.[si] || null;
                    return (
                      <div key={si} className="rounded-xl bg-white/50 dark:bg-white/5 p-2.5 border border-white/60 dark:border-white/10">
                        {/* Step header */}
                        <div className="flex items-start gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
                            {si + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-gray-800 dark:text-gray-200">{step.name}</span>
                              {step.active && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0">
                                  Active
                                </Badge>
                              )}
                            </div>
                            {/* Timing info if present */}
                            {(step.apply_time || step.wait_time) && (
                              <div className="flex gap-3 mt-0.5 text-[10px] text-gray-400">
                                {step.apply_time && <span>⏱ Apply: {step.apply_time}</span>}
                                {step.wait_time && <span>⏳ Wait: {step.wait_time}</span>}
                              </div>
                            )}
                            {step.tip && (
                              <p className="text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{step.tip}</p>
                            )}
                          </div>
                        </div>

                        {/* Product picker */}
                        <StepProductPicker
                          stepName={step.name}
                          stepType={day.day_type}
                          country={country}
                          onCountryChange={setCountry}
                          selectedProduct={pickedProduct}
                          userEmail={userEmail}
                          onProductSelect={(p) => setProduct(i, si, p)}
                        />

                        {/* Selected product quick-info bar */}
                        {pickedProduct && (
                          <div className="mt-2 p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 text-[10px] flex flex-wrap gap-3">
                            {pickedProduct.apply_time && <span>⏱ Apply: <strong>{pickedProduct.apply_time}</strong></span>}
                            {pickedProduct.wait_time && <span>⏳ Wait: <strong>{pickedProduct.wait_time}</strong></span>}
                            {pickedProduct.price_local && <span>💰 <strong>{pickedProduct.price_local}</strong></span>}
                            {pickedProduct.availability && <span>📍 {pickedProduct.availability}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}