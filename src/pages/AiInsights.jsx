import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Sparkles, AlertCircle, Star, Users, Apple,
  Brain, Dna, Zap, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';

const TABS = [
  { id: 'celebrity', label: 'Celebrity Match', icon: Star, color: 'from-yellow-400 to-amber-500', desc: 'See which celebrity has similar skin to yours' },
  { id: 'acne', label: 'Acne Risk', icon: AlertCircle, color: 'from-red-400 to-pink-500', desc: 'AI predicts your acne breakout risk' },
  { id: 'diet', label: 'Diet Scanner', icon: Apple, color: 'from-emerald-400 to-teal-500', desc: 'Scan your diet for skin impact' },
  { id: 'stress', label: 'Stress Detector', icon: Brain, color: 'from-orange-400 to-amber-500', desc: 'How stress is affecting your skin' },
  { id: 'dna', label: 'Beauty DNA', icon: Dna, color: 'from-violet-400 to-purple-500', desc: 'Your unique skin genetic profile' },
];

function CooldownButton({ cooldownKey, onClick, loading, children, className }) {
  const [cd, setCd] = useState(getCooldownSeconds(cooldownKey));
  useEffect(() => {
    const t = setInterval(() => {
      const s = getCooldownSeconds(cooldownKey);
      setCd(s);
      if (s <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownKey]);

  return (
    <Button onClick={onClick} disabled={loading || cd > 0} className={className}>
      {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
        : cd > 0 ? `⏳ ${Math.floor(cd / 60)}:${String(cd % 60).padStart(2, '0')}`
        : children}
    </Button>
  );
}

export default function AiInsights() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('celebrity');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: analysis } = useQuery({
    queryKey: ['analysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: dietLog } = useQuery({
    queryKey: ['dietLogLatest', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 7),
    enabled: !!user?.email,
  });

  const skinData = analysis ? `Skin type: ${analysis.skin_type}, Score: ${analysis.overall_score}, Acne: ${analysis.acne_level}/10, Dark spots: ${analysis.dark_spots}/10, Wrinkles: ${analysis.wrinkles}/10, Redness: ${analysis.redness}/10, Oiliness: ${analysis.oiliness}/10, Dryness: ${analysis.dryness}/10, Sensitivity: ${analysis.sensitivity}/10` : 'No skin analysis available';

  const lifestyleData = dietLog?.length > 0 ? `Avg water: ${(dietLog.reduce((s, l) => s + (l.water_glasses || 0), 0) / dietLog.length).toFixed(1)} glasses, Avg sleep: ${(dietLog.reduce((s, l) => s + (l.sleep_hours || 0), 0) / dietLog.length).toFixed(1)}h, Avg stress: ${(dietLog.reduce((s, l) => s + (l.stress_level || 3), 0) / dietLog.length).toFixed(1)}/5, Skincare morning: ${dietLog.filter(l => l.skincare_done_morning).length}/${dietLog.length} days` : 'No lifestyle data available';

  const run = async (tab) => {
    const { allowed } = checkAICooldown(`ai_insights_${tab}`);
    if (!allowed) return;
    setLoading(tab);

    let prompt = '';
    let schema = {};

    if (tab === 'celebrity') {
      prompt = `You are a skin analysis expert and celebrity skin consultant. Based on this skin data, find the closest celebrity skin match.

Skin data: ${skinData}

Compare against 20+ celebrities known for their skin conditions. Consider their publicly known skin type, acne history, skin tone, and concerns.

Provide top 3 celebrity matches with reasoning.`;
      schema = {
        type: "object",
        properties: {
          top_match: { type: "object", properties: { name: { type: "string" }, similarity_pct: { type: "number" }, why: { type: "string" }, their_routine: { type: "string" } } },
          match_2: { type: "object", properties: { name: { type: "string" }, similarity_pct: { type: "number" }, why: { type: "string" } } },
          match_3: { type: "object", properties: { name: { type: "string" }, similarity_pct: { type: "number" }, why: { type: "string" } } },
          celeb_tip: { type: "string", description: "One skincare tip adopted from your top match celebrity" }
        }
      };
    } else if (tab === 'acne') {
      prompt = `You are a dermatologist specializing in acne. Predict this user's acne risk for the next 2-4 weeks based on their skin and lifestyle data.

Skin data: ${skinData}
Lifestyle (last 7 days): ${lifestyleData}
Coffee cups avg: ${dietLog?.length > 0 ? (dietLog.reduce((s, l) => s + (l.coffee_cups || 0), 0) / dietLog.length).toFixed(1) : 'unknown'}, Dairy/sugar consumption noted: ${dietLog?.some(l => l.foods_bad?.includes('Dairy') || l.foods_bad?.includes('Sugar')) ? 'Yes' : 'No/Unknown'}

Provide a detailed acne risk assessment.`;
      schema = {
        type: "object",
        properties: {
          risk_level: { type: "string", enum: ["Very Low", "Low", "Moderate", "High", "Very High"] },
          risk_score: { type: "number", description: "0-100" },
          breakout_probability_pct: { type: "number", description: "0-100% chance of breakout in next 2 weeks" },
          main_triggers: { type: "array", items: { type: "string" } },
          protective_factors: { type: "array", items: { type: "string" } },
          prevention_plan: { type: "array", items: { type: "string" } },
          ingredients_to_use: { type: "array", items: { type: "string" } },
          foods_to_avoid: { type: "array", items: { type: "string" } }
        }
      };
    } else if (tab === 'diet') {
      prompt = `You are a nutritional dermatologist. Analyze this user's recent diet and lifestyle data to provide a detailed skin-diet impact report.

Skin data: ${skinData}
Recent foods (good for skin eaten): ${dietLog?.flatMap(l => l.foods_good || []).join(', ') || 'None tracked'}
Recent foods (bad for skin eaten): ${dietLog?.flatMap(l => l.foods_bad || []).join(', ') || 'None tracked'}
Vitamins taken: ${dietLog?.flatMap(l => l.vitamins_taken || []).join(', ') || 'None tracked'}
Avg water: ${dietLog?.length > 0 ? (dietLog.reduce((s, l) => s + (l.water_glasses || 0), 0) / dietLog.length).toFixed(1) : 'unknown'} glasses/day
Avg coffee: ${dietLog?.length > 0 ? (dietLog.reduce((s, l) => s + (l.coffee_cups || 0), 0) / dietLog.length).toFixed(1) : 'unknown'} cups/day
Avg alcohol: ${dietLog?.length > 0 ? (dietLog.reduce((s, l) => s + (l.alcohol_drinks || 0), 0) / dietLog.length).toFixed(1) : 'unknown'} drinks/day

Provide a comprehensive skin-diet analysis.`;
      schema = {
        type: "object",
        properties: {
          diet_skin_score: { type: "number", description: "0-100 how well the diet supports skin" },
          diet_grade: { type: "string", description: "e.g. A+, B-, C" },
          positive_impacts: { type: "array", items: { type: "string" } },
          harmful_impacts: { type: "array", items: { type: "string" } },
          missing_nutrients: { type: "array", items: { type: "string" } },
          best_foods_to_add: { type: "array", items: { type: "string" } },
          foods_to_cut: { type: "array", items: { type: "string" } },
          supplement_recommendations: { type: "array", items: { type: "string" } },
          skin_diet_tip: { type: "string" }
        }
      };
    } else if (tab === 'stress') {
      prompt = `You are a psychodermatologist (skin-stress specialist). Analyze how the user's stress levels are affecting their skin health.

Skin data: ${skinData}
Stress data (last 7 days): avg stress = ${dietLog?.length > 0 ? (dietLog.reduce((s, l) => s + (l.stress_level || 3), 0) / dietLog.length).toFixed(1) : 'unknown'}/5, avg sleep = ${dietLog?.length > 0 ? (dietLog.reduce((s, l) => s + (l.sleep_hours || 0), 0) / dietLog.length).toFixed(1) : 'unknown'}h, avg meditation = ${dietLog?.length > 0 ? (dietLog.reduce((s, l) => s + (l.meditation_minutes || 0), 0) / dietLog.length).toFixed(1) : '0'} min/day, mood entries: ${dietLog?.map(l => l.mood).filter(Boolean).join(', ') || 'unknown'}

Analyze the stress-skin connection comprehensively.`;
      schema = {
        type: "object",
        properties: {
          stress_skin_impact_score: { type: "number", description: "0-100, higher = more stressed" },
          cortisol_risk: { type: "string", enum: ["Low", "Moderate", "High", "Very High"] },
          skin_symptoms_from_stress: { type: "array", items: { type: "string" } },
          stress_related_concerns: { type: "array", items: { type: "string" }, description: "Which of their current skin concerns are stress-driven" },
          mind_skin_connection: { type: "string", description: "Explanation of how their stress manifests in skin" },
          stress_busting_plan: { type: "array", items: { type: "string" } },
          topical_solutions: { type: "array", items: { type: "string" }, description: "Products/ingredients to combat stress-skin damage" }
        }
      };
    } else if (tab === 'dna') {
      prompt = `You are a genomic dermatologist and beauty scientist. Based on this user's comprehensive skin profile, lifestyle, and patterns, create their "Beauty DNA" — a personalized skin genetic blueprint.

Skin data: ${skinData}
Lifestyle: ${lifestyleData}

Create a detailed Beauty DNA profile that describes their unique skin characteristics, tendencies, and personalized roadmap. Make it feel premium and personalized.`;
      schema = {
        type: "object",
        properties: {
          skin_archetype: { type: "string", description: "e.g. 'The Sensitive Warrior', 'The Balanced Glow', 'The Oily Shield'" },
          unique_skin_traits: { type: "array", items: { type: "string" } },
          genetic_strengths: { type: "array", items: { type: "string" } },
          genetic_vulnerabilities: { type: "array", items: { type: "string" } },
          ideal_ingredients: { type: "array", items: { type: "string" } },
          ingredients_to_avoid: { type: "array", items: { type: "string" } },
          skin_superpower: { type: "string", description: "Your skin's unique superpower/best quality" },
          skin_kryptonite: { type: "string", description: "Your skin's biggest weakness" },
          personalized_mantra: { type: "string", description: "A personalized skincare mantra for this user" },
          lifetime_skin_goals: { type: "array", items: { type: "string" } }
        }
      };
    }

    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    setResults(prev => ({ ...prev, [tab]: res }));
    recordAIUsage(`ai_insights_${tab}`);
    setLoading(null);
  };

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="relative">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black gold-shimmer">✨ AI Skin Insights</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Advanced AI-powered skin intelligence tools</p>
        </motion.div>
        {/* Floating sparkles */}
        <span className="absolute top-0 right-0 text-2xl animate-bounce">🌟</span>
      </div>

      {/* Tab Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              className={`p-3 rounded-2xl text-left transition-all relative overflow-hidden ${
                isActive
                  ? 'shadow-xl border-0'
                  : 'border-2 border-white/40 dark:border-white/10 hover:border-pink-300 bg-white/40 dark:bg-white/5'
              }`}
              style={isActive ? { background: `linear-gradient(135deg, #f472b6 0%, #fbbf24 100%)`, boxShadow: '0 0 24px 6px rgba(244,114,182,0.4)' } : {}}
            >
              {isActive && (
                <span className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)',
                }} />
              )}
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tab.color} flex items-center justify-center mb-2 shadow-lg`}
                style={isActive ? { boxShadow: '0 0 12px 3px rgba(255,255,255,0.5)' } : {}}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className={`font-bold text-xs ${isActive ? 'text-white' : ''}`}>{tab.label}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {currentTab && (
        <GlassCard className="relative overflow-hidden">
          {/* Background glow orb */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: `linear-gradient(135deg, #f472b6, #fbbf24)` }} />
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ boxShadow: ['0 0 8px 2px rgba(244,114,182,0.4)', '0 0 20px 6px rgba(251,191,36,0.5)', '0 0 8px 2px rgba(244,114,182,0.4)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentTab.color} flex items-center justify-center flex-shrink-0`}
              >
                <currentTab.icon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="font-black text-lg">{currentTab.label}</h3>
                <p className="text-sm text-gray-500">{currentTab.desc}</p>
              </div>
            </div>
            <CooldownButton
              cooldownKey={`ai_insights_${activeTab}`}
              onClick={() => run(activeTab)}
              loading={loading === activeTab}
              className={`bg-gradient-to-r ${currentTab.color} text-white shadow-lg shadow-pink-400/30 font-bold`}
            >
              <Sparkles className="w-4 h-4 mr-2 animate-spin" style={{ animationDuration: '3s' }} /> Run Analysis
            </CooldownButton>
          </div>

          {!analysis && (
            <div className="text-center py-6 space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">पहले Skin Analysis करें</p>
              <p className="text-gray-500 text-sm">AI Insights आपकी skin analysis data का उपयोग करता है — बेहतर results के लिए पहले analysis करें।</p>
              <a href="/SkinAnalysis">
                <button className="mt-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">
                  📸 Skin Analysis करें →
                </button>
              </a>
            </div>
          )}

          <AnimatePresence mode="wait">
            {results[activeTab] && (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {activeTab === 'celebrity' && <CelebrityResult data={results.celebrity} />}
                {activeTab === 'acne' && <AcneResult data={results.acne} />}
                {activeTab === 'diet' && <DietResult data={results.diet} />}
                {activeTab === 'stress' && <StressResult data={results.stress} />}
                {activeTab === 'dna' && <DnaResult data={results.dna} />}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      )}
    </div>
  );
}

function CelebrityResult({ data }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">⭐ {data.top_match?.name}</span>
          <Badge className="bg-amber-500 text-white">{data.top_match?.similarity_pct}% Match</Badge>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{data.top_match?.why}</p>
        <div className="p-3 bg-white/60 dark:bg-black/20 rounded-lg">
          <p className="text-xs font-semibold text-amber-600 mb-1">Their Skincare Secret:</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">{data.top_match?.their_routine}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[data.match_2, data.match_3].map((m, i) => m && (
          <div key={i} className="p-3 bg-white/50 dark:bg-white/5 rounded-xl">
            <div className="flex justify-between mb-1"><span className="font-semibold text-sm">{m.name}</span><Badge variant="outline">{m.similarity_pct}%</Badge></div>
            <p className="text-xs text-gray-500">{m.why}</p>
          </div>
        ))}
      </div>
      {data.celeb_tip && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">💡 Celeb Tip For You:</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{data.celeb_tip}</p>
        </div>
      )}
    </div>
  );
}

