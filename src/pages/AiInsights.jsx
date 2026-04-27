import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, AlertCircle, Star, Apple, Brain, Dna, Zap, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';

const TABS = [
  { id: 'celebrity', label: 'Celebrity Match', emoji: '⭐', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'Which celebrity has similar skin?' },
  { id: 'acne', label: 'Acne Risk', emoji: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', desc: 'AI predicts your breakout risk' },
  { id: 'diet', label: 'Diet Scanner', emoji: '🥗', color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: 'How your diet affects your skin' },
  { id: 'stress', label: 'Stress Detector', emoji: '🧠', color: '#f97316', bg: 'rgba(249,115,22,0.1)', desc: 'Stress impact on your skin' },
  { id: 'dna', label: 'Beauty DNA', emoji: '🧬', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', desc: 'Your unique skin blueprint' },
];

function CooldownButton({ cooldownKey, onClick, loading, children }) {
  const [cd, setCd] = useState(getCooldownSeconds(cooldownKey));
  useEffect(() => {
    const t = setInterval(() => { const s = getCooldownSeconds(cooldownKey); setCd(s); if (s <= 0) clearInterval(t); }, 1000);
    return () => clearInterval(t);
  }, [cooldownKey]);

  return (
    <button onClick={onClick} disabled={loading || cd > 0}
      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all ios-button-3d"
      style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
        : cd > 0 ? `⏳ ${Math.floor(cd / 60)}:${String(cd % 60).padStart(2, '0')}`
        : children}
    </button>
  );
}

export default function AiInsights() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('celebrity');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

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

  const skinData = analysis
    ? `Skin type: ${analysis.skin_type}, Score: ${analysis.overall_score}, Acne: ${analysis.acne_level}/10, Dark spots: ${analysis.dark_spots}/10, Redness: ${analysis.redness}/10, Oiliness: ${analysis.oiliness}/10, Dryness: ${analysis.dryness}/10, Sensitivity: ${analysis.sensitivity}/10`
    : 'No skin analysis — use general advice';

  const lifestyleData = dietLog?.length > 0
    ? `Avg water: ${(dietLog.reduce((s, l) => s + (l.water_glasses || 0), 0) / dietLog.length).toFixed(1)}g, Avg sleep: ${(dietLog.reduce((s, l) => s + (l.sleep_hours || 0), 0) / dietLog.length).toFixed(1)}h, Avg stress: ${(dietLog.reduce((s, l) => s + (l.stress_level || 3), 0) / dietLog.length).toFixed(1)}/5`
    : 'No lifestyle data';

  const run = async (tab) => {
    const { allowed } = checkAICooldown(`ai_insights_${tab}`);
    if (!allowed) return;
    setLoading(tab);

    const PROMPTS = {
      celebrity: { prompt: `You are a skin consultant. Based on: ${skinData}\nFind 3 celebrity skin matches. Compare against known skin types.`, schema: { type: 'object', properties: { top_match: { type: 'object', properties: { name: { type: 'string' }, similarity_pct: { type: 'number' }, why: { type: 'string' }, their_routine: { type: 'string' } } }, match_2: { type: 'object', properties: { name: { type: 'string' }, similarity_pct: { type: 'number' }, why: { type: 'string' } } }, match_3: { type: 'object', properties: { name: { type: 'string' }, similarity_pct: { type: 'number' }, why: { type: 'string' } } }, celeb_tip: { type: 'string' } } } },
      acne: { prompt: `Dermatologist: Predict acne risk for 2-4 weeks. ${skinData} Lifestyle: ${lifestyleData}`, schema: { type: 'object', properties: { risk_level: { type: 'string' }, risk_score: { type: 'number' }, breakout_probability_pct: { type: 'number' }, main_triggers: { type: 'array', items: { type: 'string' } }, protective_factors: { type: 'array', items: { type: 'string' } }, prevention_plan: { type: 'array', items: { type: 'string' } } } } },
      diet: { prompt: `Nutritional dermatologist: Analyze diet-skin link. ${skinData} Recent good foods: ${dietLog?.flatMap(l => l.foods_good || []).join(', ') || 'none'} Bad foods: ${dietLog?.flatMap(l => l.foods_bad || []).join(', ') || 'none'}`, schema: { type: 'object', properties: { diet_skin_score: { type: 'number' }, diet_grade: { type: 'string' }, positive_impacts: { type: 'array', items: { type: 'string' } }, harmful_impacts: { type: 'array', items: { type: 'string' } }, best_foods_to_add: { type: 'array', items: { type: 'string' } }, foods_to_cut: { type: 'array', items: { type: 'string' } }, skin_diet_tip: { type: 'string' } } } },
      stress: { prompt: `Psychodermatologist: Analyze stress-skin link. ${skinData} ${lifestyleData}`, schema: { type: 'object', properties: { stress_skin_impact_score: { type: 'number' }, cortisol_risk: { type: 'string' }, skin_symptoms_from_stress: { type: 'array', items: { type: 'string' } }, mind_skin_connection: { type: 'string' }, stress_busting_plan: { type: 'array', items: { type: 'string' } }, topical_solutions: { type: 'array', items: { type: 'string' } } } } },
      dna: { prompt: `Genomic dermatologist: Create Beauty DNA profile. ${skinData} ${lifestyleData}`, schema: { type: 'object', properties: { skin_archetype: { type: 'string' }, unique_skin_traits: { type: 'array', items: { type: 'string' } }, genetic_strengths: { type: 'array', items: { type: 'string' } }, genetic_vulnerabilities: { type: 'array', items: { type: 'string' } }, ideal_ingredients: { type: 'array', items: { type: 'string' } }, ingredients_to_avoid: { type: 'array', items: { type: 'string' } }, skin_superpower: { type: 'string' }, skin_kryptonite: { type: 'string' }, personalized_mantra: { type: 'string' } } } },
    };

    const { prompt, schema } = PROMPTS[tab];
    const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    setResults(prev => ({ ...prev, [tab]: res }));
    recordAIUsage(`ai_insights_${tab}`);
    setLoading(null);
  };

  const current = TABS.find(t => t.id === activeTab);

  return (
    <div className="max-w-2xl mx-auto pb-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            🧠
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">AI Skin Insights</h1>
            <p className="text-sm text-gray-500">Advanced AI-powered skin intelligence</p>
          </div>
        </div>
      </div>

      {/* No analysis banner */}
      {!analysis && (
        <Link to="/SkinAnalysis">
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <Camera className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Run Skin Analysis first</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">For personalized insights → Tap to analyze</p>
            </div>
          </div>
        </Link>
      )}

      {/* Tab Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? tab.color : 'white',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              border: `1.5px solid ${activeTab === tab.id ? tab.color : '#e5e7eb'}`,
              boxShadow: activeTab === tab.id ? `0 4px 16px ${tab.color}40` : 'none',
            }}>
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Card */}
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        {/* Color accent bar */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg,${current.color},#a78bfa)` }} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{ background: current.bg }}>
                {current.emoji}
              </div>
              <div>
                <p className="font-black text-base">{current.label}</p>
                <p className="text-xs text-gray-400">{current.desc}</p>
              </div>
            </div>
            <CooldownButton cooldownKey={`ai_insights_${activeTab}`} onClick={() => run(activeTab)} loading={loading === activeTab}>
              <Sparkles className="w-4 h-4" /> Run Analysis
            </CooldownButton>
          </div>

          <AnimatePresence mode="wait">
            {results[activeTab] ? (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {activeTab === 'celebrity' && <CelebResult data={results.celebrity} />}
                {activeTab === 'acne' && <AcneResult data={results.acne} />}
                {activeTab === 'diet' && <DietResult data={results.diet} />}
                {activeTab === 'stress' && <StressResult data={results.stress} />}
                {activeTab === 'dna' && <DnaResult data={results.dna} />}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-10 text-center">
                <div className="text-5xl mb-3">{current.emoji}</div>
                <p className="text-gray-500 text-sm">Tap "Run Analysis" to generate insights</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800">
      <p className="text-xs font-bold text-gray-400 mb-1">{label}</p>
      {children}
    </div>
  );
}

function CelebResult({ data }) {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.12))', border: '1.5px solid rgba(245,158,11,0.3)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-black text-base">⭐ {data.top_match?.name}</p>
          <Badge className="bg-amber-500 text-white">{data.top_match?.similarity_pct}% match</Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{data.top_match?.why}</p>
        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/20">
          <p className="text-xs font-bold text-amber-600 mb-1">Their routine:</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">{data.top_match?.their_routine}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[data.match_2, data.match_3].map((m, i) => m && (
          <div key={i} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm">{m.name}</p>
              <Badge variant="outline" className="text-xs">{m.similarity_pct}%</Badge>
            </div>
            <p className="text-xs text-gray-500">{m.why}</p>
          </div>
        ))}
      </div>
      {data.celeb_tip && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
          <p className="text-xs font-bold text-amber-600 mb-1">💡 Celeb tip for you</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{data.celeb_tip}</p>
        </div>
      )}
    </div>
  );
}

