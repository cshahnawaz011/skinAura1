import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sun, Moon, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const TODAY_KEY = () => `routine_tracker_${format(new Date(), 'yyyy-MM-dd')}`;

function CheckItem({ label, tip, isActive, checked, onToggle, color = '#f472b6', index }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onToggle}
      className="w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all"
      style={{
        background: checked
          ? `${color}12`
          : 'rgba(249,250,251,0.8)',
        border: `1.5px solid ${checked ? color + '40' : '#e5e7eb'}`,
      }}
    >
      {/* Checkbox circle */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        style={{
          background: checked ? color : 'white',
          border: `2px solid ${checked ? color : '#d1d5db'}`,
        }}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold transition-all ${checked ? 'line-through opacity-60' : 'opacity-100'}`}
          style={{ color: checked ? color : '#374151' }}>
          {label}
        </p>
        {tip && !checked && (
          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{tip}</p>
        )}
      </div>

      {isActive && (
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 flex-shrink-0 mt-0.5">
          ACTIVE
        </span>
      )}
    </motion.button>
  );
}

export default function RoutineTracker({ routineData }) {
  const [checked, setChecked] = useState({});

  // Load from localStorage on mount & when date changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TODAY_KEY());
      if (saved) setChecked(JSON.parse(saved));
      else setChecked({});
    } catch { setChecked({}); }
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(TODAY_KEY(), JSON.stringify(checked));
    } catch {}
  }, [checked]);

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const resetAll = () => {
    setChecked({});
    localStorage.removeItem(TODAY_KEY());
  };

  if (!routineData) return (
    <div className="text-center py-6 text-sm text-gray-400">
      Generate your routine first to start tracking ✨
    </div>
  );

  // Today's night plan
  const todayDayIndex = (new Date().getDay() + 6) % 7; // Mon=0
  const todayNight = routineData.night_week_plan?.[todayDayIndex];

  // Build morning steps
  const morningSteps = (routineData.morning_routine || []).map((s, i) => ({
    key: `morning_${i}`,
    label: s.name,
    tip: s.tip,
    isActive: false,
  }));

  // Build tonight's steps
  const nightSteps = (todayNight?.steps || []).map((s, i) => ({
    key: `night_${i}`,
    label: s.name,
    tip: s.tip,
    isActive: s.active,
  }));

  const totalSteps = morningSteps.length + nightSteps.length;
  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  const allDone = doneCount >= totalSteps && totalSteps > 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-gray-500">
            {doneCount}/{totalSteps} steps done today
          </p>
          <div className="flex items-center gap-2">
            {allDone && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="text-xs font-black text-amber-500 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Done!
              </motion.span>
            )}
            <button onClick={resetAll}
              className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-gray-100">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ background: allDone ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#f472b6,#a78bfa)' }}
          />
        </div>
      </div>

      {/* All done celebration */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.12),rgba(16,185,129,0.08))', border: '1.5px solid rgba(52,211,153,0.3)' }}>
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-black text-emerald-700 text-sm">Routine Complete!</p>
            <p className="text-xs text-emerald-600 mt-0.5">Your skin is thanking you right now ✨</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Morning Section */}
      {morningSteps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-black text-gray-600 uppercase tracking-wide">Morning Routine</p>
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
              {morningSteps.filter(s => checked[s.key]).length}/{morningSteps.length}
            </span>
          </div>
          <div className="space-y-2">
            {morningSteps.map((step, i) => (
              <CheckItem
                key={step.key}
                index={i}
                label={step.label}
                tip={step.tip}
                isActive={step.isActive}
                checked={!!checked[step.key]}
                onToggle={() => toggle(step.key)}
                color="#f59e0b"
              />
            ))}
          </div>
        </div>
      )}

      {/* Tonight's Night Routine */}
      {nightSteps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-black text-gray-600 uppercase tracking-wide">
              Tonight — {todayNight?.day_label}
            </p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              todayNight?.day_type === 'treatment'
                ? 'bg-violet-100 text-violet-700'
                : todayNight?.day_type === 'recovery'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-sky-100 text-sky-700'
            }`}>
              {todayNight?.day_type}
            </span>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold ml-auto">
              {nightSteps.filter(s => checked[s.key]).length}/{nightSteps.length}
            </span>
          </div>
          {todayNight?.frequency_note && (
            <p className="text-[11px] text-violet-500 font-medium mb-2 px-1">
              📅 {todayNight.frequency_note}
            </p>
          )}
          <div className="space-y-2">
            {nightSteps.map((step, i) => (
              <CheckItem
                key={step.key}
                index={i}
                label={step.label}
                tip={step.tip}
                isActive={step.isActive}
                checked={!!checked[step.key]}
                onToggle={() => toggle(step.key)}
                color="#6366f1"
              />
            ))}
          </div>
        </div>
      )}

      {totalSteps === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">No steps found for today.</p>
      )}
    </div>
  );
}