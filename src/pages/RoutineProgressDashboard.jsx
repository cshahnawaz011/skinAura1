import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Camera, ChevronLeft, ChevronRight,
  Info, ZoomIn, X, Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { computeUserLevel } from '@/lib/routineAdaptation';

// ── Helpers ───────────────────────────────────────────────────────────────────
const SIGNAL_MAP = {
  1: 'positive', 2: 'positive', 8: 'neutral',
  3: 'mild_damage', 5: 'mild_damage',
  4: 'high_damage', 6: 'high_damage',
  7: 'oil', 9: 'breakout', 10: 'breakout',
};

function feedbackScore(codes = []) {
  if (!codes.length) return null;
  const signals = codes.map(c => SIGNAL_MAP[c]).filter(Boolean);
  let score = 50;
  signals.forEach(s => {
    if (s === 'positive')     score += 12;
    else if (s === 'neutral') score += 2;
    else if (s === 'oil')     score -= 4;
    else if (s === 'mild_damage') score -= 12;
    else if (s === 'high_damage') score -= 22;
    else if (s === 'breakout')    score -= 10;
  });
  return Math.max(0, Math.min(100, score));
}

const LEVEL_NUM = { 'Level 1': 1, 'Level 2': 2, 'Level 3': 3 };
const LEVEL_COLOR = {
  'Level 1': '#22c55e',
  'Level 2': '#f59e0b',
  'Level 3': '#ef4444',
};

