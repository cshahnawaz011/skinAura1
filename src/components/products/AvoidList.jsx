import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATIC_AVOID = [
  { ingredient: 'Sodium Lauryl Sulfate (SLS)', reason: 'Strips natural oils — harsh for sensitive & dry skin', sensitivity_trigger: true, barrier_disruptor: true },
  { ingredient: 'Denatured Alcohol (SD Alcohol)', reason: 'Dries out skin and disrupts moisture barrier', sensitivity_trigger: true, barrier_disruptor: true },
  { ingredient: 'Synthetic Fragrance', reason: 'Top sensitizer — can trigger redness, allergic reactions', sensitivity_trigger: true, barrier_disruptor: false },
  { ingredient: 'Methylparaben / Propylparaben', reason: 'Endocrine disruptors; potential skin irritant', sensitivity_trigger: true, barrier_disruptor: false },
  { ingredient: 'Formaldehyde Releasers', reason: 'Known carcinogen and contact allergen', sensitivity_trigger: true, barrier_disruptor: false },
];

function getSensitivityAvoids(analysis) {
  if (!analysis) return [];
  const avoids = [];
  if (analysis.sensitivity > 5) {
    avoids.push({ ingredient: 'Retinol (>0.3%)', reason: 'High sensitivity detected — start with lower concentration or buffer with moisturizer', signal: 'High Sensitivity' });
    avoids.push({ ingredient: 'AHAs at high % (>10%)', reason: 'Risk of over-exfoliation with your current sensitivity level', signal: 'High Sensitivity' });
  }
  if (analysis.acne_level > 5) {
    avoids.push({ ingredient: 'Coconut Oil', reason: 'Highly comedogenic — worsens active acne', signal: 'Active Acne' });
    avoids.push({ ingredient: 'Isopropyl Myristate', reason: 'Comedogenic — clogs pores, triggers breakouts', signal: 'Active Acne' });
  }
  if (analysis.oiliness > 6) {
    avoids.push({ ingredient: 'Heavy Mineral Oil', reason: 'Occlusive — traps sebum and worsens congestion', signal: 'Excess Oiliness' });
    avoids.push({ ingredient: 'Petrolatum as sole moisturizer', reason: 'Too occlusive for oily skin — use lighter humectants', signal: 'Excess Oiliness' });
  }
  if (analysis.redness > 5) {
    avoids.push({ ingredient: 'Menthol / Peppermint', reason: 'Vasodilator — worsens redness and broken capillaries', signal: 'Redness' });
    avoids.push({ ingredient: 'Witch Hazel (alcohol-based)', reason: 'Drying and irritating for redness-prone skin', signal: 'Redness' });
  }
  return avoids;
};

export default function AvoidList({ savedProducts, latestAnalysis }) {
  const [loading, setLoading] = useState(false);
  const [aiAvoids, setAiAvoids] = useState(null);

  const dynamicAvoids = getSensitivityAvoids(latestAnalysis);

  const generateAiList = async () => {
    if (!latestAnalysis) return;
    setLoading(true);
    const a = latestAnalysis;
    const shelfIngs = savedProducts.flatMap(p => p.key_ingredients || []).join(', ');
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatologist. Based on this skin profile, generate a personalized list of ingredients and product types to AVOID RIGHT NOW.

Skin: ${a.skin_type}, Acne ${a.acne_level}/10, Oiliness ${a.oiliness}/10, Dryness ${a.dryness}/10, Sensitivity ${a.sensitivity}/10, Redness ${a.redness}/10, Dark spots ${a.dark_spots}/10, Overall ${a.overall_score}/100.
Shelf ingredients: ${shelfIngs || 'none'}.

Give 5–8 specific ingredients or product types to avoid, with clinical reasoning tied to their exact skin signals. Be specific.`,
      response_json_schema: {
        type: 'object',
        properties: {
          avoid_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                ingredient: { type: 'string' },
                reason: { type: 'string' },
                severity: { type: 'string' },
                signal: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setAiAvoids(res.avoid_items || []);
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Header CTA */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.06),rgba(251,146,60,0.06))', border: '1px solid rgba(239,68,68,0.18)' }}>
        <div>
          <p className="font-black text-sm">🚫 Personalized Avoid List</p>
          <p className="text-xs text-gray-500 mt-0.5">AI generates a custom list from your barrier risk, sensitivity & conflicts</p>
        </div>
        <Button onClick={generateAiList} disabled={loading || !latestAnalysis}
          className="text-white flex-shrink-0 text-xs gap-1"
          style={{ background: 'linear-gradient(135deg,#f43f5e,#fb923c)' }}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🚫'}
          {loading ? 'Generating…' : 'Generate'}
        </Button>
      </div>

      {/* Dynamic AI avoids */}
      <AnimatePresence>
        {aiAvoids && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="font-black text-sm text-red-500 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> AI-Generated Avoid List for Your Skin</p>
            {aiAvoids.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4" style={{ background: item.severity === 'high' ? 'rgba(239,68,68,0.07)' : 'rgba(251,146,60,0.07)', border: `1px solid ${item.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(251,146,60,0.2)'}` }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-black text-sm">{item.ingredient}</p>
                      {item.signal && <Badge className="bg-red-100 text-red-600 text-[10px]">{item.signal}</Badge>}
                    </div>
                    <p className="text-xs text-gray-600">{item.reason}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic skin-signal avoids */}
      {dynamicAvoids.length > 0 && (
        <div className="space-y-2">
          <p className="font-black text-sm text-amber-600">⚡ Based on Your Skin Signals</p>
          {dynamicAvoids.map((item, i) => (
            <div key={i} className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-black text-sm">{item.ingredient}</p>
                  <Badge className="bg-amber-100 text-amber-700 text-[10px]">{item.signal}</Badge>
                </div>
                <p className="text-xs text-gray-600">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Static universal avoids */}
      <div className="space-y-2">
        <p className="font-black text-sm text-gray-500">🔴 Universal Avoids (All Skin Types)</p>
        {STATIC_AVOID.map((item, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-bold text-sm">{item.ingredient}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
              <div className="flex gap-1 mt-1.5">
                {item.sensitivity_trigger && <Badge className="bg-rose-50 text-rose-500 text-[10px]">Sensitizer</Badge>}
                {item.barrier_disruptor && <Badge className="bg-orange-50 text-orange-500 text-[10px]">Barrier Disruptor</Badge>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}