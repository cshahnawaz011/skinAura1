import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const TRIGGER_MAP = {
  4: { name: 'Heavy moisturizer', category: 'Product' },
  6: { name: 'Active ingredient', category: 'Ingredient' },
  5: { name: 'New product/ingredient', category: 'Product' },
  3: { name: 'Weather / dryness', category: 'Environment' },
  7: { name: 'Oily diet / hormones', category: 'Lifestyle' },
  9: { name: 'Stress / hormones', category: 'Lifestyle' },
  10: { name: 'Treatment overload', category: 'Routine' },
};

const CORR_LEVELS = [
  { min: 0.8, label: 'Strong',   color: '#ef4444', badge: 'bg-red-100 text-red-700' },
  { min: 0.5, label: 'Moderate', color: '#fb923c', badge: 'bg-orange-100 text-orange-700' },
  { min: 0.2, label: 'Weak',     color: '#facc15', badge: 'bg-yellow-100 text-yellow-700' },
  { min: 0,   label: 'Minimal',  color: '#34d399', badge: 'bg-emerald-100 text-emerald-700' },
];

function analyzeCorrelation(feedbackHistory) {
  if (!feedbackHistory.length) return { trigger: null, correlation: 0, chartData: [], insight: 'Log daily feedback to detect trigger patterns.' };

  const triggerCounts = {};
  feedbackHistory.forEach(f => {
    (f.feedback_codes || []).forEach(c => {
      if (TRIGGER_MAP[c]) {
        triggerCounts[c] = (triggerCounts[c] || 0) + 1;
      }
    });
  });

  const topCode = Object.keys(triggerCounts).sort((a, b) => triggerCounts[b] - triggerCounts[a])[0];
  const topTrigger = topCode ? TRIGGER_MAP[topCode] : null;
  const correlation = topCode ? Math.min(1, triggerCounts[topCode] / feedbackHistory.length) : 0;

  const chartData = feedbackHistory.slice(0, 7).map((f, i) => {
    const hasTrigger = (f.feedback_codes || []).some(c => c === parseInt(topCode));
    const hasFlare = (f.feedback_codes || []).some(c => [4, 6, 9, 10].includes(c));
    return {
      day: `D${i + 1}`,
      trigger: hasTrigger ? 1 : 0,
      flare: hasFlare ? 1 : 0,
    };
  }).reverse();

  const corrLevel = CORR_LEVELS.find(l => correlation >= l.min) || CORR_LEVELS[CORR_LEVELS.length - 1];
  const insight = topTrigger
    ? `${topTrigger.name} (${topTrigger.category}) appears in ${Math.round(correlation * 100)}% of flare-up days — ${corrLevel.label.toLowerCase()} correlation detected.`
    : 'No clear trigger pattern identified yet. Keep logging daily feedback.';

  return { trigger: topTrigger, correlation, chartData, insight, corrLevel, topCode };
}

export default function TriggerCorrelationEngine({ feedbackHistory = [] }) {
  const [open, setOpen] = useState(true);
  const { trigger, correlation, chartData, insight, corrLevel } = analyzeCorrelation(feedbackHistory);

  return (
    <div className="rounded-2xl border-2 border-amber-200 overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Trigger Correlation Engine</p>
            <p className="text-[10px] text-gray-400">Flare-up root cause detection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {corrLevel && (
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${corrLevel.badge}`}>{corrLevel.label}</span>
          )}
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
                {/* Top Trigger */}
                <div className="rounded-xl p-3 text-center bg-amber-50 border border-amber-100 col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Top Trigger</p>
                  <p className="text-lg">⚡</p>
                  <p className="text-[10px] font-black text-amber-700 mt-0.5 leading-tight">
                    {trigger?.name || '—'}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{trigger?.category || 'None yet'}</p>
                </div>

                {/* Correlation */}
                <div className="rounded-xl p-3 text-center border border-gray-100 bg-gray-50">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Correlation</p>
                  <p className="text-2xl font-black" style={{ color: corrLevel?.color || '#9ca3af' }}>
                    {(correlation * 100).toFixed(0)}%
                  </p>
                  <p className="text-[9px] font-bold mt-1" style={{ color: corrLevel?.color || '#9ca3af' }}>
                    {corrLevel?.label || 'N/A'}
                  </p>
                </div>

                {/* Impact Badge */}
                <div className={`rounded-xl p-3 text-center border ${correlation >= 0.5 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Impact</p>
                  <p className="text-2xl">{correlation >= 0.8 ? '🔴' : correlation >= 0.5 ? '🟠' : correlation >= 0.2 ? '🟡' : '🟢'}</p>
                  <p className={`text-[9px] font-black mt-1 ${correlation >= 0.5 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {correlation >= 0.8 ? 'Critical' : correlation >= 0.5 ? 'High' : correlation >= 0.2 ? 'Low' : 'Minimal'}
                  </p>
                </div>
              </div>

              {/* Trend Graph */}
              {chartData.length > 0 && (
                <div className="rounded-xl p-3 bg-white border border-gray-100">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Trigger vs Flare Trend</p>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 1.2]} />
                      <Tooltip formatter={(v, n) => [v === 1 ? 'Yes' : 'No', n === 'trigger' ? 'Trigger' : 'Flare']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="trigger" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} name="Trigger" />
                      <Line type="monotone" dataKey="flare" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} name="Flare" strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Insight Sentence */}
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <span className="text-base flex-shrink-0">💡</span>
                <p className="text-xs text-gray-700 leading-relaxed">{insight}</p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}