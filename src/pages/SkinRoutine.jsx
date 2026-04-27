import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Sun, Moon, Calendar, Check, Trash2,
  ShieldCheck, AlertTriangle, TrendingUp, RefreshCw, Info,
  ChevronDown, ChevronUp, BookOpen, Save, ListChecks, Zap, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import DailyFeedbackPanel from '@/components/routine/DailyFeedbackPanel';
import WeekPlanGrid from '@/components/routine/WeekPlanGrid';
import StepProductPicker from '@/components/routine/StepProductPicker';
import { computeUserLevel } from '@/lib/routineAdaptation';
import { format } from 'date-fns';
import { backgroundOps } from '@/lib/BackgroundOperations';
import { cacheRoutineData, getCachedRoutineData, clearRoutineCache } from '@/lib/routineSessionCache';

import RoutineTracker from '@/components/routine/RoutineTracker';
import PageIntroPopup from '@/components/PageIntroPopup';
import CompactLevelGuide from '@/components/routine/CompactLevelGuide';
import { usePageState } from '@/lib/pageStateContext';
import { getLastAutoRoutineTime } from '@/lib/autoRoutineGenerator';

// Initialize from localStorage
const initializeRoutineState = () => {
  const cached = localStorage.getItem('skinRoutineCache');
  if (cached) {
    try {
      return { generating: false, routineData: JSON.parse(cached) };
    } catch (e) {
      localStorage.removeItem('skinRoutineCache');
    }
  }
  return { generating: false, routineData: null };
};

let sharedRoutineState = initializeRoutineState();
const routineListeners = new Set();
const updateRoutineState = (updates) => {
  sharedRoutineState = { ...sharedRoutineState, ...updates };
  routineListeners.forEach(l => l(sharedRoutineState));
};

