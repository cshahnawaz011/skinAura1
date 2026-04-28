import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FlaskConical, Star, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, XCircle
} from 'lucide-react';

const STATIC_INGREDIENTS = [
  { name: 'Niacinamide', category: 'Brightening', safety: 'safe', skin_types: ['oily', 'combination', 'sensitive'], benefits: 'Reduces pores, controls oil, brightens skin, strengthens barrier', avoid_with: 'High dose Vitamin C (may cause flushing)', best_for: ['pores', 'oiliness', 'dark_spots'], percentage: '2-20%', emoji: '✨' },
  { name: 'Retinol', category: 'Anti-Aging', safety: 'caution', skin_types: ['normal', 'combination', 'oily'], benefits: 'Accelerates cell turnover, reduces wrinkles, treats acne', avoid_with: 'AHAs/BHAs same routine, direct sunlight without SPF', best_for: ['wrinkles', 'acne_level', 'dark_spots'], percentage: '0.025-1%', emoji: '🔬' },
  { name: 'Vitamin C (Ascorbic Acid)', category: 'Antioxidant', safety: 'caution', skin_types: ['normal', 'dry', 'combination'], benefits: 'Brightens, antioxidant protection, boosts collagen, fades spots', avoid_with: 'Retinol, AHA/BHA (alternate AM/PM)', best_for: ['dark_spots', 'wrinkles'], percentage: '10-20%', emoji: '🍋' },
  { name: 'Hyaluronic Acid', category: 'Hydration', safety: 'safe', skin_types: ['all'], benefits: 'Attracts and retains moisture, plumps skin, reduces fine lines', avoid_with: 'Nothing — universally compatible', best_for: ['dryness'], percentage: '0.1-2%', emoji: '💧' },
  { name: 'Salicylic Acid (BHA)', category: 'Exfoliant', safety: 'caution', skin_types: ['oily', 'combination', 'acne-prone'], benefits: 'Unclogs pores, exfoliates, antibacterial, anti-inflammatory', avoid_with: 'Other acids same step, physical scrubs', best_for: ['acne_level', 'pores', 'oiliness'], percentage: '0.5-2%', emoji: '⚡' },
  { name: 'AHA (Glycolic/Lactic Acid)', category: 'Exfoliant', safety: 'caution', skin_types: ['normal', 'dry', 'combination'], benefits: 'Surface exfoliation, brightening, texture improvement', avoid_with: 'BHAs same step, retinol same routine', best_for: ['dark_spots', 'wrinkles', 'dryness'], percentage: '5-15%', emoji: '🌟' },
  { name: 'Ceramides', category: 'Barrier', safety: 'safe', skin_types: ['all', 'sensitive', 'dry'], benefits: 'Restores skin barrier, prevents moisture loss, calms sensitivity', avoid_with: 'Nothing — barrier-safe', best_for: ['dryness', 'sensitivity'], percentage: '1-5%', emoji: '🛡️' },
  { name: 'Azelaic Acid', category: 'Brightening', safety: 'safe', skin_types: ['sensitive', 'acne-prone', 'rosacea'], benefits: 'Anti-inflammatory, reduces redness, fades hyperpigmentation, antibacterial', avoid_with: 'Very few — one of safest actives', best_for: ['redness', 'dark_spots', 'acne_level'], percentage: '10-20%', emoji: '🌸' },
  { name: 'Centella Asiatica (Cica)', category: 'Soothing', safety: 'safe', skin_types: ['sensitive', 'irritated', 'all'], benefits: 'Calms inflammation, heals barrier, soothes redness, anti-aging', avoid_with: 'Nothing known', best_for: ['redness', 'sensitivity'], percentage: '0.1-5%', emoji: '🌿' },
  { name: 'Peptides', category: 'Anti-Aging', safety: 'safe', skin_types: ['all', 'mature'], benefits: 'Stimulates collagen, firms skin, reduces wrinkles, repairs barrier', avoid_with: 'Direct acids (use at different times)', best_for: ['wrinkles'], percentage: '1-10%', emoji: '💪' },
  { name: 'Tranexamic Acid', category: 'Brightening', safety: 'safe', skin_types: ['sensitive', 'all'], benefits: 'Fades melasma, hyperpigmentation, post-acne marks without irritation', avoid_with: 'Nothing significant', best_for: ['dark_spots'], percentage: '2-5%', emoji: '🎯' },
  { name: 'Benzoyl Peroxide', category: 'Acne', safety: 'caution', skin_types: ['oily', 'acne-prone'], benefits: 'Kills acne bacteria, dries active breakouts, prevents new pimples', avoid_with: 'Retinoids (inactivates), AHAs/BHAs', best_for: ['acne_level'], percentage: '2.5-10%', emoji: '🔴' },
  { name: 'Alpha Arbutin', category: 'Brightening', safety: 'safe', skin_types: ['all', 'sensitive'], benefits: 'Gentle melanin inhibitor, fades dark spots safely, brighter tone', avoid_with: 'Nothing known — very gentle', best_for: ['dark_spots'], percentage: '1-2%', emoji: '🌙' },
  { name: 'Zinc PCA', category: 'Oil Control', safety: 'safe', skin_types: ['oily', 'acne-prone'], benefits: 'Regulates sebum, antibacterial, reduces shine, calms breakouts', avoid_with: 'Nothing significant', best_for: ['oiliness', 'acne_level'], percentage: '0.5-5%', emoji: '⚗️' },
  { name: 'Bakuchiol', category: 'Anti-Aging', safety: 'safe', skin_types: ['sensitive', 'all'], benefits: 'Plant retinol alternative, anti-aging without irritation, safe in pregnancy', avoid_with: 'Nothing known', best_for: ['wrinkles', 'sensitivity'], percentage: '0.5-2%', emoji: '🌺' },
  { name: 'Panthenol (B5)', category: 'Soothing', safety: 'safe', skin_types: ['all', 'sensitive'], benefits: 'Deep moisturizing, wound healing, reduces inflammation, strengthens barrier', avoid_with: 'Nothing', best_for: ['dryness', 'sensitivity'], percentage: '0.5-5%', emoji: '💚' },
];

