import React from 'react';
import { motion } from 'framer-motion';
import { INGREDIENT_REGISTRY, FREQUENCY_LADDER } from '@/lib/adaptiveRoutineEngine';

const today = new Date().getDay(); // 0=Sun
const DAY_MAP = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

export default function WeeklyAdaptiveSchedule({ schedule = [], activeModules = [], frequencyId = '1x' }) {
  const freq = FREQUENCY_LADDER.find(f => f.id === frequencyId) || FREQUENCY_LADDER[1];

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(167,139,250,0.2)', boxShadow: '0 4px 20px rgba(167,139,250,0.08)' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-black text-sm text-gray-800">🗓 Weekly Adaptive Schedule</p>
          <p className="text-[10px] text-gray-400">Auto-generated from feedback · {freq.label}</p>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{freq.label}</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {schedule.map((day, i) => {
          const isToday = DAY_MAP[day.day] === today;
          const hasActive = day.isTreatment;

          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center gap-1 py-2 rounded-xl text-center"
              style={{
                background: isToday ? 'rgba(244,114,182,0.15)' : hasActive ? 'rgba(167,139,250,0.1)' : 'rgba(0,0,0,0.03)',
                border: isToday ? '1.5px solid #f472b6' : '1.5px solid transparent',
              }}
            >
              <span className="text-[9px] font-black text-gray-500">{day.day}</span>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                style={{ background: hasActive ? 'rgba(167,139,250,0.2)' : 'rgba(0,0,0,0.05)' }}>
                {hasActive ? '⚗️' : '💧'}
              </div>
              <span className="text-[8px] font-bold" style={{ color: hasActive ? '#a78bfa' : '#9ca3af' }}>
                {hasActive ? 'Active' : 'Recovery'}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Module legend */}
      {activeModules.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Active Nights Use:</p>
          <div className="flex flex-wrap gap-1.5">
            {activeModules.map(key => {
              const ing = INGREDIENT_REGISTRY[key];
              if (!ing) return null;
              return (
                <span key={key} className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-100 text-violet-700">
                  {ing.name} {ing.conc}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-2.5 flex gap-3 text-[9px] text-gray-400">
        <span className="flex items-center gap-1"><span>⚗️</span> Treatment night</span>
        <span className="flex items-center gap-1"><span>💧</span> Recovery (base only)</span>
      </div>
    </div>
  );
}