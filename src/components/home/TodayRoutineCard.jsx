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
      <div className="ios-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-bold text-gray-900">Today's Routine</p>
            <p className="text-xs text-gray-500 mt-1">{completedCount} of {routineData.morning_routine.length} steps</p>
          </div>
          <Link to="/SkinRoutine">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:shadow-md active:scale-95"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
              <Play className="w-4 h-4" />
              Start
            </button>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-gray-600">Progress</p>
            <p className="text-xs font-bold text-blue-600">{completionPercent}%</p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }} />
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-2">
          {routineData.morning_routine.slice(0, 4).map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs"
                style={{
                  background: i < completedCount ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' : '#e5e7eb',
                  color: i < completedCount ? 'white' : '#6b7280'
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