function AcneResult({ data }) {
  const riskBg = { 'Very Low': 'bg-emerald-100 text-emerald-700', 'Low': 'bg-green-100 text-green-700', 'Moderate': 'bg-amber-100 text-amber-700', 'High': 'bg-orange-100 text-orange-700', 'Very High': 'bg-red-100 text-red-700' };
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center gap-4">
        <div className="text-center flex-shrink-0">
          <p className="text-4xl font-black text-red-500">{data.breakout_probability_pct}%</p>
          <p className="text-xs text-gray-500">Breakout Risk</p>
        </div>
        <div className="flex-1">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-2 ${riskBg[data.risk_level] || 'bg-gray-100 text-gray-600'}`}>{data.risk_level}</span>
          <div className="h-2 rounded-full overflow-hidden bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-500" style={{ width: `${data.risk_score}%` }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoRow label="⚠️ Triggers">
          {data.main_triggers?.map((t, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-0.5">• {t}</p>)}
        </InfoRow>
        <InfoRow label="🛡️ Protection">
          {data.protective_factors?.map((t, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-0.5">• {t}</p>)}
        </InfoRow>
      </div>
      <InfoRow label="📋 Prevention Plan">
        {data.prevention_plan?.map((p, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
            <p className="text-xs text-gray-600 dark:text-gray-300">{p}</p>
          </div>
        ))}
      </InfoRow>
    </div>
  );
}

function DietResult({ data }) {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center gap-4">
        <div className="text-center flex-shrink-0">
          <p className="text-4xl font-black text-emerald-500">{data.diet_grade}</p>
          <p className="text-xs text-gray-500">Diet Grade</p>
        </div>
        <div className="flex-1">
          <div className="h-2 rounded-full overflow-hidden bg-gray-200 mb-1">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${data.diet_skin_score}%` }} />
          </div>
          <p className="text-xs text-emerald-600 font-bold">{data.diet_skin_score}/100 skin score</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoRow label="✅ Positive">
          {data.positive_impacts?.slice(0, 3).map((t, i) => <p key={i} className="text-xs text-gray-600 mb-0.5">✓ {t}</p>)}
        </InfoRow>
        <InfoRow label="❌ Harmful">
          {data.harmful_impacts?.slice(0, 3).map((t, i) => <p key={i} className="text-xs text-gray-600 mb-0.5">✗ {t}</p>)}
        </InfoRow>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoRow label="🥗 Add These">
          <div className="flex flex-wrap gap-1">{data.best_foods_to_add?.map((f, i) => <Badge key={i} className="bg-emerald-500 text-white text-xs">{f}</Badge>)}</div>
        </InfoRow>
        <InfoRow label="🚫 Cut These">
          <div className="flex flex-wrap gap-1">{data.foods_to_cut?.map((f, i) => <Badge key={i} className="bg-red-400 text-white text-xs">{f}</Badge>)}</div>
        </InfoRow>
      </div>
      {data.skin_diet_tip && <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200"><p className="text-sm text-gray-700">💡 {data.skin_diet_tip}</p></div>}
    </div>
  );
}

