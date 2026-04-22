import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Sun, Moon, Calendar, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const ROUTINE_TABS = [
  { id: 'morning', label: 'Morning', icon: Sun, emoji: '☀️', color: 'from-amber-400 to-orange-400' },
  { id: 'night', label: 'Night', icon: Moon, emoji: '🌙', color: 'from-indigo-400 to-violet-500' },
  { id: 'weekly', label: 'Weekly', icon: Calendar, emoji: '📅', color: 'from-teal-400 to-emerald-500' },
];

const DEFAULT_STEPS = {
  morning: [
    { name: 'Gentle Cleanser', time: '1 min', tip: 'Use lukewarm water, massage for 60 seconds' },
    { name: 'Vitamin C Serum', time: '1 min', tip: 'Apply 3-4 drops, let absorb for 60 seconds' },
    { name: 'Moisturizer', time: '1 min', tip: 'Apply upward strokes, include neck' },
    { name: 'SPF 50 Sunscreen', time: '1 min', tip: 'Apply generously, reapply every 2 hours' },
  ],
  night: [
    { name: 'Oil/Micellar Cleanser', time: '2 min', tip: 'Double cleanse to remove makeup and SPF' },
    { name: 'Active Serum / Retinol', time: '1 min', tip: 'Start 2x/week, build up gradually' },
    { name: 'Rich Night Moisturizer', time: '1 min', tip: 'Apply generously, skin repairs overnight' },
  ],
  weekly: [
    { name: 'AHA/BHA Exfoliant', time: '10 min', tip: 'Use 1-2x per week, avoid with retinol nights' },
    { name: 'Hydrating Face Mask', time: '15 min', tip: 'Apply thick layer, leave for 15 minutes' },
    { name: 'Spot Treatment', time: '2 min', tip: 'Target active blemishes only' },
  ],
};

