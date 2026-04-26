import React from 'react';
import { Sparkles, Wine } from 'lucide-react';

export default function HabitsSection({ log, updateField }) {
  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'linear-gradient(145deg,#fdf4ff,#fae8ff)', border: '1.5px solid rgba(168,85,247,0.2)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <p className="font-black text-sm">Habits & Routine</p>
      </div>

      {/* Skincare routine */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-purple-500 block">Skincare Routine</label>
        {[
          { field: 'skincare_done_morning', label: '☀️ Morning Routine Done' },
          { field: 'skincare_done_night', label: '🌙 Night Routine Done' },
        ].map(({ field, label }) => (
          <label key={field} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!log[field]} onChange={e => updateField(field, e.target.checked)}
              className="accent-purple-500 w-4 h-4" />
            <span className="text-sm text-purple-700 font-semibold">{label}</span>
          </label>
        ))}
      </div>

      {/* Late night habits */}
      <div>
        <label className="text-[10px] font-bold text-purple-500 mb-1 block">🌛 Late-night habits stopped before 10PM?</label>
        <div className="flex gap-2">
          {['yes', 'no'].map(v => (
            <button key={v} onClick={() => updateField('late_night_stopped', v)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                log.late_night_stopped === v
                  ? v === 'yes' ? 'bg-purple-500 text-white border-transparent' : 'bg-red-400 text-white border-transparent'
                  : 'border-purple-200 text-purple-600 bg-white hover:border-purple-400'
              }`}>{v === 'yes' ? '✅ Yes' : '❌ No'}</button>
          ))}
        </div>
      </div>

      {/* Smoking */}
      <div>
        <label className="text-[10px] font-bold text-purple-500 mb-1 block">🚬 Smoking</label>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['yes', 'no'].map(v => (
              <button key={v} onClick={() => updateField('smoked', v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  log.smoked === v ? (v === 'yes' ? 'bg-red-500 text-white border-transparent' : 'bg-emerald-500 text-white border-transparent') : 'border-purple-200 text-purple-600 bg-white'
                }`}>{v === 'yes' ? '🚬 Yes' : '✅ No'}</button>
            ))}
          </div>
          {log.smoked === 'yes' && (
            <input type="number" min="1" max="50" placeholder="qty" value={log.cigarettes_count || ''}
              onChange={e => updateField('cigarettes_count', parseInt(e.target.value) || 0)}
              className="w-16 rounded-xl border border-purple-200 px-2 py-1.5 text-xs bg-white focus:outline-none" />
          )}
        </div>
      </div>

      {/* Alcohol */}
      <div>
        <label className="text-[10px] font-bold text-purple-500 mb-1 block">🍷 Alcohol</label>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['yes', 'no'].map(v => (
              <button key={v} onClick={() => updateField('drank_alcohol', v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  log.drank_alcohol === v ? (v === 'yes' ? 'bg-red-500 text-white border-transparent' : 'bg-emerald-500 text-white border-transparent') : 'border-purple-200 text-purple-600 bg-white'
                }`}>{v === 'yes' ? '🍷 Yes' : '✅ No'}</button>
            ))}
          </div>
          {log.drank_alcohol === 'yes' && (
            <input type="number" min="1" max="20" placeholder="drinks" value={log.alcohol_drinks || ''}
              onChange={e => updateField('alcohol_drinks', parseInt(e.target.value) || 0)}
              className="w-20 rounded-xl border border-purple-200 px-2 py-1.5 text-xs bg-white focus:outline-none" />
          )}
        </div>
      </div>

      {/* Coffee */}
      <div>
        <label className="text-[10px] font-bold text-purple-500 mb-1 block">☕ Coffee Cups</label>
        <div className="flex items-center gap-2">
          <button onClick={() => updateField('coffee_cups', Math.max(0, (log.coffee_cups || 0) - 1))}
            className="w-7 h-7 rounded-full bg-white border border-purple-200 text-purple-600 font-black flex items-center justify-center">−</button>
          <span className="text-xl font-black text-purple-600 w-8 text-center">{log.coffee_cups || 0}</span>
          <button onClick={() => updateField('coffee_cups', (log.coffee_cups || 0) + 1)}
            className="w-7 h-7 rounded-full bg-white border border-purple-200 text-purple-600 font-black flex items-center justify-center">+</button>
        </div>
      </div>
    </div>
  );
}