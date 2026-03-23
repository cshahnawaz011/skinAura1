import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Loader2, TrendingUp, AlertTriangle,
  CheckCircle, ChevronDown, ChevronUp, Sparkles, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

function InsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false);

  const typeStyles = {
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700', icon: AlertTriangle, color: 'text-amber-500', badge: 'bg-amber-500', glow: 'shadow-amber-200/50' },
    positive: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', icon: CheckCircle, color: 'text-emerald-500', badge: 'bg-emerald-500', glow: 'shadow-emerald-200/50' },
    trend: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', icon: TrendingUp, color: 'text-blue-500', badge: 'bg-blue-500', glow: 'shadow-blue-200/50' },
    urgent: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700', icon: AlertTriangle, color: 'text-red-500', badge: 'bg-red-500', glow: 'shadow-red-200/50' },
  };

  const style = typeStyles[insight.type] || typeStyles.trend;
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border-2 shadow-lg ${style.bg} ${style.border} ${style.glow} cursor-pointer overflow-hidden`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm leading-tight">{insight.title}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge className={`text-xs text-white ${style.badge} border-0`}>{insight.type}</Badge>
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{insight.summary}</p>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/40 dark:border-white/10 space-y-3">
              {insight.explanation && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Why This Matters</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{insight.explanation}</p>
                </div>
              )}
              {insight.action && (
                <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl border border-pink-200/30">
                  <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-1">⚡ Action Step</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{insight.action}</p>
                </div>
              )}
              {insight.timeline && (
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Expected improvement:</span> {insight.timeline}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProactiveHealthInsights({ skinAnalysis, dietLog, progressPhotos = [], analyses = [] }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthScore, setHealthScore] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(getCooldownSeconds('health_insights'));

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

  const getUserLang = () => {
    const langMap = { en: 'English', hi: 'Hindi', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', pt: 'Portuguese', ru: 'Russian', tr: 'Turkish' };
    return langMap[localStorage.getItem('glowai-lang') || 'en'] || 'English';
  };

  const generateInsights = async () => {
    const { allowed } = checkAICooldown('health_insights');
    if (!allowed) return;
    setLoading(true);

    const scoreTrend = analyses.length >= 2
      ? `Skin score went from ${analyses[analyses.length - 1]?.overall_score} to ${analyses[0]?.overall_score} over ${analyses.length} analyses`
      : 'Only one analysis — no trend yet';

    const skinProfile = skinAnalysis ? `Skin score: ${skinAnalysis.overall_score}/100, Type: ${skinAnalysis.skin_type}, Acne: ${skinAnalysis.acne_level}/10, Dark spots: ${skinAnalysis.dark_spots}/10, Oiliness: ${skinAnalysis.oiliness}/10, Dryness: ${skinAnalysis.dryness}/10, Redness: ${skinAnalysis.redness}/10, Sensitivity: ${skinAnalysis.sensitivity}/10` : 'No skin analysis done yet';

    const lifestyleProfile = dietLog ? `Water: ${dietLog.water_glasses}/8, Sleep: ${dietLog.sleep_hours}h, Stress: ${dietLog.stress_level}/5, Exercise: ${dietLog.exercise_minutes}min, Good foods: ${dietLog.foods_good?.join(', ') || 'none'}, Bad foods: ${dietLog.foods_bad?.join(', ') || 'none'}` : 'No lifestyle data today';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a proactive health coach generating real-time skin health insights. Respond entirely in ${getUserLang()}.
DATA: ${skinProfile}
LIFESTYLE: ${lifestyleProfile}
TREND: Progress photos: ${progressPhotos.length}, ${scoreTrend}
Generate 4-6 highly specific actionable insights tied to user's actual data. For each: title (5-8 words), type ("warning"/"positive"/"trend"/"urgent"), summary (1 sentence), explanation (2-3 sentences), action (one concrete step today), timeline (when to see improvement).
Also: overall_health_score (0-100), health_summary (2 sentences).`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: { type: "array", items: { type: "object", properties: { title:{type:"string"}, type:{type:"string"}, summary:{type:"string"}, explanation:{type:"string"}, action:{type:"string"}, timeline:{type:"string"} } } },
          overall_health_score: { type: "number" },
          health_summary: { type: "string" }
        }
      }
    });

    setInsights(result.insights || []);
    setHealthScore({ score: result.overall_health_score, summary: result.health_summary });
    recordAIUsage('health_insights');
    setCooldownLeft(3 * 60);
    setLoading(false);
  };

  if (!skinAnalysis && !dietLog) return null;

  return (
    <GlassCard className="col-span-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center shadow-lg shadow-violet-400/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">Proactive Health Insights</h3>
            <p className="text-xs text-gray-500">AI-powered • Click to generate</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {healthScore && (
            <div className="text-center px-3 py-1 rounded-xl bg-gradient-to-r from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30">
              <p className={`text-xl font-black ${healthScore.score >= 70 ? 'text-emerald-500' : healthScore.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{healthScore.score}</p>
              <p className="text-[10px] text-gray-400">Health Score</p>
            </div>
          )}
          <Button
            onClick={generateInsights}
            disabled={loading || cooldownLeft > 0}
            className="bg-gradient-to-r from-violet-500 to-pink-500 shadow-md shadow-violet-400/30"
            size="sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : cooldownLeft > 0 ? (
              <><Clock className="w-4 h-4" /> {Math.floor(cooldownLeft/60)}:{String(cooldownLeft%60).padStart(2,'0')}</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {insights ? 'Refresh Insights' : 'Generate Insights'}</>
            )}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
            <p className="text-gray-500 text-sm">Analyzing your skin & lifestyle patterns...</p>
          </div>
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && !insights && (
        <div className="text-center py-8 space-y-2">
          <Brain className="w-12 h-12 mx-auto text-violet-300 opacity-50" />
          <p className="text-sm text-gray-400">Tap "Generate Insights" to get AI-powered health analysis based on your skin & lifestyle data.</p>
        </div>
      )}

      {!loading && healthScore?.summary && (
        <div className="p-3 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-xl mb-4 border border-violet-100 dark:border-violet-800/30">
          <p className="text-sm text-gray-700 dark:text-gray-300">{healthScore.summary}</p>
        </div>
      )}

      {!loading && insights && (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}