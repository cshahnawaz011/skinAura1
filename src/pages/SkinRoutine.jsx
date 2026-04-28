import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Zap, Shield, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  selectModules, buildBaseRoutine, calcSkinResponseScore, calcIrritationRisk,
  shouldTriggerRecovery, getFrequencyRecommendation, generateWeekSchedule,
  checkConflicts, getPhaseFromAnalysis, INGREDIENT_REGISTRY, FREQUENCY_LADDER, PHASES,
} from '@/lib/adaptiveRoutineEngine';
import { saveRoutineStore, getRoutineStore } from '@/lib/routineStore';
import PageIntroPopup from '@/components/PageIntroPopup';

// ── Feedback options ─────────────────────────────────────────────
const FEEDBACK_OPTIONS = [
  { code: 1, emoji: '😊', label: 'Comfortable', signal: 'good', color: '#34d399' },
  { code: 2, emoji: '✨', label: 'More glowing', signal: 'good', color: '#34d399' },
  { code: 3, emoji: '😐', label: 'Slight dryness', signal: 'mild', color: '#facc15' },
  { code: 4, emoji: '🏜️', label: 'Very dry/flaky', signal: 'bad', color: '#fb923c' },
  { code: 5, emoji: '🔥', label: 'Mild irritation', signal: 'bad', color: '#f97316' },
  { code: 6, emoji: '⚡', label: 'Burning/stinging', signal: 'bad', color: '#ef4444' },
  { code: 7, emoji: '💧', label: 'More oily', signal: 'neutral', color: '#38bdf8' },
  { code: 8, emoji: '➖', label: 'No change', signal: 'neutral', color: '#9ca3af' },
  { code: 9, emoji: '🔴', label: 'New pimples', signal: 'bad', color: '#f43f5e' },
  { code: 10, emoji: '😰', label: 'Acne worsening', signal: 'bad', color: '#dc2626' },
];

// ── Small sub-components ─────────────────────────────────────────

function PhaseBar({ phase }) {
  const p = PHASES[phase] || PHASES[1];
  return (
    <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: `${p.color}18`, border: `1.5px solid ${p.color}40` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
        style={{ background: p.color }}>{phase}</div>
      <div>
        <p className="font-black text-sm" style={{ color: p.color }}>{p.label}: {p.name}</p>
        <p className="text-xs text-gray-500">{p.desc}</p>
      </div>
    </div>
  );
}

