import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, AlertTriangle, Check, X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const KNOWN_CONFLICTS = [
  { a: 'retinol', b: 'vitamin c', note: 'Can cause irritation — use on alternate nights', severity: 'caution' },
  { a: 'retinol', b: 'aha', note: 'Both exfoliate — combined use risks over-exfoliation', severity: 'avoid' },
  { a: 'retinol', b: 'bha', note: 'Both exfoliate — combined use risks over-exfoliation', severity: 'avoid' },
  { a: 'niacinamide', b: 'vitamin c', note: 'May reduce efficacy of Vitamin C at high concentrations', severity: 'caution' },
  { a: 'benzoyl peroxide', b: 'retinol', note: 'Oxidizes retinol — apply at different times', severity: 'avoid' },
  { a: 'aha', b: 'vitamin c', note: 'Layering both lowers pH and can irritate — use AM/PM separately', severity: 'caution' },
  { a: 'salicylic acid', b: 'retinol', note: 'High irritation risk for sensitive skin', severity: 'caution' },
  { a: 'glycolic acid', b: 'lactic acid', note: 'Over-exfoliation risk if both used daily', severity: 'caution' },
];

const SAFE_COMBOS = [
  { a: 'niacinamide', b: 'hyaluronic acid', note: 'Great pairing — brightening + hydration' },
  { a: 'retinol', b: 'hyaluronic acid', note: 'HA cushions retinol irritation — layer after retinol' },
  { a: 'vitamin c', b: 'spf', note: 'Powerful antioxidant + UV protection combo for AM' },
  { a: 'peptides', b: 'hyaluronic acid', note: 'Complementary anti-aging + hydration stack' },
  { a: 'niacinamide', b: 'zinc', note: 'Classic acne-fighting duo' },
];

function detectConflicts(products) {
  const allIngs = products.flatMap(p => (p.key_ingredients || []).map(i => i.toLowerCase()));
  const found = [];
  KNOWN_CONFLICTS.forEach(c => {
    if (allIngs.some(i => i.includes(c.a)) && allIngs.some(i => i.includes(c.b))) {
      found.push(c);
    }
  });
  return found;
};

function detectSafeCombos(products) {
  const allIngs = products.flatMap(p => (p.key_ingredients || []).map(i => i.toLowerCase()));
  return SAFE_COMBOS.filter(c => allIngs.some(i => i.includes(c.a)) && allIngs.some(i => i.includes(c.b)));
}

const LAYER_ORDER = ['water-based cleanser', 'toner', 'essence', 'serum (lightest)', 'treatment', 'eye cream', 'moisturizer', 'face oil', 'spf (AM only)'];

