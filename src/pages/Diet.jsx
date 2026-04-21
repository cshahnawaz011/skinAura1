import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Apple, Sparkles, Loader2, Flame, Droplets, Leaf, Target,
  Calendar, Map, BookOpen, Zap, Moon, Sun, TrendingUp, Heart,
  ChevronDown, ChevronUp, Star, Clock, AlertTriangle, CheckCircle,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'smart_plan', label: 'Smart Plan', icon: Sparkles, emoji: '🧬' },
  { id: 'skin_food', label: 'Skin-Food', icon: Heart, emoji: '💆' },
  { id: 'goals', label: 'Goals', icon: Target, emoji: '🎯' },
  { id: 'glow_log', label: 'Glow Log', icon: Star, emoji: '✨' },
  { id: 'travel', label: 'Travel Diet', icon: Map, emoji: '✈️' },
  { id: 'ingredients', label: 'Food Ingredients', icon: BookOpen, emoji: '🌿' },
  { id: 'calendar', label: 'Meal Calendar', icon: Calendar, emoji: '📅' },
  { id: 'detox', label: 'Detox Mode', icon: Zap, emoji: '⚡' },
  { id: 'face_yoga', label: 'Yoga + Diet', icon: Sun, emoji: '🧘' },
  { id: 'ai_insights', label: 'AI Insights', icon: TrendingUp, emoji: '🤖' },
];

const GLOW_TASKS = [
  { id: 'water', label: 'Drink 8 glasses of water', emoji: '💧', points: 10 },
  { id: 'antioxidants', label: 'Eat 3 antioxidant-rich foods', emoji: '🫐', points: 15 },
  { id: 'no_sugar', label: 'Skip added sugar today', emoji: '🚫🍬', points: 20 },
  { id: 'greens', label: 'Eat leafy greens', emoji: '🥬', points: 10 },
  { id: 'omega3', label: 'Include omega-3 source', emoji: '🐟', points: 15 },
  { id: 'no_dairy', label: 'Go dairy-free today', emoji: '🥛❌', points: 20 },
  { id: 'collagen', label: 'Collagen-boosting meal', emoji: '🦴', points: 15 },
  { id: 'probiotic', label: 'Eat a probiotic food', emoji: '🥗', points: 10 },
];

const HORMONE_FOODS = {
  Menstrual: { eat: ['Iron-rich foods', 'Dark chocolate', 'Chamomile tea', 'Omega-3 fish'], avoid: ['Caffeine', 'Salty foods', 'Alcohol'] },
  Follicular: { eat: ['Fermented foods', 'Leafy greens', 'Flaxseeds', 'Berries'], avoid: ['Processed foods', 'Trans fats'] },
  Ovulation: { eat: ['Pumpkin seeds', 'Citrus fruits', 'Turmeric', 'Bone broth'], avoid: ['Refined carbs', 'Alcohol'] },
  Luteal: { eat: ['B6-rich foods', 'Magnesium foods', 'Dark leafy greens', 'Complex carbs'], avoid: ['Dairy', 'Sugar', 'Caffeine'] },
};

const DETOX_PLANS = [
  { day: 1, meals: ['Warm lemon water', 'Green smoothie bowl', 'Quinoa veggie bowl', 'Herbal tea + almonds'] },
  { day: 2, meals: ['Cucumber detox water', 'Chia pudding', 'Lentil soup', 'Apple + almond butter'] },
  { day: 3, meals: ['Ginger tea', 'Overnight oats + berries', 'Buddha bowl', 'Celery juice'] },
];

const YOGA_FOODS = [
  { exercise: 'Face Lifting', foods: ['Blueberries', 'Avocado', 'Salmon'], benefit: 'Boosts collagen & elasticity' },
  { exercise: 'Cheek Toning', foods: ['Turmeric latte', 'Walnuts', 'Dark chocolate'], benefit: 'Anti-inflammatory support' },
  { exercise: 'Jaw Relaxation', foods: ['Chamomile tea', 'Magnesium-rich spinach', 'Bananas'], benefit: 'Reduces muscle tension' },
  { exercise: 'Eye Brightening', foods: ['Carrots', 'Sweet potato', 'Orange', 'Kale'], benefit: 'Vitamin A for brightness' },
];

