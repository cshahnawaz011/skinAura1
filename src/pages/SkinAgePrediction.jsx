import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Clock, Star, TrendingUp, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';

export default function SkinAgePrediction() {
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(getCooldownSeconds('skin_age'));

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['skinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: latestLog } = useQuery({
    queryKey: ['latestLog', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const runAnalysis = async () => {
    const { allowed } = checkAICooldown('skin_age');
    if (!allowed || !latestAnalysis) return;
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert dermatologist and skin aging specialist. Based on this user's skin analysis data and lifestyle, predict their skin age and future skin condition.

Skin Analysis Data:
- Overall Score: ${latestAnalysis.overall_score}/100
- Skin Type: ${latestAnalysis.skin_type}
- Acne Level: ${latestAnalysis.acne_level}/10
- Dark Spots: ${latestAnalysis.dark_spots}/10
- Wrinkles: ${latestAnalysis.wrinkles}/10
- Pores: ${latestAnalysis.pores}/10
- Redness: ${latestAnalysis.redness}/10
- Oiliness: ${latestAnalysis.oiliness}/10
- Dryness: ${latestAnalysis.dryness}/10
- Sensitivity: ${latestAnalysis.sensitivity}/10

Lifestyle Data:
- Water glasses/day: ${latestLog?.water_glasses || 'unknown'}
- Sleep hours: ${latestLog?.sleep_hours || 'unknown'}
- Stress level: ${latestLog?.stress_level || 'unknown'}/5
- Exercise minutes: ${latestLog?.exercise_minutes || 0}
- Coffee cups: ${latestLog?.coffee_cups || 0}
- Alcohol drinks: ${latestLog?.alcohol_drinks || 0}
- Screen time hours: ${latestLog?.screen_time_hours || 0}
- Morning skincare: ${latestLog?.skincare_done_morning ? 'Yes' : 'No'}
- Night skincare: ${latestLog?.skincare_done_night ? 'Yes' : 'No'}
- Sunscreen: ${latestLog?.sunscreen_applied ? 'Yes' : 'No'}

Provide a detailed skin age prediction. Be realistic and scientific.`,
      response_json_schema: {
        type: "object",
        properties: {
          biological_skin_age: { type: "number", description: "Estimated skin age in years (could be younger or older than actual age)" },
          skin_age_label: { type: "string", description: "e.g. 'Young & Radiant', 'Slightly Aged', 'Well-maintained'" },
          age_factors_positive: { type: "array", items: { type: "string" }, description: "3 factors making skin look younger" },
          age_factors_negative: { type: "array", items: { type: "string" }, description: "3 factors aging the skin faster" },
          future_5yr_with_current: { type: "string", description: "Detailed prediction of skin condition in 5 years if current lifestyle continues" },
          future_5yr_if_improved: { type: "string", description: "Skin condition in 5 years if user improves lifestyle and skincare" },
          top_anti_aging_tips: { type: "array", items: { type: "string" }, description: "5 specific anti-aging recommendations" },
          skin_longevity_score: { type: "number", description: "Score 0-100 for how well the skin is aging" }
        }
      }
    });
    setResult(res);
    recordAIUsage('skin_age');
    setCooldown(3 * 60);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Skin Age Prediction</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">AI estimates your biological skin age & future skin outlook</p>
      </div>

      {!user ? (
        <GlassCard className="text-center py-12">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Sign in to get your skin age prediction</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-violet-500 to-purple-500">Sign In</Button>
        </GlassCard>
      ) : !latestAnalysis ? (
        <GlassCard className="text-center py-12">
          <User className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">You need to complete a Skin Analysis first</p>
          <Button onClick={() => window.location.href = '/SkinAnalysis'} className="bg-gradient-to-r from-pink-500 to-amber-500">Go to Skin Analysis</Button>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Based on your latest scan</h3>
                <p className="text-sm text-gray-500">Overall score: <span className="font-bold text-pink-500">{latestAnalysis.overall_score}/100</span> · Skin type: <span className="capitalize font-medium">{latestAnalysis.skin_type}</span></p>
              </div>
            </div>
            <Button
              onClick={runAnalysis}
              disabled={loading || cooldown > 0}
              className="w-full mt-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white py-5 text-base"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating Skin Age...</>
                : cooldown > 0 ? `⏳ Available in ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
                : <><Sparkles className="w-4 h-4 mr-2" /> Predict My Skin Age</>}
            </Button>
          </GlassCard>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Skin Age Hero */}
                <GlassCard className="text-center bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
                  <p className="text-sm text-gray-500 mb-1">Your Biological Skin Age</p>
                  <p className="text-7xl font-black text-violet-600">{result.biological_skin_age}</p>
                  <p className="text-xl font-semibold text-purple-500 mt-1">{result.skin_age_label}</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="text-sm text-gray-500">Skin Longevity Score</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full ${i < Math.round(result.skin_longevity_score / 10) ? 'bg-violet-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                      ))}
                    </div>
                    <span className="font-bold text-violet-600">{result.skin_longevity_score}/100</span>
                  </div>
                </GlassCard>

                {/* Aging Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <GlassCard>
                    <h3 className="font-semibold mb-3 text-emerald-600 flex items-center gap-2"><Star className="w-4 h-4" /> Keeping You Young</h3>
                    <ul className="space-y-2">
                      {result.age_factors_positive?.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                          <span className="text-gray-700 dark:text-gray-300">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                  <GlassCard>
                    <h3 className="font-semibold mb-3 text-red-500 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Aging Faster Due To</h3>
                    <ul className="space-y-2">
                      {result.age_factors_negative?.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                          <span className="text-gray-700 dark:text-gray-300">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>

                {/* 5-Year Prediction */}
                <GlassCard>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-amber-500" /> 5-Year Skin Forecast</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm font-semibold text-red-600 mb-1">❌ If you continue current habits:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.future_5yr_with_current}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm font-semibold text-emerald-600 mb-1">✅ If you improve your routine:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{result.future_5yr_if_improved}</p>
                    </div>
                  </div>
                </GlassCard>

                {/* Anti-Aging Tips */}
                <GlassCard>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> Top Anti-Aging Tips For You</h3>
                  <div className="space-y-3">
                    {result.top_anti_aging_tips?.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}