import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Loader2, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, ChevronDown, ChevronUp, Sparkles, RefreshCw, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

function InsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false);

  const typeStyles = {
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700', icon: AlertTriangle, color: 'text-amber-500', badge: 'bg-amber-500' },
    positive: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', icon: CheckCircle, color: 'text-emerald-500', badge: 'bg-emerald-500' },
    trend: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', icon: TrendingUp, color: 'text-blue-500', badge: 'bg-blue-500' },
    urgent: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700', icon: AlertTriangle, color: 'text-red-500', badge: 'bg-red-500' },
  };

  const style = typeStyles[insight.type] || typeStyles.trend;
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border p-4 cursor-pointer ${style.bg} ${style.border}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm leading-tight">{insight.title}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge className={`text-xs ${style.badge} border-0`}>{insight.type}</Badge>
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
            className="mt-3 pt-3 border-t border-white/40 dark:border-white/10 space-y-3"
          >
            {insight.explanation && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Why This Matters</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{insight.explanation}</p>
              </div>
            )}
            {insight.action && (
              <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-1">⚡ Action Step</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{insight.action}</p>
              </div>
            )}
            {insight.timeline && (
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Expected improvement:</span> {insight.timeline}
              </p>
            )}
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

  useEffect(() => {
    if ((skinAnalysis || dietLog) && cooldownLeft === 0) {
      generateInsights();
    }
  }, [skinAnalysis?.id, dietLog?.id]);

  const generateInsights = async () => {
    const { allowed } = checkAICooldown('health_insights');
    if (!allowed) return;
    setLoading(true);

    // Build trend data
    const scoreTrend = analyses.length >= 2
      ? `Skin score went from ${analyses[analyses.length - 1]?.overall_score} to ${analyses[0]?.overall_score} over ${analyses.length} analyses`
      : 'Only one analysis — no trend yet';

    const skinProfile = skinAnalysis ? `
Skin score: ${skinAnalysis.overall_score}/100
Type: ${skinAnalysis.skin_type}
Acne: ${skinAnalysis.acne_level}/10, Dark spots: ${skinAnalysis.dark_spots}/10
Oiliness: ${skinAnalysis.oiliness}/10, Dryness: ${skinAnalysis.dryness}/10
Redness: ${skinAnalysis.redness}/10, Sensitivity: ${skinAnalysis.sensitivity}/10
Wrinkles: ${skinAnalysis.wrinkles}/10, Pores: ${skinAnalysis.pores}/10` : 'No skin analysis done yet';

    const lifestyleProfile = dietLog ? `
Water: ${dietLog.water_glasses}/8 glasses
Sleep: ${dietLog.sleep_hours} hours
Stress: ${dietLog.stress_level}/5
Exercise: ${dietLog.exercise_minutes} min
Good foods eaten: ${dietLog.foods_good?.join(', ') || 'none logged'}
Bad foods eaten: ${dietLog.foods_bad?.join(', ') || 'none logged'}` : 'No lifestyle data logged today';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a proactive health coach generating real-time skin health insights.

DATA:
${skinProfile}

LIFESTYLE TODAY:
${lifestyleProfile}

PROGRESS TREND:
- Progress photos: ${progressPhotos.length} total
- ${scoreTrend}

Generate 4-6 highly specific, actionable, proactive health insights. Each should be directly tied to the user's actual data — no generic advice.

For each insight provide:
- title: Short, punchy insight title (5-8 words)
- type: "warning" (concerning pattern), "positive" (doing well), "trend" (observed pattern), "urgent" (needs immediate attention)
- summary: 1 sentence what was detected
- explanation: 2-3 sentences explaining the mechanism/why this matters for their skin specifically
- action: One specific, concrete action they can take today
- timeline: When they should see improvement if they act

Also provide:
- overall_health_score: 0-100 composite score based on skin + lifestyle
- health_summary: 2-sentence overall skin health status

Examples of good insights (use their real data, not these examples):
- If sleep < 6 and acne_level > 5: "Sleep deprivation is spiking your cortisol, directly worsening your breakouts"
- If water < 4 and dryness > 6: "Severe dehydration is amplifying your skin's moisture barrier breakdown"
- If oiliness > 7 and diet has sugar: "High glycemic foods are triggering excess sebum production"
- If skin score improved: "Your consistency is paying off — skin score up X points"`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                type: { type: "string" },
                summary: { type: "string" },
                explanation: { type: "string" },
                action: { type: "string" },
                timeline: { type: "string" }
              }
            }
          },
          overall_health_score: { type: "number" },
          health_summary: { type: "string" }
        }
      }
    });

    setInsights(result.insights || []);
    setHealthScore({ score: result.overall_health_score, summary: result.health_summary });
    setLoading(false);
  };

  if (!skinAnalysis && !dietLog) {
    return null;
  }

  return (
    <GlassCard className="col-span-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">Proactive Health Insights</h3>
            <p className="text-xs text-gray-500">AI-generated based on your skin & lifestyle data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {healthScore && (
            <div className="text-center">
              <p className={`text-xl font-bold ${
                healthScore.score >= 70 ? 'text-emerald-500' :
                healthScore.score >= 50 ? 'text-amber-500' : 'text-red-500'
              }`}>{healthScore.score}</p>
              <p className="text-xs text-gray-400">Health Score</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={generateInsights} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
            <p className="text-gray-500 text-sm">Analyzing your skin & lifestyle patterns...</p>
          </div>
          {[1,2,3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && healthScore?.summary && (
        <div className="p-3 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-xl mb-4">
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