export default function IngredientIntelligence({ savedProducts, latestAnalysis }) {
  const [ingredientInput, setIngredientInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [activeSection, setActiveSection] = useState('conflicts');

  const conflicts = detectConflicts(savedProducts);
  const safeCombos = detectSafeCombos(savedProducts);

  const analyzeIngredients = async () => {
    if (!ingredientInput.trim()) return;
    setAnalyzing(true);
    const skinProfile = latestAnalysis
      ? `${latestAnalysis.skin_type} skin, acne ${latestAnalysis.acne_level}/10, oiliness ${latestAnalysis.oiliness}/10, dryness ${latestAnalysis.dryness}/10, sensitivity ${latestAnalysis.sensitivity}/10`
      : 'unknown skin type';
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cosmetic chemist. Skin profile: ${skinProfile}.
Analyze this ingredient list: "${ingredientInput}"
For each ingredient: name, rating (good/neutral/bad/avoid), function, skin_benefit for this skin type, comedogenic_rating (0-5), allergen_warning (string or null), interactions (string or null).
Overall: overall_assessment, suitability_score (1-10), top_concern, top_benefit, pair_with, fragrance_free (bool), alcohol_free (bool).`,
      response_json_schema: {
        type: 'object',
        properties: {
          ingredients: { type: 'array', items: { type: 'object', properties: {
            name: { type: 'string' }, rating: { type: 'string' }, function: { type: 'string' },
            skin_benefit: { type: 'string' }, comedogenic_rating: { type: 'number' },
            allergen_warning: { type: 'string' }, interactions: { type: 'string' }
          }}},
          overall_assessment: { type: 'string' }, suitability_score: { type: 'number' },
          top_concern: { type: 'string' }, top_benefit: { type: 'string' },
          pair_with: { type: 'string' }, fragrance_free: { type: 'boolean' }, alcohol_free: { type: 'boolean' }
        }
      }
    });
    setResult(res);
    setAnalyzing(false);
  };

  const SECTIONS = [
    { key: 'conflicts', label: '⚡ Conflicts', count: conflicts.length },
    { key: 'safe', label: '✅ Safe Combos', count: safeCombos.length },
    { key: 'layering', label: '📋 Layering Order', count: null },
    { key: 'scanner', label: '🔬 Ingredient Scanner', count: null },
  ];

  return (
    <div className="space-y-4">
      {/* Section nav */}
      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: activeSection === s.key ? 'linear-gradient(135deg,#f472b6,#a78bfa)' : 'rgba(0,0,0,0.05)',
              color: activeSection === s.key ? 'white' : '#6b7280',
            }}>
            {s.label}{s.count != null ? ` (${s.count})` : ''}
          </button>
        ))}
      </div>

      {/* Conflict Engine */}
      {activeSection === 'conflicts' && (
        <div className="space-y-3">
          {conflicts.length === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-sm">No conflicts detected!</p>
              <p className="text-xs text-gray-400 mt-1">Your current product ingredients work well together.</p>
            </div>
          ) : conflicts.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4" style={{ background: c.severity === 'avoid' ? 'rgba(239,68,68,0.06)' : 'rgba(251,191,36,0.06)', border: `1px solid ${c.severity === 'avoid' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.25)'}` }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.severity === 'avoid' ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <p className="font-black text-sm capitalize">{c.a} ✕ {c.b}</p>
                  <p className="text-xs text-gray-600 mt-1">{c.note}</p>
                  <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${c.severity === 'avoid' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {c.severity === 'avoid' ? '🚫 Avoid Together' : '⚠️ Use Caution'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Safe Combos */}
      {activeSection === 'safe' && (
        <div className="space-y-3">
          {safeCombos.length === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="text-sm text-gray-400">Add more products to see safe ingredient pairings from your shelf.</p>
            </div>
          ) : safeCombos.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm capitalize">{c.a} + {c.b}</p>
                <p className="text-xs text-gray-600 mt-1">{c.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Layering Order */}
      {activeSection === 'layering' && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="font-black text-sm mb-3">📋 Universal Layering Order (thinnest → thickest)</p>
          {LAYER_ORDER.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                style={{ background: `hsl(${260 + i * 12}, 70%, 60%)` }}>{i + 1}</div>
              <div className="flex-1 h-0.5 rounded-full" style={{ background: `hsl(${260 + i * 12}, 70%, 85%)` }} />
              <p className="text-xs font-semibold text-gray-700 capitalize">{step}</p>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
            ⏱ Wait 30–60 seconds between each layer for optimal absorption.
          </p>
        </div>
      )}

      {/* Ingredient Scanner */}
      {activeSection === 'scanner' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="font-black text-sm mb-1">Paste any product's ingredient list</p>
            <p className="text-xs text-gray-400 mb-3">We'll rate each ingredient for YOUR specific skin type</p>
            <Textarea
              placeholder="Water, Glycerin, Niacinamide, Hyaluronic Acid, Retinol..."
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              rows={4}
              className="mb-3 text-xs"
            />
            <Button onClick={analyzeIngredients} disabled={analyzing || !ingredientInput.trim()}
              className="w-full text-white gap-2" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : <><Search className="w-4 h-4" /> Analyze Ingredients</>}
            </Button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.06),rgba(167,139,250,0.08))', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-black text-sm">Overall Assessment</p>
                    <span className={`text-2xl font-black ${result.suitability_score >= 7 ? 'text-emerald-500' : result.suitability_score >= 5 ? 'text-amber-500' : 'text-red-500'}`}>
                      {result.suitability_score}/10
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{result.overall_assessment}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {result.top_benefit && <div className="p-2 rounded-xl bg-emerald-50"><p className="font-bold text-emerald-600 mb-0.5">✅ Top Benefit</p><p>{result.top_benefit}</p></div>}
                    {result.top_concern && <div className="p-2 rounded-xl bg-red-50"><p className="font-bold text-red-600 mb-0.5">⚠️ Top Concern</p><p>{result.top_concern}</p></div>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {result.fragrance_free && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✓ Fragrance-Free</Badge>}
                    {result.alcohol_free && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✓ Alcohol-Free</Badge>}
                  </div>
                </div>
                <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <p className="font-black text-sm mb-2">Ingredient Breakdown</p>
                  {result.ingredients?.map((ing, i) => (
                    <div key={i} className={`p-3 rounded-xl text-xs ${ing.rating === 'good' ? 'bg-emerald-50 border border-emerald-100' : ing.rating === 'avoid' || ing.rating === 'bad' ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{ing.name}</span>
                        <div className="flex gap-1">
                          {ing.rating === 'good' && <span className="text-emerald-600 font-black">✓</span>}
                          {(ing.rating === 'bad' || ing.rating === 'avoid') && <span className="text-red-500 font-black">✗</span>}
                          <span className="text-gray-400">Pores: {ing.comedogenic_rating}/5</span>
                        </div>
                      </div>
                      <p className="text-gray-500">{ing.skin_benefit || ing.function}</p>
                      {ing.allergen_warning && <p className="mt-1 text-amber-600">⚠️ {ing.allergen_warning}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}