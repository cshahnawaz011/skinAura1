import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, GitCompare, X, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function getMatchScore(product, analysis) {
  if (!analysis) return 70;
  let score = 70;
  const ings = (product.key_ingredients || []).join(' ').toLowerCase();
  if (product.category === 'sunscreen') score += 15;
  if (product.category === 'moisturizer' && analysis.dryness > 4) score += 12;
  if (ings.includes('niacinamide') && analysis.dark_spots > 3) score += 6;
  if (ings.includes('hyaluronic') && analysis.dryness > 3) score += 6;
  if (ings.includes('retinol') && analysis.wrinkles > 3) score += 6;
  if (ings.includes('salicylic') && analysis.acne_level > 4) score += 8;
  if (analysis.sensitivity > 6 && ings.includes('fragrance')) score -= 18;
  if (analysis.sensitivity > 6 && ings.includes('alcohol')) score -= 12;
  return Math.min(99, Math.max(45, score));
}

function ProductSelectCard({ selected, products, onSelect, label }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-gray-400 mb-2">{label}</p>
      {selected ? (
        <div className="rounded-2xl p-3 relative" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(167,139,250,0.3)' }}>
          <button onClick={() => onSelect(null)} className="absolute top-2 right-2">
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
          </button>
          <p className="font-bold text-sm pr-5">{selected.product_name}</p>
          <p className="text-[10px] text-gray-400 capitalize mt-0.5">{selected.category?.replace('_', ' ')}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(selected.key_ingredients || []).slice(0, 3).map((ing, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded-full text-[10px] bg-violet-50 text-violet-600">{ing}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          <button onClick={() => setOpen(o => !o)}
            className="w-full rounded-2xl p-4 text-sm text-gray-400 border-2 border-dashed border-gray-200 hover:border-pink-300 transition-colors text-center">
            + Select Product
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute top-full left-0 right-0 z-20 mt-1 rounded-2xl shadow-xl overflow-y-auto max-h-48"
                style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)' }}>
                {products.map(p => (
                  <button key={p.id} onClick={() => { onSelect(p); setOpen(false); }}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <p className="font-semibold">{p.product_name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{p.category}</p>
                  </button>
                ))}
                {products.length === 0 && (
                  <p className="p-3 text-xs text-gray-400 text-center">No products on shelf</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, valA, valB, higher = 'good' }) {
  const aWins = higher === 'good' ? valA > valB : valA < valB;
  const bWins = higher === 'good' ? valB > valA : valB < valA;
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-2 border-b border-gray-50 last:border-0">
      <div className={`text-right text-xs font-bold ${aWins ? 'text-emerald-600' : 'text-gray-500'}`}>{valA}</div>
      <div className="text-center text-[10px] text-gray-400 font-semibold">{label}</div>
      <div className={`text-left text-xs font-bold ${bWins ? 'text-emerald-600' : 'text-gray-500'}`}>{valB}</div>
    </div>
  );
}

export default function ProductCompareTool({ savedProducts, latestAnalysis }) {
  const [productA, setProductA] = useState(null);
  const [productB, setProductB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);

  const scoreA = productA ? getMatchScore(productA, latestAnalysis) : null;
  const scoreB = productB ? getMatchScore(productB, latestAnalysis) : null;
  const winner = scoreA !== null && scoreB !== null ? (scoreA >= scoreB ? 'A' : 'B') : null;

  const runAiComparison = async () => {
    if (!productA || !productB || !latestAnalysis) return;
    setLoading(true);
    const a = latestAnalysis;
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare these two skincare products for this person:

Skin: ${a.skin_type}, Acne ${a.acne_level}/10, Oiliness ${a.oiliness}/10, Dryness ${a.dryness}/10, Sensitivity ${a.sensitivity}/10, Dark spots ${a.dark_spots}/10.

Product A: "${productA.product_name}" (${productA.category}), ingredients: ${(productA.key_ingredients || []).join(', ')}.
Product B: "${productB.product_name}" (${productB.category}), ingredients: ${(productB.key_ingredients || []).join(', ')}.

Compare on: efficacy for their concerns, irritation risk, ingredient quality, value. Pick a winner with reasoning.`,
      response_json_schema: {
        type: 'object',
        properties: {
          winner: { type: 'string' },
          winner_reason: { type: 'string' },
          product_a_summary: { type: 'string' },
          product_b_summary: { type: 'string' },
          product_a_pros: { type: 'array', items: { type: 'string' } },
          product_b_pros: { type: 'array', items: { type: 'string' } },
          product_a_cons: { type: 'array', items: { type: 'string' } },
          product_b_cons: { type: 'array', items: { type: 'string' } },
        }
      }
    });
    setComparison(res);
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Product selectors */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
        <p className="font-black text-sm mb-3 flex items-center gap-2"><GitCompare className="w-4 h-4 text-pink-500" /> Select Two Products to Compare</p>
        <div className="flex gap-3 items-start">
          <ProductSelectCard label="Product A" selected={productA} products={savedProducts.filter(p => p.id !== productB?.id)} onSelect={setProductA} />
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-gray-400 flex-shrink-0 mt-6"
            style={{ background: 'rgba(0,0,0,0.05)' }}>vs</div>
          <ProductSelectCard label="Product B" selected={productB} products={savedProducts.filter(p => p.id !== productA?.id)} onSelect={setProductB} />
        </div>
      </div>

      {/* Score comparison */}
      {productA && productB && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.06),rgba(167,139,250,0.08))', border: '1px solid rgba(167,139,250,0.2)' }}>
          <p className="font-black text-sm text-center mb-4">Match Score for Your Skin</p>
          <div className="flex items-center justify-around gap-4">
            <div className="text-center flex-1">
              <p className="text-xs text-gray-400 mb-1 truncate">{productA.product_name}</p>
              <div className="relative w-16 h-16 mx-auto">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
                  <motion.circle cx="32" cy="32" r="26" fill="none" stroke="#f472b6" strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 26}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - scoreA / 100) }}
                    transition={{ duration: 1 }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-pink-500">{scoreA}%</span>
                </div>
              </div>
              {winner === 'A' && <Badge className="bg-emerald-100 text-emerald-700 mt-1 text-[10px]">🏆 Winner</Badge>}
            </div>

            <div className="text-center flex-1">
              <p className="text-xs text-gray-400 mb-1 truncate">{productB.product_name}</p>
              <div className="relative w-16 h-16 mx-auto">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
                  <motion.circle cx="32" cy="32" r="26" fill="none" stroke="#a78bfa" strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 26}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - scoreB / 100) }}
                    transition={{ duration: 1 }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-violet-500">{scoreB}%</span>
                </div>
              </div>
              {winner === 'B' && <Badge className="bg-emerald-100 text-emerald-700 mt-1 text-[10px]">🏆 Winner</Badge>}
            </div>
          </div>

          <CompareRow label="Match Score" valA={`${scoreA}%`} valB={`${scoreB}%`} />

          <Button onClick={runAiComparison} disabled={loading || !latestAnalysis}
            className="w-full mt-4 text-white gap-2" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Running AI Comparison…</> : <><GitCompare className="w-4 h-4" /> Deep AI Comparison</>}
          </Button>
        </motion.div>
      )}

      {/* AI result */}
      <AnimatePresence>
        {comparison && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-emerald-500" />
                <p className="font-black text-sm">AI Verdict: {comparison.winner}</p>
              </div>
              <p className="text-xs text-gray-600">{comparison.winner_reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: productA?.product_name, summary: comparison.product_a_summary, pros: comparison.product_a_pros, cons: comparison.product_a_cons, color: '#f472b6' },
                { label: productB?.product_name, summary: comparison.product_b_summary, pros: comparison.product_b_pros, cons: comparison.product_b_cons, color: '#a78bfa' },
              ].map((p, i) => (
                <div key={i} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
                  <p className="font-black text-xs mb-2 truncate" style={{ color: p.color }}>{p.label}</p>
                  {p.summary && <p className="text-[10px] text-gray-500 mb-2">{p.summary}</p>}
                  {p.pros?.map((pro, j) => (
                    <p key={j} className="text-[10px] text-emerald-600 flex gap-1 mb-0.5"><span>✓</span>{pro}</p>
                  ))}
                  {p.cons?.map((con, j) => (
                    <p key={j} className="text-[10px] text-red-400 flex gap-1 mb-0.5"><span>✗</span>{con}</p>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {savedProducts.length < 2 && (
        <div className="rounded-2xl p-6 text-center text-sm text-gray-400" style={{ border: '2px dashed #e5e7eb' }}>
          Add at least 2 products to your shelf to use the comparison tool.
        </div>
      )}
    </div>
  );
}