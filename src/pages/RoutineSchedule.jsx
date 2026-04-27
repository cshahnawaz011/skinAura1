import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek } from 'date-fns';
import {
  Sun, Moon, Check, RotateCcw, Trophy, Sparkles,
  ChevronDown, ChevronUp, Info, Zap, Shield, Calendar
} from 'lucide-react';
import { computeUserLevel } from '@/lib/routineAdaptation';
import { Link } from 'react-router-dom';

const TODAY_KEY = (date) => `routine_tracker_${format(date, 'yyyy-MM-dd')}`;

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const LEVEL_CONFIG = {
  'Level 1': { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', freq: '1–2x / week', label: 'Beginner' },
  'Level 2': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', freq: '3–4x / week', label: 'Intermediate' },
  'Level 3': { color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.3)', freq: '5–7x / week', label: 'Advanced' },
};

const DAY_TYPE_STYLE = {
  treatment: { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', color: '#7c3aed', label: 'Treatment' },
  recovery: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#059669', label: 'Recovery' },
  hydration: { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', color: '#2563eb', label: 'Hydration' },
};

function CheckItem({ stepKey, label, tip, isActive, checked, onToggle, color }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onToggle}
      className="w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all"
      style={{
        background: checked ? `${color}12` : 'rgba(249,250,251,0.8)',
        border: `1.5px solid ${checked ? color + '40' : '#e5e7eb'}`,
      }}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        style={{ background: checked ? color : 'white', border: `2px solid ${checked ? color : '#d1d5db'}` }}>
        {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold transition-all ${checked ? 'line-through opacity-50' : ''}`}
          style={{ color: checked ? color : '#374151' }}>
          {label}
        </p>
        {tip && !checked && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{tip}</p>}
      </div>
      {isActive && (
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 flex-shrink-0 mt-0.5">ACTIVE</span>
      )}
    </motion.button>
  );
}

function DayCard({ dayLabel, dayIndex, nightPlan, morningSteps, isToday }) {
  const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), dayIndex);
  const dateKey = TODAY_KEY(date);
  const [checked, setChecked] = useState({});
  const [open, setOpen] = useState(isToday);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(dateKey);
      setChecked(saved ? JSON.parse(saved) : {});
    } catch { setChecked({}); }
  }, [dateKey]);

  const toggle = (key) => {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    try { localStorage.setItem(dateKey, JSON.stringify(next)); } catch {}
  };

  const resetDay = (e) => {
    e.stopPropagation();
    setChecked({});
    localStorage.removeItem(dateKey);
  };

  const allSteps = [
    ...morningSteps.map((s, i) => ({ key: `m_${i}`, label: s.name, tip: s.tip, isActive: false, color: '#f59e0b', section: 'morning' })),
    ...(nightPlan?.steps || []).map((s, i) => ({ key: `n_${i}`, label: s.name, tip: s.tip, isActive: s.active, color: '#6366f1', section: 'night' })),
  ];

  const doneCount = allSteps.filter(s => checked[s.key]).length;
  const totalCount = allSteps.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = doneCount >= totalCount && totalCount > 0;

  const dayTypeStyle = DAY_TYPE_STYLE[nightPlan?.day_type] || DAY_TYPE_STYLE.recovery;
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className={`rounded-2xl overflow-hidden border-2 transition-all ${isToday ? 'shadow-lg' : ''}`}
      style={{
        borderColor: isToday ? '#f472b6' : allDone ? '#34d39950' : '#e5e7eb',
        background: isToday ? 'rgba(255,250,255,0.98)' : 'rgba(255,255,255,0.9)',
      }}>
      {/* Day header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          {/* Day indicator */}
          <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'text-white' : ''}`}
            style={{ background: isToday ? 'linear-gradient(135deg,#f472b6,#a78bfa)' : '#f9fafb', border: isToday ? 'none' : '1.5px solid #e5e7eb' }}>
            <span className="text-[9px] font-bold opacity-80">{format(date, 'EEE').toUpperCase()}</span>
            <span className="text-sm font-black leading-none">{format(date, 'd')}</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-black text-sm">{dayLabel}</p>
              {isToday && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600">TODAY</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: dayTypeStyle.bg, color: dayTypeStyle.color }}>
                {nightPlan?.day_type || 'recovery'}
              </span>
              {nightPlan?.active_name && (
                <span className="text-[10px] text-violet-600 font-semibold">{nightPlan.active_name}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress ring */}
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle cx="16" cy="16" r="12" fill="none"
                stroke={allDone ? '#34d399' : '#f472b6'} strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 12}`}
                strokeDashoffset={`${2 * Math.PI * 12 * (1 - pct / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.4s' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {allDone
                ? <Check className="w-3 h-3 text-emerald-500" strokeWidth={3} />
                : <span className="text-[8px] font-black text-gray-500">{pct}%</span>}
            </div>
          </div>
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">

              {/* Frequency note */}
              {nightPlan?.frequency_note && (
                <p className="text-[11px] text-violet-500 font-medium px-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {nightPlan.frequency_note}
                </p>
              )}

              {/* Morning steps */}
              {morningSteps.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Morning</p>
                    <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold ml-auto">
                      {morningSteps.filter((_, i) => checked[`m_${i}`]).length}/{morningSteps.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {morningSteps.map((s, i) => (
                      <CheckItem key={`m_${i}`} stepKey={`m_${i}`} label={s.name} tip={s.tip}
                        isActive={false} checked={!!checked[`m_${i}`]} onToggle={() => toggle(`m_${i}`)} color="#f59e0b" />
                    ))}
                  </div>
                </div>
              )}

              {/* Night steps */}
              {nightPlan?.steps?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Tonight</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1"
                      style={{ background: dayTypeStyle.bg, color: dayTypeStyle.color }}>
                      {nightPlan.day_type}
                    </span>
                    {nightPlan.concentration_level && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-600">
                        {nightPlan.concentration_level}
                      </span>
                    )}
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold ml-auto">
                      {nightPlan.steps.filter((_, i) => checked[`n_${i}`]).length}/{nightPlan.steps.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {nightPlan.steps.map((s, i) => (
                      <CheckItem key={`n_${i}`} stepKey={`n_${i}`} label={s.name} tip={s.tip}
                        isActive={s.active} checked={!!checked[`n_${i}`]} onToggle={() => toggle(`n_${i}`)} color="#6366f1" />
                    ))}
                  </div>
                </div>
              )}

              {/* All done */}
              <AnimatePresence>
                {allDone && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1.5px solid rgba(52,211,153,0.3)' }}>
                    <p className="text-sm font-black text-emerald-700">🎉 Day complete!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reset */}
              <button onClick={resetDay}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset day
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LevelBadge({ userLevel }) {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CONFIG[userLevel.currentLevel] || LEVEL_CONFIG['Level 1'];

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: cfg.border, background: cfg.bg }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: cfg.color + '20' }}>
            <Zap className="w-5 h-5" style={{ color: cfg.color }} />
          </div>
          <div className="text-left">
            <p className="font-black text-sm" style={{ color: cfg.color }}>{userLevel.currentLevel} — {cfg.label}</p>
            <p className="text-[10px] text-gray-500">{cfg.freq} treatment frequency</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userLevel.recoveryMode && (
            <span className="text-[9px] font-black px-2 py-1 rounded-full bg-red-100 text-red-600">RECOVERY</span>
          )}
          <Info className="w-4 h-4 text-gray-400" />
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {Object.entries(LEVEL_CONFIG).map(([lvl, c]) => (
                <div key={lvl} className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: lvl === userLevel.currentLevel ? c.bg : 'rgba(0,0,0,0.02)', border: `1.5px solid ${lvl === userLevel.currentLevel ? c.border : 'transparent'}` }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <div className="flex-1">
                    <p className="text-xs font-bold" style={{ color: c.color }}>{lvl} · {c.freq}</p>
                    <p className="text-[10px] text-gray-500">{c.label}</p>
                  </div>
                  {lvl === userLevel.currentLevel && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: c.color }}>YOU</span>
                  )}
                </div>
              ))}
              <div className="pt-1 space-y-1 text-[10px] text-gray-500">
                <p>• Progress to next level after <strong>7+ positive feedback days</strong></p>
                <p>• Drop to Level 1 after <strong>3 negative days</strong></p>
                <p>• High damage signals → <strong>Recovery Mode</strong> (no actives)</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoutineSchedule() {
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: savedRoutine } = useQuery({
    queryKey: ['skinRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 14),
    enabled: !!user?.email,
  });

  const routineData = savedRoutine?.steps || null;
  const userLevel = computeUserLevel(feedbackHistory);

  // Week stats
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0
  const weekStats = DAY_LABELS.map((label, i) => {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
    const key = TODAY_KEY(date);
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      return Object.values(saved).filter(Boolean).length;
    } catch { return 0; }
  });
  const totalDone = weekStats.reduce((a, b) => a + b, 0);

  if (!user) return (
    <div className="max-w-2xl mx-auto pt-20 text-center px-4">
      <div className="text-5xl mb-4">🗓️</div>
      <h2 className="text-2xl font-black mb-2">Routine Schedule</h2>
      <p className="text-gray-500 mb-6">Sign in to view your weekly skincare schedule</p>
      <button onClick={() => base44.auth.redirectToLogin()}
        className="px-8 py-3 rounded-2xl font-black text-white ios-button-3d"
        style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>Sign In</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span>🗓️</span> Routine Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Weekly plan · Daily check-off · Level-synced</p>
        </div>
        <Link to="/SkinRoutine"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(244,114,182,0.1)', color: '#db2777' }}>
          <Sparkles className="w-3.5 h-3.5" /> Edit Routine
        </Link>
      </div>

      {/* No routine state */}
      {!routineData && (
        <div className="rounded-2xl p-8 text-center border border-dashed border-gray-200 bg-white">
          <div className="text-4xl mb-3">✨</div>
          <p className="font-black text-base mb-1">No routine generated yet</p>
          <p className="text-sm text-gray-500 mb-4">Generate your AI routine first to see your weekly schedule</p>
          <Link to="/SkinRoutine"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-white text-sm ios-button-3d"
            style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            <Sparkles className="w-4 h-4" /> Go to Routine
          </Link>
        </div>
      )}

      {routineData && (
        <>
          {/* Level badge */}
          <LevelBadge userLevel={userLevel} />

          {/* Week summary strip */}
          <div className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-sm">This Week</p>
              <span className="text-xs text-pink-500 font-bold">{totalDone} tasks done</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS.map((d, i) => {
                const isToday = i === todayIndex;
                const done = weekStats[i] > 0;
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-400 font-bold">{d.slice(0, 1)}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        background: isToday ? 'linear-gradient(135deg,#f472b6,#a78bfa)' : done ? 'rgba(52,211,153,0.15)' : '#f9fafb',
                        border: isToday ? 'none' : done ? '1.5px solid rgba(52,211,153,0.4)' : '1.5px solid #e5e7eb',
                      }}>
                      {done && !isToday && <Check className="w-3 h-3 text-emerald-500" strokeWidth={3} />}
                      {isToday && <span className="text-[9px] font-black text-white">{weekStats[i] || '·'}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day cards */}
          <div className="space-y-3">
            {DAY_LABELS.map((dayLabel, i) => {
              const nightPlan = routineData.night_week_plan?.[i] || null;
              const morningSteps = routineData.morning_routine || [];
              return (
                <DayCard
                  key={dayLabel}
                  dayLabel={dayLabel}
                  dayIndex={i}
                  nightPlan={nightPlan}
                  morningSteps={morningSteps}
                  isToday={i === todayIndex}
                />
              );
            })}
          </div>

          {/* Recovery mode banner */}
          {userLevel.recoveryMode && (
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
              <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm text-red-700">Recovery Mode Active</p>
                <p className="text-xs text-red-600 mt-0.5">Skip all actives this week. Focus on gentle cleansing + barrier repair. Log daily feedback to exit recovery.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}