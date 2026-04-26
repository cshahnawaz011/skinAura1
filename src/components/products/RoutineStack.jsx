import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, X, Sun, Moon, Check, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MORNING_ORDER = ['cleanser', 'toner', 'serum', 'eye_cream', 'moisturizer', 'sunscreen'];
const NIGHT_ORDER = ['cleanser', 'toner', 'serum', 'treatment', 'eye_cream', 'moisturizer', 'face_mask'];

const CAT_EMOJI = {
  cleanser: '🧴', toner: '💧', serum: '✨', moisturizer: '🧈',
  sunscreen: '☀️', eye_cream: '👁️', face_mask: '🎭', treatment: '💊', exfoliant: '🔬', retinol: '🌙', other: '📦',
};

const FREQ_LABELS = {
  cleanser: 'AM + PM · Daily', toner: 'AM + PM · Daily', serum: 'AM or PM · Daily',
  moisturizer: 'AM + PM · Daily', sunscreen: 'AM · Daily', eye_cream: 'PM · Daily',
  face_mask: '1–2× Weekly', exfoliant: '2–3× Weekly', retinol: 'PM · 3× Week', treatment: 'PM · Daily',
};

function getMatchScore(product, analysis) {
  if (!analysis) return 75;
  let score = 70;
  const cats = product.category;
  if (cats === 'sunscreen') score += 15;
  if (cats === 'moisturizer' && analysis.dryness > 4) score += 12;
  if (cats === 'serum' && analysis.acne_level > 4) score += 10;
  if (cats === 'cleanser') score += 8;
  const ings = (product.key_ingredients || []).join(' ').toLowerCase();
  if (ings.includes('niacinamide') && analysis.dark_spots > 3) score += 5;
  if (ings.includes('hyaluronic') && analysis.dryness > 3) score += 5;
  if (ings.includes('retinol') && analysis.wrinkles > 3) score += 5;
  if (ings.includes('salicylic') && analysis.acne_level > 4) score += 8;
  if (analysis.sensitivity > 6 && (ings.includes('fragrance') || ings.includes('alcohol'))) score -= 15;
  return Math.min(99, Math.max(45, score));
}

function ScorePill({ score }) {
  const color = score >= 85 ? '#34d399' : score >= 70 ? '#facc15' : '#f43f5e';
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${color}18`, border: `1px solid ${color}44` }}>
      <Star className="w-3 h-3" style={{ color }} />
      <span className="text-[11px] font-black" style={{ color }}>{score}%</span>
    </div>
  );
}

function ProductCard({ product, analysis, onRemove }) {
  const score = getMatchScore(product, analysis);
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-3.5 relative group"
      style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{CAT_EMOJI[product.category] || '📦'}</span>
          <div>
            <p className="font-bold text-sm leading-tight">{product.product_name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{product.category?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <ScorePill score={score} />
          <button onClick={() => onRemove(product.id)} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50">
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-2 text-[10px] text-gray-400">
        <Clock className="w-3 h-3" />
        <span>{FREQ_LABELS[product.category] || 'As directed'}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {(product.key_ingredients || []).slice(0, 4).map((ing, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-100">{ing}</span>
        ))}
      </div>
    </motion.div>
  );
}

function RoutineSection({ title, icon: Icon, order, products, analysis, onRemove, color }) {
  const sorted = [...products].sort((a, b) => {
    const ai = order.indexOf(a.category);
    const bi = order.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-black text-sm">{title}</h3>
        <span className="text-xs text-gray-400">{sorted.length} steps</span>
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-2xl p-6 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200">
          No products yet — add some to build your routine
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sorted.map((p, i) => (
            <div key={p.id} className="relative">
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white z-10"
                style={{ background: color }}>
                {i + 1}
              </div>
              <div className="pl-5">
                <ProductCard product={p} analysis={analysis} onRemove={onRemove} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoutineStack({ savedProducts, latestAnalysis, onRemove, onAdd }) {
  const [generating, setGenerating] = useState(false);
  const [aiStack, setAiStack] = useState(null);

  const morningProducts = savedProducts.filter(p => MORNING_ORDER.includes(p.category));
  const nightProducts = savedProducts.filter(p =>
    p.category === 'retinol' || NIGHT_ORDER.includes(p.category)
  );

  const generateStack = async () => {
    if (!latestAnalysis) return;
    setGenerating(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatologist. The user has: ${latestAnalysis.skin_type} skin, acne ${latestAnalysis.acne_level}/10, oiliness ${latestAnalysis.oiliness}/10, dryness ${latestAnalysis.dryness}/10, sensitivity ${latestAnalysis.sensitivity}/10.
Current shelf: ${savedProducts.map(p => `${p.product_name} (${p.category})`).join(', ') || 'none'}.
Generate a morning and night routine stack using the products on their shelf where possible. Also suggest 1–2 missing key products.
Keep it concise and practical.`,
      response_json_schema: {
        type: 'object',
        properties: {
          morning_order: { type: 'array', items: { type: 'string' } },
          night_order: { type: 'array', items: { type: 'string' } },
          morning_tips: { type: 'string' },
          night_tips: { type: 'string' },
          missing_products: { type: 'array', items: { type: 'string' } },
        }
      }
    });
    setAiStack(res);
    setGenerating(false);
  };

  return (
    <div className="space-y-5">
      {/* AI Stack CTA */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.1))', border: '1px solid rgba(244,114,182,0.2)' }}>
        <div>
          <p className="font-black text-sm">AI Routine Optimizer</p>
          <p className="text-xs text-gray-500 mt-0.5">Get step-by-step ordering advice from your dermatology AI</p>
        </div>
        <Button onClick={generateStack} disabled={generating || !latestAnalysis}
          className="text-white gap-1.5 flex-shrink-0 text-xs"
          style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '✨'}
          {generating ? 'Optimizing…' : 'Optimize'}
        </Button>
      </div>

      {/* AI Stack result */}
      <AnimatePresence>
        {aiStack && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="font-black text-sm">✨ AI Recommended Order</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-amber-600 mb-2">☀️ Morning</p>
                {aiStack.morning_order?.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-[10px] flex-shrink-0">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
                {aiStack.morning_tips && <p className="text-[10px] text-gray-500 mt-2 italic">💡 {aiStack.morning_tips}</p>}
              </div>
              <div>
                <p className="text-xs font-bold text-violet-600 mb-2">🌙 Night</p>
                {aiStack.night_order?.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-[10px] flex-shrink-0">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
                {aiStack.night_tips && <p className="text-[10px] text-gray-500 mt-2 italic">💡 {aiStack.night_tips}</p>}
              </div>
            </div>
            {aiStack.missing_products?.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-1.5">🛒 Missing from your shelf:</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiStack.missing_products.map((p, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Morning Routine */}
      <RoutineSection
        title="Morning Routine"
        icon={Sun}
        order={MORNING_ORDER}
        products={morningProducts}
        analysis={latestAnalysis}
        onRemove={onRemove}
        color="linear-gradient(135deg,#f59e0b,#f97316)"
      />

      {/* Night Routine */}
      <RoutineSection
        title="Night Routine"
        icon={Moon}
        order={NIGHT_ORDER}
        products={nightProducts}
        analysis={latestAnalysis}
        onRemove={onRemove}
        color="linear-gradient(135deg,#7c3aed,#a78bfa)"
      />

      <Button onClick={onAdd} variant="outline" className="w-full gap-2">
        <Plus className="w-4 h-4" /> Add Product to Shelf
      </Button>
    </div>
  );
}