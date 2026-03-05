import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare, Check, X, Loader2, Sparkles, ArrowLeftRight, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';

const priceMap = { budget: 1, mid: 2, premium: 3 };
const priceLabel = { budget: '$', mid: '$$', premium: '$$$' };
const priceColor = { budget: 'bg-emerald-100 text-emerald-700', mid: 'bg-blue-100 text-blue-700', premium: 'bg-purple-100 text-purple-700' };

function CompareRow({ label, a, b, type = 'text', winner }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className={`text-sm p-2 rounded-lg ${winner === 'a' ? 'bg-emerald-50 dark:bg-emerald-900/20 font-semibold' : ''}`}>{a}</div>
      <div className="text-xs text-gray-400 font-medium text-center self-center min-w-[60px]">{label}</div>
      <div className={`text-sm p-2 rounded-lg text-right ${winner === 'b' ? 'bg-emerald-50 dark:bg-emerald-900/20 font-semibold' : ''}`}>{b}</div>
    </div>
  );
}

export default function ProductComparison() {
  const [user, setUser] = useState(null);
  const [productA, setProductA] = useState(null);
  const [productB, setProductB] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const runComparison = async () => {
    if (!productA || !productB) return;
    setComparing(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare these two skincare products as a dermatologist:

PRODUCT A: ${productA.product_name}
- Category: ${productA.category}
- Key Ingredients: ${productA.key_ingredients?.join(', ')}
- Benefits: ${productA.benefits}
- Price Range: ${productA.price_range}
- Rating: ${productA.rating}

PRODUCT B: ${productB.product_name}  
- Category: ${productB.category}
- Key Ingredients: ${productB.key_ingredients?.join(', ')}
- Benefits: ${productB.benefits}
- Price Range: ${productB.price_range}
- Rating: ${productB.rating}

Provide a clinical comparison including:
1. Which is better for: oily skin, dry skin, sensitive skin, acne-prone skin, anti-aging
2. Ingredient synergies and conflicts between both
3. Overall winner and why
4. Best use case for each
5. Can they be used together?`,
      response_json_schema: {
        type: "object",
        properties: {
          oily_skin_winner: { type: "string", enum: ["A", "B", "Tie"] },
          dry_skin_winner: { type: "string", enum: ["A", "B", "Tie"] },
          sensitive_skin_winner: { type: "string", enum: ["A", "B", "Tie"] },
          acne_prone_winner: { type: "string", enum: ["A", "B", "Tie"] },
          anti_aging_winner: { type: "string", enum: ["A", "B", "Tie"] },
          value_winner: { type: "string", enum: ["A", "B", "Tie"] },
          overall_winner: { type: "string", enum: ["A", "B", "Tie"] },
          overall_reasoning: { type: "string" },
          best_use_a: { type: "string" },
          best_use_b: { type: "string" },
          can_combine: { type: "boolean" },
          combine_tip: { type: "string" },
          ingredient_synergy: { type: "string" },
          ingredient_conflict: { type: "string" },
          verdict_a_score: { type: "number" },
          verdict_b_score: { type: "number" }
        }
      }
    });

    setComparison(result);
    setComparing(false);
  };

  const WinnerBadge = ({ winner, side }) => {
    if (winner === 'Tie') return <Badge variant="secondary" className="text-xs">Tie</Badge>;
    if (winner === side) return <Badge className="bg-emerald-500 text-xs">✓ Winner</Badge>;
    return <Badge variant="outline" className="text-xs text-gray-400">Runner-up</Badge>;
  };

  const skinTypes = [
    { key: 'oily_skin_winner', label: '💧 Oily Skin' },
    { key: 'dry_skin_winner', label: '🌵 Dry Skin' },
    { key: 'sensitive_skin_winner', label: '🌸 Sensitive Skin' },
    { key: 'acne_prone_winner', label: '🔬 Acne-Prone' },
    { key: 'anti_aging_winner', label: '⏳ Anti-Aging' },
    { key: 'value_winner', label: '💰 Best Value' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-pink-500" />
          Product Comparison
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Side-by-side breakdown to make the best purchase decision
        </p>
      </div>

      {/* Product Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <GlassCard>
          <h3 className="font-semibold mb-3 text-pink-500">Product A</h3>
          <Select onValueChange={(val) => setProductA(displayProducts.find(p => p.id === val))}>
            <SelectTrigger>
              <SelectValue placeholder="Select first product..." />
            </SelectTrigger>
            <SelectContent>
              {displayProducts.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.product_name} — {p.category?.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {productA && (
            <div className="mt-3 space-y-1">
              <p className="font-medium text-sm">{productA.product_name}</p>
              <div className="flex flex-wrap gap-1">
                {productA.key_ingredients?.slice(0, 3).map((ing, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{ing}</Badge>
                ))}
              </div>
              <Badge className={`text-xs mt-1 ${priceColor[productA.price_range]}`}>
                {priceLabel[productA.price_range]} {productA.price_range}
              </Badge>
            </div>
          )}
        </GlassCard>

        <div className="flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-white" />
          </div>
        </div>

        <GlassCard>
          <h3 className="font-semibold mb-3 text-amber-500">Product B</h3>
          <Select onValueChange={(val) => setProductB(displayProducts.find(p => p.id === val))}>
            <SelectTrigger>
              <SelectValue placeholder="Select second product..." />
            </SelectTrigger>
            <SelectContent>
              {displayProducts.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.product_name} — {p.category?.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {productB && (
            <div className="mt-3 space-y-1">
              <p className="font-medium text-sm">{productB.product_name}</p>
              <div className="flex flex-wrap gap-1">
                {productB.key_ingredients?.slice(0, 3).map((ing, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{ing}</Badge>
                ))}
              </div>
              <Badge className={`text-xs mt-1 ${priceColor[productB.price_range]}`}>
                {priceLabel[productB.price_range]} {productB.price_range}
              </Badge>
            </div>
          )}
        </GlassCard>
      </div>

      <Button
        onClick={runComparison}
        disabled={!productA || !productB || comparing}
        className="w-full bg-gradient-to-r from-pink-500 to-amber-500 text-white h-12 text-base"
      >
        {comparing ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Comparing Products...</>
        ) : (
          <><GitCompare className="w-5 h-5 mr-2" /> Compare Products</>
        )}
      </Button>

      {/* Side-by-Side Comparison */}
      <AnimatePresence>
        {productA && productB && !comparing && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <GlassCard>
              <h3 className="text-lg font-semibold mb-4">Side-by-Side Breakdown</h3>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-2">
                <p className="font-semibold text-pink-500 text-sm">{productA.product_name}</p>
                <div />
                <p className="font-semibold text-amber-500 text-sm text-right">{productB.product_name}</p>
              </div>
              <CompareRow
                label="Category"
                a={productA.category?.replace('_', ' ')}
                b={productB.category?.replace('_', ' ')}
              />
              <CompareRow
                label="Price"
                a={`${priceLabel[productA.price_range]} ${productA.price_range}`}
                b={`${priceLabel[productB.price_range]} ${productB.price_range}`}
                winner={priceMap[productA.price_range] <= priceMap[productB.price_range] ? 'a' : 'b'}
              />
              <CompareRow
                label="Rating"
                a={`${productA.rating || 'N/A'} ⭐`}
                b={`${productB.rating || 'N/A'} ⭐`}
                winner={(productA.rating || 0) >= (productB.rating || 0) ? 'a' : 'b'}
              />
              <div className="py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 font-medium text-center mb-2">Key Ingredients</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-wrap gap-1">
                    {productA.key_ingredients?.map((ing, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{ing}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {productB.key_ingredients?.map((ing, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{ing}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <CompareRow label="Benefits" a={productA.benefits} b={productB.benefits} />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Analysis Results */}
      <AnimatePresence>
        {comparison && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Overall Winner */}
            <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 border-2 border-amber-200 dark:border-amber-700">
              <div className="text-center">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">🏆 Overall Winner</p>
                <h2 className="text-2xl font-bold mb-1">
                  {comparison.overall_winner === 'A' ? productA?.product_name :
                   comparison.overall_winner === 'B' ? productB?.product_name : 'It\'s a Tie!'}
                </h2>
                <div className="flex justify-center gap-6 my-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-pink-500">{comparison.verdict_a_score}<span className="text-sm text-gray-400">/10</span></p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[100px]">{productA?.product_name}</p>
                  </div>
                  <div className="text-3xl font-bold text-gray-300 self-center">vs</div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-500">{comparison.verdict_b_score}<span className="text-sm text-gray-400">/10</span></p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[100px]">{productB?.product_name}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto">{comparison.overall_reasoning}</p>
              </div>
            </GlassCard>

            {/* Skin Type Winners */}
            <GlassCard>
              <h3 className="text-lg font-semibold mb-4">Best For Your Skin Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skinTypes.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      <WinnerBadge winner={comparison[key]} side="A" />
                      <span className="text-xs text-gray-400">{comparison[key] === 'Tie' ? '' : comparison[key] === 'A' ? productA?.product_name?.split(' ')[0] : productB?.product_name?.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Use Cases & Synergy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard>
                <h3 className="font-semibold mb-3 text-pink-500">Best Use: {productA?.product_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{comparison.best_use_a}</p>
              </GlassCard>
              <GlassCard>
                <h3 className="font-semibold mb-3 text-amber-500">Best Use: {productB?.product_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{comparison.best_use_b}</p>
              </GlassCard>
            </div>

            {/* Can Combine? */}
            <GlassCard>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${comparison.can_combine ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {comparison.can_combine ? <Check className="w-6 h-6 text-emerald-600" /> : <X className="w-6 h-6 text-red-600" />}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{comparison.can_combine ? '✅ These can be used together!' : '⚠️ Not recommended to combine'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{comparison.combine_tip}</p>
                  {comparison.ingredient_synergy && (
                    <p className="text-xs text-emerald-600 mt-2">🔗 Synergy: {comparison.ingredient_synergy}</p>
                  )}
                  {comparison.ingredient_conflict && (
                    <p className="text-xs text-red-500 mt-1">⚡ Conflict: {comparison.ingredient_conflict}</p>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}