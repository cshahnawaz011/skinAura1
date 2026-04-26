import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, ChevronRight } from 'lucide-react';

export default function TodayRoutineCard({ routineData, todayName }) {
  if (!routineData?.morning_routine || routineData.morning_routine.length === 0) return null;

  const completedCount = Math.floor(routineData.morning_routine.length * 0.6); // Mock completion
  const completionPercent = Math.round((completedCount / routineData.morning_routine.length) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
      <div className="p-6 rounded-3xl backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(248,250,255,0.9) 100%)',
          border: '1px solid rgba(59,130,246,0.15)',
          boxShadow: '0 8px 32px rgba(59,130,246,0.06)'
        }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-bold text-gray-900">Today's Routine</p>
            <p className="text-xs text-gray-500 mt-1">{completedCount} of {routineData.morning_routine.length} steps</p>
          </div>
          <Link to="/SkinRoutine">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:shadow-md active:scale-95"
              style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)', boxShadow: '0 4px 12px rgba(244,114,182,0.2)' }}>
              <Play className="w-4 h-4" />
              Start
            </button>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2.5">
            <p className="text-xs font-semibold text-gray-600">Progress</p>
            <p className="text-xs font-bold text-pink-500">{completionPercent}%</p>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(244,114,182,0.1)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #f472b6 0%, #a78bfa 100%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }} />
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-2.5">
          {routineData.morning_routine.slice(0, 4).map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl transition-all"
              style={{
                background: i < completedCount ? 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(196,181,253,0.1))' : 'rgba(0,0,0,0.02)',
                border: i < completedCount ? '1px solid rgba(244,114,182,0.15)' : '1px solid rgba(0,0,0,0.05)'
              }}>
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs"
                style={{
                  background: i < completedCount ? 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)' : '#f0f0f0',
                  color: i < completedCount ? 'white' : '#9ca3af'
                }}>
                {i < completedCount ? '✓' : i + 1}
              </div>
              <p className={`flex-1 text-sm ${i < completedCount ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                {step.name}
              </p>
            </div>
          ))}
        </div>

        {routineData.morning_routine.length > 4 && (
          <p className="text-xs text-gray-500 text-center mt-3">+{routineData.morning_routine.length - 4} more steps</p>
        )}
      </div>
    </motion.div>
  );
}