import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Upload, Sparkles, Loader2, AlertTriangle,
  CheckCircle, XCircle, Info, Clipboard, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const SAFETY_COLORS = {
  safe: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  caution: 'bg-amber-100 text-amber-800 border-amber-200',
  avoid: 'bg-red-100 text-red-800 border-red-200',
};

const SAFETY_ICON = {
  safe: <CheckCircle className="w-4 h-4 text-emerald-600" />,
  caution: <AlertTriangle className="w-4 h-4 text-amber-600" />,
  avoid: <XCircle className="w-4 h-4 text-red-600" />,
};

function IngredientTag({ ingredient }) {
  const [expanded, setExpanded] = useState(false);
  const color = SAFETY_COLORS[ingredient.safety] || SAFETY_COLORS.safe;
  const icon = SAFETY_ICON[ingredient.safety] || SAFETY_ICON.safe;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border p-3 ${color} cursor-pointer select-none`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm">{ingredient.name}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-xs opacity-90 space-y-1"
          >
            <p>{ingredient.description}</p>
            {ingredient.concern && <p className="font-semibold">⚠️ {ingredient.concern}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function IngredientChecker() {
  const [user, setUser] = useState(null);
  const [ingredientText, setIngredientText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setIngredientText(ev.target.result);
    reader.readAsText(file);
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setIngredientText(text);
  };

  const analyzeIngredients = async () => {
    if (!ingredientText.trim()) return;
    setLoading(true);
    setReport(null);

    const skinContext = latestAnalysis
      ? `User's skin type: ${latestAnalysis.skin_type}. Concerns: acne level ${latestAnalysis.acne_level}/10, sensitivity ${latestAnalysis.sensitivity}/10, oiliness ${latestAnalysis.oiliness}/10, dryness ${latestAnalysis.dryness}/10.`
      : 'No skin analysis available — provide general guidance.';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cosmetic chemist and dermatologist. Analyze this ingredient list and generate a safety & suitability report.

${skinContext}

INGREDIENT LIST:
${ingredientText}

For each significant ingredient (up to 15), classify it as:
- "safe": generally safe and beneficial
- "caution": potentially irritating or needs awareness
- "avoid": known irritant, comedogenic, or harmful for the skin type above

Also provide an overall safety score (0-100), a suitability score for the user's skin type (0-100), a short overall verdict, key concerns, and top benefits.`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_safety_score: { type: "number" },
          skin_suitability_score: { type: "number" },
          verdict: { type: "string" },
          verdict_level: { type: "string", enum: ["great", "good", "caution", "avoid"] },
          key_concerns: { type: "array", items: { type: "string" } },
          top_benefits: { type: "array", items: { type: "string" } },
          comedogenic_risk: { type: "string", enum: ["low", "moderate", "high"] },
          irritancy_risk: { type: "string", enum: ["low", "moderate", "high"] },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                safety: { type: "string", enum: ["safe", "caution", "avoid"] },
                description: { type: "string" },
                concern: { type: "string" }
              }
            }
          }
        }
      }
    });

    setReport(result);
    setLoading(false);
  };

  const verdictConfig = {
    great: { color: 'from-emerald-400 to-teal-400', emoji: '✅', label: 'Great for You!' },
    good: { color: 'from-blue-400 to-cyan-400', emoji: '👍', label: 'Generally Good' },
    caution: { color: 'from-amber-400 to-orange-400', emoji: '⚠️', label: 'Use with Caution' },
    avoid: { color: 'from-red-400 to-pink-400', emoji: '🚫', label: 'Not Recommended' },
  };

  const riskColor = { low: 'text-emerald-600', moderate: 'text-amber-600', high: 'text-red-600' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-emerald-500" />
          Ingredient Checker
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Paste or upload any ingredient list to get a personalized safety & suitability report
          {latestAnalysis && <span className="text-emerald-600 font-medium"> · Tailored to your {latestAnalysis.skin_type} skin</span>}
        </p>
      </div>

      {/* Input Section */}
      <GlassCard>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-emerald-500" />
          Paste Ingredient List
        </h3>
        <textarea
          className="w-full h-36 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:text-gray-100"
          placeholder="e.g. Water, Glycerin, Niacinamide, Zinc PCA, Sodium Hyaluronate..."
          value={ingredientText}
          onChange={(e) => setIngredientText(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={handlePaste} className="gap-2">
            <Clipboard className="w-4 h-4" /> Paste from Clipboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" /> Upload .txt File
          </Button>
          {ingredientText && (
            <Button variant="ghost" size="sm" onClick={() => { setIngredientText(''); setReport(null); }} className="gap-2 text-gray-400">
              <RefreshCw className="w-4 h-4" /> Clear
            </Button>
          )}
          <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
        </div>
      </GlassCard>

      <Button
        onClick={analyzeIngredients}
        disabled={!ingredientText.trim() || loading}
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Ingredients...</>
          : <><Sparkles className="w-5 h-5 mr-2" /> Check Safety & Suitability</>
        }
      </Button>

      {/* Report */}
      <AnimatePresence>
        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Verdict Banner */}
            {(() => {
              const v = verdictConfig[report.verdict_level] || verdictConfig.good;
              return (
                <GlassCard className={`bg-gradient-to-r ${v.color} border-0`}>
                  <div className="text-white text-center">
                    <p className="text-4xl mb-2">{v.emoji}</p>
                    <h2 className="text-2xl font-bold mb-1">{v.label}</h2>
                    <p className="text-sm opacity-90 max-w-lg mx-auto">{report.verdict}</p>
                    <div className="flex justify-center gap-8 mt-4">
                      <div>
                        <p className="text-3xl font-bold">{report.overall_safety_score}</p>
                        <p className="text-xs opacity-80">Safety Score</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{report.skin_suitability_score}</p>
                        <p className="text-xs opacity-80">Skin Suitability</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })()}

            {/* Risk Overview */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="!p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">🔬 Comedogenic Risk</p>
                <p className={`font-bold text-lg capitalize ${riskColor[report.comedogenic_risk]}`}>{report.comedogenic_risk}</p>
              </GlassCard>
              <GlassCard className="!p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">🌡️ Irritancy Risk</p>
                <p className={`font-bold text-lg capitalize ${riskColor[report.irritancy_risk]}`}>{report.irritancy_risk}</p>
              </GlassCard>
            </div>

            {/* Concerns & Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.key_concerns?.length > 0 && (
                <GlassCard className="bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-700/30">
                  <h3 className="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Key Concerns
                  </h3>
                  <ul className="space-y-2">
                    {report.key_concerns.map((c, i) => (
                      <li key={i} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                        <span className="mt-0.5">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}
              {report.top_benefits?.length > 0 && (
                <GlassCard className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-700/30">
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Top Benefits
                  </h3>
                  <ul className="space-y-2">
                    {report.top_benefits.map((b, i) => (
                      <li key={i} className="text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                        <span className="mt-0.5">•</span> {b}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}
            </div>

            {/* Ingredient-by-Ingredient Breakdown */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                Ingredient Breakdown
                <span className="text-xs text-gray-400 ml-1">(tap to expand)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.ingredients?.map((ing, i) => (
                  <IngredientTag key={i} ingredient={ing} />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle className="w-3.5 h-3.5" /> Safe</div>
                <div className="flex items-center gap-1.5 text-xs text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /> Caution</div>
                <div className="flex items-center gap-1.5 text-xs text-red-700"><XCircle className="w-3.5 h-3.5" /> Avoid</div>
              </div>
            </GlassCard>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}