// ─── AI Prompt Builder ────────────────────────────────────────────────────────
function buildRoutinePrompt(analysis, feedbackHistory, userLevel = {}) {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Map feedback to signals
  const SIGNAL_MAP = {
    1: 'positive', 2: 'positive', 8: 'neutral',
    3: 'mild_damage', 5: 'mild_damage',
    4: 'high_damage', 6: 'high_damage',
    7: 'oil', 9: 'breakout', 10: 'breakout',
  };

  const recentCodes = feedbackHistory.flatMap(f => f.feedback_codes || []);
  const signals = recentCodes.map(c => SIGNAL_MAP[c]).filter(Boolean);
  const negativeCount = signals.filter(s => ['mild_damage','high_damage','breakout'].includes(s)).length;
  const positiveCount = signals.filter(s => s === 'positive').length;
  const hasHighDamage = signals.includes('high_damage');
  const hasMildDamage = signals.includes('mild_damage');
  const hasBreakout   = signals.includes('breakout');
  const hasOil        = signals.includes('oil');

  const skinProfile = analysis
    ? `Skin type: ${analysis.skin_type}, Overall score: ${analysis.overall_score}/100,
Acne: ${analysis.acne_level}/10, Dryness: ${analysis.dryness}/10, Oiliness: ${analysis.oiliness}/10,
Sensitivity: ${analysis.sensitivity}/10, Dark spots: ${analysis.dark_spots}/10,
Redness: ${analysis.redness}/10, Wrinkles: ${analysis.wrinkles}/10.
Priority concerns: ${(analysis.priority_concerns || []).join(', ') || 'none'}.`
    : 'No skin analysis — assume balanced/normal skin, use gentle defaults.';

  const feedbackContext = feedbackHistory.length > 0
    ? `Last ${feedbackHistory.length} days of feedback signals: ${signals.join(', ')}.
Positive streak: ${positiveCount}. Negative count: ${negativeCount}.
High damage signals present: ${hasHighDamage}. Mild damage: ${hasMildDamage}.
Breakout signals: ${hasBreakout}. Oil signals: ${hasOil}.`
    : 'No feedback history yet. This is the first routine — start at Level 1 for all actives.';

  const computedLevel = userLevel.currentLevel || 'Level 1';
  const isRecovery    = userLevel.recoveryMode || false;
  const frequencyLabel = userLevel.frequencyLabel || '1–2x / week';

  return `You are an advanced AI dermatologist assistant. Generate a complete, safe, minimal, rotational, and adaptive skincare routine.

TODAY: ${today}
USER'S CURRENT FREQUENCY LEVEL: ${computedLevel} → ${frequencyLabel} (computed from ${userLevel.daysAtLevel || 0} days of feedback)
RECOVERY MODE: ${isRecovery ? 'YES — do NOT include any actives. Recovery-only routine.' : 'NO'}

=== USER SKIN PROFILE ===
${skinProfile}

=== FEEDBACK HISTORY (last 3–5 days) ===
${feedbackContext}

=== CORE RULES YOU MUST FOLLOW ===

RULE 1 – MINIMAL ROUTINE (max 5 steps)
  Morning: Cleanser → (optional Vit-C serum) → Moisturizer → SPF
  Night: Cleanser → ONE active treatment → Moisturizer

RULE 2 – FREQUENCY SYSTEM (levels = HOW OFTEN, NOT concentration)
  CONCENTRATION stays fixed at safest effective range for each active.
  Level 1 = 1–2 treatment nights/week (everyone starts here)
  Level 2 = 3–4 treatment nights/week (after 7+ positive days at Level 1)
  Level 3 = 5–7 treatment nights/week (after 21+ positive days total)
  NEVER increase frequency and concentration at the same time.
  ALWAYS assign correct frequency to each day's night_week_plan.

RULE 3 – ROTATIONAL ACTIVES (ONE per night only)
  Options: Retinol, Salicylic Acid (BHA), Benzoyl Peroxide, AHA
  Rotate with recovery/hydration days between treatment days.
  At Level 1: max 2 treatment nights (rest = recovery/hydration)
  At Level 2: 3–4 treatment nights (rest = recovery)
  At Level 3: up to 5 nights, with at least 1 recovery day
  Max AHA/BHA exfoliation: respect frequency limit per level.

RULE 4 – HARD RESTRICTIONS
  ❌ Retinol + Benzoyl Peroxide same night
  ❌ Retinol + AHA/BHA same night
  ❌ AHA + BHA together (beginners)
  ❌ More treatment nights than level allows

RULE 5 – FEEDBACK ADAPTATION
  - HIGH DAMAGE (4,6) → SAFETY OVERRIDE: 0 actives, full recovery mode, restart Level 1 next week
  - MILD DAMAGE (3,5) → reduce by 1 treatment night this week, add recovery day
  - 3 negative days → drop to Level 1 frequency
  - POSITIVE (1,2) for 5+ days → increase frequency by 1 night (do NOT change concentration)
  - NEUTRAL (8) → keep current frequency; reassess in 7 days
  - OIL (7) → increase BHA frequency by 1 night
  - BREAKOUT mild (9) → add 1 BHA treatment night; severe (10) → reduce frequency

RULE 6 – BARRIER FIRST
  Moisturizer EVERY day. If irritation appears, drop to Level 1 frequency immediately.

RULE 7 – frequency_note FIELD
  In each night_week_plan day, add "frequency_note" field explaining:
  e.g. "Treatment Night 1 of 2 this week (Level 1: 1–2x/week)"
  or "Recovery Day — no actives, barrier support only"

=== OUTPUT FORMAT (return strict JSON) ===

{
  "skin_summary": {
    "skin_type": "string",
    "concerns": ["string"],
    "sensitivity_level": "low|medium|high",
    "current_barrier_status": "string (1 sentence)"
  },
  "morning_routine": [
    { "step": 1, "name": "string", "product_type": "string", "tip": "string", "key_ingredients": ["string"] }
  ],
  "night_week_plan": [
    {
      "day_label": "Monday",
      "day_type": "treatment|recovery|hydration",
      "active_name": "string or null",
      "concentration_level": "Level 1|Level 2|Level 3 or null",
      "steps": [
        { "name": "string", "active": true|false, "tip": "string" }
      ]
    }
  ],
  "weekly_addons": [
    { "name": "string", "frequency": "string", "tip": "string" }
  ],
  "todays_adjustment": {
    "changed": true|false,
    "summary": "string",
    "reason": "string"
  },
  "safety_notes": ["string"],
  "adaptive_guidance": {
    "if_improves": "string",
    "if_worsens": "string"
  },
  "recovery_mode_active": false
}

Generate 7 days (Monday–Sunday) in night_week_plan. Be conservative and safe. Prioritize barrier health above all goals.`;
}

