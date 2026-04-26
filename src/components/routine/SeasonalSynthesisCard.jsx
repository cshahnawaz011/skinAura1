import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

const SEASONAL_MODES = {
  summer:  { emoji: '☀️', label: 'Summer Mode',   humidity: 'High', uv: 'Extreme 9–11', climate: 'Hot & Humid',  color: '#f59e0b', rec: 'Lightweight gel moisturizer, SPF 50+, avoid heavy actives midday' },
  monsoon: { emoji: '🌧️', label: 'Monsoon Mode',  humidity: 'Very High', uv: 'Moderate 4–6', climate: 'Humid & Overcast', color: '#38bdf8', rec: 'Clarifying cleanser, oil-control toner, reduce heavy creams' },
  winter:  { emoji: '❄️', label: 'Winter Mode',   humidity: 'Low', uv: 'Low 1–3', climate: 'Cold & Dry',    color: '#818cf8', rec: 'Ceramide-rich cream, add facial oil, skip harsh exfoliation' },
  spring:  { emoji: '🌸', label: 'Spring Mode',   humidity: 'Medium', uv: 'Moderate 5–7', climate: 'Mild & Windy',  color: '#34d399', rec: 'Vitamin C in AM, increase active frequency gradually' },
};

function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 10) return 'monsoon';
  return 'winter';
}

const MOCK_ENV_TREND = [
  { day: 'Mon', humidity: 72, uv: 8 },
  { day: 'Tue', humidity: 68, uv: 9 },
  { day: 'Wed', humidity: 75, uv: 7 },
  { day: 'Thu', humidity: 80, uv: 6 },
  { day: 'Fri', humidity: 65, uv: 9 },
  { day: 'Sat', humidity: 70, uv: 8 },
  { day: 'Sun', humidity: 74, uv: 7 },
];

export default function SeasonalSynthesisCard() {
  const [open, setOpen] = useState(true);
  const season = getSeason();
  const mode = SEASONAL_MODES[season];

  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: `${mode.color}40`, background: 'rgba(255,255,255,0.95)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: `${mode.color}15` }}>
            {mode.emoji}
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Seasonal Auto-Synthesis</p>
            <p className="text-[10px] text-gray-400">Environment-adjusted recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: mode.color }}>{mode.label}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">

              {/* Sub-cards */}
              <div className="grid grid-cols-3 gap-2">
                {/* Humidity */}
                <div className="rounded-xl p-3 text-center bg-sky-50 border border-sky-100">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Humidity</p>
                  <p className="text-lg">💧</p>
                  <p className="text-xs font-black text-sky-700 mt-0.5">{mode.humidity}</p>
                </div>

                {/* UV Level */}
                <div className="rounded-xl p-3 text-center bg-amber-50 border border-amber-100">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">UV Level</p>
                  <p className="text-lg">☀️</p>
                  <p className="text-xs font-black text-amber-700 mt-0.5">{mode.uv}</p>
                </div>

                {/* Climate Status */}
                <div className="rounded-xl p-3 text-center border" style={{ background: `${mode.color}0e`, borderColor: `${mode.color}25` }}>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Climate</p>
                  <p className="text-lg">{mode.emoji}</p>
                  <p className="text-[10px] font-black mt-0.5" style={{ color: mode.color }}>{mode.climate}</p>
                </div>
              </div>

              {/* Environment Trend Graph */}
              <div className="rounded-xl p-3 bg-white border border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">7-Day Environment Trend</p>
                <ResponsiveContainer width="100%" height={72}>
                  <AreaChart data={MOCK_ENV_TREND} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="uvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} fill="url(#humGrad)" name="Humidity%" dot={false} />
                    <Area type="monotone" dataKey="uv" stroke="#f59e0b" strokeWidth={2} fill="url(#uvGrad)" name="UV Index" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Active Recommendation */}
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: `${mode.color}0e`, border: `1px solid ${mode.color}30` }}>
                <Cloud className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: mode.color }} />
                <div>
                  <p className="text-[10px] font-black mb-0.5" style={{ color: mode.color }}>Active Recommendation</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{mode.rec}</p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}