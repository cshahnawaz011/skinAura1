import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info, Zap, Target, Shield, FlaskConical, Sparkles, Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const STEP_EMOJIS = {
  cleanse: '🧼', antioxidant: '🍊', moisturize: '🧴', spf: '☀️',
};

export default function RoutineStepCard({ step, index, isMorning, savedProducts = [], userEmail, skinAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [productName, setProductName] = useState(step.chosen_product || '');
  const [analysisResult, setAnalysisResult] = useState(null);
  const queryClient = useQueryClient();

  const emoji = STEP_EMOJIS[step.step_key] || '💧';
  const gradientClass = isMorning ? 'from-amber-400 to-orange-400' : 'from-indigo-500 to-purple-500';

  const analyzeProduct = async () => {
    if (!productName.trim() || !skinAnalysis) return;
    setAnalyzing(true);
    const a = skinAnalysis;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cosmetic chemist. Analyze if the product "${productName}" is suitable for THIS patient's skin.

Patient skin: ${a.skin_type}, Acne: ${a.acne_level}/10, Oiliness: ${a.oiliness}/10, Dryness: ${a.dryness}/10, Sensitivity: ${a.sensitivity}/10, Dark spots: ${a.dark_spots}/10, Redness: ${a.redness}/10.

This product will be used in the ${step.label} step.
Required ingredient to look for: ${step.key_ingredient || 'any appropriate'}.

Give:
- suitability_score: 1–10
- verdict: "excellent" | "good" | "caution" | "avoid"
- reason: 2-sentence explanation
- better_alternative: suggest a better product if score < 7`,
      response_json_schema: {
        type: 'object',
        properties: {
          suitability_score: { type: 'number' },
          verdict: { type: 'string' },
          reason: { type: 'string' },
          better_alternative: { type: 'string' },
        }
      }
    });
    setAnalysisResult(result);

    // Save product to shelf
    if (userEmail) {
      await base44.entities.SavedProduct.create({
        user_email: userEmail,
        product_name: productName,
        category: step.step_key === 'spf' ? 'sunscreen' : step.step_key === 'antioxidant' ? 'serum' : step.step_key,
        routine_step: step.step_key,
        skin_compatibility_score: result.suitability_score,
        skin_analysis_notes: result.reason,
        key_ingredients: step.key_ingredient ? [step.key_ingredient] : [],
      });
      queryClient.invalidateQueries(['savedProducts']);
    }
    setAnalyzing(false);
  };

  const verdictColor = {
    excellent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    good: 'text-blue-600 bg-blue-50 border-blue-200',
    caution: 'text-amber-600 bg-amber-50 border-amber-200',
    avoid: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
      <div className={`glass rounded-2xl overflow-hidden border ${expanded ? 'border-pink-200 dark:border-pink-800' : 'border-white/20'}`}>
        {/* Header */}
        <div className="p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-xl flex-shrink-0`}>
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{step.label}</span>
                {step.key_ingredient && (
                  <Badge variant="outline" className="text-xs">{step.key_ingredient}</Badge>
                )}
                {step.concentration && (
                  <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{step.concentration}</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{step.product_type}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {step.duration && <span className="text-xs text-gray-400 hidden sm:block">{step.duration}</span>}
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </div>

        {/* Expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 dark:border-gray-800">
              <div className="p-4 space-y-3 bg-white/30 dark:bg-black/10">

                {/* Why this for you */}
                {step.why && (
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Why This For You</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{step.why}</p>
                    </div>
                  </div>
                )}

                {/* How to apply */}
                {step.how_to_apply && (
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-0.5">How to Apply</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{step.how_to_apply}</p>
                    </div>
                  </div>
                )}

                {/* Avoid */}
                {step.avoid && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs font-bold text-red-500 mb-0.5">🚫 Avoid in this step</p>
                    <p className="text-xs text-red-700 dark:text-red-300">{step.avoid}</p>
                  </div>
                )}

                {/* ── Product Picker + Analyzer ── */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                  <p className="text-xs font-bold text-gray-500 mb-2">🔍 Analyze a Product for This Step</p>
                  <div className="flex gap-2">
                    <input
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      placeholder={`e.g. ${step.product_type || 'product name'}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/20 text-sm focus:outline-none focus:ring-1 focus:ring-pink-300"
                    />
                    <Button size="sm" onClick={analyzeProduct} disabled={analyzing || !productName.trim() || !skinAnalysis}
                      className="bg-gradient-to-r from-pink-500 to-amber-500 gap-1.5 shrink-0">
                      {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
                      {analyzing ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>

                  {/* Saved products for this step */}
                  {savedProducts.filter(p => p.routine_step === step.step_key).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {savedProducts.filter(p => p.routine_step === step.step_key).map(p => (
                        <button key={p.id} onClick={() => setProductName(p.product_name)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-900/20 text-xs text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 hover:bg-pink-100 transition-colors">
                          <Check className="w-3 h-3" /> {p.product_name}
                          {p.skin_compatibility_score && (
                            <span className="ml-1 font-bold">{p.skin_compatibility_score}/10</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Analysis Result */}
                  {analysisResult && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 p-3 rounded-xl border ${verdictColor[analysisResult.verdict] || 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm capitalize">{analysisResult.verdict}</p>
                        <span className="font-black text-lg">{analysisResult.suitability_score}/10</span>
                      </div>
                      <p className="text-xs leading-relaxed">{analysisResult.reason}</p>
                      {analysisResult.better_alternative && (
                        <p className="text-xs mt-1.5 font-medium opacity-80">💡 Better option: {analysisResult.better_alternative}</p>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}