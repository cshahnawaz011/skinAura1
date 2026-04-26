import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import BarrierRiskEngine from '@/components/routine/BarrierRiskEngine';
import IngredientIntelligenceCard from '@/components/routine/IngredientIntelligenceCard';
import TriggerCorrelationEngine from '@/components/routine/TriggerCorrelationEngine';
import SkinAnalysisDeepCard from '@/components/routine/SkinAnalysisDeepCard';
import SeasonalSynthesisCard from '@/components/routine/SeasonalSynthesisCard';
import ProgressForecastCard from '@/components/routine/ProgressForecastCard';
import RoutineChangesCard from '@/components/routine/RoutineChangesCard';
import OutcomeFeaturesCard from '@/components/routine/OutcomeFeaturesCard';
import RoutineMotivationalQuote from '@/components/routine/RoutineMotivationalQuote';

export default function RoutineIntelligence() {
  const [user, setUser] = useState(null);

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

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">Sign in to view routine intelligence</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)' }}>
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black">Routine Intelligence</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Advanced skin & routine analytics</p>
        </div>
      </motion.div>

      {/* Section Label */}
      <div className="flex items-center gap-2 pt-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Core Engines</p>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
      </div>

      {/* Core engines */}
      <BarrierRiskEngine feedbackHistory={feedbackHistory} analysis={latestAnalysis} userLevel={{ currentLevel: 'Level 1' }} />
      <IngredientIntelligenceCard routineData={savedRoutine?.steps} />
      <TriggerCorrelationEngine feedbackHistory={feedbackHistory} />

      {/* Section Label 2 */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Deep Analysis</p>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
      </div>

      {/* Deep analysis cards */}
      <SkinAnalysisDeepCard analysis={latestAnalysis} />
      <SeasonalSynthesisCard />
      <ProgressForecastCard pastAnalyses={[latestAnalysis].filter(Boolean)} />
      <RoutineChangesCard feedbackHistory={feedbackHistory} savedRoutine={savedRoutine} />

      {/* Outcome features & motivation */}
      <OutcomeFeaturesCard />
      <RoutineMotivationalQuote />
    </div>
  );
}