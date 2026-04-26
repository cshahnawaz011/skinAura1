import React from 'react';
import { Brain } from 'lucide-react';

const MOOD_OPTIONS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'bad', emoji: '😔', label: 'Bad' },
  { value: 'rough', emoji: '😫', label: 'Rough' },
];

export default function StressSection({ log, updateField }) {
  const stress = log.stress_level || 0;
  const stressColor = stress <= 3 ? '#10b981' : stress <= 6 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'linear-gradient(145deg,#fffbeb,#fef3c7)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
          <Brain className="w-5 h-5 text-white" />
        </div>
        <p className="font-black text-sm">Stress & Recovery</p>
        {stress > 0 && (
          <span className="ml-auto text-xl font-black" style={{ color: stressColor }}>{stress}/10</span>
        )}
      </div>

      {/* Stress scale 1-10 */}
      <div>
        <label className="text-[10px] font-bold text-amber-600 mb-2 block">Stress Level (1 = calm, 10 = extreme)</label>
        <div className="flex gap-1 flex-wrap">
          {[1,2,3,4,5,6,7,8,9,10].map(v => (
            <button key={v} onClick={() => updateField('stress_level', v)}
              className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                log.stress_level === v ? 'text-white shadow-sm' : 'bg-white border border-amber-200 text-amber-600 hover:bg-amber-50'
              }`}
              style={log.stress_level === v ? { background: v <= 3 ? '#10b981' : v <= 6 ? '#f59e0b' : '#ef4444' } : {}}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-1"><span>😌 Calm</span><span>😤 Stressed</span></div>
      </div>

      {/* Mood */}
      <div>
        <label className="text-[10px] font-bold text-amber-600 mb-2 block">Mood</label>
        <div className="flex gap-1.5 flex-wrap">
          {MOOD_OPTIONS.map(m => (
            <button key={m.value} onClick={() => updateField('mood', m.value)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs border-2 transition-all ${
                log.mood === m.value ? 'bg-amber-500 text-white border-transparent' : 'border-amber-200 text-amber-600 hover:border-amber-400 bg-white'
              }`}>
              <span className="text-lg">{m.emoji}</span>
              <span className="font-bold">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fatigue & Energy */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-amber-600 mb-1 block">Fatigue (1–10)</label>
          <input type="range" min="1" max="10" value={log.fatigue_level || 5}
            onChange={e => updateField('fatigue_level', parseInt(e.target.value))}
            className="w-full accent-amber-500" />
          <p className="text-xs text-center font-black text-amber-600">{log.fatigue_level || 5}/10</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-amber-600 mb-1 block">Energy (1–10)</label>
          <input type="range" min="1" max="10" value={log.energy_level || 5}
            onChange={e => updateField('energy_level', parseInt(e.target.value))}
            className="w-full accent-emerald-500" />
          <p className="text-xs text-center font-black text-emerald-600">{log.energy_level || 5}/10</p>
        </div>
      </div>

      {/* Stress trigger & recovery food */}
      <div>
        <label className="text-[10px] font-bold text-amber-600 mb-1 block">Stress Trigger Notes</label>
        <textarea value={log.stress_notes || ''} onChange={e => updateField('stress_notes', e.target.value)}
          rows={2} placeholder="What caused stress today?"
          className="w-full rounded-xl border border-amber-200 px-3 py-2 text-xs bg-white resize-none focus:outline-none focus:border-amber-400" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-amber-600 mb-1 block">Recovery Foods</label>
        <input type="text" value={log.recovery_food || ''} onChange={e => updateField('recovery_food', e.target.value)}
          placeholder="e.g. chamomile tea, dark chocolate..."
          className="w-full rounded-xl border border-amber-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-amber-400" />
      </div>
    </div>
  );
}