function FrequencyLadder({ currentId }) {
  const currentIdx = FREQUENCY_LADDER.findIndex(f => f.id === currentId);
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
      <p className="font-black text-xs text-gray-500 mb-3 uppercase tracking-wider">Frequency Ladder</p>
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1">
        {FREQUENCY_LADDER.map((f, i) => {
          const active = i === currentIdx;
          const passed = i < currentIdx;
          return (
            <div key={f.id} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${active ? 'scale-110' : ''}`}
                  style={{
                    background: active ? '#f472b6' : passed ? '#34d399' : 'rgba(0,0,0,0.04)',
                    borderColor: active ? '#f472b6' : passed ? '#34d399' : 'rgba(0,0,0,0.1)',
                    color: active || passed ? 'white' : '#9ca3af',
                  }}>
                  {i + 1}
                </div>
                <span className="text-[9px] text-center font-bold" style={{ color: active ? '#f472b6' : '#9ca3af', maxWidth: 48 }}>
                  {f.label}
                </span>
              </div>
              {i < FREQUENCY_LADDER.length - 1 && (
                <div className="w-4 h-0.5 mb-4 rounded-full" style={{ background: passed ? '#34d399' : 'rgba(0,0,0,0.1)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoutineStep({ step, isActive }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{
      border: `1.5px solid ${isActive ? '#f472b6' : 'rgba(0,0,0,0.07)'}`,
      background: isActive ? 'rgba(244,114,182,0.04)' : 'rgba(255,255,255,0.9)',
    }}>
      <button className="w-full flex items-center gap-3 px-4 py-3" onClick={() => setOpen(o => !o)}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: isActive ? 'rgba(244,114,182,0.15)' : 'rgba(0,0,0,0.04)' }}>
          {isActive ? '⚡' : '🧴'}
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-sm text-gray-800">{step.name}</p>
          <p className="text-[11px] text-gray-400">{step.type}</p>
        </div>
        <div className="flex items-center gap-2">
          {isActive && <Badge className="text-[10px] bg-pink-100 text-pink-600 border-none">Active</Badge>}
          <span className="text-[11px] text-gray-400">{step.timing}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100">
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs text-gray-600">💡 {step.tip}</p>
              {step.ingredients?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {step.ingredients.map(i => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{i}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WeekSchedule({ schedule }) {
  const today = new Date().getDay(); // 0=Sun
  const dayMap = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }; // Mon=0
  const todayIdx = dayMap[today];

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
      <p className="font-black text-sm mb-3">📅 Weekly Schedule</p>
      <div className="grid grid-cols-7 gap-1">
        {schedule.map((d, i) => (
          <div key={d.day} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400">{d.day}</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
              style={{
                background: i === todayIdx ? '#f472b6' : d.isTreatment ? 'rgba(167,139,250,0.2)' : 'rgba(52,211,153,0.15)',
                border: i === todayIdx ? '2px solid #f472b6' : '1.5px solid transparent',
                color: i === todayIdx ? 'white' : d.isTreatment ? '#7c3aed' : '#059669',
              }}>
              {i === todayIdx ? '📍' : d.isTreatment ? '⚡' : '💧'}
            </div>
            <span className="text-[8px] font-bold" style={{ color: d.isTreatment ? '#7c3aed' : '#059669' }}>
              {d.isTreatment ? 'Treat' : 'Rest'}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span>⚡</span> Treatment night</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span>💧</span> Recovery night</span>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function SkinRoutine() {
  const [user, setUser] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [routineData, setRoutineData] = useState(null); // AI-generated full routine
  const [tab, setTab] = useState('morning');

  // Adaptive state derived from analysis + feedback
  const [currentFreqId, setCurrentFreqId] = useState('1x');
  const [weeksSinceStart] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load latest skin analysis
  const { data: analyses = [] } = useQuery({
    queryKey: ['skinAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  // Load feedback history
  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, '-created_date', 14),
    enabled: !!user?.email,
  });

  // Load saved routine
  const { data: savedRoutines = [], refetch: refetchRoutine } = useQuery({
    queryKey: ['skinRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });

  const latestAnalysis = analyses[0] || null;
  const savedRoutine = savedRoutines[0] || null;

  // Load routine from DB or localStorage
  useEffect(() => {
    if (savedRoutine?.steps && typeof savedRoutine.steps === 'object') {
      setRoutineData(savedRoutine.steps);
    } else {
      const cached = localStorage.getItem('skinRoutineCache');
      if (cached) {
        try { setRoutineData(JSON.parse(cached)); } catch {}
      }
    }
  }, [savedRoutine]);

  // Derive adaptive state
  const modules = selectModules(latestAnalysis);
  const baseRoutine = buildBaseRoutine(latestAnalysis?.skin_type);
  const responseScore = calcSkinResponseScore(feedbackHistory);
  const irritationRisk = calcIrritationRisk(latestAnalysis, feedbackHistory);
  const isRecovery = shouldTriggerRecovery(feedbackHistory);
  const phase = getPhaseFromAnalysis(latestAnalysis, feedbackHistory, weeksSinceStart);
  const freqRecommendation = getFrequencyRecommendation(responseScore, irritationRisk, currentFreqId);
  const weekSchedule = generateWeekSchedule(modules.actives, isRecovery ? 'paused' : currentFreqId);
  const conflicts = checkConflicts([...modules.support, ...modules.actives]);

  // Sync to routineStore for other pages
  useEffect(() => {
    if (latestAnalysis) {
      saveRoutineStore({ modules, analysis: latestAnalysis, frequencyId: currentFreqId, phase });
    }
  }, [latestAnalysis, currentFreqId, phase]);

  const generateRoutine = async () => {
    if (!latestAnalysis) return;
    setGenerating(true);
    const a = latestAnalysis;
    const prompt = `You are an AI dermatologist. Based on this skin analysis, create a safe, minimal skincare routine.
Skin: type=${a.skin_type}, score=${a.overall_score}/100, acne=${a.acne_level}/10, dryness=${a.dryness}/10, oiliness=${a.oiliness}/10, sensitivity=${a.sensitivity}/10, redness=${a.redness}/10, dark_spots=${a.dark_spots}/10
Concerns: ${(a.priority_concerns || []).join(', ') || 'none'}
Rules: max 5 AM steps, max 4 PM steps, always include moisturizer+SPF in AM, start actives 1-2x/week only, barrier-first approach.
Return JSON with keys: morning_routine (array of steps with: step, name, product_type, tip, key_ingredients[]), night_week_plan (7 items with: day_label, day_type "treatment"|"recovery"|"hydration", steps[]), safety_notes (string[]).`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          morning_routine: { type: 'array', items: { type: 'object', properties: { step: { type: 'number' }, name: { type: 'string' }, product_type: { type: 'string' }, tip: { type: 'string' }, key_ingredients: { type: 'array', items: { type: 'string' } } } } },
          night_week_plan: { type: 'array', items: { type: 'object', properties: { day_label: { type: 'string' }, day_type: { type: 'string' }, steps: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, tip: { type: 'string' }, active: { type: 'boolean' } } } } } } },
          safety_notes: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    if (result) {
      setRoutineData(result);
      localStorage.setItem('skinRoutineCache', JSON.stringify(result));
      // Save to DB
      const payload = {
        user_email: user.email,
        routine_type: 'morning',
        skin_type: a.skin_type || '',
        steps: result,
        skin_concerns: a.priority_concerns || [],
        routine_summary: `AI routine for ${a.skin_type} skin`,
      };
      if (savedRoutine?.id) {
        await base44.entities.SkinRoutine.update(savedRoutine.id, payload);
      } else {
        await base44.entities.SkinRoutine.create(payload);
      }
      refetchRoutine();
    }
    setGenerating(false);
  };

  const submitFeedback = async () => {
    if (!selectedFeedback.length || !user) return;
    setSaving(true);
    await base44.entities.SkinFeedback.create({
      user_email: user.email,
      date: new Date().toISOString().slice(0, 10),
      feedback_codes: selectedFeedback,
      routine_day_type: weekSchedule[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.type || 'recovery',
      concentration_level: 'Level 1',
    });

    // Apply frequency adjustment
    const rec = getFrequencyRecommendation(responseScore, irritationRisk, currentFreqId);
    const ladder = FREQUENCY_LADDER;
    const idx = ladder.findIndex(f => f.id === currentFreqId);
    if (rec === 'increase' && idx < ladder.length - 1) setCurrentFreqId(ladder[idx + 1].id);
    else if ((rec === 'reduce' || rec === 'recovery') && idx > 0) setCurrentFreqId(ladder[Math.max(0, idx - 1)].id);

    setSaving(false);
    setSaved(true);
    setSelectedFeedback([]);
    setTimeout(() => setSaved(false), 3000);
  };

  // Build AM/PM steps from AI routine or base
  const amSteps = routineData?.morning_routine || baseRoutine.am.map(s => ({ name: s.name, product_type: s.type, tip: s.tip, key_ingredients: s.ingredients }));
  const pmDays = routineData?.night_week_plan || weekSchedule.map(d => ({
    day_label: d.day,
    day_type: d.type,
    steps: d.isTreatment
      ? [{ name: 'Cleanser', tip: 'Gentle cleanse' }, ...modules.actives.map(a => ({ name: INGREDIENT_REGISTRY[a]?.name, tip: `Apply ${INGREDIENT_REGISTRY[a]?.conc}`, active: true })), { name: 'Moisturizer', tip: 'Seal with barrier cream' }]
      : [{ name: 'Cleanser', tip: 'Gentle cleanse' }, { name: 'Ceramide Moisturizer', tip: 'Barrier recovery night' }],
  }));

  const todayDayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayPM = pmDays[todayDayIdx] || pmDays[0];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <PageIntroPopup
        storageKey="intro_SkinRoutine"
        emoji="✨"
        title="Adaptive Skin Routine"
        accentColor="#f472b6"
        description="Your routine adapts in real-time based on your skin analysis and daily feedback. We follow a minimum-effective-dose philosophy — fixed safe concentrations, only frequency changes."
        tips={[
          { icon: '🔬', title: 'Scan first', text: 'Run a Skin Analysis first so your routine is fully personalized to your skin type and concerns.' },
          { icon: '📊', title: 'Submit daily feedback', text: 'Tell us how your skin feels each day. This drives automatic frequency adjustments.' },
          { icon: '⚡', title: 'One active at a time', text: 'We introduce only one active ingredient to prevent overload. More can be added as your skin adapts.' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black">Skin Routine</h1>
          <p className="text-xs text-gray-500 mt-0.5">Adaptive · Minimum-Effective-Dose · Barrier-First</p>
        </div>
        {latestAnalysis && (
          <Button onClick={generateRoutine} disabled={generating}
            className="gap-2 text-white ios-button-3d"
            style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Building…' : routineData ? 'Regenerate' : 'Build Routine'}
          </Button>
        )}
      </div>

      {/* No analysis CTA */}
      {!latestAnalysis && (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(244,114,182,0.06)', border: '1.5px dashed rgba(244,114,182,0.3)' }}>
          <p className="text-3xl mb-2">🔬</p>
          <p className="font-black text-base mb-1">No Skin Analysis Found</p>
          <p className="text-sm text-gray-500 mb-4">Run a skin analysis first so we can build your personalized routine.</p>
          <Button onClick={() => window.location.href = '/SkinAnalysis'} className="text-white ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            Go to Skin Analysis
          </Button>
        </div>
      )}

      {latestAnalysis && (
        <>
          {/* Phase + Recovery */}
          <PhaseBar phase={phase} />
          {isRecovery && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(251,146,60,0.12)', border: '1.5px solid rgba(251,146,60,0.4)' }}>
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-xs font-bold text-orange-700">Recovery Mode Active — Actives paused. Barrier repair priority.</p>
            </div>
          )}

          {/* Key metrics row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Skin Response', value: `${responseScore}/100`, color: responseScore >= 70 ? '#34d399' : responseScore >= 50 ? '#facc15' : '#ef4444', icon: '💚' },
              { label: 'Irritation Risk', value: `${irritationRisk}/10`, color: irritationRisk <= 3 ? '#34d399' : irritationRisk <= 6 ? '#facc15' : '#ef4444', icon: '🛡️' },
              { label: 'Frequency', value: FREQUENCY_LADDER.find(f => f.id === currentFreqId)?.label || '1×/week', color: '#a78bfa', icon: '📈' },
            ].map(m => (
              <div key={m.label} className="rounded-2xl p-3 text-center" style={{ background: `${m.color}12`, border: `1px solid ${m.color}30` }}>
                <p className="text-base mb-0.5">{m.icon}</p>
                <p className="font-black text-sm" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Frequency ladder */}
          <FrequencyLadder currentId={currentFreqId} />

          {/* Weekly schedule */}
          <WeekSchedule schedule={weekSchedule} />

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-black text-red-600 mb-1">⚠️ Ingredient Conflicts Detected</p>
              {conflicts.map((c, i) => (
                <p key={i} className="text-xs text-red-700">{c.a} + {c.b}: {c.reason}</p>
              ))}
            </div>
          )}

          {/* AM / PM tab routine */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="flex">
              {[
                { key: 'morning', label: '☀️ Morning', icon: Sun },
                { key: 'night', label: '🌙 Tonight', icon: Moon },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex-1 py-3 font-black text-sm transition-all"
                  style={{
                    background: tab === t.key ? 'rgba(244,114,182,0.1)' : 'transparent',
                    color: tab === t.key ? '#f472b6' : '#9ca3af',
                    borderBottom: tab === t.key ? '2px solid #f472b6' : '2px solid transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-4 space-y-2">
              {tab === 'morning' ? (
                amSteps.map((step, i) => (
                  <RoutineStep key={i} step={{ name: step.name, type: step.product_type, timing: `Step ${step.step || i + 1}`, tip: step.tip, ingredients: step.key_ingredients }} isActive={false} />
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${todayPM?.day_type === 'treatment' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {todayPM?.day_type === 'treatment' ? '⚡ Treatment Night' : '💧 Recovery Night'}
                    </span>
                    <span className="text-xs text-gray-400">{todayPM?.day_label}</span>
                  </div>
                  {(todayPM?.steps || []).map((step, i) => (
                    <RoutineStep key={i} step={{ name: step.name, type: step.active ? `Active — ${INGREDIENT_REGISTRY[modules.actives[0]]?.conc || ''}` : 'Base step', timing: `Step ${i + 1}`, tip: step.tip || '', ingredients: [] }} isActive={!!step.active} />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Active modules */}
          {(modules.support.length > 0 || modules.actives.length > 0) && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="font-black text-sm">🧴 Your Modules</p>
              <div className="space-y-2">
                {modules.support.map(key => {
                  const ing = INGREDIENT_REGISTRY[key];
                  return (
                    <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-black text-gray-800">{ing.name} <span className="text-emerald-600">{ing.conc}</span></p>
                        <p className="text-[10px] text-gray-400">Support · {ing.timing}</p>
                      </div>
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-none">Support</Badge>
                    </div>
                  );
                })}
                {modules.actives.map(key => {
                  const ing = INGREDIENT_REGISTRY[key];
                  return (
                    <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)' }}>
                      <Zap className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-black text-gray-800">{ing.name} <span className="text-pink-600">{ing.conc}</span></p>
                        <p className="text-[10px] text-gray-400">Active · {ing.timing} · {FREQUENCY_LADDER.find(f => f.id === currentFreqId)?.label}</p>
                      </div>
                      <Badge className="text-[10px] bg-pink-100 text-pink-600 border-none">Active</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feedback panel */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div>
              <p className="font-black text-sm">📋 Daily Skin Feedback</p>
              <p className="text-[11px] text-gray-400 mt-0.5">How does your skin feel today? This drives frequency adjustments.</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {FEEDBACK_OPTIONS.map(opt => {
                const selected = selectedFeedback.includes(opt.code);
                return (
                  <button key={opt.code}
                    onClick={() => setSelectedFeedback(prev => selected ? prev.filter(c => c !== opt.code) : [...prev, opt.code])}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
                    style={{ background: selected ? `${opt.color}18` : 'rgba(0,0,0,0.03)', border: `1.5px solid ${selected ? opt.color : 'transparent'}` }}>
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="text-[9px] font-bold text-center leading-tight" style={{ color: selected ? opt.color : '#9ca3af' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <Button onClick={submitFeedback} disabled={!selectedFeedback.length || saving || !user}
              className="w-full gap-2 text-white"
              style={{ background: selectedFeedback.length ? 'linear-gradient(135deg,#f472b6,#a78bfa)' : undefined }}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
              {saving ? 'Saving…' : saved ? 'Saved! Routine adjusted.' : 'Submit Feedback'}
            </Button>
            {!user && <p className="text-xs text-center text-gray-400">Sign in to save feedback</p>}
          </div>

          {/* Safety notes */}
          {routineData?.safety_notes?.length > 0 && (
            <div className="rounded-xl p-4 space-y-1" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <p className="text-xs font-black text-violet-700 mb-2">🛡️ Safety Notes</p>
              {routineData.safety_notes.map((note, i) => (
                <p key={i} className="text-xs text-violet-600 flex items-start gap-1.5"><span>•</span>{note}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}