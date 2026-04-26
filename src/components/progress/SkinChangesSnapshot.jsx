import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PARAMS = [
  { key: 'acne_level',  label: 'Acne',        emoji: '🔴', invertGood: true },
  { key: 'dark_spots',  label: 'Dark Spots',   emoji: '🟤', invertGood: true },
  { key: 'oiliness',   label: 'Oiliness',     emoji: '💧', invertGood: true },
  { key: 'dryness',    label: 'Dryness',      emoji: '🏜️', invertGood: true },
  { key: 'redness',    label: 'Redness',      emoji: '🌹', invertGood: true },
  { key: 'sensitivity',label: 'Sensitivity',  emoji: '⚡', invertGood: true },
  { key: 'wrinkles',   label: 'Wrinkles',     emoji: '〰️', invertGood: true },
  { key: 'pores',      label: 'Pores',        emoji: '🔬', invertGood: true },
];

function ParamChip({ param, first, last, index }) {
  const delta = last - first;
  const pct = first > 0 ? ((Math.abs(delta) / first) * 100).toFixed(0) : 0;
  const improved = param.invertGood ? delta < 0 : delta > 0;
  const worsened = param.invertGood ? delta > 0 : delta < 0;

  const color = improved ? '#10b981' : worsened ? '#f43f5e' : '#9ca3af';
  const bg = improved ? 'rgba(16,185,129,0.07)' : worsened ? 'rgba(244,63,94,0.07)' : 'rgba(156,163,175,0.07)';
  const border = improved ? 'rgba(16,185,129,0.2)' : worsened ? 'rgba(244,63,94,0.2)' : 'rgba(156,163,175,0.15)';
  const Icon = delta === 0 ? Minus : improved ? TrendingDown : TrendingUp;
  const sign = delta > 0 ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl p-3 flex flex-col gap-1"
      style={{ background: bg, border: `1.5px solid ${border}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-base">{param.emoji}</span>
        <div className="flex items-center gap-0.5" style={{ color }}>
          <Icon className="w-3 h-3" />
          <span className="text-[10px] font-black">{pct}%</span>
        </div>
      </div>
      <p className="text-[11px] font-bold text-gray-700">{param.label}</p>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-400">{first}/10</span>
        <span className="text-[9px] text-gray-300">→</span>
        <span className="text-[10px] font-black" style={{ color }}>{last}/10</span>
      </div>
      {/* Mini bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(last / 10) * 100}%` }}
          transition={{ duration: 0.6, delay: index * 0.04 }}
          style={{ background: color }}
        />
      </div>
    </motion.div>
  );
}

export default function SkinChangesSnapshot({ firstAnalysis, latestAnalysis }) {
  if (!firstAnalysis || !latestAnalysis) return null;

  return (
    <div className="rounded-3xl p-5" style={{
      background: 'linear-gradient(145deg,rgba(255,255,255,0.95),rgba(248,244,255,0.9))',
      border: '1.5px solid rgba(167,139,250,0.15)',
      boxShadow: '0 4px 24px rgba(167,139,250,0.08)',
    }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-black text-base">Skin Changes Snapshot</p>
          <p className="text-[10px] text-gray-400 mt-0.5">First analysis → Now</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5"><TrendingDown className="w-3 h-3 text-emerald-500" /> Better</span>
          <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3 text-red-400" /> Worse</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PARAMS.map((p, i) => (
          <ParamChip
            key={p.key}
            param={p}
            first={firstAnalysis[p.key] ?? 0}
            last={latestAnalysis[p.key] ?? 0}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}