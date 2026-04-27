import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperationRecovery } from '@/hooks/useOperationRecovery';
import {
  Sparkles, Loader2, Sun, Moon, Check, Trash2,
  ShieldCheck, TrendingUp, RefreshCw, Save, ListChecks,
  Zap, ArrowRight, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DailyFeedbackPanel from '@/components/routine/DailyFeedbackPanel';
import WeekPlanGrid from '@/components/routine/WeekPlanGrid';
import StepProductPicker from '@/components/routine/StepProductPicker';
import { computeUserLevel } from '@/lib/routineAdaptation';
import { format } from 'date-fns';
import { backgroundOps } from '@/lib/BackgroundOperations';
import { cacheRoutineData, getCachedRoutineData, clearRoutineCache } from '@/lib/routineSessionCache';
import RoutineTracker from '@/components/routine/RoutineTracker';
import ConcentrationLevelGuide from '@/components/routine/ConcentrationLevelGuide';
import AdvancedTolerancePhases from '@/components/routine/AdvancedTolerancePhases';
import SkinCyclingProtocol from '@/components/routine/SkinCyclingProtocol';
import SafetyGuidelinesChecklist from '@/components/routine/SafetyGuidelinesChecklist';
import AdvancedSkinAdaptations from '@/components/routine/AdvancedSkinAdaptations';
import IngredientProgressionChart from '@/components/routine/IngredientProgressionChart';
import { usePageState } from '@/lib/pageStateContext';

// ── Shared state ──────────────────────────────────────────────────────────────
const initializeRoutineState = () => {
  const cached = localStorage.getItem('skinRoutineCache');
  if (cached) {
    try { return { generating: false, routineData: JSON.parse(cached) }; }
    catch { localStorage.removeItem('skinRoutineCache'); }
  }
  return { generating: false, routineData: null };
};

let sharedRoutineState = initializeRoutineState();
const routineListeners = new Set();
const updateRoutineState = (updates) => {
  sharedRoutineState = { ...sharedRoutineState, ...updates };
  routineListeners.forEach(l => l(sharedRoutineState));
};

// ── AI Prompt ─────────────────────────────────────────────────────────────────
function buildRoutinePrompt(analysis, feedbackHistory, userLevel = {}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const SIGNAL_MAP = { 1:'positive',2:'positive',8:'neutral',3:'mild_damage',5:'mild_damage',4:'high_damage',6:'high_damage',7:'oil',9:'breakout',10:'breakout' };
  const recentCodes = feedbackHistory.flatMap(f => f.feedback_codes || []);
  const signals = recentCodes.map(c => SIGNAL_MAP[c]).filter(Boolean);
  const negativeCount = signals.filter(s => ['mild_damage','high_damage','breakout'].includes(s)).length;
  const positiveCount = signals.filter(s => s === 'positive').length;
  const hasHighDamage = signals.includes('high_damage');
  const hasMildDamage = signals.includes('mild_damage');
  const hasBreakout   = signals.includes('breakout');
  const hasOil        = signals.includes('oil');
  const skinProfile = analysis
    ? `Skin type: ${analysis.skin_type}, Score: ${analysis.overall_score}/100, Acne: ${analysis.acne_level}/10, Dryness: ${analysis.dryness}/10, Oiliness: ${analysis.oiliness}/10, Sensitivity: ${analysis.sensitivity}/10, Dark spots: ${analysis.dark_spots}/10, Redness: ${analysis.redness}/10. Concerns: ${(analysis.priority_concerns||[]).join(', ')||'none'}.`
    : 'No skin analysis — assume balanced/normal skin, use gentle defaults.';
  const feedbackContext = feedbackHistory.length > 0
    ? `Last ${feedbackHistory.length} days: ${signals.join(', ')}. Positive: ${positiveCount}, Negative: ${negativeCount}. High damage: ${hasHighDamage}, Mild damage: ${hasMildDamage}, Breakout: ${hasBreakout}, Oil: ${hasOil}.`
    : 'No feedback history. Start at Level 1.';
  const computedLevel = userLevel.currentLevel || 'Level 1';
  const isRecovery    = userLevel.recoveryMode || false;
  const frequencyLabel = userLevel.frequencyLabel || '1–2x / week';

  return `You are an advanced AI dermatologist. Generate a safe, minimal, rotational skincare routine.
TODAY: ${today} | LEVEL: ${computedLevel} → ${frequencyLabel} | RECOVERY: ${isRecovery ? 'YES — no actives' : 'NO'}
SKIN: ${skinProfile}
FEEDBACK: ${feedbackContext}
RULES: Max 5 morning steps. ONE active per night. Rotate with recovery days. Level 1=1-2x/week, Level 2=3-4x, Level 3=5-7x. Never Retinol+BP or Retinol+AHA same night. Moisturizer every day. Add frequency_note per night day.
Return strict JSON: { skin_summary:{skin_type,concerns,sensitivity_level,current_barrier_status}, morning_routine:[{step,name,product_type,tip,key_ingredients}], night_week_plan:[{day_label,day_type,active_name,concentration_level,frequency_note,steps:[{name,active,tip}]}], weekly_addons:[{name,frequency,tip}], todays_adjustment:{changed,summary,reason}, safety_notes:[], adaptive_guidance:{if_improves,if_worsens}, recovery_mode_active }
Generate 7 days Mon–Sun. Be conservative. Barrier health first.`;
}

// ── Collapsible Section ───────────────────────────────────────────────────────
function Section({ title, icon, emoji, defaultOpen = false, children, badge, resetKey }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { setOpen(defaultOpen); }, [resetKey]);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(255,255,255,0.85)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-base">{emoji}</span>}
          {icon}
          <span className="font-bold text-sm text-gray-800">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Morning Steps ─────────────────────────────────────────────────────────────
function MorningSteps({ steps, userEmail, onProductsSelected }) {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [country, setCountry] = useState('IN');
  if (!steps?.length) return null;
  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
          className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="flex gap-3 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
              {step.step || i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800">{step.name}</p>
              <p className="text-[11px] text-gray-400">{step.product_type}</p>
              {step.key_ingredients?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {step.key_ingredients.slice(0, 3).map((ing, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{ing}</span>
                  ))}
                </div>
              )}
              {step.tip && <p className="text-[11px] text-amber-600 mt-1">💡 {step.tip}</p>}
            </div>
          </div>
          <StepProductPicker stepName={step.name} stepType={step.product_type} country={country}
            onCountryChange={setCountry} selectedProduct={selectedProducts[i] || null} userEmail={userEmail}
            onProductSelect={(p) => { const u = { ...selectedProducts, [i]: p }; setSelectedProducts(u); onProductsSelected?.(u); }} />
          {selectedProducts[i] && (
            <div className="mt-2 p-2 rounded-xl bg-pink-50 border border-pink-100 text-[10px] flex flex-wrap gap-2">
              {selectedProducts[i].apply_time && <span>⏱ <strong>{selectedProducts[i].apply_time}</strong></span>}
              {selectedProducts[i].price_local && <span>💰 <strong>{selectedProducts[i].price_local}</strong></span>}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Weekly Addons ─────────────────────────────────────────────────────────────
function WeeklyAddons({ addons, userEmail }) {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [country, setCountry] = useState('IN');
  if (!addons?.length) return null;
  return (
    <div className="space-y-2">
      {addons.map((addon, i) => (
        <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)' }}>
          <div className="flex items-start gap-2 mb-2">
            <span className="text-base">🧪</span>
            <div>
              <p className="font-semibold text-sm text-gray-800">{addon.name}</p>
              <p className="text-[11px] text-teal-600">{addon.frequency}</p>
              {addon.tip && <p className="text-[11px] text-gray-400 mt-0.5">{addon.tip}</p>}
            </div>
          </div>
          <StepProductPicker stepName={addon.name} stepType="weekly addon" country={country}
            onCountryChange={setCountry} selectedProduct={selectedProducts[i] || null} userEmail={userEmail}
            onProductSelect={(p) => setSelectedProducts(prev => ({ ...prev, [i]: p }))} />
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SkinRoutine() {
  useOperationRecovery();
  const [user, setUser] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [selectedMorningProducts, setSelectedMorningProducts] = useState({});
  const [showRegeneratePrompt, setShowRegeneratePrompt] = useState(false);
  const isCleared = React.useRef(false);
  const queryClient = useQueryClient();
  const { pageKey } = usePageState();

  const [localState, setLocalState] = useState(sharedRoutineState);
  useEffect(() => {
    routineListeners.add(setLocalState);
    return () => routineListeners.delete(setLocalState);
  }, []);
  const { generating, routineData } = localState;

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      const cached = getCachedRoutineData(u.email);
      if (cached && !sharedRoutineState.routineData) updateRoutineState({ routineData: cached });
      
      // Check for new analysis signal
      const newAnalysis = localStorage.getItem('newAnalysisForRoutine');
      if (newAnalysis && !isCleared.current) {
        setShowRegeneratePrompt(true);
      }
    }).catch(() => {});
  }, []);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['skinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: savedRoutine } = useQuery({
    queryKey: ['skinRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 5),
    enabled: !!user?.email,
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayFeedback = feedbackHistory.find(f => f.date === today) || null;
  const userLevel = computeUserLevel(feedbackHistory);

  useEffect(() => {
    if (isCleared.current) return;
    if (savedRoutine?.steps) localStorage.setItem('skinRoutineCache', JSON.stringify(savedRoutine.steps));
  }, [savedRoutine]);

  useEffect(() => {
    if (routineData) {
      localStorage.setItem('skinRoutineCache', JSON.stringify(routineData));
      if (user) cacheRoutineData(user.email, routineData);
    }
  }, [routineData, user]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return savedRoutine?.id
        ? base44.entities.SkinRoutine.update(savedRoutine.id, data)
        : base44.entities.SkinRoutine.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries(['skinRoutine']),
  });

  const generateRoutine = async () => {
    isCleared.current = false;
    updateRoutineState({ generating: true });
    backgroundOps.start('skinRoutine', '✨ Skin Routine', { userEmail: user?.email });
    const prompt = buildRoutinePrompt(latestAnalysis, feedbackHistory, userLevel);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          skin_summary: { type: 'object', properties: { skin_type:{type:'string'}, concerns:{type:'array',items:{type:'string'}}, sensitivity_level:{type:'string'}, current_barrier_status:{type:'string'} } },
          morning_routine: { type: 'array', items: { type: 'object', properties: { step:{type:'number'}, name:{type:'string'}, product_type:{type:'string'}, tip:{type:'string'}, key_ingredients:{type:'array',items:{type:'string'}} } } },
          night_week_plan: { type: 'array', items: { type: 'object', properties: { day_label:{type:'string'}, day_type:{type:'string'}, active_name:{type:'string'}, concentration_level:{type:'string'}, frequency_note:{type:'string'}, steps:{type:'array',items:{type:'object',properties:{name:{type:'string'},active:{type:'boolean'},tip:{type:'string'}}}} } } },
          weekly_addons: { type: 'array', items: { type: 'object', properties: { name:{type:'string'}, frequency:{type:'string'}, tip:{type:'string'} } } },
          todays_adjustment: { type: 'object', properties: { changed:{type:'boolean'}, summary:{type:'string'}, reason:{type:'string'} } },
          safety_notes: { type: 'array', items: { type: 'string' } },
          adaptive_guidance: { type: 'object', properties: { if_improves:{type:'string'}, if_worsens:{type:'string'} } },
          recovery_mode_active: { type: 'boolean' },
        },
      },
    });
    updateRoutineState({ routineData: result, generating: false });
    localStorage.setItem('skinRoutineCache', JSON.stringify(result));
    backgroundOps.complete('skinRoutine', { routineResult: result });
    if (user) {
      saveMutation.mutate({
        user_email: user.email, routine_type: 'morning',
        skin_type: result.skin_summary?.skin_type || '',
        steps: result,
        routine_summary: result.skin_summary?.current_barrier_status || '',
        skin_concerns: result.skin_summary?.concerns || [],
      });
    }
  };

  const clearRoutine = async () => {
    isCleared.current = true;
    updateRoutineState({ routineData: null });
    localStorage.removeItem('skinRoutineCache');
    clearRoutineCache();
    if (savedRoutine?.id) {
      await base44.entities.SkinRoutine.delete(savedRoutine.id);
      queryClient.invalidateQueries(['skinRoutine']);
    }
  };

  const handleRegenerateFromNewAnalysis = async () => {
    localStorage.removeItem('newAnalysisForRoutine');
    setShowRegeneratePrompt(false);
    await generateRoutine();
  };

  const levelColor = { 'Level 1': '#10b981', 'Level 2': '#f59e0b', 'Level 3': '#f472b6' };

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-10">

      {/* ── Regenerate Prompt Modal ── */}
      <AnimatePresence>
        {showRegeneratePrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShowRegeneratePrompt(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="fixed inset-x-4 top-1/4 z-50 rounded-3xl overflow-hidden shadow-2xl max-w-md mx-auto"
              style={{ background: '#ffffff' }}
            >
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'rgba(244,114,182,0.15)', border: '1.5px solid rgba(244,114,182,0.3)' }}>
                    🔬
                  </div>
                  <div>
                    <p className="font-black text-base text-gray-900">New Skin Analysis</p>
                    <p className="text-[11px] text-gray-400">Your skin has changed</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Your new skin analysis is ready. Would you like to regenerate your routine based on the updated results?
                </p>

                <div className="flex gap-2">
                  <button onClick={() => setShowRegeneratePrompt(false)}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                    style={{ background: '#f5f5f5', color: '#6b7280' }}>
                    Later
                  </button>
                  <button onClick={handleRegenerateFromNewAnalysis}
                    className="flex-1 py-3 rounded-2xl font-black text-white text-sm ios-button-3d"
                    style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                    Regenerate
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Hero Header Card ── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#fff5fb,#f5f0ff)', border: '1px solid rgba(244,114,182,0.18)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
        <div className="p-5">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900">Skin Routine</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">Minimal · Rotational · Barrier-First · Adaptive</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Level badge */}
              <div className="px-3 py-1.5 rounded-full text-[11px] font-black text-white"
                style={{ background: levelColor[userLevel.currentLevel] || '#10b981' }}>
                {userLevel.currentLevel}
              </div>
              {routineData && (
                <button onClick={clearRoutine} className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-50 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Skin profile mini-row */}
          {latestAnalysis && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 capitalize">{latestAnalysis.skin_type}</span>
              <span className="text-[11px] font-semibold text-gray-500">Score: <strong className="text-gray-800">{latestAnalysis.overall_score}/100</strong></span>
              {latestAnalysis.acne_level > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Acne-Prone</span>}
              {latestAnalysis.sensitivity > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold">Sensitive</span>}
              {latestAnalysis.dryness > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 font-semibold">Dry</span>}
              {latestAnalysis.oiliness > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold">Oily</span>}
            </div>
          )}

          {/* Feedback signal mini-row */}
          {feedbackHistory.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] text-gray-400">Last {feedbackHistory.length} days:</span>
              {feedbackHistory.slice(0, 5).map((f, i) => {
                const hasBad = (f.feedback_codes || []).some(c => [4,6,9,10].includes(c));
                const hasGood = (f.feedback_codes || []).some(c => [1,2].includes(c));
                return (
                  <div key={i} className="w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-black"
                    style={{ background: hasBad ? '#fef2f2' : hasGood ? '#f0fdf4' : '#f9fafb', color: hasBad ? '#ef4444' : hasGood ? '#22c55e' : '#9ca3af', border: `1.5px solid ${hasBad ? '#fca5a5' : hasGood ? '#86efac' : '#e5e7eb'}` }}>
                    {format(new Date(f.date + 'T00:00:00'), 'E')[0]}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          {!latestAnalysis && user ? (
            <Link to="/SkinAnalysis" className="block">
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white ios-button-3d"
                style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                <span>🔬</span> Scan Your Skin First
              </div>
              <p className="text-center text-[11px] text-gray-400 mt-1.5">A skin analysis is required to generate your personalized routine</p>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={generateRoutine} disabled={generating || !latestAnalysis}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white ios-button-3d disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</>
                  : <><Sparkles className="w-4 h-4" />{routineData ? 'Regenerate' : 'Generate Routine'}</>}
              </button>
              {(routineData || savedRoutine?.steps) && (
                <button onClick={() => setShowTracker(t => !t)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all"
                  style={{ background: showTracker ? 'rgba(167,139,250,0.12)' : '#f5f5f5', color: showTracker ? '#7c3aed' : '#6b7280', border: showTracker ? '1.5px solid rgba(167,139,250,0.4)' : '1.5px solid transparent' }}>
                  <ListChecks className="w-4 h-4" />
                  {showTracker ? 'Hide' : 'Track'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tracker ── */}
      <AnimatePresence>
        {showTracker && (routineData || savedRoutine?.steps) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(145deg,#faf5ff,#f5f3ff)', border: '1.5px solid rgba(167,139,250,0.25)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-violet-100">
                <ListChecks className="w-4 h-4 text-violet-500" />
                <p className="font-black text-sm text-violet-800">Today's Tracker</p>
                <p className="text-[10px] text-violet-400 ml-1">· resets daily</p>
              </div>
              <div className="p-4">
                <RoutineTracker routineData={routineData || savedRoutine?.steps} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Routine Output ── */}
      {routineData && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">

          {/* Saved chip */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Save className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-700">Saved</span>
            {savedRoutine?.updated_date && (
              <span className="ml-auto text-[10px] text-gray-400">{format(new Date(savedRoutine.updated_date), 'MMM d, HH:mm')}</span>
            )}
          </div>

          {/* Recovery / Adjustment alert */}
          {routineData.recovery_mode_active && (
            <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-red-700">🚨 Recovery Mode</p>
                <p className="text-xs text-red-600 mt-0.5">All actives paused. Gentle cleanse + moisturizer only.</p>
              </div>
            </div>
          )}
          {!routineData.recovery_mode_active && routineData.todays_adjustment?.changed && (
            <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.25)' }}>
              <RefreshCw className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-violet-700">📊 Adjusted today</p>
                <p className="text-xs text-gray-600 mt-0.5">{routineData.todays_adjustment.summary}</p>
              </div>
            </div>
          )}

          {/* Advanced Tolerance System */}
          <Section title="Advanced Tolerance-Based System" emoji="🚀" defaultOpen={false} resetKey={pageKey}>
            <AdvancedTolerancePhases />
          </Section>

          {/* 4-Night Skin Cycling */}
          <Section title="4-Night Skin Cycling Protocol" emoji="🌙" defaultOpen={false} resetKey={pageKey}>
            <SkinCyclingProtocol />
          </Section>

          {/* Ingredient Progression */}
          <Section title="Ingredient Progression Chart" emoji="📊" defaultOpen={false} resetKey={pageKey}>
            <IngredientProgressionChart />
          </Section>

          {/* Safety Guidelines */}
          <Section title="Safety & Irritation Guidelines" emoji="🛡️" defaultOpen={false} resetKey={pageKey}>
            <SafetyGuidelinesChecklist />
          </Section>

          {/* Advanced Adaptations */}
          <Section title="Advanced Adaptations (Skin Type, Climate, Hormones)" emoji="🔧" defaultOpen={false} resetKey={pageKey}>
            <AdvancedSkinAdaptations />
          </Section>

          {/* Level & Frequency Guide */}
          <ConcentrationLevelGuide currentLevel={userLevel.currentLevel} />

          {/* Skin Summary */}
          {routineData.skin_summary && (
            <Section title="Skin Profile" emoji="🧬" resetKey={pageKey}>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 capitalize">{routineData.skin_summary.skin_type} Skin</span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${routineData.skin_summary.sensitivity_level === 'high' ? 'bg-red-100 text-red-600' : routineData.skin_summary.sensitivity_level === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {routineData.skin_summary.sensitivity_level} sensitivity
                </span>
                {(routineData.skin_summary.concerns || []).map((c, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{c}</span>
                ))}
              </div>
              {routineData.skin_summary.current_barrier_status && (
                <p className="text-xs text-gray-600 mt-2">🛡️ {routineData.skin_summary.current_barrier_status}</p>
              )}
            </Section>
          )}

          {/* Morning Routine */}
          <Section title="Morning Routine" emoji="☀️" defaultOpen={true} resetKey={pageKey}
            badge={<span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold ml-1">{routineData.morning_routine?.length || 0} steps</span>}>
            <MorningSteps steps={routineData.morning_routine} userEmail={user?.email}
              onProductsSelected={(products) => {
                setSelectedMorningProducts(products);
                saveMutation.mutate({ user_email: user.email, routine_type: 'morning', skin_type: routineData.skin_summary?.skin_type || '', steps: routineData, routine_summary: routineData.skin_summary?.current_barrier_status || '', skin_concerns: routineData.skin_summary?.concerns || [] });
              }} />
          </Section>

          {/* Night 7-Day Plan */}
          {routineData.night_week_plan?.length > 0 && (
            <Section title="Night Routine · 7 Days" emoji="🌙" defaultOpen={true} resetKey={pageKey}
              badge={<span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold ml-1">rotation</span>}>
              <WeekPlanGrid weekPlan={routineData.night_week_plan} userEmail={user?.email} />
            </Section>
          )}

          {/* Weekly Add-ons */}
          {routineData.weekly_addons?.length > 0 && (
            <Section title="Weekly Add-ons" emoji="🧪" resetKey={pageKey}>
              <WeeklyAddons addons={routineData.weekly_addons} userEmail={user?.email} />
            </Section>
          )}

          {/* Safety + Guidance */}
          {(routineData.safety_notes?.length > 0 || routineData.adaptive_guidance) && (
            <Section title="Safety & Guidance" emoji="🛡️" resetKey={pageKey}>
              {routineData.safety_notes?.map((note, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700 mb-1.5">
                  <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>{note}
                </div>
              ))}
              {routineData.adaptive_guidance && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50">
                    <p className="text-[10px] font-bold text-emerald-600 mb-1">✅ If improves</p>
                    <p className="text-[11px] text-gray-700">{routineData.adaptive_guidance.if_improves}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-50">
                    <p className="text-[10px] font-bold text-red-500 mb-1">⚠️ If worsens</p>
                    <p className="text-[11px] text-gray-700">{routineData.adaptive_guidance.if_worsens}</p>
                  </div>
                </div>
              )}
            </Section>
          )}
        </motion.div>
      )}

      {/* ── Daily Feedback ── */}
      {user && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(244,114,182,0.2)', background: 'rgba(255,255,255,0.9)' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(244,114,182,0.12)' }}>
            <RefreshCw className="w-4 h-4 text-pink-400" />
            <p className="font-bold text-sm text-gray-800">Daily Skin Feedback</p>
            {todayFeedback && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">Logged today ✓</span>}
          </div>
          <div className="p-4">
            <DailyFeedbackPanel userEmail={user.email} todayFeedback={todayFeedback} onFeedbackSaved={generateRoutine} />
          </div>
        </div>
      )}

      {/* ── Routine Intelligence CTA ── */}
      <Link to="/RoutineIntelligence">
        <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer hover:scale-[1.01] transition-all"
          style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.1),rgba(244,114,182,0.08))', border: '1px solid rgba(167,139,250,0.25)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-violet-700">Routine Intelligence</p>
              <p className="text-[11px] text-violet-500">Analytics · Barrier · Forecasts</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-violet-400" />
        </div>
      </Link>

      {/* Sign in prompt */}
      {!user && (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid rgba(244,114,182,0.15)' }}>
          <p className="text-sm text-gray-500 mb-4">Sign in to generate your personalized routine</p>
          <button onClick={() => base44.auth.redirectToLogin()}
            className="px-6 py-3 rounded-2xl font-black text-white text-sm ios-button-3d"
            style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}