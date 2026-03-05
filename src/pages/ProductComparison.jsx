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

  const searchProduct = async (query, setProduct, setSetter) => {
    if (!query.trim()) return;
    setSetter(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search and provide details for the skincare product: "${query}"
        
Provide accurate, real product information including:
- Exact product name
- Category (cleanser, toner, serum, moisturizer, sunscreen, etc)
- Key active ingredients (up to 5)
- Main benefits
- Typical price range (budget/mid/premium)
- Average rating (0-5 scale)

If the product doesn't exist, provide information about the closest real alternative.`,
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            category: { type: "string" },
            key_ingredients: { type: "array", items: { type: "string" } },
            benefits: { type: "string" },
            price_range: { type: "string", enum: ["budget", "mid", "premium"] },
            rating: { type: "number", minimum: 0, maximum: 5 }
          }
        }
      });
      setProduct(result);
    } catch (err) {
      console.error('Error searching product:', err);
    } finally {
      setSetter(false);
    }
  };

  const runComparison = async () => {
    if (!productA || !productB) return;
    setComparing(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare these two skincare products in detail as a dermatologist:

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

Provide a comprehensive clinical comparison including:
1. Which is better for: oily skin, dry skin, sensitive skin, acne-prone skin, anti-aging
2. Detailed ingredient synergies and conflicts
3. Overall winner and reasoning
4. Best use case for each product
5. Can they be used together?
6. Texture & wear profile comparison
7. Long-term vs immediate results`,
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
          verdict_b_score: { type: "number" },
          texture_profile_a: { type: "string" },
          texture_profile_b: { type: "string" },
          results_timeline: { type: "string" }
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-500" />
          AI Product Comparison
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Search any skincare products and get deep AI-powered insights
        </p>
      </div>

      {/* AI-Powered Search */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <GlassCard>
          <h3 className="font-semibold mb-3 text-pink-500 flex items-center gap-2">
            <Search className="w-4 h-4" /> Product A
          </h3>
          <Input
            placeholder="Search product name (e.g., CeraVe, Retinol...)"
            value={searchA}
            onChange={(e) => setSearchA(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProduct(searchA, setProductA, setLoadingA)}
            className="mb-2"
          />
          <Button
            onClick={() => searchProduct(searchA, setProductA, setLoadingA)}
            disabled={!searchA.trim() || loadingA}
            variant="outline"
            className="w-full text-xs h-9"
          >
            {loadingA ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Searching...</> : 'Search'}
          </Button>
          {productA && (
            <div className="mt-4 p-3 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-900/10 rounded-lg space-y-2 border border-pink-200/50 dark:border-pink-700/30">
              <p className="font-semibold text-sm text-pink-700 dark:text-pink-300">{productA.product_name}</p>
              <div className="flex flex-wrap gap-1">
                {productA.key_ingredients?.map((ing, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{ing}</Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <Badge className={priceColor[productA.price_range]}>
                  {priceLabel[productA.price_range]}
                </Badge>
                <span className="text-yellow-500 font-semibold">{productA.rating} ⭐</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 italic">{productA.benefits}</p>
            </div>
          )}
        </GlassCard>

        <div className="flex items-center justify-center h-10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
            <ArrowLeftRight className="w-6 h-6 text-white" />
          </div>
        </div>

        <GlassCard>
          <h3 className="font-semibold mb-3 text-amber-500 flex items-center gap-2">
            <Search className="w-4 h-4" /> Product B
          </h3>
          <Input
            placeholder="Search product name (e.g., Retinol, Niacinamide...)"
            value={searchB}
            onChange={(e) => setSearchB(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProduct(searchB, setProductB, setLoadingB)}
            className="mb-2"
          />
          <Button
            onClick={() => searchProduct(searchB, setProductB, setLoadingB)}
            disabled={!searchB.trim() || loadingB}
            variant="outline"
            className="w-full text-xs h-9"
          >
            {loadingB ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Searching...</> : 'Search'}
          </Button>
          {productB && (
            <div className="mt-4 p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 rounded-lg space-y-2 border border-amber-200/50 dark:border-amber-700/30">
              <p className="font-semibold text-sm text-amber-700 dark:text-amber-300">{productB.product_name}</p>
              <div className="flex flex-wrap gap-1">
                {productB.key_ingredients?.map((ing, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{ing}</Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <Badge className={priceColor[productB.price_range]}>
                  {priceLabel[productB.price_range]}
                </Badge>
                <span className="text-yellow-500 font-semibold">{productB.rating} ⭐</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 italic">{productB.benefits}</p>
            </div>
          )}
        </GlassCard>
      </div>

      <Button
        onClick={runComparison}
        disabled={!productA || !productB || comparing}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white h-12 text-base font-semibold"
      >
        {comparing ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Deep Analyzing...</>
        ) : (
          <><Sparkles className="w-5 h-5 mr-2" /> Compare with AI Insights</>
        )}
      </Button>

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

            {/* Texture & Results Timeline */}
            {(comparison.texture_profile_a || comparison.texture_profile_b) && (
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Texture & Feel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200/50 dark:border-pink-700/30">
                    <p className="font-semibold text-pink-700 dark:text-pink-300 text-sm mb-2">{productA?.product_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{comparison.texture_profile_a}</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                    <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm mb-2">{productB?.product_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{comparison.texture_profile_b}</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Results Timeline */}
            {comparison.results_timeline && (
              <GlassCard className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <h3 className="font-semibold mb-3 text-purple-700 dark:text-purple-300">⏱️ Results Timeline</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{comparison.results_timeline}</p>
              </GlassCard>
            )}

            {/* Use Cases & Synergy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-900/10 border border-pink-200/50 dark:border-pink-700/30">
                <h3 className="font-semibold mb-3 text-pink-700 dark:text-pink-300">💡 Best Use: {productA?.product_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{comparison.best_use_a}</p>
              </GlassCard>
              <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-700/30">
                <h3 className="font-semibold mb-3 text-amber-700 dark:text-amber-300">💡 Best Use: {productB?.product_name}</h3>
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