import React from 'react';
import { Apple, Droplets } from 'lucide-react';

const SUGAR_LEVELS = ['slow', 'medium', 'high'];
const DAIRY_AMOUNTS = ['low', 'medium', 'high'];

function Counter({ value, onChange, min = 0, max = 20 }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, (value || 0) - 1))}
        className="w-7 h-7 rounded-full bg-white border border-emerald-200 text-emerald-600 font-black text-sm flex items-center justify-center hover:bg-emerald-50">−</button>
      <span className="text-xl font-black text-emerald-600 w-8 text-center">{value || 0}</span>
      <button onClick={() => onChange(Math.min(max, (value || 0) + 1))}
        className="w-7 h-7 rounded-full bg-white border border-emerald-200 text-emerald-600 font-black text-sm flex items-center justify-center hover:bg-emerald-50">+</button>
    </div>
  );
}

export default function DietNutritionSection({ log, updateField }) {
  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: 'linear-gradient(145deg,#f0fdf4,#dcfce7)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          <Apple className="w-5 h-5 text-white" />
        </div>
        <p className="font-black text-sm">Diet & Nutrition</p>
      </div>

      {/* Meals AM / Noon / PM */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-emerald-600 block">Meals Today</label>
        {[['meal_am', '🌅 AM / Breakfast'], ['meal_noon', '☀️ Noon / Lunch'], ['meal_pm', '🌙 PM / Dinner']].map(([field, label]) => (
          <div key={field}>
            <label className="text-[10px] text-gray-500 mb-0.5 block">{label}</label>
            <input type="text" value={log[field] || ''} onChange={e => updateField(field, e.target.value)}
              placeholder={`What did you eat ${label.split('/')[0].trim()}?`}
              className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-emerald-400" />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="no_miss" checked={!!log.no_meal_missed}
            onChange={e => updateField('no_meal_missed', e.target.checked)}
            className="accent-emerald-500 w-4 h-4 rounded" />
          <label htmlFor="no_miss" className="text-xs text-emerald-700 font-semibold">✅ No meal missed today</label>
        </div>
      </div>

      {/* Water */}
      <div>
        <label className="text-[10px] font-bold text-emerald-600 mb-2 block flex items-center gap-1">
          <Droplets className="w-3 h-3" /> Water Intake (glasses)
        </label>
        <div className="flex items-center gap-3">
          <Counter value={log.water_glasses} onChange={v => updateField('water_glasses', v)} max={20} />
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} onClick={() => updateField('water_glasses', i + 1)}
                className={`w-5 h-7 rounded-full border-2 cursor-pointer transition-colors ${
                  i < (log.water_glasses || 0) ? 'bg-blue-400 border-blue-400' : 'border-blue-200'
                }`} />
            ))}
          </div>
        </div>
      </div>

      {/* Sugar */}
      <div>
        <label className="text-[10px] font-bold text-emerald-600 mb-1.5 block">Sugar Intake</label>
        <div className="flex gap-2 mb-2">
          {SUGAR_LEVELS.map(s => (
            <button key={s} onClick={() => updateField('sugar_level', s)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                log.sugar_level === s ? 'bg-rose-400 text-white border-transparent' : 'border-rose-200 text-rose-500 bg-white hover:border-rose-400'
              }`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="sweet_foods" checked={!!log.ate_sweet_foods}
            onChange={e => updateField('ate_sweet_foods', e.target.checked)} className="accent-rose-500 w-4 h-4" />
          <label htmlFor="sweet_foods" className="text-xs text-rose-600 font-semibold">Ate sweet foods?</label>
        </div>
      </div>

      {/* Dairy */}
      <div>
        <label className="text-[10px] font-bold text-emerald-600 mb-1.5 block">Dairy Consumed</label>
        <div className="flex items-center gap-2 mb-2">
          {['yes', 'no'].map(v => (
            <button key={v} onClick={() => updateField('dairy_consumed', v)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                log.dairy_consumed === v ? (v === 'yes' ? 'bg-blue-400 text-white border-transparent' : 'bg-gray-400 text-white border-transparent') : 'border-blue-200 text-blue-500 bg-white'
              }`}>{v === 'yes' ? '🥛 Yes' : '❌ No'}</button>
          ))}
        </div>
        {log.dairy_consumed === 'yes' && (
          <div className="flex gap-2">
            {DAIRY_AMOUNTS.map(a => (
              <button key={a} onClick={() => updateField('dairy_amount', a)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                  log.dairy_amount === a ? 'bg-blue-500 text-white border-transparent' : 'border-blue-200 text-blue-500 bg-white'
                }`}>{a}</button>
            ))}
          </div>
        )}
      </div>

      {/* Fruits & Veg, Healthy Fats */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-emerald-600 mb-1 block">🥦 Fruits & Veg (servings)</label>
          <Counter value={log.fruits_veg_servings} onChange={v => updateField('fruits_veg_servings', v)} max={15} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-emerald-600 mb-1 block">🥑 Healthy Fats (servings)</label>
          <Counter value={log.healthy_fats_servings} onChange={v => updateField('healthy_fats_servings', v)} max={10} />
        </div>
      </div>
    </div>
  );
}