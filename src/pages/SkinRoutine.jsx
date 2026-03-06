import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Sparkles, Loader2, Clock, Check, ChevronDown,
  ChevronUp, Bell, BellOff, RefreshCw, Trash2, Info, Zap,
  Droplets, Shield, Target, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/ui/GlassCard';
import ReminderSection from '@/components/routine/ReminderSection';

const ROUTINE_PHASES = {
  morning: [
    { phase: 'Cleanse', icon: '🧼', desc: 'Start fresh' },
    { phase: 'Tone', icon: '💧', desc: 'Balance pH' },
    { phase: 'Treat', icon: '✨', desc: 'Active ingredients' },
    { phase: 'Moisturize', icon: '🧴', desc: 'Lock in hydration' },
    { phase: 'Protect', icon: '☀️', desc: 'Defend against UV' },
  ],
  night: [
    { phase: 'Pre-Cleanse', icon: '🫧', desc: 'Remove makeup/SPF' },
    { phase: 'Cleanse', icon: '🧼', desc: 'Deep clean' },
    { phase: 'Exfoliate', icon: '⚡', desc: '2-3x per week' },
    { phase: 'Treat', icon: '✨', desc: 'Repair & renew' },
    { phase: 'Moisturize', icon: '🧴', desc: 'Overnight repair' },
  ]
};