// ── Custom Chart Tooltip ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 shadow-xl text-xs space-y-1.5 min-w-[170px]">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.dataKey === 'level' ? `Level ${p.value}` : p.value != null ? Math.round(p.value) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Photo Timeline ─────────────────────────────────────────────────────────────
function PhotoTimeline({ photos, feedbackByDate }) {
  const [lightbox, setLightbox] = useState(null);

  // Sort oldest → newest
  const sorted = [...photos].sort((a, b) =>
    new Date(a.photo_date || a.created_date) - new Date(b.photo_date || b.created_date)
  );

  if (!sorted.length) return null;

  return (
    <div>
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <Camera className="w-4 h-4 text-pink-500" /> Photo Timeline
      </h3>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {sorted.map((photo, i) => {
          const dateStr = photo.photo_date || photo.created_date?.split('T')[0];
          const fb = feedbackByDate[dateStr];
          const score = fb ? feedbackScore(fb.feedback_codes || []) : null;
          const isFirst = i === 0;
          const isLast = i === sorted.length - 1;

          return (
            <div key={photo.id} className="relative flex-shrink-0 w-36">
              {/* connector line */}
              {i < sorted.length - 1 && (
                <div className="absolute top-14 left-[calc(100%+0px)] w-3 h-0.5 bg-gradient-to-r from-pink-300 to-amber-300 z-10" />
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`rounded-2xl overflow-hidden border-2 cursor-pointer hover:scale-105 transition-transform ${
                  isLast ? 'border-pink-400 shadow-lg shadow-pink-200/40' : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setLightbox(photo)}
              >
                <div className="relative">
                  <img
                    src={photo.photo_url}
                    alt={`Week ${photo.week_number}`}
                    className="w-full h-28 object-cover"
                  />
                  {isFirst && (
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gray-800/80 text-white">START</span>
                  )}
                  {isLast && (
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-pink-500 text-white">LATEST</span>
                  )}
                  <button className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center">
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-2 bg-white/80 dark:bg-gray-900/80">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Week {photo.week_number}</p>
                  <p className="text-[10px] text-gray-400">{dateStr ? format(new Date(dateStr + 'T00:00:00'), 'MMM d') : ''}</p>
                  {score != null && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-amber-400" style={{ width: `${score}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-pink-500">{score}</span>
                    </div>
                  )}
                  {photo.skin_score && (
                    <p className="text-[10px] text-gray-500 mt-0.5">Skin: {photo.skin_score}</p>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl"
            >
              <img src={lightbox.photo_url} alt="" className="w-full max-h-80 object-cover" />
              <div className="p-4">
                <p className="font-bold">Week {lightbox.week_number}</p>
                <p className="text-sm text-gray-500">{lightbox.photo_date || lightbox.created_date?.split('T')[0]}</p>
                {lightbox.notes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{lightbox.notes}</p>}
                {lightbox.skin_score && <p className="text-sm font-semibold text-pink-500 mt-1">Skin Score: {lightbox.skin_score}</p>}
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Before/After Slider ───────────────────────────────────────────────────────
function BeforeAfterPanel({ photos }) {
  const [idx, setIdx] = useState(0);
  const sorted = [...photos].sort((a, b) =>
    new Date(a.photo_date || a.created_date) - new Date(b.photo_date || b.created_date)
  );
  if (sorted.length < 2) return null;
  const first = sorted[0];
  const compare = sorted[Math.min(1 + idx, sorted.length - 1)];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-500" /> Before / After
        </h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-500 font-medium">W1 vs W{Math.min(2 + idx, sorted.length)}</span>
          <Button size="sm" variant="ghost" onClick={() => setIdx(Math.min(sorted.length - 2, idx + 1))} disabled={idx >= sorted.length - 2}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[first, compare].map((p, i) => (
          <div key={i} className="text-center">
            <p className="text-xs text-gray-500 mb-1">{i === 0 ? '📷 Before (Week 1)' : `✨ After (Week ${Math.min(2 + idx, sorted.length)})`}</p>
            <img src={p.photo_url} alt="" className="w-full h-44 object-cover rounded-xl border-2 border-pink-200 dark:border-pink-900/40" />
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-pink-500">Score: {p.skin_score ?? '—'}</span>
              {i === 1 && first.skin_score && p.skin_score && (
                <Badge className={p.skin_score >= first.skin_score ? 'bg-emerald-500 text-white text-[10px]' : 'bg-red-400 text-white text-[10px]'}>
                  {p.skin_score >= first.skin_score ? '+' : ''}{p.skin_score - first.skin_score}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function RoutineProgressDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: progressPhotos = [] } = useQuery({
    queryKey: ['progressPhotos', user?.email],
    queryFn: () => base44.entities.ProgressPhoto.filter({ user_email: user.email }, 'created_date'),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, 'date'),
    enabled: !!user?.email,
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, 'created_date'),
    enabled: !!user?.email,
  });

  // Map feedback by date for quick lookup
  const feedbackByDate = {};
  feedbackHistory.forEach(f => { feedbackByDate[f.date] = f; });

  // ── Build Combined Chart Data (per feedback day) ──────────────────────────
  const chartData = feedbackHistory.map((fb, i) => {
    const score = feedbackScore(fb.feedback_codes || []);
    const levelStr = fb.concentration_level || 'Level 1';
    const levelNum = LEVEL_NUM[levelStr] || 1;

    // Closest skin analysis score on or before this date
    const skinEntry = analyses.filter(a => a.created_date <= (fb.date + 'T23:59:59')).pop();

    return {
      date: fb.date,
      label: format(new Date(fb.date + 'T00:00:00'), 'MMM d'),
      feedbackScore: score,
      level: levelNum,
      skinScore: skinEntry?.overall_score ?? null,
      levelLabel: levelStr,
    };
  });

  // Annotate chart with routine level change events
  const levelChangePoints = [];
  chartData.forEach((d, i) => {
    if (i > 0 && d.level !== chartData[i - 1].level) {
      levelChangePoints.push({ date: d.label, from: chartData[i - 1].levelLabel, to: d.levelLabel });
    }
  });

  // ── Computed Stats ─────────────────────────────────────────────────────────
  const userLevel = computeUserLevel([...feedbackHistory].reverse()); // newest first
  const avgFeedback = chartData.length
    ? Math.round(chartData.filter(d => d.feedbackScore != null).reduce((s, d) => s + d.feedbackScore, 0) / chartData.filter(d => d.feedbackScore != null).length)
    : null;
  const latestFeedback = chartData[chartData.length - 1]?.feedbackScore;
  const firstFeedback = chartData[0]?.feedbackScore;
  const feedbackDelta = latestFeedback != null && firstFeedback != null ? latestFeedback - firstFeedback : null;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Routine Progress Dashboard</h2>
          <p className="text-gray-500 mb-4">Sign in to view your skin transformation timeline.</p>
          <button onClick={() => base44.auth.redirectToLogin()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 text-white font-semibold">
            Sign In
          </button>
        </GlassCard>
      </div>
    );
  }

  const hasPhotos = progressPhotos.length > 0;
  const hasFeedback = feedbackHistory.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          📊
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Routine Progress Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Photos · Feedback Scores · Concentration Level Changes</p>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Concentration Level', value: userLevel.currentLevel,
            sub: `${userLevel.daysAtLevel} days`, color: LEVEL_COLOR[userLevel.currentLevel] || '#22c55e',
            emoji: userLevel.statusEmoji,
          },
          {
            label: 'Avg Feedback Score', value: avgFeedback != null ? avgFeedback : '—',
            sub: 'out of 100', color: '#f472b6', emoji: '📋',
          },
          {
            label: 'Feedback Trend',
            value: feedbackDelta != null ? `${feedbackDelta >= 0 ? '+' : ''}${feedbackDelta}` : '—',
            sub: 'first vs latest', color: feedbackDelta >= 0 ? '#22c55e' : '#ef4444',
            emoji: feedbackDelta >= 0 ? '📈' : '📉',
          },
          {
            label: 'Progress Photos', value: progressPhotos.length,
            sub: 'weeks tracked', color: '#a78bfa', emoji: '📸',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg">{stat.emoji}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Photo Timeline */}
      {hasPhotos ? (
        <GlassCard>
          <PhotoTimeline photos={progressPhotos} feedbackByDate={feedbackByDate} />
        </GlassCard>
      ) : (
        <GlassCard className="text-center py-8">
          <Camera className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No progress photos yet — add them in the <a href="/Progress" className="text-pink-500 underline">Progress</a> page.</p>
        </GlassCard>
      )}

      {/* Before / After */}
      {progressPhotos.length >= 2 && (
        <GlassCard>
          <BeforeAfterPanel photos={progressPhotos} />
        </GlassCard>
      )}

      {/* Combined Chart */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-pink-500" />
          <h3 className="font-bold text-base">Feedback Score vs Concentration Level</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Each day's feedback score (bars) overlaid with your concentration level (line)</p>

        {hasFeedback ? (
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tick={{ fill: '#9ca3af' }} />
                <YAxis yAxisId="score" domain={[0, 100]} stroke="#9ca3af" fontSize={11} tick={{ fill: '#9ca3af' }} width={34} />
                <YAxis yAxisId="level" orientation="right" domain={[0, 4]} ticks={[1, 2, 3]}
                  tickFormatter={v => `L${v}`} stroke="#a78bfa" fontSize={11} tick={{ fill: '#a78bfa' }} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(val) => <span className="text-xs text-gray-500">{val}</span>}
                  iconType="circle" iconSize={8}
                />

                {/* Skin score as a soft area */}
                {analyses.length > 0 && (
                  <Area yAxisId="score" type="monotone" dataKey="skinScore"
                    fill="rgba(244,114,182,0.08)" stroke="rgba(244,114,182,0.3)"
                    strokeWidth={1.5} strokeDasharray="4 3" dot={false}
                    name="Skin Score" connectNulls />
                )}

                {/* Feedback score bars */}
                <Bar yAxisId="score" dataKey="feedbackScore" name="Feedback Score"
                  radius={[6, 6, 0, 0]}
                  fill="url(#fbGrad)" maxBarSize={32} />

                {/* Level line */}
                <Line yAxisId="level" type="stepAfter" dataKey="level" name="Concentration Level"
                  stroke="#a78bfa" strokeWidth={2.5}
                  dot={{ fill: '#a78bfa', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }} connectNulls />

                {/* Level change annotations */}
                {levelChangePoints.map((lc, i) => (
                  <ReferenceLine key={i} yAxisId="score" x={lc.date} stroke="#f59e0b"
                    strokeWidth={1.5} strokeDasharray="4 3"
                    label={{ value: `↑ ${lc.to}`, position: 'top', fontSize: 9, fill: '#f59e0b' }} />
                ))}

                <defs>
                  <linearGradient id="fbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f472b6" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10">
            <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No feedback data yet — submit daily feedback on the <a href="/SkinRoutine" className="text-pink-500 underline">Routine</a> page.</p>
          </div>
        )}
      </GlassCard>

      {/* Level Change Events */}
      {levelChangePoints.length > 0 && (
        <GlassCard>
          <h3 className="font-bold text-base mb-3 flex items-center gap-2">
            ⚡ Concentration Level Changes
          </h3>
          <div className="space-y-2">
            {levelChangePoints.map((lc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white"
                  style={{ background: LEVEL_COLOR[lc.to] }}>
                  {LEVEL_NUM[lc.to]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {lc.from} → {lc.to}
                  </p>
                  <p className="text-xs text-gray-400">{lc.date}</p>
                </div>
                <Badge className="ml-auto text-xs"
                  style={{ background: LEVEL_COLOR[lc.to], color: '#fff' }}>
                  {LEVEL_NUM[lc.to] > LEVEL_NUM[lc.from] ? '⬆ Upgraded' : '⬇ Stepped Down'}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Routine × Feedback key */}
      <GlassCard className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/15 dark:to-pink-900/15">
        <h3 className="font-bold text-sm mb-3">📖 How to Read This Dashboard</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-start gap-2">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-pink-400 to-amber-400 flex-shrink-0 mt-0.5" />
            <p><strong>Bars</strong> = Daily Feedback Score (0–100). Higher = better skin response to routine.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-3 h-1.5 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
            <p><strong>Purple line</strong> = Concentration Level (L1/L2/L3). Rises as skin builds tolerance.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-3 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" style={{ borderStyle: 'dashed' }} />
            <p><strong>Yellow vertical lines</strong> = Level upgrade/downgrade events.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// small local Button shim to avoid importing full shadcn button for icon buttons
function Button({ children, onClick, disabled, size, variant, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl transition-all disabled:opacity-40 ${
        size === 'sm' ? 'text-xs px-2 py-1' : 'px-4 py-2 text-sm'
      } ${
        variant === 'ghost' ? 'hover:bg-white/60 dark:hover:bg-white/10' : 'bg-gradient-to-r from-pink-500 to-amber-500 text-white font-semibold'
      } ${className}`}
    >
      {children}
    </button>
  );
}