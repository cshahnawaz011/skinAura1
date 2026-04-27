import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Heart, Target, Leaf, ChevronDown, ChevronUp,
  Zap, TrendingUp, BookOpen, Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'smart_plan', label: 'Smart Plan', emoji: '🧬' },
  { id: 'skin_food', label: 'Skin Foods', emoji: '💆' },
  { id: 'detox', label: 'Detox', emoji: '⚡' },
  { id: 'ai_insights', label: 'AI Insights', emoji: '🤖' },
];

const HORMONE_FOODS = {
  Menstrual: { eat: ['Iron-rich foods', 'Dark chocolate', 'Chamomile tea', 'Omega-3 fish'], avoid: ['Caffeine', 'Salty foods', 'Alcohol'] },
  Follicular: { eat: ['Fermented foods', 'Leafy greens', 'Flaxseeds', 'Berries'], avoid: ['Processed foods', 'Trans fats'] },
  Ovulation: { eat: ['Pumpkin seeds', 'Citrus fruits', 'Turmeric', 'Bone broth'], avoid: ['Refined carbs', 'Alcohol'] },
  Luteal: { eat: ['B6-rich foods', 'Magnesium foods', 'Dark leafy greens', 'Complex carbs'], avoid: ['Dairy', 'Sugar', 'Caffeine'] },
};

