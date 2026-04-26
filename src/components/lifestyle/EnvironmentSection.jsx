import React from 'react';
import { Sun, Wind } from 'lucide-react';

export default function EnvironmentSection({ log, updateField }) {
  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'linear-gradient(145deg,#fff7ed,#ffedd5)', border: '1.5px solid rgba(251,146,60,0.2)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#fb923c,#f59e0b)' }}>
          <Sun className="w-5 h-5 text-white" />
        </div>
        <p className="font-black text-sm">Environmental Exposures</p>
      </div>

      {/* UV Exposure */}
      <div>
        <label className="text-[10px] font-bold text-orange-500 mb-1 block">☀️ UV / Sun Exposure (minutes)</label>
        <div className="flex gap-2 flex-wrap mb-2">
          {[0, 15, 30, 60, 90, 120].map(m => (
            <button key={m} onClick={() => updateField('uv_exposure_minutes', m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                log.uv_exposure_minutes === m ? 'bg-orange-500 text-white border-transparent' : 'border-orange-200 text-orange-500 bg-white hover:border-orange-400'
              }`}>{m === 0 ? 'None' : `${m}m`}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="sunscreen" checked={!!log.sunscreen_applied}
            onChange={e => updateField('sunscreen_applied', e.target.checked)} className="accent-orange-500 w-4 h-4" />
          <label htmlFor="sunscreen" className="text-xs text-orange-600 font-semibold">🧴 Sunscreen Applied</label>
        </div>
      </div>

      {/* Pollution */}
      <div>
        <label className="text-[10px] font-bold text-orange-500 mb-1 block">🌫️ Outdoor / Pollution Exposure (minutes)</label>
        <div className="flex gap-2 flex-wrap">
          {[0, 30, 60, 120, 180, 240].map(m => (
            <button key={m} onClick={() => updateField('pollution_exposure_minutes', m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                log.pollution_exposure_minutes === m ? 'bg-gray-500 text-white border-transparent' : 'border-gray-200 text-gray-500 bg-white hover:border-gray-400'
              }`}>{m === 0 ? 'None' : `${m}m`}</button>
          ))}
        </div>
      </div>

      {/* Humidity / Climate override */}
      <div>
        <label className="text-[10px] font-bold text-orange-500 mb-1 block">💧 Humidity / Climate (manual override)</label>
        <div className="flex gap-2">
          {['dry', 'normal', 'humid'].map(h => (
            <button key={h} onClick={() => updateField('humidity_level', h)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                log.humidity_level === h ? 'bg-sky-500 text-white border-transparent' : 'border-sky-200 text-sky-600 bg-white hover:border-sky-400'
              }`}>{h === 'dry' ? '🏜️' : h === 'normal' ? '🌤️' : '🌧️'} {h}</button>
          ))}
        </div>
      </div>
    </div>
  );
}