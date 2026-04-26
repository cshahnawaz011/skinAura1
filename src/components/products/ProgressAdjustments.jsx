import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, RefreshCw, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ACTION_STYLES = {
  keep:   { icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', label: 'Keep', badge: 'bg-emerald-100 text-emerald-700' },
  switch: { icon: RefreshCw,   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  label: 'Consider Switching', badge: 'bg-amber-100 text-amber-700' },
  remove: { icon: Trash2,      color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   label: 'Remove', badge: 'bg-red-100 text-red-700' },
};

function getTrend(pastAnalyses) {
  if (pastAnalyses.length < 2) return null;
  const latest = pastAnalyses[0];
  const prev = pastAnalyses[1];
  const delta = (latest.overall_score || 0) - (prev.overall_score || 0);
  return delta;
}

export default function ProgressAdjustments({ savedProducts, latestAnalysis, pastAnalyses }) {
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState(null);

  const trend = getTrend(pastAnalyses);

  const runAnalysis = async () => {
    if (!latestAnalysis || savedProducts.length === 0) return;
    setLoading(true);
    const a = latestAnalysis;
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatology AI. Analyze the user's skincare routine and suggest specific adjustments based on their skin progress.

Skin profile: ${a.skin_type} skin. Scores: Acne ${a.acne_level}/10, Dark spots ${a.dark_spots}/10, Wrinkles ${a.wrinkles}/10, Oiliness ${a.oiliness}/10, Dryness ${a.dryness}/10, Sensitivity ${a.sensitivity}/10. Overall score: ${a.overall_score}/100.

${pastAnalyses.length >= 2 ? `Previous score: ${pastAnalyses[1]?.overall_score}/100. Trend: ${trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'}.` : ''}

Current shelf: ${savedProducts.map(p => `${p.product_name} (${p.category}, ingredients: ${(p.key_ingredients || []).join(', ')})`).join(' | ')}

For each product, decide: keep / switch / remove. Give a specific reason tied to their skin metrics.
Also suggest 1–2 replacement recommendations where switching is advised.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          adjustments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_name: { type: 'string' },
                action: { type: 'string' },
                reason: { type: 'string' },
                replacement_suggestion: { type: 'string' },
                priority: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setAdjustments(res);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Trend banner */}
      {trend !== null && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: trend > 0 ? 'rgba(52,211,153,0.08)' : trend < 0 ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.04)', border: `1px solid ${trend > 0 ? 'rgba(52,211,153,0.25)' : trend < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.07)'}` }}>
          {trend > 0 ? <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : trend < 0 ? <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" /> : <Minus className="w-5 h-5 text-gray-400 flex-shrink-0" />}
          <div>
            <p className="font-black text-sm">{trend > 0 ? `+${trend} points since last scan 🎉` : trend < 0 ? `${trend} points since last scan` : 'Score unchanged'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{trend > 0 ? 'Your routine is working — adjustments will help you keep improving.' : trend < 0 ? 'Something might not be working — let\'s refine your shelf.' : 'Steady progress — minor tweaks can accelerate results.'}</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.1))', border: '1px solid rgba(244,114,182,0.2)' }}>
        <div>
          <p className="font-black text-sm">Progress-Driven Analysis</p>
          <p className="text-xs text-gray-500 mt-0.5">AI reviews your skin progress and recommends keep / switch / remove per product</p>
        </div>
        <Button onClick={runAnalysis} disabled={loading || !latestAnalysis || savedProducts.length === 0}
          className="text-white flex-shrink-0 text-xs gap-1"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '📈'}
          {loading ? 'Analyzing…' : 'Analyze'}
        </Button>
      </div>

      {savedProducts.length === 0 && (
        <div className="rounded-2xl p-6 text-center text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
          Add products to your shelf first to get adjustment suggestions.
        </div>
      )}

      <AnimatePresence>
        {adjustments && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {adjustments.summary && (
              <div className="rounded-2xl p-4 text-sm italic text-gray-600"
                style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
                💬 {adjustments.summary}
              </div>
            )}
            {(adjustments.adjustments || []).map((adj, i) => {
              const style = ACTION_STYLES[adj.action] || ACTION_STYLES['keep'];
              const Icon = style.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl p-4" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: style.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-black text-sm">{adj.product_name}</p>
                        <Badge className={`text-[10px] ${style.badge}`}>{style.label}</Badge>
                        {adj.priority === 'high' && <Badge className="bg-red-100 text-red-600 text-[10px]">High Priority</Badge>}
                      </div>
                      <p className="text-xs text-gray-600">{adj.reason}</p>
                      {adj.replacement_suggestion && (
                        <p className="mt-1.5 text-xs font-semibold text-violet-600">
                          💡 Try instead: {adj.replacement_suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}