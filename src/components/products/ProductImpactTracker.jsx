import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const CAT_METRIC = {
  cleanser: 'oiliness',
  toner: 'dryness',
  serum: 'dark_spots',
  moisturizer: 'dryness',
  sunscreen: 'dark_spots',
  eye_cream: 'wrinkles',
  face_mask: 'sensitivity',
  retinol: 'wrinkles',
  treatment: 'acne_level',
  exfoliant: 'pores',
};

const METRIC_LABELS = {
  oiliness: 'Oiliness', dryness: 'Dryness', acne_level: 'Acne', dark_spots: 'Dark Spots',
  wrinkles: 'Fine Lines', pores: 'Pores', redness: 'Redness', sensitivity: 'Sensitivity',
};

function buildChartData(pastAnalyses, metric) {
  return [...pastAnalyses].reverse().map((a, i) => ({
    label: `Scan ${i + 1}`,
    value: a[metric] || 0,
    date: a.created_date ? format(new Date(a.created_date), 'MMM d') : `#${i + 1}`,
  }));
}

function MiniImpactCard({ product, pastAnalyses }) {
  const metric = CAT_METRIC[product.category] || 'overall_score';
  const data = buildChartData(pastAnalyses, metric);
  const [open, setOpen] = useState(false);

  const trend = data.length >= 2 ? data[data.length - 1].value - data[0].value : 0;
  // For concern metrics, decreasing is good
  const isPositive = trend <= 0;
  const trendColor = isPositive ? '#34d399' : '#f43f5e';

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}
      onClick={() => setOpen(o => !o)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-sm">{product.product_name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{product.category?.replace('_', ' ')} · tracks {METRIC_LABELS[metric]}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {trend < 0 ? <TrendingDown className="w-4 h-4" style={{ color: trendColor }} /> : trend > 0 ? <TrendingUp className="w-4 h-4" style={{ color: trendColor }} /> : <Minus className="w-4 h-4 text-gray-400" />}
            <span className="text-sm font-black" style={{ color: trendColor }}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Mini sparkline */}
        {data.length >= 2 && (
          <div className="h-14">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <Line type="monotone" dataKey="value" stroke={trendColor} strokeWidth={2} dot={false} />
                <Tooltip
                  contentStyle={{ fontSize: 10, padding: '4px 8px', borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                  formatter={(v) => [`${v}/10`, METRIC_LABELS[metric]]}
                  labelFormatter={(_, p) => p?.[0]?.payload?.date || ''}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.length < 2 && (
          <div className="h-10 flex items-center justify-center text-xs text-gray-300">
            Need 2+ analyses to show trend
          </div>
        )}

        {open && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Key Ingredients</p>
            <div className="flex flex-wrap gap-1">
              {(product.key_ingredients || []).map((ing, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-violet-50 text-violet-600 border border-violet-100">{ing}</span>
              ))}
            </div>
            {product.skin_analysis_notes && (
              <p className="text-xs text-gray-500 mt-2">{product.skin_analysis_notes}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ProductImpactTracker({ savedProducts, pastAnalyses }) {
  const [selectedMetric, setSelectedMetric] = useState('overall_score');

  const overallData = buildChartData(pastAnalyses, selectedMetric === 'overall_score' ? 'overall_score' : selectedMetric);

  const metrics = ['overall_score', 'acne_level', 'oiliness', 'dryness', 'dark_spots', 'sensitivity'];

  return (
    <div className="space-y-5">
      {/* Overall trend chart */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-pink-500" />
            <p className="font-black text-sm">Skin Progress Over Time</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {metrics.map(m => (
              <button key={m} onClick={() => setSelectedMetric(m)}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: selectedMetric === m ? 'linear-gradient(135deg,#f472b6,#a78bfa)' : 'rgba(0,0,0,0.05)',
                  color: selectedMetric === m ? 'white' : '#9ca3af',
                }}>
                {METRIC_LABELS[m] || 'Overall'}
              </button>
            ))}
          </div>
        </div>
        {pastAnalyses.length >= 2 ? (
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overallData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
                  formatter={(v) => [v, METRIC_LABELS[selectedMetric] || 'Score']}
                />
                <Line type="monotone" dataKey="value" stroke="#f472b6" strokeWidth={2.5} dot={{ fill: '#f472b6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-sm text-gray-300">
            Run 2+ skin analyses to unlock trend charts
          </div>
        )}
      </div>

      {/* Per-product cards */}
      <p className="font-black text-sm text-gray-600">📦 Per-Product Impact</p>
      {savedProducts.length === 0 ? (
        <div className="rounded-2xl p-8 text-center text-sm text-gray-300" style={{ border: '2px dashed #e5e7eb' }}>
          Add products to see their impact tracked over time
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savedProducts.map((p) => (
            <MiniImpactCard key={p.id} product={p} pastAnalyses={pastAnalyses} />
          ))}
        </div>
      )}
    </div>
  );
}