const CATEGORIES = ['All', 'Brightening', 'Anti-Aging', 'Hydration', 'Exfoliant', 'Barrier', 'Soothing', 'Acne', 'Antioxidant', 'Oil Control'];

const SAFETY_COLORS = {
  safe: { bg: '#e8f8f0', text: '#2a8a5a', icon: <CheckCircle className="w-3 h-3" />, label: 'Safe' },
  caution: { bg: '#fff8e8', text: '#a07020', icon: <AlertTriangle className="w-3 h-3" />, label: 'Caution' },
  avoid: { bg: '#fee8e8', text: '#c04040', icon: <XCircle className="w-3 h-3" />, label: 'Avoid' },
};

function IngredientCard({ ingredient, isRecommended }) {
  const [expanded, setExpanded] = useState(false);
  const s = SAFETY_COLORS[ingredient.safety] || SAFETY_COLORS.safe;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{ border: '1px solid #ede8e3', background: isRecommended ? '#fff8f5' : '#faf6f2' }}
      onClick={() => setExpanded(p => !p)}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{ingredient.emoji}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm" style={{ color: '#3d2a2a' }}>{ingredient.name}</p>
                {isRecommended && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: '#fce8ec', color: '#c07080' }}>✨ For You</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f0ebe6', color: '#9a7e78' }}>{ingredient.category}</span>
                <span className="text-xs font-semibold flex items-center gap-0.5" style={{ color: s.text }}>
                  {s.icon} {s.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: '#b0a0a0' }}>{ingredient.percentage}</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
        {!expanded && (
          <p className="text-xs mt-2 line-clamp-2" style={{ color: '#7a6060' }}>{ingredient.benefits}</p>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: '#ede8e3' }}>
            <div className="pt-3 space-y-2 text-xs">
              <div className="p-2 rounded-xl" style={{ background: '#f0faf5' }}>
                <p className="font-semibold text-green-700 mb-1">✅ Benefits</p>
                <p className="text-green-600">{ingredient.benefits}</p>
              </div>
              <div className="p-2 rounded-xl" style={{ background: '#fff8e8' }}>
                <p className="font-semibold text-amber-700 mb-1">⚠️ Avoid Pairing With</p>
                <p className="text-amber-600">{ingredient.avoid_with}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="font-semibold text-xs" style={{ color: '#7a6060' }}>Best for:</span>
                {ingredient.skin_types.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: '#f0ebe6', color: '#9a7e78' }}>{t}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function IngredientLibrary() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showRecommended, setShowRecommended] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const topConcerns = useMemo(() => {
    if (!latestAnalysis) return [];
    return Object.entries({
      acne_level: latestAnalysis.acne_level,
      dark_spots: latestAnalysis.dark_spots,
      wrinkles: latestAnalysis.wrinkles,
      pores: latestAnalysis.pores,
      redness: latestAnalysis.redness,
      oiliness: latestAnalysis.oiliness,
      dryness: latestAnalysis.dryness,
      sensitivity: latestAnalysis.sensitivity,
    }).filter(([, v]) => v > 3).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [latestAnalysis]);

  const isRecommended = (ingredient) => ingredient.best_for?.some(c => topConcerns.includes(c));

  const filtered = useMemo(() => {
    let list = STATIC_INGREDIENTS;
    if (showRecommended) list = list.filter(isRecommended);
    if (category !== 'All') list = list.filter(i => i.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.benefits.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return list;
  }, [search, category, showRecommended, topConcerns]);

  const searchAI = async () => {
    if (!search.trim()) return;
    setLoadingAI(true);
    const skinCtx = latestAnalysis ? `User skin type: ${latestAnalysis.skin_type}. Top concerns: ${topConcerns.slice(0, 3).join(', ')}.` : '';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cosmetic chemist. Explain the ingredient "${search}" for skincare. ${skinCtx}
      Provide: name, category, safety (safe/caution/avoid), benefits, avoid_with, percentage, best skin types, emoji.`,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' }, category: { type: 'string' }, safety: { type: 'string' },
          benefits: { type: 'string' }, avoid_with: { type: 'string' }, percentage: { type: 'string' },
          skin_types: { type: 'array', items: { type: 'string' } }, emoji: { type: 'string' },
          best_for: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    setAiResult(result);
    setLoadingAI(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#3d2a2a' }}>
          <FlaskConical className="w-6 h-6 text-emerald-500" /> Ingredient Library
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9a7e78' }}>
          Learn every ingredient — and what works for your skin
          {latestAnalysis && <span className="text-rose-400 font-medium"> · Personalized for {latestAnalysis.skin_type} skin</span>}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search ingredient (e.g. Niacinamide, Retinol...)"
          className="w-full pl-9 pr-24 py-2.5 rounded-xl text-sm"
          style={{ border: '1px solid #ede8e3', background: '#fff', color: '#3d2a2a' }} />
        {search.trim() && filtered.length === 0 && (
          <button onClick={searchAI} disabled={loadingAI}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
            {loadingAI ? '...' : 'AI Lookup'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {latestAnalysis && (
          <button onClick={() => setShowRecommended(p => !p)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={showRecommended ? { background: '#fce8ec', color: '#c07080', border: '1px solid #f0b0c0' } : { background: '#f5f0eb', color: '#9a7e78', border: '1px solid #ede8e3' }}>
            <Star className="w-3 h-3" /> For My Skin
          </button>
        )}
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={category === cat ? { background: '#3d2a2a', color: '#fff' } : { background: '#f5f0eb', color: '#9a7e78', border: '1px solid #ede8e3' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* AI Result */}
      {aiResult && (
        <div className="rounded-2xl p-4" style={{ background: '#fff5f8', border: '1px solid #f0c0d0' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#c07080' }}>🤖 AI Ingredient Lookup</p>
          <IngredientCard ingredient={aiResult} isRecommended={isRecommended(aiResult)} />
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        <p className="text-xs" style={{ color: '#9a7e78' }}>{filtered.length} ingredients</p>
        {filtered.map((ing, i) => (
          <IngredientCard key={ing.name + i} ingredient={ing} isRecommended={isRecommended(ing)} />
        ))}
        {filtered.length === 0 && !aiResult && (
          <div className="text-center py-8">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm" style={{ color: '#9a7e78' }}>No ingredients found. Try "AI Lookup" to search any ingredient!</p>
          </div>
        )}
      </div>
    </div>
  );
}