export default function SkinRoutine() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('morning');
  const [generating, setGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['skinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: routines = [] } = useQuery({
    queryKey: ['skinRoutines', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SkinRoutine.create(data),
    onSuccess: () => queryClient.invalidateQueries(['skinRoutines']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SkinRoutine.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['skinRoutines']),
  });

  const currentRoutine = routines.find(r => r.routine_type === activeTab);
  const currentTab = ROUTINE_TABS.find(t => t.id === activeTab);

  const generateRoutine = async () => {
    setGenerating(true);
    setGeneratedRoutine(null);

    const skinProfile = latestAnalysis
      ? `Skin type: ${latestAnalysis.skin_type}, Score: ${latestAnalysis.overall_score}/100, Acne: ${latestAnalysis.acne_level}/10, Oiliness: ${latestAnalysis.oiliness}/10, Dryness: ${latestAnalysis.dryness}/10, Sensitivity: ${latestAnalysis.sensitivity}/10, Dark spots: ${latestAnalysis.dark_spots}/10`
      : 'No skin analysis available — create a general routine';

    const routineContext = {
      morning: 'Create a morning skincare routine (cleanser, antioxidant serum, moisturizer, SPF)',
      night: 'Create a night skincare routine (double cleanse, actives/retinol, rich moisturizer)',
      weekly: 'Create weekly treatment steps (exfoliant, mask, spot treatment, etc. — 2-3x per week)',
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${routineContext[activeTab]} for a person with this profile: ${skinProfile}. 
      Make it personalized and science-backed. For each step include product type recommendation, key ingredients to look for, and application tip.`,
      response_json_schema: {
        type: 'object',
        properties: {
          routine_summary: { type: 'string' },
          skin_type: { type: 'string' },
          total_time: { type: 'string' },
          priority_note: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step_number: { type: 'number' },
                name: { type: 'string' },
                product_type: { type: 'string' },
                key_ingredients: { type: 'array', items: { type: 'string' } },
                application_tip: { type: 'string' },
                time_needed: { type: 'string' },
                why_important: { type: 'string' },
              }
            }
          }
        }
      }
    });

    setGeneratedRoutine(result);
    setGenerating(false);
  };

  const saveRoutine = async () => {
    if (!generatedRoutine || !user) return;
    if (currentRoutine) {
      await deleteMutation.mutateAsync(currentRoutine.id);
    }
    await saveMutation.mutateAsync({
      user_email: user.email,
      routine_type: activeTab,
      skin_type: generatedRoutine.skin_type,
      steps: generatedRoutine.steps,
      routine_summary: generatedRoutine.routine_summary,
      total_time: generatedRoutine.total_time,
      priority_note: generatedRoutine.priority_note,
    });
    setGeneratedRoutine(null);
  };

  const stepsToShow = generatedRoutine?.steps || currentRoutine?.steps || DEFAULT_STEPS[activeTab];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(135deg, #f472b6, #fbbf24)' }}>
          ✨
        </div>
        <div>
          <h1 className="text-3xl font-bold">Skin Routine</h1>
          <p className="text-gray-500 dark:text-gray-400">Personalized routines based on your skin analysis</p>
        </div>
      </div>

      {/* Skin Profile Banner */}
      {latestAnalysis && (
        <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-pink-500 text-white capitalize">{latestAnalysis.skin_type} Skin</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-300">Score: <strong>{latestAnalysis.overall_score}/100</strong></span>
            {latestAnalysis.acne_level > 4 && <Badge variant="outline" className="text-xs">⚠ Acne-Prone</Badge>}
            {latestAnalysis.sensitivity > 4 && <Badge variant="outline" className="text-xs">⚡ Sensitive</Badge>}
            {latestAnalysis.dryness > 4 && <Badge variant="outline" className="text-xs">🏜 Dry</Badge>}
            {latestAnalysis.oiliness > 4 && <Badge variant="outline" className="text-xs">✨ Oily</Badge>}
          </div>
        </GlassCard>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {ROUTINE_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setGeneratedRoutine(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                  : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-white'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Generate Button */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">{currentTab?.emoji} {currentTab?.label} Routine</h2>
            {currentRoutine && (
              <p className="text-xs text-gray-500 mt-0.5">
                {currentRoutine.total_time && `⏱ ${currentRoutine.total_time}`}
                {currentRoutine.skin_type && ` · ${currentRoutine.skin_type} skin`}
              </p>
            )}
          </div>
          <Button
            onClick={generateRoutine}
            disabled={generating}
            className={`bg-gradient-to-r ${currentTab?.color} text-white`}
          >
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />AI Generate</>}
          </Button>
        </div>

        {currentRoutine?.routine_summary && !generatedRoutine && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 p-3 bg-white/50 dark:bg-white/5 rounded-xl">
            {currentRoutine.routine_summary}
          </p>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {(stepsToShow || []).map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex gap-3 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10"
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentTab?.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{step.name || step.product_type}</span>
                  {(step.time || step.time_needed) && (
                    <Badge variant="outline" className="text-xs">⏱ {step.time || step.time_needed}</Badge>
                  )}
                </div>
                {step.key_ingredients?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {step.key_ingredients.slice(0, 3).map((ing, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">{ing}</Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">{step.tip || step.application_tip}</p>
                {step.why_important && (
                  <p className="text-xs text-emerald-600 mt-1">💡 {step.why_important}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Save generated routine */}
        {generatedRoutine && user && (
          <div className="mt-4 flex gap-3">
            <Button onClick={saveRoutine} disabled={saveMutation.isPending} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Save This Routine
            </Button>
            <Button variant="outline" onClick={() => setGeneratedRoutine(null)}>Discard</Button>
          </div>
        )}

        {generatedRoutine?.priority_note && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-300">
            ⚠️ {generatedRoutine.priority_note}
          </div>
        )}
      </GlassCard>

      {/* Delete saved routine */}
      {currentRoutine && !generatedRoutine && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteMutation.mutate(currentRoutine.id)}
            disabled={deleteMutation.isPending}
            className="text-red-500 hover:text-red-600 text-xs gap-1"
          >
            <Trash2 className="w-3 h-3" /> Clear Saved Routine
          </Button>
        </div>
      )}

      {!user && (
        <GlassCard className="text-center py-8">
          <p className="text-gray-500 mb-4">Sign in to save your personalized routines</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">Sign In</Button>
        </GlassCard>
      )}
    </div>
  );
}