export default function Diet() {
  const [activeTab, setActiveTab] = useState('smart_plan');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [detoxDays, setDetoxDays] = useState(3);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: skinAnalysis } = useQuery({
    queryKey: ['dietSkinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0]),
    enabled: !!user?.email,
  });

  const { data: lifestyleLogs = [] } = useQuery({
    queryKey: ['dietLifestyleLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 7),
    enabled: !!user?.email,
  });

  const hormoneData = (() => {
    try { const s = localStorage.getItem('hormone-tracker'); return s ? JSON.parse(s) : null; } catch { return null; }
  })();

  const getCurrentPhase = () => {
    if (!hormoneData?.lastPeriod) return null;
    const now = new Date();
    const period = new Date(hormoneData.lastPeriod + 'T00:00:00');
    const day = Math.floor((now - period) / (1000 * 60 * 60 * 24)) + 1;
    if (day <= 5) return 'Menstrual';
    if (day <= 13) return 'Follicular';
    if (day <= 16) return 'Ovulation';
    return 'Luteal';
  };

  const currentPhase = getCurrentPhase();
  const phaseFoods = currentPhase ? HORMONE_FOODS[currentPhase] : null;

  const avgLifestyle = lifestyleLogs.length > 0 ? {
    water: (lifestyleLogs.reduce((s, l) => s + (l.water_glasses || 0), 0) / lifestyleLogs.length).toFixed(1),
    sleep: (lifestyleLogs.reduce((s, l) => s + (l.sleep_hours || 0), 0) / lifestyleLogs.length).toFixed(1),
    foods_good: [...new Set(lifestyleLogs.flatMap(l => l.foods_good || []))],
    foods_bad: [...new Set(lifestyleLogs.flatMap(l => l.foods_bad || []))],
  } : null;

  const buildContext = () => {
    const parts = [];
    if (skinAnalysis) parts.push(`SKIN: type=${skinAnalysis.skin_type}, score=${skinAnalysis.overall_score}/100, acne=${skinAnalysis.acne_level}/10, oiliness=${skinAnalysis.oiliness}/10, dryness=${skinAnalysis.dryness}/10.`);
    if (currentPhase) parts.push(`CYCLE: ${currentPhase} phase.`);
    if (avgLifestyle) {
      parts.push(`LIFESTYLE (7d avg): water=${avgLifestyle.water}/day, sleep=${avgLifestyle.sleep}h.`);
      if (avgLifestyle.foods_bad.length) parts.push(`Bad foods: ${avgLifestyle.foods_bad.join(', ')}.`);
    }
    return parts.join(' ') || 'No personal data yet — general skin diet advice.';
  };

  const invokeAI = async (prompt, schema) => {
    setLoading(true);
    setAiResult(null);
    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    setAiResult(res);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#34d399,#10b981)' }}>
            <span className="text-2xl">🥗</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Skin Diet Hub</h1>
            <p className="text-sm text-gray-500">Nutrition powered by your skin data</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: 'Skin Analysis', ok: !!skinAnalysis, href: '/SkinAnalysis' },
          { label: 'Lifestyle Log', ok: lifestyleLogs.length > 0, href: '/Lifestyle' },
          { label: 'Hormone Data', ok: !!currentPhase, href: '/HormoneTracker' },
        ].map(({ label, ok, href }) => (
          <Link key={label} to={href}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${ok ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'}`}>
            <span>{ok ? '✅' : '➕'}</span> {label}
          </Link>
        ))}
      </div>

      {/* Hormone Phase Banner */}
      {phaseFoods && (
        <div className="mb-5 p-4 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
          <p className="font-bold text-sm text-violet-700 dark:text-violet-300 mb-2">🌙 {currentPhase} Phase — Eat for Your Cycle</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-semibold text-emerald-600 mb-1">✅ Eat More</p>
              {phaseFoods.eat.map((f, i) => <p key={i} className="text-xs text-gray-600">• {f}</p>)}
            </div>
            <div>
              <p className="text-xs font-semibold text-red-500 mb-1">🚫 Avoid</p>
              {phaseFoods.avoid.map((f, i) => <p key={i} className="text-xs text-gray-600">• {f}</p>)}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setAiResult(null); }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-white shadow-md'
                : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50'
            }`}
            style={activeTab === tab.id ? { background: 'linear-gradient(135deg,#f472b6,#a78bfa)' } : {}}>
            <span>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>

          {/* Smart Plan */}
          {activeTab === 'smart_plan' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-lg mb-1">🧬 AI Smart Diet Plan</h3>
                <p className="text-sm text-gray-500 mb-4">Personalized using your skin & hormone data</p>
                {skinAnalysis && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                    <p className="text-xs font-bold text-rose-600 mb-1">📊 Skin Profile</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{skinAnalysis.skin_type} skin · Score {skinAnalysis.overall_score}/100 · Acne {skinAnalysis.acne_level}/10</p>
                  </div>
                )}
                <Button onClick={() => invokeAI(
                  `Create a personalized 1-day skin diet plan:\n${buildContext()}\nInclude breakfast, lunch, dinner, snack. Science-backed and tailored to their skin.`,
                  { type: 'object', properties: {
                    goal_summary: { type: 'string' },
                    meals: { type: 'array', items: { type: 'object', properties: {
                      meal_type: { type: 'string' }, name: { type: 'string' },
                      foods: { type: 'array', items: { type: 'string' } },
                      skin_benefits: { type: 'string' }, calories_approx: { type: 'number' }
                    }}},
                    daily_tip: { type: 'string' },
                    foods_to_avoid: { type: 'array', items: { type: 'string' } }
                  }}
                )} disabled={loading} className="w-full font-bold text-white py-3 rounded-2xl ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate My Smart Plan</>}
                </Button>
              </div>
              {aiResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{aiResult.goal_summary}</p>
                    {aiResult.daily_tip && <p className="mt-2 text-sm font-semibold text-emerald-600">💡 {aiResult.daily_tip}</p>}
                  </div>
                  {aiResult.meals?.map((meal, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                      <button className="w-full flex items-center justify-between" onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{['🌅','☀️','🌙','🍎'][i] || '🍽️'}</span>
                          <div className="text-left">
                            <p className="font-bold">{meal.meal_type}: {meal.name}</p>
                            <p className="text-xs text-gray-400">~{meal.calories_approx} cal</p>
                          </div>
                        </div>
                        {expandedMeal === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                      {expandedMeal === i && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {meal.foods?.map((f, fi) => <Badge key={fi} variant="outline" className="text-xs">{f}</Badge>)}
                          </div>
                          <p className="text-xs text-emerald-600"><Leaf className="w-3 h-3 inline mr-1" />{meal.skin_benefits}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {aiResult.foods_to_avoid?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200">
                      <h4 className="font-bold text-red-600 mb-2">🚫 Avoid Today</h4>
                      <div className="flex flex-wrap gap-1">
                        {aiResult.foods_to_avoid.map((f, i) => <Badge key={i} className="bg-red-500 text-xs">{f}</Badge>)}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Skin Food */}
          {activeTab === 'skin_food' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-lg mb-1">💆 Skin-Food Connection</h3>
                <p className="text-sm text-gray-500 mb-4">Which foods help or harm YOUR specific skin</p>
                {avgLifestyle?.foods_bad?.length > 0 && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                    <p className="text-xs font-bold text-red-600 mb-1">⚠️ Bad Foods You've Been Eating</p>
                    <div className="flex flex-wrap gap-1">{avgLifestyle.foods_bad.map((f, i) => <Badge key={i} className="bg-red-500 text-xs">{f}</Badge>)}</div>
                  </div>
                )}
                <Button onClick={() => invokeAI(
                  `Analyze skin-food connection:\n${buildContext()}\nList glow foods and trigger foods specific to this user's skin issues.`,
                  { type: 'object', properties: {
                    glow_foods: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, benefit: { type: 'string' } } } },
                    trigger_foods: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, why: { type: 'string' } } } },
                    summary: { type: 'string' }
                  }}
                )} disabled={loading} className="w-full font-bold text-white py-3 rounded-2xl ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing...</> : <><Heart className="w-4 h-4 mr-2" />Analyze Skin-Food Link</>}
                </Button>
              </div>
              {aiResult && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
                    <h4 className="font-bold text-emerald-600 mb-3">✅ Glow Foods</h4>
                    {aiResult.glow_foods?.map((item, i) => (
                      <div key={i} className="mb-3">
                        <p className="font-semibold text-sm">🌟 {item.food}</p>
                        <p className="text-xs text-gray-500">{item.benefit}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200">
                    <h4 className="font-bold text-red-600 mb-3">🚫 Triggers</h4>
                    {aiResult.trigger_foods?.map((item, i) => (
                      <div key={i} className="mb-3">
                        <p className="font-semibold text-sm">⚠️ {item.food}</p>
                        <p className="text-xs text-gray-500">{item.why}</p>
                      </div>
                    ))}
                  </div>
                  {aiResult.summary && (
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100">
                      <p className="text-sm text-gray-600 dark:text-gray-300">💡 {aiResult.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detox */}
          {activeTab === 'detox' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-lg mb-1">⚡ Skin Detox Plan</h3>
                <p className="text-sm text-gray-500 mb-4">Anti-inflammatory cleanse tailored to your skin data</p>
                <div className="flex gap-2 mb-4">
                  {[3, 5, 7].map(d => (
                    <button key={d} onClick={() => setDetoxDays(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${detoxDays === d ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}>
                      {d} Days
                    </button>
                  ))}
                </div>
                <Button onClick={() => invokeAI(
                  `Create a ${detoxDays}-day skin detox diet plan:\n${buildContext()}\nFocus on eliminating bad foods and healing the gut-skin axis.`,
                  { type: 'object', properties: {
                    detox_rules: { type: 'array', items: { type: 'string' } },
                    daily_plans: { type: 'array', items: { type: 'object', properties: {
                      day: { type: 'number' }, focus: { type: 'string' },
                      meals: { type: 'array', items: { type: 'string' } },
                      detox_drink: { type: 'string' }, avoid: { type: 'string' }
                    }}},
                    expected_results: { type: 'string' }
                  }}
                )} disabled={loading} className="w-full font-bold text-white py-3 rounded-2xl ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating plan...</> : <><Zap className="w-4 h-4 mr-2" />Start {detoxDays}-Day Detox</>}
                </Button>
              </div>
              {aiResult && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200">
                    <h4 className="font-bold text-teal-600 mb-2">📋 Rules</h4>
                    {aiResult.detox_rules?.map((r, i) => <p key={i} className="text-sm text-gray-600 mb-1">• {r}</p>)}
                  </div>
                  {aiResult.daily_plans?.map((day, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">{day.day}</div>
                        <p className="font-bold text-sm">{day.focus}</p>
                      </div>
                      {day.meals?.map((m, mi) => <p key={mi} className="text-xs text-gray-500 mb-0.5">🍽️ {m}</p>)}
                      {day.detox_drink && <p className="text-xs text-cyan-600 mt-1">💧 {day.detox_drink}</p>}
                      {day.avoid && <p className="text-xs text-red-500 mt-0.5">🚫 {day.avoid}</p>}
                    </div>
                  ))}
                  {aiResult.expected_results && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <p className="text-sm font-semibold text-emerald-600">🌟 {aiResult.expected_results}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Insights */}
          {activeTab === 'ai_insights' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-lg mb-1">🤖 AI Nutrition Insights</h3>
                <p className="text-sm text-gray-500 mb-4">Weekly recommendations based on all your data</p>
                <Button onClick={() => invokeAI(
                  `Generate a weekly AI nutrition insights report:\n${buildContext()}\nIdentify patterns, wins, gaps, and give a 3-step action plan. Be specific and data-driven.`,
                  { type: 'object', properties: {
                    weekly_summary: { type: 'string' },
                    key_insights: { type: 'array', items: { type: 'string' } },
                    nutrient_focus: { type: 'array', items: { type: 'object', properties: {
                      nutrient: { type: 'string' }, why: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } }
                    }}},
                    action_plan: { type: 'array', items: { type: 'string' } },
                    skin_diet_score: { type: 'number' }
                  }}
                )} disabled={loading} className="w-full font-bold text-white py-3 rounded-2xl ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing...</> : <><TrendingUp className="w-4 h-4 mr-2" />Generate Weekly Insights</>}
                </Button>
              </div>
              {aiResult && (
                <div className="space-y-3">
                  {aiResult.skin_diet_score !== undefined && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-indigo-200 flex items-center gap-4">
                      <div className="text-center flex-shrink-0">
                        <p className="text-4xl font-black text-indigo-600">{aiResult.skin_diet_score}</p>
                        <p className="text-xs text-gray-500">Diet Score</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{aiResult.weekly_summary}</p>
                    </div>
                  )}
                  <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 shadow-sm">
                    <h4 className="font-bold mb-3">💡 Key Insights</h4>
                    {aiResult.key_insights?.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <span className="text-indigo-500 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{insight}</p>
                      </div>
                    ))}
                  </div>
                  {aiResult.nutrient_focus?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 shadow-sm">
                      <h4 className="font-bold mb-3">🧬 Nutrient Focus</h4>
                      {aiResult.nutrient_focus.map((item, i) => (
                        <div key={i} className="mb-3">
                          <p className="font-semibold text-sm">{item.nutrient}</p>
                          <p className="text-xs text-gray-500 mb-1">{item.why}</p>
                          <div className="flex flex-wrap gap-1">
                            {item.sources?.map((s, si) => <Badge key={si} variant="outline" className="text-xs">{s}</Badge>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
                    <h4 className="font-bold text-emerald-600 mb-3">✅ Action Plan</h4>
                    {aiResult.action_plan?.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}