function StressResult({ data }) {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center gap-4">
        <div className="text-center flex-shrink-0">
          <p className="text-4xl font-black text-orange-500">{data.stress_skin_impact_score}</p>
          <p className="text-xs text-gray-500">Stress Impact</p>
        </div>
        <div className="flex-1">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 mb-2">{data.cortisol_risk} Cortisol</span>
          <p className="text-xs text-gray-600 dark:text-gray-300">{data.mind_skin_connection}</p>
        </div>
      </div>
      <InfoRow label="🔥 Stress Skin Symptoms">
        <div className="flex flex-wrap gap-1">{data.skin_symptoms_from_stress?.map((s, i) => <Badge key={i} className="bg-orange-400 text-white text-xs">{s}</Badge>)}</div>
      </InfoRow>
      <InfoRow label="🧘 Stress-Busting Plan">
        {data.stress_busting_plan?.map((p, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1">• {p}</p>)}
      </InfoRow>
      {data.topical_solutions?.length > 0 && (
        <InfoRow label="🧴 Topical Solutions">
          <div className="flex flex-wrap gap-1">{data.topical_solutions.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}</div>
        </InfoRow>
      )}
    </div>
  );
}

function DnaResult({ data }) {
  return (
    <div className="space-y-3">
      <div className="p-5 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(167,139,250,0.12))', border: '1.5px solid rgba(139,92,246,0.3)' }}>
        <p className="text-xs text-gray-400 mb-1">Your Skin Archetype</p>
        <p className="text-2xl font-black text-violet-600">{data.skin_archetype}</p>
        {data.personalized_mantra && <p className="text-sm italic text-violet-500 mt-2">"{data.personalized_mantra}"</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20">
          <p className="text-xs font-bold text-amber-600 mb-1">⚡ Superpower</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">{data.skin_superpower}</p>
        </div>
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20">
          <p className="text-xs font-bold text-red-500 mb-1">🎯 Kryptonite</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">{data.skin_kryptonite}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoRow label="💚 Ideal Ingredients">
          <div className="flex flex-wrap gap-1">{data.ideal_ingredients?.map((i, idx) => <Badge key={idx} className="bg-emerald-500 text-white text-xs">{i}</Badge>)}</div>
        </InfoRow>
        <InfoRow label="🚫 Avoid">
          <div className="flex flex-wrap gap-1">{data.ingredients_to_avoid?.map((i, idx) => <Badge key={idx} className="bg-red-400 text-white text-xs">{i}</Badge>)}</div>
        </InfoRow>
      </div>
      <InfoRow label="🧬 Unique Traits">
        <div className="flex flex-wrap gap-1">{data.unique_skin_traits?.map((t, i) => <Badge key={i} variant="outline" className="text-xs border-violet-300 text-violet-600">{t}</Badge>)}</div>
      </InfoRow>
    </div>
  );
}