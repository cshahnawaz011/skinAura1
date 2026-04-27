import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Droplets, Moon, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { computeUserLevel } from '@/lib/routineAdaptation';
import { format } from 'date-fns';

import BarrierRiskEngine from '@/components/routine/BarrierRiskEngine';
import IngredientIntelligenceCard from '@/components/routine/IngredientIntelligenceCard';
import TriggerCorrelationEngine from '@/components/routine/TriggerCorrelationEngine';
import SkinAnalysisDeepCard from '@/components/routine/SkinAnalysisDeepCard';
import SeasonalSynthesisCard from '@/components/routine/SeasonalSynthesisCard';
import ProgressForecastCard from '@/components/routine/ProgressForecastCard';
import RoutineChangesCard from '@/components/routine/RoutineChangesCard';
import OutcomeFeaturesCard from '@/components/routine/OutcomeFeaturesCard';
import RoutineMotivationalQuote from '@/components/routine/RoutineMotivationalQuote';
import UserLevelTracker from '@/components/routine/UserLevelTracker';
import ConcentrationLevelGuide from '@/components/routine/ConcentrationLevelGuide';

export default function RoutineIntelligence() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['skinAnalysis', user?.email],
    queryFn: () =>
      base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: savedRoutine } = useQuery({
    queryKey: ['skinRoutine', user?.email],
    queryFn: () =>
      base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () =>
      base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 14),
    enabled: !!user?.email,
  });

  const { data: dietLogs = [] } = useQuery({
    queryKey: ['dietLogs14', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 14),
    enabled: !!user?.email,
  });

  const { data: cycleData } = useQuery({
    queryKey: ['cycleData', user?.email],
    queryFn: () => base44.entities.CycleData.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: progressPhotos = [] } = useQuery({
    queryKey: ['progressPhotos', user?.email],
    queryFn: () => base44.entities.ProgressPhoto.filter({ user_email: user.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const { data: activeChallenge } = useQuery({
    queryKey: ['activeChallenge', user?.email],
    queryFn: () => base44.entities.SkinChallenge.filter({ user_email: user.email, status: 'active' }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const userLevel = computeUserLevel(feedbackHistory);

  // ── Compute synced lifestyle metrics for display ──────────────────────
  const avgWater = dietLogs.length > 0 ? (dietLogs.reduce((s, d) => s + (d.water_glasses || 0), 0) / dietLogs.length).toFixed(1) : null;
  const avgSleep = dietLogs.length > 0 ? (dietLogs.reduce((s, d) => s + (d.sleep_hours || 0), 0) / dietLogs.length).toFixed(1) : null;
  const avgStress = dietLogs.length > 0 ? (dietLogs.reduce((s, d) => s + (d.stress_level || 3), 0) / dietLogs.length).toFixed(1) : null;
  const sunscreenDays = dietLogs.filter(d => d.sunscreen_applied).length;
  const positiveFeedbackDays = feedbackHistory.filter(f => (f.feedback_codes || []).some(c => c === 1 || c === 2)).length;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">Sign in to view routine intelligence</p>
        <button onClick={() => base44.auth.redirectToLogin()}
          className="px-6 py-3 rounded-2xl text-white font-bold"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)' }}>
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Routine Intelligence</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Advanced skin & routine analytics</p>
        </div>
      </motion.div>

      {/* ── User Level & Concentration Guide (moved from Routine page) ── */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Your Level</p>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
      </div>

      <UserLevelTracker
        currentLevel={userLevel.currentLevel}
        frequencyLabel={userLevel.frequencyLabel}
        daysAtLevel={userLevel.daysAtLevel}
        progressPercent={userLevel.progressPercent}
        nextAction={userLevel.nextAction}
        recoveryMode={userLevel.recoveryMode}
        statusEmoji={userLevel.statusEmoji}
      />

      <ConcentrationLevelGuide currentLevel={userLevel.currentLevel} />

      {/* ── All Features Sync Panel ── */}
      {(dietLogs.length > 0 || cycleData || progressPhotos.length > 0 || activeChallenge) && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(96,165,250,0.2)', background: 'linear-gradient(145deg,rgba(96,165,250,0.04),rgba(167,139,250,0.04))' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)' }} />
          <div className="p-4">
            <p className="font-black text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" /> All Features Synced Data
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {avgWater && (
                <div className="rounded-xl p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-center">
                  <p className="text-lg">💧</p>
                  <p className="text-sm font-black text-blue-600">{avgWater}g</p>
                  <p className="text-[9px] text-gray-400">Avg Water/day</p>
                </div>
              )}
              {avgSleep && (
                <div className="rounded-xl p-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 text-center">
                  <p className="text-lg">😴</p>
                  <p className="text-sm font-black text-violet-600">{avgSleep}h</p>
                  <p className="text-[9px] text-gray-400">Avg Sleep/night</p>
                </div>
              )}
              {avgStress && (
                <div className="rounded-xl p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-center">
                  <p className="text-lg">🧠</p>
                  <p className="text-sm font-black text-red-500">{avgStress}/5</p>
                  <p className="text-[9px] text-gray-400">Avg Stress</p>
                </div>
              )}
              {sunscreenDays > 0 && (
                <div className="rounded-xl p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-center">
                  <p className="text-lg">☀️</p>
                  <p className="text-sm font-black text-amber-600">{sunscreenDays}d</p>
                  <p className="text-[9px] text-gray-400">SPF Applied</p>
                </div>
              )}
              {positiveFeedbackDays > 0 && (
                <div className="rounded-xl p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-center">
                  <p className="text-lg">✅</p>
                  <p className="text-sm font-black text-emerald-600">{positiveFeedbackDays}d</p>
                  <p className="text-[9px] text-gray-400">Positive Skin Days</p>
                </div>
              )}
              {cycleData?.current_phase && (
                <div className="rounded-xl p-2.5 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 text-center">
                  <p className="text-lg">🌙</p>
                  <p className="text-xs font-black text-pink-600 capitalize">{cycleData.current_phase}</p>
                  <p className="text-[9px] text-gray-400">Cycle Phase</p>
                </div>
              )}
              {progressPhotos.length > 0 && (
                <div className="rounded-xl p-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-center">
                  <p className="text-lg">📸</p>
                  <p className="text-sm font-black text-indigo-600">{progressPhotos.length}</p>
                  <p className="text-[9px] text-gray-400">Progress Photos</p>
                </div>
              )}
              {activeChallenge && (
                <div className="rounded-xl p-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 text-center">
                  <p className="text-lg">⚡</p>
                  <p className="text-xs font-black text-orange-600">{(activeChallenge.completed_days || []).length}/21</p>
                  <p className="text-[9px] text-gray-400">Challenge Days</p>
                </div>
              )}
            </div>
            {/* Lifestyle impact on routine */}
            {avgWater && parseFloat(avgWater) < 6 && (
              <div className="mt-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 text-xs text-blue-700 dark:text-blue-300">
                💧 <strong>Low hydration alert:</strong> Avg {avgWater} glasses/day may increase dryness. Add hydrating serum (hyaluronic acid) to morning routine.
              </div>
            )}
            {avgStress && parseFloat(avgStress) >= 4 && (
              <div className="mt-2 p-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-xs text-red-700 dark:text-red-300">
                🧠 <strong>High stress detected:</strong> Stress triggers cortisol → increases acne & oiliness. Consider reducing active nights by 1 this week.
              </div>
            )}
            {cycleData?.current_phase === 'luteal' && (
              <div className="mt-2 p-2 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 text-xs text-pink-700 dark:text-pink-300">
                🌙 <strong>Luteal phase:</strong> Progesterone increases sebum. Boost BHA nights, reduce heavy moisturizers this week.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Core Engines */}
      <div className="flex items-center gap-2 pt-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Core Engines</p>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
      </div>

      <BarrierRiskEngine feedbackHistory={feedbackHistory} analysis={latestAnalysis} userLevel={userLevel} />
      <IngredientIntelligenceCard routineData={savedRoutine?.steps} />
      <TriggerCorrelationEngine feedbackHistory={feedbackHistory} />

      {/* Deep Analysis */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Deep Analysis</p>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
      </div>

      <SkinAnalysisDeepCard analysis={latestAnalysis} />
      <SeasonalSynthesisCard />
      <ProgressForecastCard pastAnalyses={[latestAnalysis].filter(Boolean)} />
      <RoutineChangesCard feedbackHistory={feedbackHistory} savedRoutine={savedRoutine} />

      <OutcomeFeaturesCard />
      <RoutineMotivationalQuote />
    </div>
  );
}