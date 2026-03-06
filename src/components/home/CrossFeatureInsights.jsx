import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, CheckCircle, Lightbulb, Zap } from 'lucide-react';

/**
 * CrossFeatureInsights — connects all features together.
 * Shows actionable cross-feature nudges based on user's data.
 */
export default function CrossFeatureInsights({ skinAnalysis, dietLog, routines = [], logs = [] }) {
  const insights = [];

  // 1. Skin Analysis → Routine
  if (skinAnalysis && routines.length === 0) {
    insights.push({
      type: 'action',
      icon: '✨',
      color: 'from-pink-400 to-amber-400',
      text: `You have a skin score of ${skinAnalysis.overall_score}/100 but no routine yet.`,
      cta: 'Generate Personalized Routine',
      page: 'SkinRoutine',
    });
  }

  // 2. Skin Analysis → Ingredient Checker (priority concerns)
  if (skinAnalysis?.acne_level > 6 || skinAnalysis?.oiliness > 6) {
    insights.push({
      type: 'tip',
      icon: '🔬',
      color: 'from-violet-400 to-purple-400',
      text: `High acne/oiliness detected. Check if your products contain comedogenic ingredients.`,
      cta: 'Check Ingredients',
      page: 'IngredientChecker',
    });
  }

  // 3. Low water / sleep → lifestyle nudge from skin data
  if (skinAnalysis?.dryness > 5 && (!dietLog || dietLog.water_glasses < 6)) {
    insights.push({
      type: 'warning',
      icon: '💧',
      color: 'from-blue-400 to-cyan-400',
      text: `Your skin shows dryness (${skinAnalysis.dryness}/10) and today's water intake is low. Hydration directly impacts skin.`,
      cta: 'Log Today\'s Wellness',
      page: 'Lifestyle',
    });
  }

  // 4. Stress → Skin Chat
  if (dietLog?.stress_level >= 4) {
    insights.push({
      type: 'warning',
      icon: '🧘',
      color: 'from-rose-400 to-pink-400',
      text: `High stress today (${dietLog.stress_level}/5) can trigger breakouts and inflammation. Get personalized advice.`,
      cta: 'Ask AI Skin Coach',
      page: 'SkinChat',
    });
  }

  // 5. No skin analysis yet → encourage first analysis
  if (!skinAnalysis) {
    insights.push({
      type: 'action',
      icon: '📸',
      color: 'from-pink-400 to-rose-400',
      text: `No skin analysis yet. All features (Routine, AI Insights, Report) work best with your analysis.`,
      cta: 'Start Skin Analysis',
      page: 'SkinAnalysis',
    });
  }

  // 6. Lifestyle log streak → Glow Tracker
  if (logs.length >= 3 && logs.length < 7) {
    insights.push({
      type: 'tip',
      icon: '🔥',
      color: 'from-amber-400 to-orange-400',
      text: `You have ${logs.length} days of lifestyle logs! Keep going to unlock streak badges in Glow Tracker.`,
      cta: 'View Glow Tracker',
      page: 'GamifiedTracker',
    });
  }

  // 7. Skin analysis but no progress photos
  if (skinAnalysis && logs.length >= 7) {
    insights.push({
      type: 'tip',
      icon: '📈',
      color: 'from-emerald-400 to-teal-400',
      text: `${logs.length} days of data collected. See how your lifestyle habits are impacting your skin score.`,
      cta: 'View Progress Report',
      page: 'SkinReport',
    });
  }

  // 8. Dark spots → Education
  if (skinAnalysis?.dark_spots > 5) {
    insights.push({
      type: 'tip',
      icon: '📚',
      color: 'from-indigo-400 to-blue-400',
      text: `Dark spots detected (${skinAnalysis.dark_spots}/10). Learn about Vitamin C, AHA, and pigmentation treatments.`,
      cta: 'Learn About Dark Spots',
      page: 'Education',
    });
  }

  // 9. Good sleep but no skincare done → nudge
  if (dietLog?.sleep_hours >= 7 && dietLog?.skincare_done_night === false) {
    insights.push({
      type: 'warning',
      icon: '🌙',
      color: 'from-indigo-400 to-purple-400',
      text: `Great sleep tonight! Don't skip your night skincare — skin repairs best while you sleep.`,
      cta: 'View Night Routine',
      page: 'SkinRoutine',
    });
  }

  // 10. Community — no posts but has analysis
  if (skinAnalysis && skinAnalysis.overall_score >= 70) {
    insights.push({
      type: 'tip',
      icon: '🌟',
      color: 'from-pink-400 to-fuchsia-400',
      text: `Your skin score is ${skinAnalysis.overall_score}/100 — great results! Share your glow journey with the community.`,
      cta: 'Join Community',
      page: 'Community',
    });
  }

  // Show max 3 most relevant
  const topInsights = insights.slice(0, 3);

  if (topInsights.length === 0) return null;

  const typeIcon = (type) => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
    if (type === 'action') return <Zap className="w-4 h-4 text-pink-500 flex-shrink-0" />;
    return <Lightbulb className="w-4 h-4 text-violet-500 flex-shrink-0" />;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        Smart Connections
      </h3>
      {topInsights.map((insight, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/40 dark:border-white/10"
        >
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${insight.color} flex items-center justify-center text-base flex-shrink-0`}>
            {insight.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1 mb-1">
              {typeIcon(insight.type)}
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-snug">{insight.text}</p>
            </div>
            <Link to={createPageUrl(insight.page)}>
              <span className="text-xs font-semibold text-pink-500 hover:text-pink-600 flex items-center gap-1">
                {insight.cta} <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
}