export default function Diet() {
  const [activeTab, setActiveTab] = useState('smart_plan');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [glowTasksDone, setGlowTasksDone] = useState([]);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [detoxDay, setDetoxDay] = useState(0);
  const [mealLog, setMealLog] = useState(() => {
    const saved = localStorage.getItem('diet-meal-log');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // ── DB Data ──────────────────────────────────────────────────────────
  const { data: skinAnalysis } = useQuery({
    queryKey: ['dietSkinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0]),
    enabled: !!user?.email,
  });

  // Last 7 days of Lifestyle/DietLog entries
  const { data: lifestyleLogs = [] } = useQuery({
    queryKey: ['dietLifestyleLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 7),
    enabled: !!user?.email,
  });

  // Today's lifestyle log
  const todayDate = new Date().toLocaleDateString('en-CA');
  const { data: todayLog } = useQuery({
    queryKey: ['dietTodayLog', user?.email, todayDate],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email, log_date: todayDate }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  // Skin journal entries
  const { data: skinJournalEntries = [] } = useQuery({
    queryKey: ['dietSkinJournal', user?.email],
    queryFn: () => base44.entities.SkinJournal.filter({ created_by: user.email }, '-created_date', 10),
    enabled: !!user?.email,
  });

  // Glow Goals
  const { data: glowGoals = [] } = useQuery({
    queryKey: ['dietGlowGoals', user?.email],
    queryFn: () => base44.entities.GlowGoals.filter({ created_by: user.email }, '-created_date', 10),
    enabled: !!user?.email,
  });

  // Skin Routine
  const { data: skinRoutine } = useQuery({
    queryKey: ['dietSkinRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  // ── LocalStorage Data ─────────────────────────────────────────────────
  const hormoneData = (() => {
    try { const s = localStorage.getItem('hormone-tracker'); return s ? JSON.parse(s) : null; } catch { return null; }
  })();

  const travelData = (() => {
    try { const s = localStorage.getItem('travel-skincare'); return s ? JSON.parse(s) : null; } catch { return null; }
  })();

  // ── Derived / computed data ───────────────────────────────────────────
  // Avg lifestyle metrics over last 7 days
  const avgLifestyle = lifestyleLogs.length > 0 ? {
    water: (lifestyleLogs.reduce((s, l) => s + (l.water_glasses || 0), 0) / lifestyleLogs.length).toFixed(1),
    sleep: (lifestyleLogs.reduce((s, l) => s + (l.sleep_hours || 0), 0) / lifestyleLogs.length).toFixed(1),
    stress: (lifestyleLogs.reduce((s, l) => s + (l.stress_level || 3), 0) / lifestyleLogs.length).toFixed(1),
    coffee: (lifestyleLogs.reduce((s, l) => s + (l.coffee_cups || 0), 0) / lifestyleLogs.length).toFixed(1),
    alcohol: (lifestyleLogs.reduce((s, l) => s + (l.alcohol_drinks || 0), 0) / lifestyleLogs.length).toFixed(1),
    skincare_morning_pct: Math.round(lifestyleLogs.filter(l => l.skincare_done_morning).length / lifestyleLogs.length * 100),
    foods_good: [...new Set(lifestyleLogs.flatMap(l => l.foods_good || []))],
    foods_bad: [...new Set(lifestyleLogs.flatMap(l => l.foods_bad || []))],
    vitamins: [...new Set(lifestyleLogs.flatMap(l => l.vitamins_taken || []))],
  } : null;

  // Build a comprehensive context string for AI prompts
  const buildContext = () => {
    const parts = [];
    if (skinAnalysis) {
      parts.push(`SKIN ANALYSIS: type=${skinAnalysis.skin_type}, score=${skinAnalysis.overall_score}/100, acne=${skinAnalysis.acne_level}/10, oiliness=${skinAnalysis.oiliness}/10, dryness=${skinAnalysis.dryness}/10, dark_spots=${skinAnalysis.dark_spots}/10, redness=${skinAnalysis.redness}/10, sensitivity=${skinAnalysis.sensitivity}/10.`);
    }
    if (currentPhase) {
      parts.push(`HORMONE CYCLE: Currently in ${currentPhase} phase (Day of cycle based on tracker).`);
    }
    if (avgLifestyle) {
      parts.push(`LIFESTYLE (7-day avg): water=${avgLifestyle.water} glasses/day, sleep=${avgLifestyle.sleep}h/night, stress=${avgLifestyle.stress}/5, coffee=${avgLifestyle.coffee} cups/day, alcohol=${avgLifestyle.alcohol} drinks/day, morning skincare done ${avgLifestyle.skincare_morning_pct}% of days.`);
      if (avgLifestyle.foods_good.length) parts.push(`Good foods recently eaten: ${avgLifestyle.foods_good.join(', ')}.`);
      if (avgLifestyle.foods_bad.length) parts.push(`Bad foods recently eaten: ${avgLifestyle.foods_bad.join(', ')}.`);
      if (avgLifestyle.vitamins.length) parts.push(`Supplements taken: ${avgLifestyle.vitamins.join(', ')}.`);
    }
    if (todayLog) {
      parts.push(`TODAY'S LOG: water=${todayLog.water_glasses || 0} glasses, sleep=${todayLog.sleep_hours || 0}h, stress=${todayLog.stress_level || 'unknown'}/5, mood=${todayLog.mood || 'unknown'}.`);
    }
    if (skinJournalEntries.length > 0) {
      const recentMoods = skinJournalEntries.slice(0, 3).map(e => e.mood || e.skin_feel || e.notes).filter(Boolean);
      if (recentMoods.length) parts.push(`SKIN JOURNAL (recent): ${recentMoods.join('; ')}.`);
    }
    if (glowGoals.length > 0) {
      const activeGoals = glowGoals.filter(g => g.status === 'active' || !g.status).map(g => g.title || g.goal).filter(Boolean).slice(0, 3);
      if (activeGoals.length) parts.push(`ACTIVE GLOW GOALS: ${activeGoals.join(', ')}.`);
    }
    if (skinRoutine) {
      parts.push(`HAS SKINCARE ROUTINE: Yes (${skinRoutine.skin_type || ''} routine active).`);
    }
    return parts.join(' ') || 'No personal data available yet — provide general advice.'
  };

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

  // buildContext is defined below after currentPhase is available

  const invokeAI = async (prompt, schema) => {
    setLoading(true);
    setAiResult(null);
    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    setAiResult(res);
    setLoading(false);
  };

  const toggleGlowTask = (id) => {
    setGlowTasksDone(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const glowPoints = GLOW_TASKS.filter(t => glowTasksDone.includes(t.id)).reduce((sum, t) => sum + t.points, 0);

  const logMeal = (day, slot, food) => {
    const updated = { ...mealLog, [`${day}_${slot}`]: food };
    setMealLog(updated);
    localStorage.setItem('diet-meal-log', JSON.stringify(updated));
  };

  const today = format(new Date(), 'MMM d, yyyy');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(135deg, #84cc16, #22c55e)' }}>
          🥗
        </div>
        <div>
          <h1 className="text-3xl font-bold">Diet & Glow Hub</h1>
          <p className="text-gray-500 dark:text-gray-400">Smart nutrition powered by your skin data</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard className="text-center p-3">
          <p className="text-2xl font-bold text-emerald-500">{glowPoints}</p>
          <p className="text-xs text-gray-500">Glow Points Today</p>
        </GlassCard>
        <GlassCard className="text-center p-3">
          <p className="text-xl font-bold text-rose-500">{currentPhase || '—'}</p>
          <p className="text-xs text-gray-500">Cycle Phase</p>
        </GlassCard>
        <GlassCard className="text-center p-3">
          <p className="text-2xl font-bold text-blue-500">{todayLog?.water_glasses ?? avgLifestyle?.water ?? '—'}</p>
          <p className="text-xs text-gray-500">Glasses Water</p>
        </GlassCard>
        <GlassCard className="text-center p-3">
          <p className="text-2xl font-bold text-indigo-500">{todayLog?.sleep_hours ?? avgLifestyle?.sleep ?? '—'}</p>
          <p className="text-xs text-gray-500">Sleep Hours</p>
        </GlassCard>
      </div>

      {/* Data Connection Banner */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Skin Analysis', ok: !!skinAnalysis, href: '/SkinAnalysis' },
          { label: 'Lifestyle Log', ok: lifestyleLogs.length > 0, href: '/Lifestyle' },
          { label: 'Hormone Tracker', ok: !!currentPhase, href: '/HormoneTracker' },
          { label: 'Skin Journal', ok: skinJournalEntries.length > 0, href: '/SkinJournal' },
          { label: 'Glow Goals', ok: glowGoals.length > 0, href: '/GlowGoals' },
        ].map(({ label, ok, href }) => (
          <Link key={label} to={href}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${ok ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600'}`}>
            <span>{ok ? '✅' : '➕'}</span> {label}
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setAiResult(null); }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10'
            }`}>
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* 1. Smart Diet Plan */}
          {activeTab === 'smart_plan' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">🧬 Smart Diet Plan</h3>
                <p className="text-sm text-gray-500 mb-4">Generated using your hormone cycle phase & skin analysis data</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {skinAnalysis ? (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                      <p className="text-xs font-bold text-rose-600 mb-1">📊 Skin Profile Connected</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Type: {skinAnalysis.skin_type} | Acne: {skinAnalysis.acne_level}/10 | Oiliness: {skinAnalysis.oiliness}/10 | Score: {skinAnalysis.overall_score}/100</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                      <p className="text-xs font-bold text-gray-500 mb-1">📊 No Skin Analysis</p>
                      <Link to="/SkinAnalysis" className="text-xs text-rose-500 underline">Run Skin Analysis →</Link>
                    </div>
                  )}
                  {currentPhase ? (
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                      <p className="text-xs font-bold text-violet-600 mb-1">🌙 Hormone Phase Connected</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{currentPhase} phase — diet adjusted accordingly</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                      <p className="text-xs font-bold text-gray-500 mb-1">🌙 No Hormone Data</p>
                      <Link to="/HormoneTracker" className="text-xs text-violet-500 underline">Set up Hormone Tracker →</Link>
                    </div>
                  )}
                  {avgLifestyle && (
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 md:col-span-2">
                      <p className="text-xs font-bold text-blue-600 mb-1">📋 Lifestyle Data Connected (7-day avg)</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        💧 {avgLifestyle.water} glasses water · 😴 {avgLifestyle.sleep}h sleep · 😟 Stress {avgLifestyle.stress}/5 · ☕ {avgLifestyle.coffee} coffees/day
                        {avgLifestyle.foods_bad.length > 0 ? ` · ⚠️ Bad foods: ${avgLifestyle.foods_bad.slice(0,3).join(', ')}` : ''}
                      </p>
                    </div>
                  )}
                </div>
                <Button onClick={() => invokeAI(
                  `Create a personalized 1-day skin diet plan using this user's data:\n${buildContext()}\nInclude breakfast, lunch, dinner, snack. Make it science-backed and skin-focused. Tailor every meal to their specific skin issues and lifestyle patterns.`,
                  { type: 'object', properties: { goal_summary: { type: 'string' }, meals: { type: 'array', items: { type: 'object', properties: { meal_type: { type: 'string' }, name: { type: 'string' }, foods: { type: 'array', items: { type: 'string' } }, skin_benefits: { type: 'string' }, calories_approx: { type: 'number' } } } }, daily_tip: { type: 'string' }, foods_to_avoid: { type: 'array', items: { type: 'string' } } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate My Smart Plan</>}
                </Button>
              </GlassCard>
              {aiResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <GlassCard className="bg-emerald-50 dark:bg-emerald-900/20">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{aiResult.goal_summary}</p>
                    {aiResult.daily_tip && <p className="mt-2 text-sm font-semibold text-emerald-600">💡 {aiResult.daily_tip}</p>}
                  </GlassCard>
                  {aiResult.meals?.map((meal, i) => (
                    <GlassCard key={i}>
                      <button className="w-full flex items-center justify-between" onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{['🌅','☀️','🌙','🍎'][i] || '🍽️'}</span>
                          <div className="text-left">
                            <p className="font-bold">{meal.meal_type}: {meal.name}</p>
                            <p className="text-xs text-gray-500">~{meal.calories_approx} cal</p>
                          </div>
                        </div>
                        {expandedMeal === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedMeal === i && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {meal.foods?.map((f, fi) => <Badge key={fi} variant="outline" className="text-xs">{f}</Badge>)}
                          </div>
                          <p className="text-xs text-emerald-600 flex items-start gap-1"><Leaf className="w-3 h-3 mt-0.5 flex-shrink-0" />{meal.skin_benefits}</p>
                        </div>
                      )}
                    </GlassCard>
                  ))}
                  {aiResult.foods_to_avoid?.length > 0 && (
                    <GlassCard className="bg-red-50 dark:bg-red-900/20">
                      <h4 className="font-bold text-red-600 mb-2">🚫 Avoid Today</h4>
                      <div className="flex flex-wrap gap-1">
                        {aiResult.foods_to_avoid.map((f, i) => <Badge key={i} className="bg-red-500 text-xs">{f}</Badge>)}
                      </div>
                    </GlassCard>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* 2. Skin-Food Connection */}
          {activeTab === 'skin_food' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1">💆 Skin-Food Connection</h3>
                <p className="text-sm text-gray-500 mb-4">Discover which foods help or harm your skin based on your diary</p>
                {avgLifestyle ? (
                  <div className="mb-4 space-y-2">
                    {avgLifestyle.foods_good.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-xs font-bold text-emerald-600 mb-1">✅ Good Foods You've Been Eating</p>
                        <div className="flex flex-wrap gap-1">{avgLifestyle.foods_good.map((f, i) => <Badge key={i} className="bg-emerald-500 text-xs">{f}</Badge>)}</div>
                      </div>
                    )}
                    {avgLifestyle.foods_bad.length > 0 && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                        <p className="text-xs font-bold text-red-600 mb-1">⚠️ Bad Foods You've Been Eating</p>
                        <div className="flex flex-wrap gap-1">{avgLifestyle.foods_bad.map((f, i) => <Badge key={i} className="bg-red-500 text-xs">{f}</Badge>)}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-xs font-bold text-amber-600 mb-1">💡 No Lifestyle Data Found</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Log food entries in <Link to="/Lifestyle" className="underline text-amber-600">Lifestyle Tracker</Link> for personalized food analysis</p>
                  </div>
                )}
                <Button onClick={() => invokeAI(
                  `Analyze this user's skin-food connection using their real data:\n${buildContext()}\nGive me a comprehensive personalized list of foods that help THIS user's specific skin concerns and foods that are likely triggering their issues. Mention specific issues (acne, dryness, oiliness etc.) from their profile. Be specific and science-backed.`,
                  { type: 'object', properties: { glow_foods: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, benefit: { type: 'string' }, how_to_eat: { type: 'string' } } } }, trigger_foods: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, why: { type: 'string' } } } }, summary: { type: 'string' } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-rose-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing...</> : <><Heart className="w-4 h-4 mr-2" />Analyze Skin-Food Link</>}
                </Button>
              </GlassCard>
              {aiResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard className="bg-emerald-50 dark:bg-emerald-900/20">
                    <h4 className="font-bold text-emerald-600 mb-3">✅ Glow Foods</h4>
                    {aiResult.glow_foods?.map((item, i) => (
                      <div key={i} className="mb-3 p-2 bg-white/60 dark:bg-white/5 rounded-lg">
                        <p className="font-semibold text-sm">🌟 {item.food}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{item.benefit}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">How: {item.how_to_eat}</p>
                      </div>
                    ))}
                  </GlassCard>
                  <GlassCard className="bg-red-50 dark:bg-red-900/20">
                    <h4 className="font-bold text-red-600 mb-3">🚫 Trigger Foods</h4>
                    {aiResult.trigger_foods?.map((item, i) => (
                      <div key={i} className="mb-3 p-2 bg-white/60 dark:bg-white/5 rounded-lg">
                        <p className="font-semibold text-sm">⚠️ {item.food}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{item.why}</p>
                      </div>
                    ))}
                  </GlassCard>
                  {aiResult.summary && <GlassCard className="md:col-span-2"><p className="text-sm text-gray-700 dark:text-gray-300">💡 {aiResult.summary}</p></GlassCard>}
                </div>
              )}
            </div>
          )}

          {/* 3. Nutrition Goals */}
          {activeTab === 'goals' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1">🎯 Nutrition Goal Tracker</h3>
                <p className="text-sm text-gray-500 mb-4">Align your nutrition with your skin goals</p>
                <Button onClick={() => invokeAI(
                  `Create a personalized nutrition goal plan based on this user's real data:\n${buildContext()}\nGive me 5 specific nutrition goals with daily targets, what foods to eat, and how each goal directly improves their specific skin concerns. Prioritize goals based on what the data shows they need most.`,
                  { type: 'object', properties: { goals: { type: 'array', items: { type: 'object', properties: { goal: { type: 'string' }, daily_target: { type: 'string' }, foods: { type: 'array', items: { type: 'string' } }, skin_benefit: { type: 'string' }, difficulty: { type: 'string' } } } }, overall_strategy: { type: 'string' } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-violet-500 to-purple-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Building Goals...</> : <><Target className="w-4 h-4 mr-2" />Generate Nutrition Goals</>}
                </Button>
              </GlassCard>
              {aiResult?.goals?.map((goal, i) => (
                <GlassCard key={i}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold">{goal.goal}</p>
                      <p className="text-xs text-violet-600 font-semibold">📅 {goal.daily_target}</p>
                    </div>
                    <Badge className={goal.difficulty === 'Easy' ? 'bg-emerald-500' : goal.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-red-500'}>
                      {goal.difficulty}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {goal.foods?.map((f, fi) => <Badge key={fi} variant="outline" className="text-xs">{f}</Badge>)}
                  </div>
                  <p className="text-xs text-emerald-600"><Leaf className="w-3 h-3 inline mr-1" />{goal.skin_benefit}</p>
                </GlassCard>
              ))}
              {aiResult?.overall_strategy && (
                <GlassCard className="bg-violet-50 dark:bg-violet-900/20">
                  <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">🧠 {aiResult.overall_strategy}</p>
                </GlassCard>
              )}
            </div>
          )}

          {/* 4. Glow Log */}
          {activeTab === 'glow_log' && (
            <div className="space-y-4">
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">✨ Glow Meal Log</h3>
                    <p className="text-sm text-gray-500">Daily diet tasks for your glow challenge</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-500">{glowPoints}</p>
                    <p className="text-xs text-gray-500">points earned</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {GLOW_TASKS.map(task => (
                    <button key={task.id} onClick={() => toggleGlowTask(task.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        glowTasksDone.includes(task.id)
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-200'
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{task.emoji}</span>
                        <span className="text-sm font-medium">{task.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">+{task.points}pts</Badge>
                        {glowTasksDone.includes(task.id) && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </GlassCard>
              <GlassCard className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🏆</span>
                  <div>
                    <p className="font-bold">{glowPoints >= 80 ? 'Perfect Glow Day!' : glowPoints >= 50 ? 'Great Progress!' : 'Keep Going!'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {glowPoints >= 80 ? 'You crushed all your diet goals today!' : `${80 - glowPoints} more points to reach Perfect Glow Day`}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* 5. Travel Diet */}
          {activeTab === 'travel' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1">✈️ Travel Diet Adapter</h3>
                <p className="text-sm text-gray-500 mb-4">Smart diet adjustments for your travel destination</p>
                {travelData ? (
                  <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-xs font-bold text-blue-600 mb-1">🌍 Travel Data Found</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Destination detected — personalizing diet recommendations</p>
                  </div>
                ) : null}
                <Button onClick={() => invokeAI(
                  `Give personalized travel diet advice for skin health using this data:\n${buildContext()}\n${travelData ? `Travel context: ${JSON.stringify(travelData)}.` : ''} Consider how their specific skin type and current lifestyle patterns should adapt when traveling. Climate changes, time zones, and local cuisine options.`,
                  { type: 'object', properties: { travel_tips: { type: 'array', items: { type: 'string' } }, local_foods_to_try: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, skin_benefit: { type: 'string' } } } }, foods_to_avoid_when_traveling: { type: 'array', items: { type: 'string' } }, hydration_tips: { type: 'array', items: { type: 'string' } } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Planning...</> : <><Map className="w-4 h-4 mr-2" />Get Travel Diet Plan</>}
                </Button>
              </GlassCard>
              {aiResult && (
                <div className="space-y-4">
                  <GlassCard>
                    <h4 className="font-bold text-blue-600 mb-3">✈️ Travel Diet Tips</h4>
                    {aiResult.travel_tips?.map((tip, i) => <p key={i} className="text-sm text-gray-600 dark:text-gray-400 mb-1">• {tip}</p>)}
                  </GlassCard>
                  <GlassCard className="bg-emerald-50 dark:bg-emerald-900/20">
                    <h4 className="font-bold text-emerald-600 mb-3">🌍 Local Foods for Skin</h4>
                    {aiResult.local_foods_to_try?.map((item, i) => (
                      <div key={i} className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{item.food}</span>
                        <span className="text-xs text-emerald-600">{item.skin_benefit}</span>
                      </div>
                    ))}
                  </GlassCard>
                  <GlassCard>
                    <h4 className="font-bold mb-3">💧 Hydration Tips</h4>
                    {aiResult.hydration_tips?.map((tip, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400 mb-1">• {tip}</p>)}
                  </GlassCard>
                </div>
              )}
            </div>
          )}

          {/* 6. Ingredient-to-Food Map */}
          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1">🌿 Ingredient-to-Food Map</h3>
                <p className="text-sm text-gray-500 mb-4">Skincare ingredients you can also eat for double the benefits</p>
                <Button onClick={() => invokeAI(
                  `User profile:\n${buildContext()}\nBased on their specific skin concerns, prioritize the most relevant skincare ingredients (like Vitamin C, Retinol/Vitamin A, Hyaluronic Acid, Niacinamide, Collagen, Zinc, Vitamin E, Omega-3) that can also be consumed as food. Show food sources for each and explain why THEIR skin specifically benefits.`,
                  { type: 'object', properties: { ingredient_foods: { type: 'array', items: { type: 'object', properties: { ingredient: { type: 'string' }, food_sources: { type: 'array', items: { type: 'string' } }, skin_benefit: { type: 'string' }, daily_tip: { type: 'string' } } } } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-emerald-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Mapping...</> : <><BookOpen className="w-4 h-4 mr-2" />Map Ingredients to Foods</>}
                </Button>
              </GlassCard>
              {aiResult?.ingredient_foods?.map((item, i) => (
                <GlassCard key={i}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-lg flex-shrink-0">🧪</div>
                    <div className="flex-1">
                      <p className="font-bold text-teal-700 dark:text-teal-300">{item.ingredient}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{item.skin_benefit}</p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {item.food_sources?.map((f, fi) => <Badge key={fi} variant="outline" className="text-xs">{f}</Badge>)}
                      </div>
                      {item.daily_tip && <p className="text-xs text-teal-600">💡 {item.daily_tip}</p>}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* 7. Beauty Calendar Meal Planner */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1">📅 Beauty Meal Calendar</h3>
                <p className="text-sm text-gray-500 mb-4">Plan meals alongside your beauty routine — {today}</p>
                <Button onClick={() => invokeAI(
                  `Create a personalized 7-day beauty meal calendar using this user's data:\n${buildContext()}\nFor each day, suggest a theme meal plan tailored to their skin type and current concerns (e.g., if acne is high, include more anti-acne days). Sync eating windows with their skincare routine if available.`,
                  { type: 'object', properties: { week_plan: { type: 'array', items: { type: 'object', properties: { day: { type: 'string' }, theme: { type: 'string' }, emoji: { type: 'string' }, morning: { type: 'string' }, afternoon: { type: 'string' }, evening: { type: 'string' }, skincare_sync: { type: 'string' } } } } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-rose-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Planning week...</> : <><Calendar className="w-4 h-4 mr-2" />Generate 7-Day Beauty Calendar</>}
                </Button>
              </GlassCard>
              {aiResult?.week_plan?.map((day, i) => (
                <GlassCard key={i}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{day.emoji}</span>
                    <div>
                      <p className="font-bold">{day.day}</p>
                      <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">{day.theme}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg"><p className="font-bold text-amber-600">☀️ Morning</p><p className="text-gray-600 dark:text-gray-400 mt-1">{day.morning}</p></div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><p className="font-bold text-blue-600">🌤️ Afternoon</p><p className="text-gray-600 dark:text-gray-400 mt-1">{day.afternoon}</p></div>
                    <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg"><p className="font-bold text-violet-600">🌙 Evening</p><p className="text-gray-600 dark:text-gray-400 mt-1">{day.evening}</p></div>
                  </div>
                  {day.skincare_sync && <p className="mt-2 text-xs text-rose-500">🧴 {day.skincare_sync}</p>}
                </GlassCard>
              ))}
            </div>
          )}

          {/* 8. Detox Diet Mode */}
          {activeTab === 'detox' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1">⚡ Detox Diet Mode</h3>
                <p className="text-sm text-gray-500 mb-4">3–7 day detox meal plan aligned with your skin detox</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[3, 5, 7].map(days => (
                    <button key={days} onClick={() => setDetoxDay(days)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${detoxDay === days ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                      <p className="font-bold text-lg">{days}</p>
                      <p className="text-xs text-gray-500">Days</p>
                    </button>
                  ))}
                </div>
                <Button onClick={() => invokeAI(
                  `Create a personalized ${detoxDay || 3}-day skin detox diet plan using this user's data:\n${buildContext()}\nFocus on eliminating the specific bad foods this user has been eating and replace with anti-inflammatory, gut-healing alternatives. Address their specific skin concerns (acne, dullness, oiliness etc.) in each day's plan.`,
                  { type: 'object', properties: { detox_rules: { type: 'array', items: { type: 'string' } }, daily_plans: { type: 'array', items: { type: 'object', properties: { day: { type: 'number' }, focus: { type: 'string' }, meals: { type: 'array', items: { type: 'string' } }, detox_drink: { type: 'string' }, avoid: { type: 'string' } } } }, expected_results: { type: 'string' } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating plan...</> : <><Zap className="w-4 h-4 mr-2" />Start {detoxDay || 3}-Day Detox Plan</>}
                </Button>
              </GlassCard>
              {aiResult && (
                <div className="space-y-4">
                  <GlassCard className="bg-teal-50 dark:bg-teal-900/20">
                    <h4 className="font-bold text-teal-600 mb-2">📋 Detox Rules</h4>
                    {aiResult.detox_rules?.map((rule, i) => <p key={i} className="text-sm text-gray-600 dark:text-gray-400 mb-1">• {rule}</p>)}
                  </GlassCard>
                  {aiResult.daily_plans?.map((day, i) => (
                    <GlassCard key={i}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-sm">{day.day}</div>
                        <p className="font-bold">{day.focus}</p>
                      </div>
                      <div className="space-y-1 mb-2">
                        {day.meals?.map((m, mi) => <p key={mi} className="text-xs text-gray-600 dark:text-gray-400">🍽️ {m}</p>)}
                      </div>
                      {day.detox_drink && <p className="text-xs text-cyan-600">💧 {day.detox_drink}</p>}
                      {day.avoid && <p className="text-xs text-red-500 mt-1">🚫 {day.avoid}</p>}
                    </GlassCard>
                  ))}
                  {aiResult.expected_results && (
                    <GlassCard className="bg-emerald-50 dark:bg-emerald-900/20">
                      <p className="text-sm font-semibold text-emerald-600">🌟 Expected Results: {aiResult.expected_results}</p>
                    </GlassCard>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 9. Face Yoga + Diet */}
          {activeTab === 'face_yoga' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1">🧘 Face Yoga + Diet Recovery</h3>
                <p className="text-sm text-gray-500 mb-4">Anti-inflammatory foods that boost your facial yoga results</p>
                <div className="grid grid-cols-1 gap-3 mb-4">
                  {YOGA_FOODS.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-sm">🧘 {item.exercise}</p>
                        <Badge variant="outline" className="text-xs">{item.benefit}</Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {item.foods.map((f, fi) => <Badge key={fi} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">{f}</Badge>)}
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => invokeAI(
                  `Create a personalized face yoga + nutrition plan using this user's data:\n${buildContext()}\nSuggest pre and post face yoga foods that specifically support their skin type and concerns. Include anti-inflammatory foods, collagen boosters, and recovery nutrients tailored to their profile.`,
                  { type: 'object', properties: { pre_yoga_foods: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, timing: { type: 'string' }, reason: { type: 'string' } } } }, post_yoga_foods: { type: 'array', items: { type: 'object', properties: { food: { type: 'string' }, timing: { type: 'string' }, reason: { type: 'string' } } } }, weekly_routine: { type: 'string' } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-orange-400 to-amber-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating plan...</> : <><Sun className="w-4 h-4 mr-2" />Get Yoga + Diet Plan</>}
                </Button>
              </GlassCard>
              {aiResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard className="bg-amber-50 dark:bg-amber-900/20">
                    <h4 className="font-bold text-amber-600 mb-3">⚡ Pre-Yoga Foods</h4>
                    {aiResult.pre_yoga_foods?.map((item, i) => (
                      <div key={i} className="mb-3">
                        <p className="font-semibold text-sm">{item.food}</p>
                        <p className="text-xs text-gray-500">⏱️ {item.timing}</p>
                        <p className="text-xs text-amber-600">{item.reason}</p>
                      </div>
                    ))}
                  </GlassCard>
                  <GlassCard className="bg-emerald-50 dark:bg-emerald-900/20">
                    <h4 className="font-bold text-emerald-600 mb-3">🌿 Post-Yoga Recovery</h4>
                    {aiResult.post_yoga_foods?.map((item, i) => (
                      <div key={i} className="mb-3">
                        <p className="font-semibold text-sm">{item.food}</p>
                        <p className="text-xs text-gray-500">⏱️ {item.timing}</p>
                        <p className="text-xs text-emerald-600">{item.reason}</p>
                      </div>
                    ))}
                  </GlassCard>
                  {aiResult.weekly_routine && (
                    <GlassCard className="md:col-span-2 bg-orange-50 dark:bg-orange-900/20">
                      <p className="text-sm font-semibold text-orange-600">📆 Weekly Routine: {aiResult.weekly_routine}</p>
                    </GlassCard>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 10. AI Diet Insights */}
          {activeTab === 'ai_insights' && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-bold text-lg mb-1">🤖 AI Diet Insights</h3>
                <p className="text-sm text-gray-500 mb-4">Weekly personalized diet recommendations based on all your data</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Skin Analysis', ok: !!skinAnalysis, detail: skinAnalysis ? `Score ${skinAnalysis.overall_score}/100` : '', href: '/SkinAnalysis' },
                    { label: 'Lifestyle Log', ok: lifestyleLogs.length > 0, detail: lifestyleLogs.length > 0 ? `${lifestyleLogs.length} days logged` : '', href: '/Lifestyle' },
                    { label: 'Hormone Tracker', ok: !!currentPhase, detail: currentPhase ? `${currentPhase} phase` : '', href: '/HormoneTracker' },
                    { label: 'Skin Journal', ok: skinJournalEntries.length > 0, detail: skinJournalEntries.length > 0 ? `${skinJournalEntries.length} entries` : '', href: '/SkinJournal' },
                    { label: 'Glow Goals', ok: glowGoals.length > 0, detail: glowGoals.length > 0 ? `${glowGoals.length} goals` : '', href: '/GlowGoals' },
                    { label: 'Glow Log Tasks', ok: glowTasksDone.length > 0, detail: glowTasksDone.length > 0 ? `${glowTasksDone.length} done today` : '', href: null },
                  ].map(({ label, ok, detail, href }) => (
                    <div key={label} className={`p-3 rounded-xl ${ok ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-800/40'}`}>
                      <p className="text-xs font-bold mb-0.5">{ok ? '✅' : '❌'} {label}</p>
                      <p className="text-xs text-gray-500">{ok ? detail : href ? <Link to={href} className="text-rose-400 underline">Add data →</Link> : 'No data yet'}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={() => invokeAI(
                  `Generate a comprehensive weekly AI diet insights report using ALL this user's real data:\n${buildContext()}\n${glowTasksDone.length > 0 ? `Completed glow tasks today: ${glowTasksDone.join(', ')}.` : ''}\nProvide specific weekly nutrition recommendations based on what the data actually shows. Identify patterns, what they're doing well, what needs improvement, and a 3-step action plan. Be concrete and data-driven.`,
                  { type: 'object', properties: { weekly_summary: { type: 'string' }, key_insights: { type: 'array', items: { type: 'string' } }, nutrient_focus: { type: 'array', items: { type: 'object', properties: { nutrient: { type: 'string' }, why: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } } } } }, action_plan: { type: 'array', items: { type: 'string' } }, skin_diet_score: { type: 'number' } } }
                )} disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 to-violet-500">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Analyzing all data...</> : <><TrendingUp className="w-4 h-4 mr-2" />Generate AI Weekly Insights</>}
                </Button>
              </GlassCard>
              {aiResult && (
                <div className="space-y-4">
                  {aiResult.skin_diet_score !== undefined && (
                    <GlassCard className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-5xl font-bold text-indigo-600">{aiResult.skin_diet_score}</p>
                          <p className="text-xs text-gray-500">Skin Diet Score</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold mb-1">Weekly Summary</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{aiResult.weekly_summary}</p>
                        </div>
                      </div>
                    </GlassCard>
                  )}
                  <GlassCard>
                    <h4 className="font-bold mb-3">💡 Key Insights</h4>
                    {aiResult.key_insights?.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <span className="text-indigo-500 font-bold text-sm">{i + 1}.</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{insight}</p>
                      </div>
                    ))}
                  </GlassCard>
                  <GlassCard>
                    <h4 className="font-bold mb-3">🧬 Nutrient Focus This Week</h4>
                    {aiResult.nutrient_focus?.map((item, i) => (
                      <div key={i} className="mb-3 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                        <div className="flex justify-between mb-1">
                          <p className="font-semibold text-sm">{item.nutrient}</p>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{item.why}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.sources?.map((s, si) => <Badge key={si} variant="outline" className="text-xs">{s}</Badge>)}
                        </div>
                      </div>
                    ))}
                  </GlassCard>
                  <GlassCard className="bg-emerald-50 dark:bg-emerald-900/20">
                    <h4 className="font-bold text-emerald-600 mb-3">✅ 3-Step Action Plan</h4>
                    {aiResult.action_plan?.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                      </div>
                    ))}
                  </GlassCard>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}