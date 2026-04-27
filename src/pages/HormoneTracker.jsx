import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import {
  Heart, ChevronLeft, ChevronRight, Sparkles, Loader2,
  Brain, Droplets, Zap, Moon, Sun, Activity, RefreshCw,
  Check, Calendar, AlertCircle, TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, LineChart, Line } from 'recharts';

// ── Phase Configuration ──────────────────────────────────────────────────────
const PHASES = [
  { key: 'menstrual',  label: 'Menstrual',  emoji: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  days: '1–5',  energy: 'Low',     icon: Moon },
  { key: 'follicular', label: 'Follicular', emoji: '🌱', color: '#10b981', bg: 'rgba(16,185,129,0.08)', days: '6–12', energy: 'Rising',  icon: Sun },
  { key: 'ovulation',  label: 'Ovulation',  emoji: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', days: '13–16',energy: 'Peak',    icon: Zap },
  { key: 'luteal',     label: 'Luteal',     emoji: '🌙', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', days: '17–28',energy: 'Declining',icon: Moon },
];

const SYMPTOMS_MAP = {
  menstrual:  ['Cramps', 'Fatigue', 'Bloating', 'Heavy flow', 'Mood swings', 'Back pain', 'Headache'],
  follicular: ['Clear skin', 'High energy', 'Positive mood', 'Better focus', 'Good sleep'],
  ovulation:  ['Peak energy', 'Confidence', 'Heightened senses', 'Slight cramping', 'Appetite change'],
  luteal:     ['Fatigue', 'Cravings', 'Mood swings', 'Bloating', 'Skin breakouts', 'Anxiety', 'Insomnia'],
};

const MOODS = ['😊 Happy', '😔 Low', '😤 Irritable', '😌 Calm', '😰 Anxious', '💪 Strong', '🤒 Unwell'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getCycleDay(startDate) {
  const d = differenceInDays(new Date(), parseISO(startDate));
  return (d % 28) + 1;
}

function getPhaseFromDay(cycleDay) {
  if (cycleDay <= 5) return 'menstrual';
  if (cycleDay <= 12) return 'follicular';
  if (cycleDay <= 16) return 'ovulation';
  return 'luteal';
}

function buildCycleTrendData(startDate, cycleLength = 28) {
  return Array.from({ length: cycleLength }, (_, i) => {
    const d = i + 1;
    const phase = getPhaseFromDay(d);
    const estrogen = d <= 5 ? 20 + d * 3 : d <= 14 ? 20 + d * 8 : d <= 16 ? 200 - d * 2 : 80 - d;
    const progesterone = d <= 14 ? 5 : d <= 21 ? 5 + (d - 14) * 18 : 5 + (28 - d) * 12;
    return { day: d, estrogen: Math.max(0, estrogen), progesterone: Math.max(0, progesterone), phase };
  });
}

// ── Calendar ─────────────────────────────────────────────────────────────────
function CycleCalendar({ startDate, cycleLength = 28 }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const getPhaseForDate = (day) => {
    if (!startDate) return null;
    const date = new Date(year, month, day);
    const diff = differenceInDays(date, parseISO(startDate));
    if (diff < 0) return null;
    const cycleDay = (diff % cycleLength) + 1;
    return getPhaseFromDay(cycleDay);
  };

  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-black text-sm">{format(viewDate, 'MMMM yyyy')}</p>
        <div className="flex gap-1">
          <button onClick={() => setViewDate(addDays(viewDate, -32))} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => setViewDate(addDays(viewDate, 32))} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-gray-400 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startWeekday }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const phase = getPhaseForDate(d);
          const pc = PHASES.find(p => p.key === phase);
          return (
            <div key={d} className="aspect-square flex flex-col items-center justify-center rounded-lg transition-all"
              style={{
                background: pc ? pc.bg : 'transparent',
                border: isToday(d) ? `2px solid ${pc?.color || '#f472b6'}` : '1.5px solid transparent',
              }}>
              <span className="text-[9px] leading-none">{pc?.emoji || ''}</span>
              <span className="text-[10px] font-bold mt-0.5" style={{ color: pc?.color || '#9ca3af' }}>{d}</span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {PHASES.map(p => (
          <div key={p.key} className="flex items-center gap-1 text-[9px] text-gray-500">
            <span>{p.emoji}</span>{p.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hormone Trend Chart ───────────────────────────────────────────────────────
function HormoneChart({ startDate, currentDay }) {
  const data = buildCycleTrendData(startDate);
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4">
      <p className="font-black text-sm mb-1">Hormone Trend Curve</p>
      <p className="text-[10px] text-gray-400 mb-3">Estimated estrogen & progesterone across your cycle</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={6} />
          <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} formatter={(v, n) => [Math.round(v), n]} />
          <Line type="monotone" dataKey="estrogen" stroke="#f472b6" strokeWidth={2} dot={false} name="Estrogen" />
          <Line type="monotone" dataKey="progesterone" stroke="#a78bfa" strokeWidth={2} dot={false} name="Progesterone" />
          {currentDay && (
            <Line type="monotone" dataKey={() => null} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1">
        {[['#f472b6','Estrogen'],['#a78bfa','Progesterone']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1 text-[9px] text-gray-400">
            <div className="w-3 h-0.5 rounded" style={{ background: c }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Orchestration Panel ────────────────────────────────────────────────────
function AIOrchestrationPanel({ user, cycleData, currentPhase, skinAnalysis, dietLogs, feedbackHistory }) {
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  const generateOrchestration = async () => {
    setLoading(true);
    const phaseConfig = PHASES.find(p => p.key === currentPhase);
    const cycleDay = cycleData?.start_date ? getCycleDay(cycleData.start_date) : '?';

    const prompt = `You are an expert AI wellness orchestrator for a skin + hormonal health app. Generate a comprehensive, deeply personalized daily brief for this user.

== USER CYCLE DATA ==
Current Phase: ${phaseConfig?.label} (Day ${cycleDay} of cycle)
Symptoms logged: ${(cycleData?.symptoms || []).join(', ') || 'none'}
Mood: ${cycleData?.mood || 'not logged'}
Energy: ${cycleData?.energy_level || 5}/10
Flow: ${cycleData?.flow_intensity || 'N/A'}

== SKIN ANALYSIS ==
${skinAnalysis ? `Skin type: ${skinAnalysis.skin_type}, Score: ${skinAnalysis.overall_score}/100, Acne: ${skinAnalysis.acne_level}/10, Oiliness: ${skinAnalysis.oiliness}/10, Dryness: ${skinAnalysis.dryness}/10, Redness: ${skinAnalysis.redness}/10` : 'No skin analysis available'}

== RECENT LIFESTYLE (last 7 days) ==
${dietLogs.slice(0,7).map(d => `${d.log_date}: water=${d.water_glasses}g, sleep=${d.sleep_hours}h, stress=${d.stress_level}/10, exercise=${d.exercise_minutes}m`).join('\n') || 'No lifestyle data'}

== SKINCARE FEEDBACK HISTORY ==
${feedbackHistory.slice(0,5).map(f => `${f.date}: codes=${(f.feedback_codes||[]).join(',')}`).join('\n') || 'No feedback history'}

Based on all this data, generate a deeply interconnected AI orchestration report that chains insights across ALL features:

1. phase_skin_connection: How this cycle phase is affecting skin RIGHT NOW (be specific with hormones — estrogen, progesterone, androgens)
2. routine_adjustment: Exactly what to add/remove from skincare routine THIS week due to phase + skin data
3. diet_for_phase: 3 specific foods to eat today and 2 to avoid — explain the hormonal reason
4. lifestyle_sync: How sleep, stress, exercise data correlates with the current skin + cycle state
5. prediction_next_phase: What will happen to skin when they transition to next phase + how to prepare
6. ai_action_chain: A step-by-step action plan for TODAY connecting routine → diet → lifestyle → cycle (5 steps max)
7. hormone_skin_score: A 0–100 score for how well the user's current lifestyle aligns with their cycle phase
8. warning_signals: Any concerning patterns detected across all data sources
9. tomorrow_brief: One sentence briefing for what to expect tomorrow based on cycle trajectory`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          phase_skin_connection: { type: 'string' },
          routine_adjustment: { type: 'object', properties: {
            add: { type: 'array', items: { type: 'string' } },
            remove: { type: 'array', items: { type: 'string' } },
            reason: { type: 'string' },
          }},
          diet_for_phase: { type: 'object', properties: {
            eat: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, reason: { type: 'string' } } } },
            avoid: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, reason: { type: 'string' } } } },
          }},
          lifestyle_sync: { type: 'string' },
          prediction_next_phase: { type: 'string' },
          ai_action_chain: { type: 'array', items: { type: 'object', properties: { step: { type: 'number' }, action: { type: 'string' }, feature: { type: 'string' }, priority: { type: 'string' } } } },
          hormone_skin_score: { type: 'number' },
          warning_signals: { type: 'array', items: { type: 'string' } },
          tomorrow_brief: { type: 'string' },
        },
      },
    });

    setAiReport(result);
    setLastGenerated(new Date());
    setLoading(false);
  };

  const phaseConfig = PHASES.find(p => p.key === currentPhase);

  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid rgba(167,139,250,0.3)', background: 'linear-gradient(145deg,rgba(167,139,250,0.04),rgba(244,114,182,0.04))' }}>
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-black text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" /> AI Cycle Orchestration
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Chains cycle → skin → diet → lifestyle → routine</p>
          </div>
          <button onClick={generateOrchestration} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black text-white ios-button-3d disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#a78bfa,#f472b6)' }}>
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing…</> : <><Sparkles className="w-3.5 h-3.5" />Run AI</>}
          </button>
        </div>

        {!aiReport && !loading && (
          <div className="text-center py-8 rounded-2xl bg-white/50 dark:bg-white/5">
            <div className="text-4xl mb-2">🔮</div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cross-feature AI analysis</p>
            <p className="text-xs text-gray-400 mt-1">Tap "Run AI" to get personalized insights that chain your cycle, skin, diet & lifestyle together</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Orchestrating all your health data…</p>
            <p className="text-xs text-gray-400 mt-1">This uses advanced AI — takes ~10 seconds</p>
          </div>
        )}

        {aiReport && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

            {/* Hormone-Skin Score */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke="url(#hsGrad)" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - aiReport.hormone_skin_score / 100)}`} />
                  <defs><linearGradient id="hsGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f472b6" /><stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-800 dark:text-gray-100">{aiReport.hormone_skin_score}</span>
                </div>
              </div>
              <div>
                <p className="font-black text-sm">Hormone-Skin Alignment Score</p>
                <p className="text-xs text-gray-500 mt-0.5">How well your lifestyle matches your current cycle phase</p>
              </div>
            </div>

            {/* Phase → Skin Connection */}
            <div className="p-4 rounded-2xl" style={{ background: phaseConfig?.bg, border: `1.5px solid ${phaseConfig?.color}30` }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: phaseConfig?.color }}>
                {phaseConfig?.emoji} {phaseConfig?.label} Phase → Skin Impact
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{aiReport.phase_skin_connection}</p>
            </div>

            {/* AI Action Chain */}
            {aiReport.ai_action_chain?.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <p className="font-black text-sm mb-3">⚡ Today's AI Action Chain</p>
                <div className="space-y-2">
                  {aiReport.ai_action_chain.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5"
                        style={{ background: `linear-gradient(135deg,#f472b6,#a78bfa)` }}>
                        {step.step || i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{step.action}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          {step.feature && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold">{step.feature}</span>}
                          {step.priority && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${step.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{step.priority}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Routine Adjustments */}
            {aiReport.routine_adjustment && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiReport.routine_adjustment.add?.length > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                    <p className="text-[10px] font-black text-emerald-700 mb-1.5">✅ Add to Routine</p>
                    {aiReport.routine_adjustment.add.map((item, i) => (
                      <p key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{item}</p>
                    ))}
                  </div>
                )}
                {aiReport.routine_adjustment.remove?.length > 0 && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20">
                    <p className="text-[10px] font-black text-red-700 mb-1.5">🚫 Remove from Routine</p>
                    {aiReport.routine_adjustment.remove.map((item, i) => (
                      <p key={i} className="text-xs text-gray-700 dark:text-gray-300">• {item}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Diet for Phase */}
            {aiReport.diet_for_phase && (
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <p className="font-black text-sm mb-2">🥗 Phase-Synced Diet Today</p>
                <div className="space-y-1 mb-2">
                  {aiReport.diet_for_phase.eat?.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-emerald-500 font-black flex-shrink-0 mt-0.5">✓</span>
                      <span><strong>{item.food}</strong> — {item.reason}</span>
                    </div>
                  ))}
                </div>
                {aiReport.diet_for_phase.avoid?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                    {aiReport.diet_for_phase.avoid.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-red-400 font-black flex-shrink-0 mt-0.5">✗</span>
                        <span><strong>{item.food}</strong> — {item.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lifestyle Sync */}
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
              <p className="text-[10px] font-black text-blue-700 mb-1">📊 Lifestyle ↔ Cycle Correlation</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{aiReport.lifestyle_sync}</p>
            </div>

            {/* Next Phase Prediction */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20">
              <p className="text-[10px] font-black text-amber-700 mb-1">🔭 Next Phase Prediction</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{aiReport.prediction_next_phase}</p>
            </div>

            {/* Warning Signals */}
            {aiReport.warning_signals?.length > 0 && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-[10px] font-black text-red-700 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Warning Signals</p>
                {aiReport.warning_signals.map((w, i) => (
                  <p key={i} className="text-xs text-red-700 dark:text-red-300">⚠️ {w}</p>
                ))}
              </div>
            )}

            {/* Tomorrow Brief */}
            {aiReport.tomorrow_brief && (
              <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 text-center">
                <p className="text-[10px] font-black text-violet-600 mb-0.5">🌙 Tomorrow's Brief</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic">{aiReport.tomorrow_brief}</p>
              </div>
            )}

            {lastGenerated && (
              <p className="text-[10px] text-gray-400 text-right">Generated {format(lastGenerated, 'HH:mm')}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HormoneTracker() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: cycleData, isLoading: cycleLoading } = useQuery({
    queryKey: ['cycleData', user?.email],
    queryFn: async () => {
      const cycles = await base44.entities.CycleData.filter({ user_email: user.email }, '-created_date', 1);
      return cycles.length > 0 ? cycles[0] : null;
    },
    enabled: !!user?.email,
    placeholderData: (prev) => prev,
  });

  const { data: skinAnalysis } = useQuery({
    queryKey: ['latestSkinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: dietLogs = [] } = useQuery({
    queryKey: ['dietLogs7', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 7),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback5', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 5),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => cycleData?.id
      ? base44.entities.CycleData.update(cycleData.id, data)
      : base44.entities.CycleData.create({ ...data, user_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cycleData', user?.email]);
      queryClient.invalidateQueries(['dietLogs7', user?.email]);
    },
  });

  const effectiveStartDate = cycleData?.start_date || null;
  const currentPhase = effectiveStartDate ? getPhaseFromDay(getCycleDay(effectiveStartDate)) : null;
  const cycleDay = effectiveStartDate ? getCycleDay(effectiveStartDate) : null;
  const phaseConfig = PHASES.find(p => p.key === (currentPhase || 'follicular'));
  const daysUntilNext = currentPhase === 'menstrual' ? 6 - cycleDay : currentPhase === 'follicular' ? 13 - cycleDay : currentPhase === 'ovulation' ? 17 - cycleDay : 29 - cycleDay;

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [energy, setEnergy] = useState(5);
  const [startDateInput, setStartDateInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cycleData) {
      setSelectedSymptoms(cycleData.symptoms || []);
      setSelectedMood(cycleData.mood || '');
      setEnergy(cycleData.energy_level || 5);
      setStartDateInput(cycleData.start_date || '');
    }
  }, [cycleData?.id]);

  const handleSave = async () => {
    setSaving(true);
    const newPhase = startDateInput ? getPhaseFromDay(getCycleDay(startDateInput)) : 'follicular';
    await saveMutation.mutateAsync({
      user_email: user.email,
      start_date: startDateInput,
      cycle_length: 28,
      current_phase: newPhase,
      symptoms: selectedSymptoms,
      mood: selectedMood,
      energy_level: energy,
    });
    setSaving(false);
  };

  // Sync to DietLog for LifestyleInsights correlation
  useEffect(() => {
    if (!user || !cycleData) return;
    base44.entities.DietLog.filter({ user_email: user.email, log_date: today }, '-created_date', 1).then(logs => {
      const log = logs[0];
      if (log?.id) {
        base44.entities.DietLog.update(log.id, { mood: selectedMood || log.mood });
      }
    });
  }, [selectedMood, user, cycleData]);

  const TABS = [
    { key: 'today', label: 'Today', emoji: '📅' },
    { key: 'calendar', label: 'Calendar', emoji: '🗓️' },
    { key: 'hormones', label: 'Hormones', emoji: '🧬' },
    { key: 'ai', label: 'AI Insights', emoji: '🤖' },
  ];

  // Still loading — don't flash incorrect content
  if (user && cycleLoading) return (
    <div className="max-w-2xl mx-auto pt-20 text-center">
      <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" />
      <p className="text-sm text-gray-400 mt-3">Loading your cycle data…</p>
    </div>
  );

  // No cycle data yet — show setup prompt instead of pre-filled page
  if (user && cycleData === null) return (
    <div className="max-w-2xl mx-auto pb-10 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'rgba(244,114,182,0.1)', border: '1.5px solid rgba(244,114,182,0.3)' }}>🌙</div>
        <div>
          <h1 className="text-2xl font-black">Cycle Intelligence</h1>
          <p className="text-sm text-gray-500">Hormones × Skin × Diet × Lifestyle — AI-chained</p>
        </div>
      </div>

      <div className="rounded-3xl p-8 text-center bg-white border border-gray-100 shadow-sm">
        <div className="text-5xl mb-4">🗓️</div>
        <h2 className="text-xl font-black mb-2">Set Up Your Cycle</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
          Enter the first day of your last period to start tracking your cycle phases, hormone trends, and personalised skin + wellness insights.
        </p>
        <div className="max-w-xs mx-auto space-y-4">
          <div className="text-left">
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Last Period Start Date</label>
            <input type="date" value={startDateInput} max={today}
              onChange={e => setStartDateInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-pink-300" />
          </div>
          <button onClick={async () => {
            setSaving(true);
            const newPhase = startDateInput ? getPhaseFromDay(getCycleDay(startDateInput)) : 'follicular';
            await saveMutation.mutateAsync({
              user_email: user.email,
              start_date: startDateInput,
              cycle_length: 28,
              current_phase: newPhase,
              symptoms: [],
              energy_level: 5,
            });
            setSaving(false);
          }} disabled={saving || !startDateInput}
            className="w-full py-3.5 rounded-2xl font-black text-white ios-button-3d disabled:opacity-50 text-sm"
            style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            {saving ? 'Setting up…' : '🌙 Start Tracking My Cycle'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="max-w-2xl mx-auto pt-20 text-center px-4">
      <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🌙</div>
      <h2 className="text-2xl font-black mb-2">Cycle Intelligence</h2>
      <p className="text-gray-500 mb-6">Sign in to unlock AI-powered hormonal cycle tracking synced with your skin, diet & lifestyle</p>
      <button onClick={() => base44.auth.redirectToLogin()} className="px-8 py-3 rounded-2xl font-black text-white" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>Sign In</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-10 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: phaseConfig?.bg, border: `1.5px solid ${phaseConfig?.color}40` }}>
          {phaseConfig?.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-black">Cycle Intelligence</h1>
          <p className="text-sm text-gray-500">Hormones × Skin × Diet × Lifestyle — AI-chained</p>
        </div>
      </div>

      {/* Phase Hero */}
      <div className="rounded-3xl p-5 overflow-hidden" style={{ background: `linear-gradient(135deg,${phaseConfig?.bg},rgba(255,255,255,0.6))`, border: `2px solid ${phaseConfig?.color}30` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Current Phase</p>
            <p className="text-3xl font-black" style={{ color: phaseConfig?.color }}>{phaseConfig?.label}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{phaseConfig?.days} days · {phaseConfig?.energy} energy</p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: phaseConfig?.color + '20' }}>{phaseConfig?.emoji}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Cycle Day', val: cycleDay || '—', color: phaseConfig?.color },
            { label: 'Days to Next', val: Math.max(0, daysUntilNext) || '—', color: '#9ca3af' },
            { label: 'Energy', val: `${cycleData?.energy_level || '—'}/10`, color: phaseConfig?.color },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2.5 text-center bg-white/60 dark:bg-white/10">
              <p className="text-base font-black" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 rounded-2xl overflow-x-auto" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? '#ec4899' : '#9ca3af',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            <span>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <motion.div key="today" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Cycle Start Date */}
            <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-600 mb-2">Last Period Start Date</p>
              <input type="date" value={startDateInput} max={today}
                onChange={e => setStartDateInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-pink-300" />
            </div>

            {/* Symptoms */}
            <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Today's Symptoms</p>
              <div className="flex flex-wrap gap-1.5">
                {(SYMPTOMS_MAP[currentPhase] || []).map(sym => {
                  const on = selectedSymptoms.includes(sym);
                  return (
                    <button key={sym} onClick={() => setSelectedSymptoms(prev => on ? prev.filter(s => s !== sym) : [...prev, sym])}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{ background: on ? phaseConfig?.color : '#f0f0f0', color: on ? '#fff' : '#9ca3af' }}>
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood */}
            <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Mood</p>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map(m => (
                  <button key={m} onClick={() => setSelectedMood(selectedMood === m ? '' : m)}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: selectedMood === m ? '#f472b6' : '#f9f9f9', color: selectedMood === m ? '#fff' : '#6b7280' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Energy Level</p>
                <span className="text-sm font-black" style={{ color: phaseConfig?.color }}>{energy}/10</span>
              </div>
              <input type="range" min="1" max="10" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5"><span>Exhausted</span><span>Energised</span></div>
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 rounded-2xl font-black text-white ios-button-3d disabled:opacity-50 text-sm"
              style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
              {saving ? 'Saving…' : '💾 Save Today\'s Data'}
            </button>

            {/* Skincare Advice for phase */}
            <div className="rounded-2xl p-4" style={{ background: phaseConfig?.bg, border: `1px solid ${phaseConfig?.color}30` }}>
              <p className="font-black text-sm mb-2" style={{ color: phaseConfig?.color }}>💅 Skincare for {phaseConfig?.label} Phase</p>
              {currentPhase === 'menstrual' && <p className="text-xs text-gray-700 dark:text-gray-300">Focus on barrier repair. Use gentle cleansers + rich moisturizers. Avoid actives — skin is most sensitive now (cortisol + low estrogen).</p>}
              {currentPhase === 'follicular' && <p className="text-xs text-gray-700 dark:text-gray-300">Rising estrogen = great skin days! Introduce Vitamin C, light BHA, treatment serums. Best time to start new actives.</p>}
              {currentPhase === 'ovulation' && <p className="text-xs text-gray-700 dark:text-gray-300">Peak estrogen = peak skin clarity. Skin can tolerate stronger actives — retinol, AHA. Maintain SPF 50+ for UV protection.</p>}
              {currentPhase === 'luteal' && <p className="text-xs text-gray-700 dark:text-gray-300">Progesterone rises → increased sebum → breakout risk. Use Salicylic acid spot treatment, calming niacinamide. Reduce heavy creams.</p>}
            </div>

            {/* All 4 Phases Overview */}
            <div>
              <p className="font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">Your 28-Day Cycle Map</p>
              <div className="grid grid-cols-2 gap-2">
                {PHASES.map(p => {
                  const PhaseIcon = p.icon;
                  const isCurrent = p.key === currentPhase;
                  return (
                    <div key={p.key} className="p-3 rounded-2xl transition-all" style={{ background: p.bg, border: `1.5px solid ${isCurrent ? p.color : p.color + '30'}`, opacity: isCurrent ? 1 : 0.7 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{p.emoji}</span>
                        <p className="font-black text-xs" style={{ color: p.color }}>{p.label}</p>
                        {isCurrent && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white ml-auto" style={{ background: p.color }}>NOW</span>}
                      </div>
                      <p className="text-[10px] text-gray-500">Days {p.days} · {p.energy} energy</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CycleCalendar startDate={cycleData?.start_date} cycleLength={28} />
          </motion.div>
        )}

        {/* HORMONES TAB */}
        {activeTab === 'hormones' && (
          <motion.div key="hormones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <HormoneChart startDate={cycleData?.start_date} currentDay={cycleDay} />

            {/* Hormone explanation */}
            <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3">
              <p className="font-black text-sm">🧬 Hormone → Skin Science</p>
              {[
                { phase: 'Menstrual', hormone: '⬇️ Estrogen + Progesterone drop', effect: 'Skin barrier weakens, dryness peaks, inflammation rises. Avoid actives.' },
                { phase: 'Follicular', hormone: '⬆️ Estrogen rises', effect: 'Collagen production peaks, skin glows, pores tighten. Best phase for active ingredients.' },
                { phase: 'Ovulation', hormone: '⚡ Estrogen peak + LH surge', effect: 'Maximum skin hydration + radiance. Testosterone slightly rises → minor oil increase.' },
                { phase: 'Luteal', hormone: '🌙 Progesterone dominates', effect: 'Sebum production increases → clogged pores → breakouts. Niacinamide + BHA are your best friends.' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-gray-700 dark:text-gray-200">{item.phase}</span>
                    <span className="text-[10px] text-gray-500">{item.hormone}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.effect}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI INSIGHTS TAB */}
        {activeTab === 'ai' && (
          <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AIOrchestrationPanel
              user={user}
              cycleData={cycleData}
              currentPhase={currentPhase}
              skinAnalysis={skinAnalysis}
              dietLogs={dietLogs}
              feedbackHistory={feedbackHistory}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}