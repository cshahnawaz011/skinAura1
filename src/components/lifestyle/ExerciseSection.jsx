import React from 'react';
import { Dumbbell } from 'lucide-react';

const SWEAT_LEVELS = ['low', 'medium', 'high'];
const EXERCISE_TYPES = ['Walking', 'Running', 'Yoga', 'HIIT', 'Swimming', 'Cycling', 'Gym', 'Pilates', 'Dance'];

export default function ExerciseSection({ log, updateField }) {
  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'linear-gradient(145deg,#f0fdf4,#dcfce7)', border: '1.5px solid rgba(52,211,153,0.2)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#34d399,#10b981)' }}>
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <p className="font-black text-sm">Exercise & Activity</p>
      </div>

      {/* Did exercise? */}
      <div className="flex gap-2">
        {['yes', 'no'].map(v => (
          <button key={v} onClick={() => updateField('exercise_done', v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              log.exercise_done === v
                ? v === 'yes' ? 'bg-emerald-500 text-white border-transparent' : 'bg-gray-400 text-white border-transparent'
                : 'border-emerald-200 text-emerald-600 bg-white hover:border-emerald-400'
            }`}>{v === 'yes' ? '💪 Yes, Exercised' : '🛋️ Rest Day'}</button>
        ))}
      </div>

      {log.exercise_done === 'yes' && (
        <>
          {/* Duration */}
          <div>
            <label className="text-[10px] font-bold text-emerald-600 mb-1 block">Duration (minutes)</label>
            <div className="flex gap-2 flex-wrap">
              {[15, 30, 45, 60, 90, 120].map(m => (
                <button key={m} onClick={() => updateField('exercise_minutes', m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    log.exercise_minutes === m ? 'bg-emerald-500 text-white border-transparent' : 'border-emerald-200 text-emerald-600 bg-white hover:border-emerald-400'
                  }`}>{m}m</button>
              ))}
              <input type="number" placeholder="custom" value={log.exercise_minutes || ''}
                onChange={e => updateField('exercise_minutes', parseInt(e.target.value) || 0)}
                className="w-20 rounded-xl border border-emerald-200 px-2 py-1.5 text-xs font-bold text-emerald-700 bg-white focus:outline-none focus:border-emerald-400" />
            </div>
          </div>

          {/* Exercise Type */}
          <div>
            <label className="text-[10px] font-bold text-emerald-600 mb-1.5 block">Exercise Type</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {EXERCISE_TYPES.map(t => (
                <button key={t} onClick={() => updateField('exercise_type', t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    log.exercise_type === t ? 'bg-emerald-500 text-white border-transparent' : 'border-emerald-200 text-emerald-600 bg-white hover:border-emerald-400'
                  }`}>{t}</button>
              ))}
            </div>
            <input type="text" placeholder="Or type custom..." value={log.exercise_type_custom || ''}
              onChange={e => updateField('exercise_type_custom', e.target.value)}
              className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-emerald-400" />
          </div>

          {/* Sweating */}
          <div>
            <label className="text-[10px] font-bold text-emerald-600 mb-1.5 block">Sweating Level</label>
            <div className="flex gap-2">
              {SWEAT_LEVELS.map(s => (
                <button key={s} onClick={() => updateField('sweat_level', s)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                    log.sweat_level === s ? 'bg-teal-500 text-white border-transparent' : 'border-teal-200 text-teal-600 bg-white hover:border-teal-400'
                  }`}>{s === 'low' ? '💧' : s === 'medium' ? '💦' : '🌊'} {s}</button>
              ))}
            </div>
          </div>

          {/* Post-workout hygiene */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="post_hygiene" checked={!!log.post_workout_hygiene}
              onChange={e => updateField('post_workout_hygiene', e.target.checked)} className="accent-emerald-500 w-4 h-4" />
            <label htmlFor="post_hygiene" className="text-xs text-emerald-700 font-semibold">✅ Post-workout hygiene done (shower/cleanse)</label>
          </div>
        </>
      )}
    </div>
  );
}