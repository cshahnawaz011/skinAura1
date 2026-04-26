import React, { useEffect } from 'react';
import { Moon } from 'lucide-react';

const SLEEP_RATINGS = [
  { value: 'good', emoji: '😴', label: 'Good', color: 'bg-indigo-500' },
  { value: 'poor', emoji: '😩', label: 'Poor', color: 'bg-red-400' },
];

export default function SleepSection({ log, updateField }) {
  const bedtime = log.bedtime || '';
  const waketime = log.wake_time || '';

  // Auto-calc hours slept
  React.useEffect(() => {
    if (bedtime && waketime) {
      const [bH, bM] = bedtime.split(':').map(Number);
      const [wH, wM] = waketime.split(':').map(Number);
      let mins = (wH * 60 + wM) - (bH * 60 + bM);
      if (mins < 0) mins += 24 * 60;
      const hrs = parseFloat((mins / 60).toFixed(1));
      updateField('sleep_hours', hrs);
    }
  }, [bedtime, waketime]);

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'linear-gradient(145deg,#eef2ff,#e0e7ff)', border: '1.5px solid rgba(99,102,241,0.2)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Moon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-sm">Sleep Quality</p>
          <p className="text-[10px] text-indigo-500">Goal: 7–9 hrs</p>
        </div>
        {log.sleep_hours > 0 && (
          <span className="ml-auto text-2xl font-black text-indigo-600">{log.sleep_hours}h</span>
        )}
      </div>

      {/* Sleep rating */}
      <div className="flex gap-2">
        {SLEEP_RATINGS.map(r => (
          <button key={r.value} onClick={() => updateField('sleep_rating', r.value)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
              log.sleep_rating === r.value ? `${r.color} text-white border-transparent` : 'border-indigo-200 text-indigo-500 hover:border-indigo-400'
            }`}>
            <span>{r.emoji}</span>{r.label}
          </button>
        ))}
      </div>

      {/* Bedtime & wake time */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-indigo-500 mb-1 block">🌙 Bedtime</label>
          <input type="time" value={bedtime} onChange={e => updateField('bedtime', e.target.value)}
            className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 bg-white focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-indigo-500 mb-1 block">☀️ Wake Time</label>
          <input type="time" value={waketime} onChange={e => updateField('wake_time', e.target.value)}
            className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 bg-white focus:outline-none focus:border-indigo-400" />
        </div>
      </div>

      {/* Night awakenings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-indigo-500 mb-1 block">Night Awakenings</label>
          <input type="number" min="0" max="20" value={log.night_awakenings || 0}
            onChange={e => updateField('night_awakenings', parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 bg-white focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-indigo-500 mb-1 block">Deficit Hours</label>
          <input type="number" min="0" max="10" step="0.5" value={log.sleep_deficit || 0}
            onChange={e => updateField('sleep_deficit', parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 bg-white focus:outline-none focus:border-indigo-400" />
        </div>
      </div>

      {/* Rested feeling */}
      <div>
        <label className="text-[10px] font-bold text-indigo-500 mb-1.5 block">Felt Rested?</label>
        <div className="flex gap-2">
          {['yes', 'no'].map(v => (
            <button key={v} onClick={() => updateField('felt_rested', v)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all capitalize ${
                log.felt_rested === v ? (v === 'yes' ? 'bg-emerald-500 text-white border-transparent' : 'bg-red-400 text-white border-transparent') : 'border-indigo-200 text-indigo-500 hover:border-indigo-400'
              }`}>
              {v === 'yes' ? '✅ Yes' : '❌ No'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}