function AcneResult({ data }) {
  const riskColors = { 'Very Low': 'text-emerald-600 bg-emerald-100', 'Low': 'text-green-600 bg-green-100', 'Moderate': 'text-amber-600 bg-amber-100', 'High': 'text-orange-600 bg-orange-100', 'Very High': 'text-red-600 bg-red-100' };
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 rounded-xl">
        <div className="text-center">
          <p className="text-5xl font-black text-red-500">{data.breakout_probability_pct}%</p>
          <p className="text-xs text-gray-500">Breakout Risk</p>
        </div>
        <div className="flex-1">
          <span className={`px-3 py-1 rounded-full font-bold text-sm ${riskColors[data.risk_level] || 'text-gray-600 bg-gray-100'}`}>{data.risk_level} Risk</span>
          <div className="mt-2 w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div className="h-3 rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-500" style={{ width: `${data.risk_score}%` }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-sm text-red-500 mb-2">⚠️ Main Triggers</p>
          {data.main_triggers?.map((t, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1"><span className="text-red-400">•</span>{t}</p>)}
        </div>
        <div>
          <p className="font-semibold text-sm text-emerald-500 mb-2">🛡️ Protective Factors</p>
          {data.protective_factors?.map((t, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1"><span className="text-emerald-400">•</span>{t}</p>)}
        </div>
      </div>
      <div>
        <p className="font-semibold text-sm mb-2">📋 Prevention Plan</p>
        {data.prevention_plan?.map((p, i) => (
          <div key={i} className="flex items-start gap-2 mb-2 p-2 bg-white/50 dark:bg-white/5 rounded-lg">
            <span className="w-5 h-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
            <p className="text-xs text-gray-700 dark:text-gray-300">{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DietResult({ data }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
        <div className="text-center">
          <p className="text-5xl font-black text-emerald-500">{data.diet_grade}</p>
          <p className="text-xs text-gray-500">Diet Grade</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-300">Skin-Diet Score</p>
          <div className="mt-1 w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${data.diet_skin_score}%` }} />
          </div>
          <p className="text-right text-xs font-bold text-emerald-600 mt-1">{data.diet_skin_score}/100</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-sm text-emerald-500 mb-2">✅ Positive Impacts</p>
          {data.positive_impacts?.map((t, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1"><span className="text-emerald-400">✓ </span>{t}</p>)}
        </div>
        <div>
          <p className="font-semibold text-sm text-red-500 mb-2">❌ Harmful Impacts</p>
          {data.harmful_impacts?.map((t, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1"><span className="text-red-400">✗ </span>{t}</p>)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-sm mb-2">🥗 Add To Your Diet</p>
          <div className="flex flex-wrap gap-1">{data.best_foods_to_add?.map((f, i) => <Badge key={i} className="bg-emerald-500 text-white text-xs">{f}</Badge>)}</div>
        </div>
        <div>
          <p className="font-semibold text-sm mb-2">🚫 Cut These</p>
          <div className="flex flex-wrap gap-1">{data.foods_to_cut?.map((f, i) => <Badge key={i} className="bg-red-400 text-white text-xs">{f}</Badge>)}</div>
        </div>
      </div>
      {data.skin_diet_tip && <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl"><p className="text-sm text-gray-700 dark:text-gray-300">💡 {data.skin_diet_tip}</p></div>}
    </div>
  );
}

function StressResult({ data }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
        <div className="text-center">
          <p className="text-5xl font-black text-orange-500">{data.stress_skin_impact_score}</p>
          <p className="text-xs text-gray-500">Stress Impact</p>
        </div>
        <div className="flex-1">
          <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 font-bold text-sm">{data.cortisol_risk} Cortisol Risk</span>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{data.mind_skin_connection}</p>
        </div>
      </div>
      <div>
        <p className="font-semibold text-sm mb-2 text-orange-500">🔥 Stress-Driven Skin Issues</p>
        <div className="flex flex-wrap gap-2">{data.skin_symptoms_from_stress?.map((s, i) => <Badge key={i} className="bg-orange-400 text-white">{s}</Badge>)}</div>
      </div>
      <div>
        <p className="font-semibold text-sm mb-2">🧘 Stress-Busting Plan</p>
        {data.stress_busting_plan?.map((p, i) => (
          <div key={i} className="flex items-start gap-2 mb-2 p-2 bg-white/50 dark:bg-white/5 rounded-lg">
            <Zap className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 dark:text-gray-300">{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DnaResult({ data }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl text-center">
        <p className="text-xs text-gray-500 mb-1">Your Skin Archetype</p>
        <p className="text-2xl font-black text-violet-600">{data.skin_archetype}</p>
        {data.personalized_mantra && <p className="text-sm italic text-purple-500 mt-2">"{data.personalized_mantra}"</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <p className="font-semibold text-sm text-amber-600 mb-2">⚡ Skin Superpower</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{data.skin_superpower}</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <p className="font-semibold text-sm text-red-500 mb-2">🎯 Skin Kryptonite</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{data.skin_kryptonite}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-sm text-emerald-500 mb-2">💚 Ideal Ingredients</p>
          <div className="flex flex-wrap gap-1">{data.ideal_ingredients?.map((i, idx) => <Badge key={idx} className="bg-emerald-500 text-white text-xs">{i}</Badge>)}</div>
        </div>
        <div>
          <p className="font-semibold text-sm text-red-500 mb-2">🚫 Avoid These</p>
          <div className="flex flex-wrap gap-1">{data.ingredients_to_avoid?.map((i, idx) => <Badge key={idx} className="bg-red-400 text-white text-xs">{i}</Badge>)}</div>
        </div>
      </div>
      <div>
        <p className="font-semibold text-sm mb-2 text-violet-600">🧬 Unique Skin Traits</p>
        <div className="flex flex-wrap gap-2">{data.unique_skin_traits?.map((t, i) => <Badge key={i} variant="outline" className="border-violet-300 text-violet-600">{t}</Badge>)}</div>
      </div>
    </div>
  );
}