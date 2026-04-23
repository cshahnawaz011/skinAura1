import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Sun, Moon, Calendar, Check, Trash2,
  ShieldCheck, AlertTriangle, TrendingUp, RefreshCw, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import DailyFeedbackPanel from '@/components/routine/DailyFeedbackPanel';
import WeekPlanGrid from '@/components/routine/WeekPlanGrid';
import { format } from 'date-fns';

// ─── AI Prompt Builder ────────────────────────────────────────────────────────
function buildRoutinePrompt(analysis, feedbackHistory) {
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

  return `You are an advanced AI dermatologist assistant. Generate a complete, safe, minimal, rotational, and adaptive skincare routine.

TODAY: ${today}

=== USER SKIN PROFILE ===
${skinProfile}

=== FEEDBACK HISTORY (last 3–5 days) ===
${feedbackContext}

=== CORE RULES YOU MUST FOLLOW ===

RULE 1 – MINIMAL ROUTINE (max 5 steps)
  Morning: Cleanser → (optional Vit-C serum) → Moisturizer → SPF
  Night: Cleanser → ONE active treatment → Moisturizer

RULE 2 – CONCENTRATION SYSTEM
  Level 1 = Low (beginner safe, always start here)
  Level 2 = Moderate (only after 5–7 days positive response)
  Level 3 = Advanced (only if sustained tolerance)
  NEVER skip levels. NEVER raise frequency + concentration together.

RULE 3 – ROTATIONAL ACTIVES (ONE per night only)
  Options: Retinol, Salicylic Acid (BHA), Benzoyl Peroxide, AHA
  Rotate with recovery days between actives.
  Max exfoliation: 1x/week. Hydrating mask: 1–2x/week on recovery days.

RULE 4 – HARD RESTRICTIONS
  ❌ Retinol + Benzoyl Peroxide same day
  ❌ Retinol + AHA/BHA same day
  ❌ AHA + BHA together (beginner)
  ❌ Over-exfoliation

RULE 5 – FEEDBACK ADAPTATION
  - HIGH DAMAGE signals (4,6) → SAFETY OVERRIDE: stop ALL actives, 2–3 day recovery, restart Level 1
  - MILD DAMAGE (3,5) → reduce frequency, decrease concentration -1 level, add recovery day
  - 3 negative days → simplify routine
  - POSITIVE (1,2) for 5+ days → increase frequency OR concentration (+1 level, NOT both)
  - NEUTRAL (8) → increase frequency first; if no result after 7–10 days → increase concentration
  - OIL (7) → add lightweight hydration, slightly increase BHA frequency
  - BREAKOUT mild (9) → increase frequency; severe (10) + irritation → reduce concentration

RULE 6 – BARRIER FIRST
  Moisturizer is MANDATORY every day. If any irritation: stop actives, switch to recovery.

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
    <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
      <h3 className="font-bold text-base mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-pink-500" /> Skin Summary</h3>
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
    </GlassCard>
  );
}

function MorningRoutineCard({ steps }) {
  if (!steps?.length) return null;
  return (
    <GlassCard>
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <Sun className="w-4 h-4 text-amber-500" /> Morning Routine
      </h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            className="flex gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
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
          </motion.div>
        ))}
      </div>
    </GlassCard>
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
    <GlassCard>
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Safety Notes
      </h3>
      <div className="space-y-2">
        {notes.map((note, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
            <span className="text-gray-700 dark:text-gray-300">{note}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function AdaptiveGuidanceCard({ guidance }) {
  if (!guidance) return null;
  return (
    <GlassCard>
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-500" /> Adaptive Guidance
      </h3>
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
    </GlassCard>
  );
}

function WeeklyAddonsCard({ addons }) {
  if (!addons?.length) return null;
  return (
    <GlassCard>
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-teal-500" /> Weekly Add-ons
      </h3>
      <div className="space-y-2">
        {addons.map((addon, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30">
            <span className="text-lg">🧪</span>
            <div>
              <p className="font-semibold text-sm">{addon.name}</p>
              <p className="text-xs text-teal-600 dark:text-teal-400">{addon.frequency}</p>
              {addon.tip && <p className="text-xs text-gray-500 mt-0.5">{addon.tip}</p>}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SkinRoutine() {
  const [user, setUser] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [routineData, setRoutineData] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
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

  // Load saved routine into state on mount
  useEffect(() => {
    if (savedRoutine?.steps && !routineData) {
      setRoutineData(savedRoutine.steps);
    }
  }, [savedRoutine]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (savedRoutine?.id) {
        return base44.entities.SkinRoutine.update(savedRoutine.id, data);
      }
      return base44.entities.SkinRoutine.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries(['skinRoutine']),
  });

  const generateRoutine = async () => {
    setGenerating(true);
    const prompt = buildRoutinePrompt(latestAnalysis, feedbackHistory);

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

    setRoutineData(result);
    setGenerating(false);

    // Auto-save
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

  const clearRoutine = () => {
    setRoutineData(null);
    if (savedRoutine?.id) {
      base44.entities.SkinRoutine.delete(savedRoutine.id).then(() =>
        queryClient.invalidateQueries(['skinRoutine'])
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow"
          style={{ background: 'linear-gradient(135deg,#f472b6,#fbbf24)' }}>
          ✨
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">AI Skin Routine</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Minimal · Rotational · Barrier-First · Adaptive
          </p>
        </div>
      </div>

      {/* Principle Banner */}
      <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 border border-violet-100 dark:border-violet-800 text-sm text-violet-700 dark:text-violet-300 font-medium text-center">
        🧩 "Start low → protect barrier → rotate → adjust → upgrade slowly"
      </div>

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
          <div className="flex gap-2">
            {routineData && (
              <Button variant="outline" size="sm" onClick={clearRoutine} className="text-red-500 hover:text-red-600">
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
            <Button
              onClick={generateRoutine}
              disabled={generating}
              className="bg-gradient-to-r from-pink-500 to-amber-500 text-white"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                : <><Sparkles className="w-4 h-4 mr-2" />{routineData ? 'Regenerate' : 'Generate Routine'}</>
              }
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Routine Output */}
      <AnimatePresence>
        {routineData && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Recovery Mode Alert */}
            <TodaysAdjustmentCard
              adjustment={routineData.todays_adjustment}
              recoveryMode={routineData.recovery_mode_active}
            />

            {/* Skin Summary */}
            <SkinSummaryCard summary={routineData.skin_summary} />

            {/* Morning Routine */}
            <MorningRoutineCard steps={routineData.morning_routine} />

            {/* Night 7-Day Plan */}
            {routineData.night_week_plan?.length > 0 && (
              <GlassCard>
                <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" /> Night Routine — 7-Day Rotation
                </h3>
                <WeekPlanGrid weekPlan={routineData.night_week_plan} />
              </GlassCard>
            )}

            {/* Weekly Add-ons */}
            <WeeklyAddonsCard addons={routineData.weekly_addons} />

            {/* Safety Notes */}
            <SafetyNotesCard notes={routineData.safety_notes} />

            {/* Adaptive Guidance */}
            <AdaptiveGuidanceCard guidance={routineData.adaptive_guidance} />
          </motion.div>
        )}
      </AnimatePresence>

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

      {!user && (
        <GlassCard className="text-center py-8">
          <p className="text-gray-500 mb-4">Sign in to generate and save your personalized routine</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">
            Sign In
          </Button>
        </GlassCard>
      )}
    </div>
  );
}