function StepCard({ step, index, isActive, isMorning, onClick }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div
        className={`glass rounded-2xl overflow-hidden border ${
          isActive ? 'border-pink-300 dark:border-pink-700' : 'border-white/20'
        } cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Step Header */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
              isMorning
                ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                : 'bg-gradient-to-br from-indigo-500 to-purple-500'
            }`}>
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base">{step.product_type}</h3>
                {step.phase_tag && (
                  <Badge variant="outline" className="text-xs capitalize">{step.phase_tag}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" /> {step.duration}
                </span>
                {step.key_ingredient && (
                  <span className="text-xs text-pink-500 font-medium">⭐ {step.key_ingredient}</span>
                )}
              </div>
            </div>

            {expanded ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
          </div>

          {/* Quick summary always visible */}
          {step.one_liner && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-16">{step.one_liner}</p>
          )}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 space-y-4 bg-gradient-to-br from-white/40 to-white/20 dark:from-black/20 dark:to-black/10">

                {/* How to Apply */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">How to Apply</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step.how_to_apply}</p>
                  </div>
                </div>

                {/* Technique */}
                {step.technique && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Pro Technique</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step.technique}</p>
                    </div>
                  </div>
                )}

                {/* Why It Helps */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Why This Works For You</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step.benefits}</p>
                  </div>
                </div>

                {/* What to Look For in Product */}
                {step.product_look_for && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wide mb-1">What to Look For</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step.product_look_for}</p>
                    </div>
                  </div>
                )}

                {/* Avoid */}
                {step.avoid && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs font-bold text-red-500 mb-1">⚠️ Avoid</p>
                    <p className="text-xs text-red-700 dark:text-red-300">{step.avoid}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function SkinRoutine() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('morning');
  const [generating, setGenerating] = useState(false);
  const [generatingPhase, setGeneratingPhase] = useState('');
  const [cooldownLeft, setCooldownLeft] = useState(getCooldownSeconds('skin_routine'));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: async () => {
      const analyses = await base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1);
      return analyses[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: dietLog } = useQuery({
    queryKey: ['todayLog', user?.email],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: today });
      return logs[0] || null;
    },
    enabled: !!user?.email,
  });

  const currentRoutine = routines.find(r => r.routine_type === activeTab);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (currentRoutine) return base44.entities.SkinRoutine.update(currentRoutine.id, data);
      return base44.entities.SkinRoutine.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries(['routines']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SkinRoutine.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['routines']),
  });

  const generateRoutine = async () => {
    if (!latestAnalysis) return;
    const { allowed } = checkAICooldown('skin_routine');
    if (!allowed) return;
    setGenerating(true);

    // Build very rich skin profile
    const scoreMap = {
      acne_level: latestAnalysis.acne_level,
      dark_spots: latestAnalysis.dark_spots,
      wrinkles: latestAnalysis.wrinkles,
      pores: latestAnalysis.pores,
      redness: latestAnalysis.redness,
      oiliness: latestAnalysis.oiliness,
      dryness: latestAnalysis.dryness,
      sensitivity: latestAnalysis.sensitivity,
    };

    const severe = Object.entries(scoreMap).filter(([k, v]) => v > 6).map(([k]) => k.replace('_', ' '));
    const moderate = Object.entries(scoreMap).filter(([k, v]) => v > 3 && v <= 6).map(([k]) => k.replace('_', ' '));

    const lifestyleContext = dietLog ? `
Lifestyle factors to consider:
- Water intake: ${dietLog.water_glasses}/8 glasses (${dietLog.water_glasses < 6 ? 'LOW — recommend extra hydration steps' : 'adequate'})
- Sleep: ${dietLog.sleep_hours} hours (${dietLog.sleep_hours < 7 ? 'insufficient — skin repair impaired, add recovery-focused steps' : 'good'})
- Stress level: ${dietLog.stress_level}/5 (${dietLog.stress_level >= 4 ? 'HIGH — include anti-inflammatory, calming ingredients' : 'manageable'})
- Exercise: ${dietLog.exercise_minutes} min (${dietLog.exercise_minutes > 30 ? 'active — consider post-workout cleanse note' : 'sedentary'})
` : '';

    const phases = ROUTINE_PHASES[activeTab].map(p => p.phase).join(', ');

    setGeneratingPhase('Building your skin profile...');
    await new Promise(r => setTimeout(r, 400));
    setGeneratingPhase('Selecting optimal ingredients...');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert cosmetic dermatologist. Create a highly advanced, deeply personalized ${activeTab} skincare routine.

PATIENT SKIN PROFILE:
- Skin type: ${latestAnalysis.skin_type}
- Skin tone: ${latestAnalysis.skin_tone || 'not specified'}
- Overall skin score: ${latestAnalysis.overall_score}/100
- SEVERE concerns (score 7-10): ${severe.join(', ') || 'none'}
- MODERATE concerns (score 4-6): ${moderate.join(', ') || 'none'}
- Detailed scores: Acne ${scoreMap.acne_level}/10, Dark spots ${scoreMap.dark_spots}/10, Wrinkles ${scoreMap.wrinkles}/10, Pores ${scoreMap.pores}/10, Redness ${scoreMap.redness}/10, Oiliness ${scoreMap.oiliness}/10, Dryness ${scoreMap.dryness}/10, Sensitivity ${scoreMap.sensitivity}/10
${lifestyleContext}

ROUTINE TYPE: ${activeTab.toUpperCase()}
REQUIRED PHASES (in order): ${phases}

For EACH step, provide:
1. order: step number
2. phase_tag: which phase this belongs to (cleanse/tone/treat/moisturize/protect/exfoliate/pre-cleanse)
3. product_type: specific product name (e.g. "Salicylic Acid 2% BHA Exfoliant Toner" not just "Toner")
4. key_ingredient: the hero ingredient and its % if relevant (e.g. "Niacinamide 10%")
5. one_liner: single sentence of what this step does (shown always, 10-15 words)
6. how_to_apply: detailed application instructions (amount, motion, zones, order of layering) — minimum 3 sentences
7. technique: a pro tip or specific technique to maximize absorption or efficacy
8. duration: how long to leave on / wait before next step
9. benefits: deep mechanistic explanation of WHY this helps THIS patient's specific skin scores — reference their actual concerns and skin type. Minimum 3 sentences.
10. product_look_for: what ingredients/labels to look for when buying — be specific
11. avoid: what ingredients or product types to strictly avoid in this step given their skin profile

IMPORTANT RULES:
- If oiliness > 6: NO heavy oils in morning; use lightweight water-based products
- If dryness > 6: include occlusives; emphasize layering thin-to-thick
- If sensitivity > 6: flag fragrance-free, alcohol-free, minimal ingredients
- If acne > 6: morning = BHA or niacinamide; night = retinoid or benzoyl peroxide
- If wrinkles > 5: night = retinol or peptides; morning = antioxidant vitamin C
- Always add SPF as final morning step regardless
- Night routine should include at least one active treatment step
- Give 5-7 steps for comprehensive care`,
      response_json_schema: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                order: { type: "number" },
                phase_tag: { type: "string" },
                product_type: { type: "string" },
                key_ingredient: { type: "string" },
                one_liner: { type: "string" },
                how_to_apply: { type: "string" },
                technique: { type: "string" },
                duration: { type: "string" },
                benefits: { type: "string" },
                product_look_for: { type: "string" },
                avoid: { type: "string" }
              }
            }
          },
          routine_summary: { type: "string" },
          total_time: { type: "string" },
          priority_note: { type: "string" }
        }
      }
    });

    setGeneratingPhase('Saving your routine...');

    await saveMutation.mutateAsync({
      user_email: user.email,
      routine_type: activeTab,
      steps: result.steps,
      skin_concerns: severe.concat(moderate),
      reminder_enabled: false,
      reminder_time: activeTab === 'morning' ? '07:00' : '21:00',
      routine_summary: result.routine_summary,
      total_time: result.total_time,
      priority_note: result.priority_note,
    });

    recordAIUsage('skin_routine');
    setCooldownLeft(3 * 60);
    setGenerating(false);
    setGeneratingPhase('');
  };

  const toggleReminder = async () => {
    if (!currentRoutine) return;
    await saveMutation.mutateAsync({ ...currentRoutine, reminder_enabled: !currentRoutine.reminder_enabled });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Personalized Skin Routine</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in to get your expert-level morning and night skincare routine</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">Sign In to Get Started</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Skin Routine</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Expert-level routines engineered for your exact skin profile</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === 'morning' ? 'default' : 'outline'}
          onClick={() => setActiveTab('morning')}
          className={activeTab === 'morning' ? 'bg-gradient-to-r from-amber-400 to-orange-400' : ''}
        >
          <Sun className="w-4 h-4 mr-2" /> Morning Routine
        </Button>
        <Button
          variant={activeTab === 'night' ? 'default' : 'outline'}
          onClick={() => setActiveTab('night')}
          className={activeTab === 'night' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : ''}
        >
          <Moon className="w-4 h-4 mr-2" /> Night Routine
        </Button>
      </div>

      {/* No Analysis Warning */}
      {!latestAnalysis && (
        <GlassCard className="border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Complete a skin analysis first</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">We need your skin data to generate a precision routine</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Phase Map */}
      {!currentRoutine && latestAnalysis && (
        <GlassCard>
          <p className="text-sm font-semibold text-gray-500 mb-3">Routine phases to be built:</p>
          <div className="flex gap-2 flex-wrap">
            {ROUTINE_PHASES[activeTab].map((p, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-white/5 rounded-xl">
                <span className="text-lg">{p.icon}</span>
                <div>
                  <p className="text-xs font-bold">{p.phase}</p>
                  <p className="text-xs text-gray-400">{p.desc}</p>
                </div>
                {i < ROUTINE_PHASES[activeTab].length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 ml-1" />}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <GlassCard key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </GlassCard>
          ))}
        </div>
      ) : currentRoutine ? (
        <div className="space-y-4">

          {/* Routine Meta */}
          {currentRoutine.routine_summary && (
            <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Routine Overview
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{currentRoutine.routine_summary}</p>
                  {currentRoutine.priority_note && (
                    <div className="mt-3 p-3 bg-amber-100/80 dark:bg-amber-900/30 rounded-xl">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300">⚠️ Priority Note</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{currentRoutine.priority_note}</p>
                    </div>
                  )}
                </div>
                {currentRoutine.total_time && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-500">{currentRoutine.total_time}</p>
                    <p className="text-xs text-gray-500">total time</p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Reminder */}
          <ReminderSection
            routine={currentRoutine}
            routineType={activeTab}
            onSave={(data) => saveMutation.mutate(data)}
          />

          {/* Skin Concerns Targeted */}
          {currentRoutine.skin_concerns?.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500 font-medium">Targeting:</span>
              {currentRoutine.skin_concerns.map((concern, i) => (
                <Badge key={i} variant="secondary" className="capitalize">{concern}</Badge>
              ))}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {currentRoutine.steps?.map((step, index) => (
              <StepCard
                key={index}
                step={step}
                index={index}
                isActive={false}
                isMorning={activeTab === 'morning'}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={generateRoutine} disabled={generating || !latestAnalysis || cooldownLeft > 0} className="flex-1">
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {cooldownLeft > 0 ? `${Math.floor(cooldownLeft/60)}:${String(cooldownLeft%60).padStart(2,'0')}` : 'Regenerate'}
            </Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(currentRoutine.id)} className="px-4">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
            activeTab === 'morning' ? 'bg-gradient-to-br from-amber-400 to-orange-400' : 'bg-gradient-to-br from-indigo-500 to-purple-500'
          }`}>
            {activeTab === 'morning' ? <Sun className="w-8 h-8 text-white" /> : <Moon className="w-8 h-8 text-white" />}
          </div>
          <h3 className="text-xl font-semibold mb-2">No {activeTab} routine yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Generate an expert-level, deeply personalized routine based on your 8-point skin analysis
          </p>
          <Button onClick={generateRoutine} disabled={generating || !latestAnalysis || cooldownLeft > 0} className="bg-gradient-to-r from-pink-500 to-amber-500 px-8 py-6">
            {generating ? (
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Building Routine...</span>
                {generatingPhase && <span className="text-xs opacity-80">{generatingPhase}</span>}
              </div>
            ) : cooldownLeft > 0 ? (
              <>⏳ Available in {Math.floor(cooldownLeft/60)}:{String(cooldownLeft%60).padStart(2,'0')}</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Advanced {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Routine</>
            )}
          </Button>
        </GlassCard>
      )}

      {/* Generating overlay */}
      {generating && currentRoutine && (
        <GlassCard className="text-center">
          <Loader2 className="w-8 h-8 text-pink-500 mx-auto animate-spin mb-2" />
          <p className="text-gray-600 dark:text-gray-300">{generatingPhase || 'Regenerating your routine...'}</p>
        </GlassCard>
      )}
    </div>
  );
}