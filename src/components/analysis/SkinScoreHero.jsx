import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function ArcMeter({ score, size = 180 }) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 20;
  const startAngle = -200, endAngle = 20;
  const totalAngle = endAngle - startAngle;
  const fillAngle = startAngle + (score / 100) * totalAngle;

  const toRad = deg => (deg * Math.PI) / 180;
  const arcPath = (from, to) => {
    const x1 = cx + r * Math.cos(toRad(from));
    const y1 = cy + r * Math.sin(toRad(from));
    const x2 = cx + r * Math.cos(toRad(to));
    const y2 = cy + r * Math.sin(toRad(to));
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const color = score >= 85 ? '#34d399' : score >= 70 ? '#38bdf8' : score >= 50 ? '#facc15' : '#f43f5e';

  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`} className="overflow-visible">
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="33%" stopColor="#facc15" />
          <stop offset="66%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      {/* Track */}
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={11} strokeLinecap="round" />
      {/* Fill */}
      <motion.path d={arcPath(startAngle, fillAngle)} fill="none" stroke="url(#arcGrad)" strokeWidth={11} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      {/* Needle dot */}
      <motion.circle
        cx={cx + r * Math.cos(toRad(fillAngle))}
        cy={cy + r * Math.sin(toRad(fillAngle))}
        r={7} fill="white" stroke={color} strokeWidth={3}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} />
    </svg>
  );
}

const GRADE_MAP = [
  { min: 90, grade: 'A+', label: 'Exceptional', color: '#34d399', bg: 'from-emerald-50 to-teal-50' },
  { min: 85, grade: 'A',  label: 'Excellent',   color: '#34d399', bg: 'from-emerald-50 to-green-50' },
  { min: 75, grade: 'B+', label: 'Very Good',   color: '#38bdf8', bg: 'from-sky-50 to-blue-50' },
  { min: 65, grade: 'B',  label: 'Good',        color: '#38bdf8', bg: 'from-sky-50 to-cyan-50' },
  { min: 55, grade: 'C+', label: 'Fair',        color: '#facc15', bg: 'from-yellow-50 to-amber-50' },
  { min: 40, grade: 'C',  label: 'Moderate',    color: '#fb923c', bg: 'from-amber-50 to-orange-50' },
  { min: 0,  grade: 'D',  label: 'Needs Care',  color: '#f43f5e', bg: 'from-red-50 to-rose-50' },
];

export default function SkinScoreHero({ analysis, previousScore }) {
  if (!analysis) return null;
  const score = analysis.overall_score || 0;
  const grade = GRADE_MAP.find(g => score >= g.min) || GRADE_MAP[GRADE_MAP.length - 1];
  const delta = previousScore != null ? score - previousScore : null;

  return (
    <div className={`rounded-3xl p-5 bg-gradient-to-br ${grade.bg} border border-white/60`}
      style={{ boxShadow: `0 8px 32px ${grade.color}22` }}>
      <div className="flex flex-col items-center">
        <ArcMeter score={score} size={200} />

        {/* Score display overlaid on arc */}
        <div className="text-center -mt-8 mb-4">
          <div className="flex items-end justify-center gap-1">
            <span className="text-7xl font-black" style={{ color: grade.color }}>{Math.round(score)}</span>
            <span className="text-2xl text-gray-400 font-bold mb-3">/100</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-black" style={{ color: grade.color }}>{grade.grade}</span>
            <Badge className="text-sm font-bold px-3 py-1" style={{ background: `${grade.color}22`, color: grade.color, border: 'none' }}>
              {grade.label}
            </Badge>
          </div>
          {delta !== null && (
            <div className="flex items-center justify-center gap-1 mt-1"
              style={{ color: delta >= 0 ? '#34d399' : '#f43f5e' }}>
              {delta > 0 ? <TrendingUp className="w-4 h-4" /> : delta < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              <span className="text-sm font-black">{delta > 0 ? '+' : ''}{delta.toFixed(0)} from last scan</span>
            </div>
          )}
        </div>

        {/* Key metrics pill row */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {[
            { label: 'Type', val: analysis.skin_type, emoji: '🧬' },
            { label: 'Tone', val: analysis.skin_tone?.split(' ').slice(0,2).join(' '), emoji: '🎨' },
            { label: 'Acne', val: `${analysis.acne_level || 0}/10`, emoji: '🔴' },
            { label: 'Oiliness', val: `${analysis.oiliness || 0}/10`, emoji: '💦' },
          ].map(item => (
            <div key={item.label} className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/70 text-gray-700 flex items-center gap-1 capitalize">
              <span>{item.emoji}</span> {item.val}
            </div>
          ))}
        </div>

        {/* Strengths */}
        {analysis.skin_strengths?.length > 0 && (
          <div className="mt-3 w-full">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 text-center">Skin Strengths</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {analysis.skin_strengths.map((s, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">✨ {s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Priority concerns */}
        {analysis.priority_concerns?.length > 0 && (
          <div className="mt-2 w-full">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 text-center">Priority Focus</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {analysis.priority_concerns.map((c, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-600 capitalize">⚠️ {c.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}