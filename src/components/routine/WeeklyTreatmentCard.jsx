import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, X, FlaskConical, Loader2, Calendar, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const KEY_EMOJIS = { aha: '⚗️', bha: '🔬', retinol: '✨', spot_treatment: '🎯' };
const KEY_COLORS = {
  aha: 'from-orange-400 to-amber-400',
  bha: 'from-blue-500 to-cyan-400',
  retinol: 'from-violet-500 to-purple-400',
  spot_treatment: 'from-rose-500 to-pink-400',
};

export default function WeeklyTreatmentCard({ treatment, index, savedProducts = [], userEmail, skinAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [productName, setProductName] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const queryClient = useQueryClient();

  const emoji = KEY_EMOJIS[treatment.treatment_key] || '⚗️';
  const gradient = KEY_COLORS[treatment.treatment_key] || 'from-gray-400 to-gray-500';

  const analyzeProduct = async () => {
    if (!productName.trim() || !skinAnalysis) return;
    setAnalyzing(true);
    const a = skinAnalysis;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze if the product "${productName}" is a good choice for the ${treatment.label} step in weekly routine.

Patient: ${a.skin_type} skin, Acne: ${a.acne_level}/10, Oiliness: ${a.oiliness}/10, Sensitivity: ${a.sensitivity}/10, Wrinkles: ${a.wrinkles}/10.
Recommended concentration for this patient: ${treatment.concentration}.

Give:
- suitability_score: 1–10
- verdict: "excellent" | "good" | "caution" | "avoid"
- concentration_match: true/false — does this product match the recommended concentration?
- reason: 2-sentence explanation
- usage_tip: specific tip for using this product correctly`,
      response_json_schema: {
        type: 'object',
        properties: {
          suitability_score: { type: 'number' },
          verdict: { type: 'string' },
          concentration_match: { type: 'boolean' },
          reason: { type: 'string' },
          usage_tip: { type: 'string' },
        }
      }
    });
    setAnalysisResult(result);
    if (userEmail) {
      await base44.entities.SavedProduct.create({
        user_email: userEmail,
        product_name: productName,
        category: treatment.treatment_key === 'aha' || treatment.treatment_key === 'bha' ? 'exfoliant' : treatment.treatment_key === 'retinol' ? 'serum' : 'treatment',
        routine_step: treatment.treatment_key,
        skin_compatibility_score: result.suitability_score,
        skin_analysis_notes: result.reason,
      });
      queryClient.invalidateQueries(['savedProducts']);
    }
    setAnalyzing(false);
  };

  const verdictColor = {
    excellent: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20',
    good: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20',
    caution: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20',
    avoid: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <div className={`glass rounded-2xl overflow-hidden border ${treatment.recommended ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-200 dark:border-gray-700 opacity-70'}`}>
        {/* Header */}
        <div className="p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{treatment.label}</span>
                {treatment.recommended ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 text-xs gap-1">
                    <Check className="w-3 h-3" /> Recommended
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 text-xs gap-1">
                    <X className="w-3 h-3" /> Skip for Now
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {treatment.concentration && (
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{treatment.concentration}</span>
                )}
                {treatment.frequency && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {treatment.frequency}
                  </span>
                )}
              </div>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </div>
        </div>

        {/* Expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 dark:border-gray-800">
              <div className="p-4 space-y-3 bg-white/30 dark:bg-black/10">

                {/* Why recommended / not */}
                <div className={`p-3 rounded-xl ${treatment.recommended ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-800/40'}`}>
                  <p className="text-xs font-bold mb-0.5 text-gray-600">{treatment.recommended ? '✅ Why Recommended' : '⏭️ Why Skip'}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{treatment.reason_recommended}</p>
                </div>

                {treatment.recommended && (
                  <>
                    {/* How to apply */}
                    {treatment.how_to_apply && (
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-600 uppercase mb-0.5">How to Apply</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{treatment.how_to_apply}</p>
                        </div>
                      </div>
                    )}

                    {/* Build-up schedule */}
                    {treatment.build_up_schedule && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-xs font-bold text-blue-600 mb-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Build-Up Schedule
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{treatment.build_up_schedule}</p>
                      </div>
                    )}

                    {/* Do not combine */}
                    {treatment.do_not_combine_with && (
                      <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-xs font-bold text-red-500 mb-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Never Combine With
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">{treatment.do_not_combine_with}</p>
                      </div>
                    )}

                    {/* Expected results */}
                    {treatment.expected_results && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm">📈</span>
                        <div>
                          <p className="text-xs font-bold text-gray-600 mb-0.5">Expected Results</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{treatment.expected_results}</p>
                        </div>
                      </div>
                    )}

                    {/* ── Product Analyzer ── */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                      <p className="text-xs font-bold text-gray-500 mb-2">🔍 Analyze a Product for This Treatment</p>
                      <div className="flex gap-2">
                        <input
                          value={productName}
                          onChange={e => setProductName(e.target.value)}
                          placeholder={`e.g. The Ordinary ${treatment.label}...`}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/20 text-sm focus:outline-none focus:ring-1 focus:ring-pink-300"
                        />
                        <Button size="sm" onClick={analyzeProduct} disabled={analyzing || !productName.trim() || !skinAnalysis}
                          className="bg-gradient-to-r from-violet-500 to-purple-500 gap-1.5 shrink-0">
                          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
                          {analyzing ? 'Checking...' : 'Analyze'}
                        </Button>
                      </div>

                      {/* Past products analyzed */}
                      {savedProducts.filter(p => p.routine_step === treatment.treatment_key).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {savedProducts.filter(p => p.routine_step === treatment.treatment_key).map(p => (
                            <button key={p.id} onClick={() => setProductName(p.product_name)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-xs text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                              <Check className="w-3 h-3" /> {p.product_name}
                              {p.skin_compatibility_score && <span className="font-bold ml-0.5">{p.skin_compatibility_score}/10</span>}
                            </button>
                          ))}
                        </div>
                      )}

                      {analysisResult && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className={`mt-3 p-3 rounded-xl border ${verdictColor[analysisResult.verdict] || 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-sm capitalize">{analysisResult.verdict}</p>
                            <div className="flex items-center gap-2">
                              {analysisResult.concentration_match ? (
                                <Badge className="bg-emerald-500 text-xs">✓ Concentration OK</Badge>
                              ) : (
                                <Badge className="bg-amber-500 text-xs">⚠ Check concentration</Badge>
                              )}
                              <span className="font-black text-lg">{analysisResult.suitability_score}/10</span>
                            </div>
                          </div>
                          <p className="text-xs">{analysisResult.reason}</p>
                          {analysisResult.usage_tip && (
                            <p className="text-xs mt-1.5 font-medium">💡 {analysisResult.usage_tip}</p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}