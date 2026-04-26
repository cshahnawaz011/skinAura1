import React from 'react';

const CYCLE_PHASES = [
  { value: 'menstrual', label: 'Menstrual', emoji: '🔴', desc: 'Day 1–5' },
  { value: 'follicular', label: 'Follicular', emoji: '🌱', desc: 'Day 6–13' },
  { value: 'ovulation', label: 'Ovulation', emoji: '🌕', desc: 'Day 14' },
  { value: 'luteal', label: 'Luteal', emoji: '🌙', desc: 'Day 15–28' },
  { value: 'na', label: 'N/A', emoji: '—', desc: 'Not tracking' },
];

export default function CycleSection({ log, updateField }) {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'linear-gradient(145deg,#fff1f2,#ffe4e6)', border: '1.5px solid rgba(244,63,94,0.2)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}>
          🌸
        </div>
        <p className="font-black text-sm">Cycle Data</p>
      </div>

      <div>
        <label className="text-[10px] font-bold text-rose-500 mb-2 block">Current Cycle Phase (manual)</label>
        <div className="grid grid-cols-2 gap-2">
          {CYCLE_PHASES.map(p => (
            <button key={p.value} onClick={() => updateField('cycle_phase', p.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                log.cycle_phase === p.value ? 'bg-rose-500 text-white border-transparent' : 'border-rose-200 text-rose-600 bg-white hover:border-rose-400'
              }`}>
              <span>{p.emoji}</span>
              <div className="text-left">
                <p className="font-black">{p.label}</p>
                <p className={`text-[9px] ${log.cycle_phase === p.value ? 'text-rose-200' : 'text-gray-400'}`}>{p.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-rose-500 mb-1 block">Cycle Notes / Symptoms</label>
        <textarea value={log.cycle_notes || ''} onChange={e => updateField('cycle_notes', e.target.value)}
          rows={2} placeholder="Any symptoms, flow notes, skin reactions..."
          className="w-full rounded-xl border border-rose-200 px-3 py-2 text-xs bg-white resize-none focus:outline-none focus:border-rose-400" />
      </div>
    </div>
  );
}