// ─── Output Section Components ─────────────────────────────────────────────
function SkinSummaryCard({ summary }) {
  if (!summary) return null;
  const sensitivityColor = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge className="capitalize bg-pink-500 text-white">{summary.skin_type} Skin</Badge>
        <Badge className={`capitalize ${sensitivityColor[summary.sensitivity_level] || 'bg-gray-100 text-gray-700'}`}>
          {summary.sensitivity_level} sensitivity
        </Badge>
        {(summary.concerns || []).map((c, i) => (
          <Badge key={i} variant="outline" className="capitalize text-xs">{c}</Badge>
        ))}
      </div>
      {summary.current_barrier_status && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          🛡️ {summary.current_barrier_status}
        </p>
      )}
    </div>
  );
}

function MorningRoutineCard({ steps, userEmail, onProductsSelected }) {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [country, setCountry] = useState('IN');
  
  const handleProductSelect = (idx, product) => {
    const updated = { ...selectedProducts, [idx]: product };
    setSelectedProducts(updated);
    if (onProductsSelected) onProductsSelected(updated);
  };

  if (!steps?.length) return null;
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
          className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {step.step || i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{step.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{step.product_type}</p>
              {step.key_ingredients?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {step.key_ingredients.slice(0, 3).map((ing, j) => (
                    <Badge key={j} variant="secondary" className="text-[10px] px-1.5 py-0">{ing}</Badge>
                  ))}
                </div>
              )}
              {step.tip && <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">💡 {step.tip}</p>}
            </div>
          </div>
          <StepProductPicker
            stepName={step.name}
            stepType={step.product_type}
            country={country}
            onCountryChange={setCountry}
            selectedProduct={selectedProducts[i] || null}
            userEmail={userEmail}
            onProductSelect={(p) => handleProductSelect(i, p)}
          />
          {selectedProducts[i] && (
            <div className="mt-2 p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 text-[10px] flex flex-wrap gap-3">
              {selectedProducts[i].apply_time && <span>⏱ Apply: <strong>{selectedProducts[i].apply_time}</strong></span>}
              {selectedProducts[i].wait_time && <span>⏳ Wait: <strong>{selectedProducts[i].wait_time}</strong></span>}
              {selectedProducts[i].price_local && <span>💰 <strong>{selectedProducts[i].price_local}</strong></span>}
              {selectedProducts[i].availability && <span>📍 {selectedProducts[i].availability}</span>}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function TodaysAdjustmentCard({ adjustment, recoveryMode }) {
  if (!adjustment && !recoveryMode) return null;
  if (recoveryMode) {
    return (
      <div className="p-4 rounded-2xl border-2 border-red-400 bg-red-50 dark:bg-red-900/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-700 dark:text-red-300">🚨 Recovery Mode Active</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
            All actives paused. Focus on gentle cleansing + heavy moisturizer only. Restart in 2–3 days at Level 1.
          </p>
        </div>
      </div>
    );
  }
  if (!adjustment?.changed) return null;
  return (
    <div className="p-4 rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 flex items-start gap-3">
      <RefreshCw className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-violet-700 dark:text-violet-300">📊 Today's Adjustment</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{adjustment.summary}</p>
        {adjustment.reason && <p className="text-xs text-gray-500 mt-1">Reason: {adjustment.reason}</p>}
      </div>
    </div>
  );
}

function SafetyNotesCard({ notes }) {
  if (!notes?.length) return null;
  return (
    <div className="space-y-2">
      {notes.map((note, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
          <span className="text-gray-700 dark:text-gray-300">{note}</span>
        </div>
      ))}
    </div>
  );
}

function AdaptiveGuidanceCard({ guidance }) {
  if (!guidance) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
        <p className="text-xs font-bold text-emerald-600 mb-1">✅ If skin improves</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{guidance.if_improves}</p>
      </div>
      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
        <p className="text-xs font-bold text-red-600 mb-1">⚠️ If skin worsens</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{guidance.if_worsens}</p>
      </div>
    </div>
  );
}

function WeeklyAddonsCard({ addons, userEmail, onProductsSelected }) {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [country, setCountry] = useState('IN');
  
  const handleProductSelect = (idx, product) => {
    const updated = { ...selectedProducts, [idx]: product };
    setSelectedProducts(updated);
    if (onProductsSelected) onProductsSelected(updated);
  };

  if (!addons?.length) return null;
  return (
    <div className="space-y-2">
      {addons.map((addon, i) => (
        <div key={i} className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30">
          <div className="flex items-start gap-3">
            <span className="text-lg">🧪</span>
            <div>
              <p className="font-semibold text-sm">{addon.name}</p>
              <p className="text-xs text-teal-600 dark:text-teal-400">{addon.frequency}</p>
              {addon.tip && <p className="text-xs text-gray-500 mt-0.5">{addon.tip}</p>}
            </div>
          </div>
          <StepProductPicker
            stepName={addon.name}
            stepType="weekly addon"
            country={country}
            onCountryChange={setCountry}
            selectedProduct={selectedProducts[i] || null}
            userEmail={userEmail}
            onProductSelect={(p) => handleProductSelect(i, p)}
          />
          {selectedProducts[i] && (
            <div className="mt-2 p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 text-[10px] flex flex-wrap gap-3">
              {selectedProducts[i].apply_time && <span>⏱ Apply: <strong>{selectedProducts[i].apply_time}</strong></span>}
              {selectedProducts[i].price_local && <span>💰 <strong>{selectedProducts[i].price_local}</strong></span>}
              {selectedProducts[i].availability && <span>📍 {selectedProducts[i].availability}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Collapsible Section Wrapper ─────────────────────────────────────────────
function CollapsibleSection({ title, icon, defaultOpen = true, children, badge, resetKey }) {
  const [open, setOpen] = useState(defaultOpen);
  // Reset to defaultOpen whenever resetKey changes (page navigation)
  React.useEffect(() => { setOpen(defaultOpen); }, [resetKey]);
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-sm">{title}</span>
          {badge && <span className="ml-1">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white/40 dark:bg-white/3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SkinRoutine() {
  const [user, setUser] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
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
      setShowFeedbackPrompt(true);
      // Load cached routine for this user if available
      const cached = getCachedRoutineData(u.email);
      if (cached && !sharedRoutineState.routineData) {
        updateRoutineState({ routineData: cached });
      }
    }).catch(() => setShowFeedbackPrompt(false));
  }, []);

  // Latest skin analysis
  const { data: latestAnalysis } = useQuery({
    queryKey: ['skinAnalysis', user?.email],
    queryFn: () =>
      base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  // Saved routine
  const { data: savedRoutine } = useQuery({
    queryKey: ['skinRoutine', user?.email],
    queryFn: () =>
      base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  // Feedback history (last 5 days)
  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () =>
      base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 5),
    enabled: !!user?.email,
  });

  // Today's feedback
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayFeedback = feedbackHistory.find(f => f.date === today) || null;

  // Auto-compute user's concentration level from feedback history
  const userLevel = computeUserLevel(feedbackHistory);

  // Sync DB routine to cache
  useEffect(() => {
    if (isCleared.current) return;
    if (savedRoutine?.steps) {
      localStorage.setItem('skinRoutineCache', JSON.stringify(savedRoutine.steps));
    }
  }, [savedRoutine]);

  // Save to both localStorage and sessionStorage whenever routineData updates
  useEffect(() => {
    if (routineData) {
      localStorage.setItem('skinRoutineCache', JSON.stringify(routineData));
      if (user) {
        cacheRoutineData(user.email, routineData);
      }
    }
  }, [routineData, user]);

  const [selectedMorningProducts, setSelectedMorningProducts] = useState({});
  const [selectedWeeklyProducts, setSelectedWeeklyProducts] = useState({});

  // Sync selected products to SavedProduct shelf
  const syncProductsToShelf = async (products, routineId) => {
    try {
      await base44.functions.invoke('syncRoutineProductsToShelf', {
        products,
        routine_id: routineId,
      });
    } catch (error) {
      console.warn('Failed to sync products to shelf:', error);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const enrichedData = {
        ...data,
        selected_products: {
          morning: selectedMorningProducts,
          weekly: selectedWeeklyProducts,
        },
      };
      const result = savedRoutine?.id
        ? await base44.entities.SkinRoutine.update(savedRoutine.id, enrichedData)
        : await base44.entities.SkinRoutine.create(enrichedData);
      
      // Sync products to shelf
      const allProducts = Object.values(selectedMorningProducts)
        .concat(Object.values(selectedWeeklyProducts))
        .filter(Boolean);
      
      if (allProducts.length > 0) {
        await syncProductsToShelf(allProducts, result?.id || 'new');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['skinRoutine']);
      queryClient.invalidateQueries(['savedProducts']);
    },
  });

  const generateRoutine = async () => {
    isCleared.current = false;
    updateRoutineState({ generating: true });
    backgroundOps.start('skinRoutine', '✨ Skin Routine');
    const prompt = buildRoutinePrompt(latestAnalysis, feedbackHistory, userLevel);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          skin_summary: {
            type: 'object',
            properties: {
              skin_type: { type: 'string' },
              concerns: { type: 'array', items: { type: 'string' } },
              sensitivity_level: { type: 'string' },
              current_barrier_status: { type: 'string' },
            },
          },
          morning_routine: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step: { type: 'number' },
                name: { type: 'string' },
                product_type: { type: 'string' },
                tip: { type: 'string' },
                key_ingredients: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          night_week_plan: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day_label: { type: 'string' },
                day_type: { type: 'string' },
                active_name: { type: 'string' },
                concentration_level: { type: 'string' },
                frequency_note: { type: 'string' },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      active: { type: 'boolean' },
                      tip: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          weekly_addons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                frequency: { type: 'string' },
                tip: { type: 'string' },
              },
            },
          },
          todays_adjustment: {
            type: 'object',
            properties: {
              changed: { type: 'boolean' },
              summary: { type: 'string' },
              reason: { type: 'string' },
            },
          },
          safety_notes: { type: 'array', items: { type: 'string' } },
          adaptive_guidance: {
            type: 'object',
            properties: {
              if_improves: { type: 'string' },
              if_worsens: { type: 'string' },
            },
          },
          recovery_mode_active: { type: 'boolean' },
        },
      },
    });

    updateRoutineState({ routineData: result, generating: false });
    backgroundOps.complete('skinRoutine');

    // Auto-save — after this savedRoutine will update but useEffect won't overwrite
    // because routineData is already set to `result`
    if (user) {
      saveMutation.mutate({
        user_email: user.email,
        routine_type: 'morning',
        skin_type: result.skin_summary?.skin_type || '',
        steps: result,
        routine_summary: result.skin_summary?.current_barrier_status || '',
        skin_concerns: result.skin_summary?.concerns || [],
      });
    }
  };

  const handleFeedbackSaved = () => {
    // Auto-regenerate after feedback
    generateRoutine();
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

  return (
    <>
      {/* Feedback Prompt Modal */}
      <AnimatePresence>
        {showFeedbackPrompt && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,10,30,0.72)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowFeedbackPrompt(false)}
          >
            <motion.div
              initial={{ y: 60, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 60, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-2xl font-bold mb-2">How's Your Skin Today?</h2>
                <p className="text-gray-600 mb-6">Your daily feedback helps us adapt your routine perfectly for your skin's needs.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFeedbackPrompt(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      setShowFeedbackPrompt(false);
                      document.querySelector('[class*="DailyFeedbackPanel"]')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 py-3 rounded-xl text-white font-bold transition"
                    style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}
                  >
                    Share Feedback
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    <div className="max-w-3xl mx-auto space-y-5 pb-8">

      <PageIntroPopup
        storageKey="intro_SkinRoutine"
        emoji="✨"
        title="Your Adaptive Skin Routine"
        accentColor="#f472b6"
        description="Your AI-powered skincare routine is built around your unique skin type, current concerns, and daily feedback — adapting every week to your skin's real-time response."
        tips={[
          { icon: '🌅', title: 'Follow morning & night steps', text: 'Consistency is everything. Complete both AM and PM routines daily for compounding results over weeks.' },
          { icon: '📋', title: 'Log daily skin feedback', text: 'Rate how your skin feels after each routine. The AI uses this data to adjust active ingredient frequency and concentration.' },
          { icon: '🔄', title: 'Regenerate weekly', text: 'Refresh your routine every 7 days as your skin levels up — the AI will safely increase treatment frequency when your skin is ready.' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="Routine" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Skin Routine</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Minimal · Rotational · Barrier-First · Adaptive
          </p>
        </div>
      </div>

      {/* Principle Banner */}
      <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 border border-violet-100 dark:border-violet-800 text-sm text-violet-700 dark:text-violet-300 font-medium text-center">
        🧩 "Start low → protect barrier → rotate → adjust → upgrade slowly"
      </div>

      {/* ── Compact Level Guide ── */}
      <CompactLevelGuide currentLevel={userLevel.currentLevel} />

      {/* User Level & Concentration Guide moved to Routine Intelligence page */}

      {/* Skin Profile Banner */}
      {latestAnalysis && (
        <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-pink-500 text-white capitalize">{latestAnalysis.skin_type} Skin</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-300">Score: <strong>{latestAnalysis.overall_score}/100</strong></span>
            {latestAnalysis.acne_level > 4 && <Badge variant="outline" className="text-xs">⚠ Acne-Prone</Badge>}
            {latestAnalysis.sensitivity > 4 && <Badge variant="outline" className="text-xs">⚡ Sensitive</Badge>}
            {latestAnalysis.dryness > 4 && <Badge variant="outline" className="text-xs">🏜 Dry</Badge>}
            {latestAnalysis.oiliness > 4 && <Badge variant="outline" className="text-xs">💦 Oily</Badge>}
          </div>
        </GlassCard>
      )}

      {/* Generate Button */}
      <GlassCard>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-lg">
              {routineData ? '🔄 Your Adaptive Routine' : '🤖 Generate Your Routine'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {feedbackHistory.length > 0
                ? `Based on your skin analysis + ${feedbackHistory.length} days of feedback`
                : 'Based on your skin analysis — provide daily feedback to adapt'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {routineData && (
              <Button variant="outline" size="sm" onClick={clearRoutine} className="text-red-500 hover:text-red-600">
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
            {(routineData || savedRoutine?.steps) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTracker(t => !t)}
                className={showTracker ? 'bg-violet-50 border-violet-300 text-violet-700' : 'text-violet-600'}
              >
                <ListChecks className="w-3.5 h-3.5 mr-1" />
                {showTracker ? 'Hide Tracker' : 'Track Today'}
              </Button>
            )}
            <Button
              onClick={generateRoutine}
              disabled={generating}
              className="ios-button-3d text-white" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}
            >
              {generating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                : <><Sparkles className="w-4 h-4 mr-2" />{routineData ? 'Regenerate' : 'Generate Routine'}</>
              }
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* ── Routine Tracker Expanding Section ── */}
      <AnimatePresence>
        {showTracker && (routineData || savedRoutine?.steps) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border-2 border-violet-200 overflow-hidden"
              style={{ background: 'linear-gradient(145deg,#faf5ff,#f5f3ff)' }}>
              {/* Header */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-violet-100">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)' }}>
                  <ListChecks className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-violet-800">Today's Routine Tracker</p>
                  <p className="text-[10px] text-violet-400">Check off steps as you complete them · resets daily</p>
                </div>
              </div>
              <div className="p-4">
                <RoutineTracker routineData={routineData || savedRoutine?.steps} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Routine Output — always visible if saved, collapsible */}
      {routineData && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Saved indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <Save className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Routine saved — visible every time you open this page
            </span>
            {savedRoutine?.updated_date && (
              <span className="ml-auto text-[10px] text-gray-400">
                Last updated: {format(new Date(savedRoutine.updated_date), 'MMM d, HH:mm')}
              </span>
            )}
          </div>

          {/* Recovery Mode Alert (always shown inline, no collapse) */}
          <TodaysAdjustmentCard
            adjustment={routineData.todays_adjustment}
            recoveryMode={routineData.recovery_mode_active}
          />

          {/* Skin Summary */}
          <CollapsibleSection
            title="Skin Summary"
            icon={<Info className="w-4 h-4 text-pink-500" />}
            defaultOpen={true}
            resetKey={pageKey}
          >
            <SkinSummaryCard summary={routineData.skin_summary} />
          </CollapsibleSection>

          {/* Morning Routine */}
          <CollapsibleSection
            title="Morning Routine"
            icon={<Sun className="w-4 h-4 text-amber-500" />}
            defaultOpen={true}
            resetKey={pageKey}
            badge={<span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{routineData.morning_routine?.length || 0} steps</span>}
          >
            <MorningRoutineCard 
              steps={routineData.morning_routine} 
              userEmail={user?.email}
              onProductsSelected={(products) => {
                setSelectedMorningProducts(products);
                syncProductsToShelf(Object.values(products).filter(Boolean), savedRoutine?.id || 'new');
                saveMutation.mutate({
                  user_email: user.email,
                  routine_type: 'morning',
                  skin_type: routineData.skin_summary?.skin_type || '',
                  steps: routineData,
                  routine_summary: routineData.skin_summary?.current_barrier_status || '',
                  skin_concerns: routineData.skin_summary?.concerns || [],
                });
              }}
            />
          </CollapsibleSection>

          {/* Night 7-Day Plan */}
          {routineData.night_week_plan?.length > 0 && (
            <CollapsibleSection
              title="Night Routine — 7-Day Rotation"
              icon={<Moon className="w-4 h-4 text-indigo-500" />}
              defaultOpen={true}
              resetKey={pageKey}
              badge={<span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">7 days</span>}
            >
              <WeekPlanGrid weekPlan={routineData.night_week_plan} userEmail={user?.email} />
            </CollapsibleSection>
          )}

          {/* Weekly Add-ons */}
          {routineData.weekly_addons?.length > 0 && (
            <CollapsibleSection
              title="Weekly Add-ons"
              icon={<Calendar className="w-4 h-4 text-teal-500" />}
              defaultOpen={false}
              resetKey={pageKey}
            >
              <WeeklyAddonsCard 
                addons={routineData.weekly_addons} 
                userEmail={user?.email}
                onProductsSelected={(products) => {
                  setSelectedWeeklyProducts(products);
                  syncProductsToShelf(Object.values(products).filter(Boolean), savedRoutine?.id || 'new');
                  saveMutation.mutate({
                    user_email: user.email,
                    routine_type: 'morning',
                    skin_type: routineData.skin_summary?.skin_type || '',
                    steps: routineData,
                    routine_summary: routineData.skin_summary?.current_barrier_status || '',
                    skin_concerns: routineData.skin_summary?.concerns || [],
                  });
                }}
              />
            </CollapsibleSection>
          )}

          {/* Safety Notes */}
          {routineData.safety_notes?.length > 0 && (
            <CollapsibleSection
              title="Safety Notes"
              icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
              defaultOpen={false}
              resetKey={pageKey}
            >
              <SafetyNotesCard notes={routineData.safety_notes} />
            </CollapsibleSection>
          )}

          {/* Adaptive Guidance */}
          {routineData.adaptive_guidance && (
            <CollapsibleSection
              title="Adaptive Guidance"
              icon={<TrendingUp className="w-4 h-4 text-indigo-500" />}
              defaultOpen={false}
              resetKey={pageKey}
            >
              <AdaptiveGuidanceCard guidance={routineData.adaptive_guidance} />
            </CollapsibleSection>
          )}
        </motion.div>
      )}

      {/* Daily Feedback Panel */}
      {user && (
        <GlassCard>
          <h3 className="font-bold text-base mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-pink-500" /> Daily Skin Feedback
          </h3>
          {feedbackHistory.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {feedbackHistory.slice(0, 3).map((f, i) => (
                <div key={i} className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {format(new Date(f.date + 'T00:00:00'), 'EEE')}: {(f.feedback_codes || []).length} signal(s)
                </div>
              ))}
            </div>
          )}
          <DailyFeedbackPanel
            userEmail={user.email}
            todayFeedback={todayFeedback}
            onFeedbackSaved={handleFeedbackSaved}
          />
        </GlassCard>
      )}

      {/* Link to Routine Intelligence */}
      <Link to="/RoutineIntelligence">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-violet-700 dark:text-violet-300 flex items-center gap-2">
                <Zap className="w-5 h-5" /> Routine Intelligence
              </h3>
              <p className="text-sm text-violet-600 dark:text-violet-400 mt-1">Advanced analytics, barrier health, trigger correlation & skin forecasts</p>
            </div>
            <ArrowRight className="w-5 h-5 text-violet-500 flex-shrink-0" />
          </div>
        </motion.div>
      </Link>

      {!user && (
        <GlassCard className="text-center py-8">
          <p className="text-gray-500 mb-4">Sign in to generate and save your personalized routine</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="ios-button-3d text-white" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            Sign In
          </Button>
        </GlassCard>
      )}
    </div>
    </>
  );
}