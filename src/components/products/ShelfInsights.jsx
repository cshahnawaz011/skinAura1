import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, AlertTriangle, Check, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

export default function ShelfInsights({ savedProducts, latestAnalysis }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!savedProducts.length) return;
    setLoading(true);

    const skinProfile = latestAnalysis
      ? `Skin type: ${latestAnalysis.skin_type}, Acne: ${latestAnalysis.acne_level}/10, Oiliness: ${latestAnalysis.oiliness}/10, Dryness: ${latestAnalysis.dryness}/10, Sensitivity: ${latestAnalysis.sensitivity}/10, Redness: ${latestAnalysis.redness}/10, Dark spots: ${latestAnalysis.dark_spots}/10`
      : 'No skin analysis available (give general advice)';

    const productList = savedProducts.map(p =>
      `- ${p.product_name} (${p.category}): ${p.key_ingredients?.join(', ') || 'no ingredients listed'}`
    ).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert dermatologist. Analyze this user's skincare shelf against their skin profile.

SKIN PROFILE:
${skinProfile}

CURRENT SHELF:
${productList}

Provide a thorough analysis:
1. Overall routine quality score (1-10)
2. For each product: is it a good match, neutral, or bad for their skin type?
3. Identify any irritants or problematic ingredients for their specific skin
4. Identify beneficial ingredients they have
5. Missing products they should add
6. Ingredient conflicts (ingredients that shouldn't be used together)
7. A personalized routine order recommendation
8. Top 3 actionable improvements`,
      response_json_schema: {
        type: "object",
        properties: {
          routine_score: { type: "number" },
          routine_summary: { type: "string" },
          product_assessments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                match: { type: "string" },
                reason: { type: "string" },
                key_concern: { type: "string" }
              }
            }
          },
          irritants_found: { type: "array", items: { type: "string" } },
          beneficial_ingredients: { type: "array", items: { type: "string" } },
          missing_products: { type: "array", items: { type: "string" } },
          ingredient_conflicts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ingredients: { type: "array", items: { type: "string" } },
                reason: { type: "string" }
              }
            }
          },
          routine_order: { type: "array", items: { type: "string" } },
          top_improvements: { type: "array", items: { type: "string" } }
        }
      }
    });

    setInsights(result);
    setLoading(false);
  };

  const matchColor = (match) => {
    if (match === 'good') return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-700';
    if (match === 'bad') return 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-700';
    return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 text-gray-600';
  };

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Shelf Analysis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Check your entire shelf for compatibility with your skin type
            </p>
          </div>
          <Button
            onClick={analyze}
            disabled={loading || savedProducts.length === 0}
            className="bg-gradient-to-r from-pink-500 to-amber-500 shrink-0"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Analyze Shelf</>
            )}
          </Button>
        </div>
        {savedProducts.length === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">Add products to your shelf first to run AI analysis.</p>
        )}
      </GlassCard>

      <AnimatePresence>
        {insights && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Score */}
            <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
              <div className="flex items-center gap-4 mb-3">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${
                    insights.routine_score >= 7 ? 'text-emerald-500' :
                    insights.routine_score >= 5 ? 'text-amber-500' : 'text-red-500'
                  }`}>{insights.routine_score}<span className="text-xl text-gray-400">/10</span></div>
                  <div className="text-xs text-gray-500">Routine Score</div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{insights.routine_summary}</p>
              </div>

              {/* Irritants & Benefits row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.irritants_found?.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Irritants Found</p>
                    <div className="flex flex-wrap gap-1">
                      {insights.irritants_found.map((i, idx) => (
                        <Badge key={idx} className="bg-red-100 text-red-700 text-xs border-0">{i}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {insights.beneficial_ingredients?.length > 0 && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1"><Check className="w-3 h-3" /> Beneficial Ingredients</p>
                    <div className="flex flex-wrap gap-1">
                      {insights.beneficial_ingredients.map((i, idx) => (
                        <Badge key={idx} className="bg-emerald-100 text-emerald-700 text-xs border-0">{i}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Per-product assessment */}
            {insights.product_assessments?.length > 0 && (
              <GlassCard>
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-pink-500" />Product-by-Product</h4>
                <div className="space-y-2">
                  {insights.product_assessments.map((pa, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${matchColor(pa.match)}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{pa.product_name}</span>
                        <Badge className={`text-xs capitalize border-0 ${
                          pa.match === 'good' ? 'bg-emerald-500 text-white' :
                          pa.match === 'bad' ? 'bg-red-500 text-white' :
                          'bg-gray-300 text-gray-700'
                        }`}>{pa.match}</Badge>
                      </div>
                      <p className="text-xs opacity-80">{pa.reason}</p>
                      {pa.key_concern && <p className="text-xs mt-1 font-medium opacity-70">⚠ {pa.key_concern}</p>}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Conflicts + Missing + Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.ingredient_conflicts?.length > 0 && (
                <GlassCard>
                  <h4 className="font-semibold mb-3 text-orange-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Ingredient Conflicts</h4>
                  <div className="space-y-2">
                    {insights.ingredient_conflicts.map((c, i) => (
                      <div key={i} className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-xs">
                        <p className="font-medium">{c.ingredients?.join(' + ')}</p>
                        <p className="text-gray-600 dark:text-gray-400 mt-0.5">{c.reason}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {insights.missing_products?.length > 0 && (
                <GlassCard>
                  <h4 className="font-semibold mb-3 text-blue-600 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Add to Your Shelf</h4>
                  <ul className="space-y-1">
                    {insights.missing_products.map((m, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">+</span>{m}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}
            </div>

            {/* Routine Order */}
            {insights.routine_order?.length > 0 && (
              <GlassCard>
                <h4 className="font-semibold mb-3">Recommended Application Order</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.routine_order.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-amber-400 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span className="text-sm">{step}</span>
                      {i < insights.routine_order.length - 1 && <span className="text-gray-400 mx-1">→</span>}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Top Improvements */}
            {insights.top_improvements?.length > 0 && (
              <GlassCard>
                <h4 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />Top Improvements</h4>
                <ul className="space-y-2">
                  {insights.top_improvements.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500 font-bold">{i + 1}.</span>{tip}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}