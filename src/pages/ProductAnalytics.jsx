import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, TrendingUp, Star, Droplets, Sparkles,
  ShoppingBag, FlaskConical, ChevronDown, ChevronUp,
  Loader2, Trash2, Clock, Award, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const CATEGORY_ICONS = { cleanser: '🧴', toner: '💧', serum: '✨', moisturizer: '🌸', sunscreen: '☀️', eye_cream: '👁️', face_mask: '🎭', treat: '⚡', pre_cleanse: '🫧', exfoliate: '⚡', protect: '☀️' };
const CATEGORY_COLORS = ['#f472b6','#fbbf24','#a78bfa','#34d399','#60a5fa','#fb923c','#c084fc','#2dd4bf'];

function ProductCard({ product, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass rounded-2xl overflow-hidden border border-white/20 glow-card"
    >
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[product.category] || '🧴'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{product.product_name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">{product.category?.replace('_', ' ')}</Badge>
            {product.price_range && <Badge className={`text-xs ${product.price_range === 'budget' ? 'bg-green-500' : product.price_range === 'mid' ? 'bg-blue-500' : 'bg-purple-500'} text-white border-0`}>{product.price_range}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {product.rating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold">{product.rating}</span>
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/20 pt-3 space-y-3">
              {product.benefits && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Why It Fits</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{product.benefits}</p>
                </div>
              )}
              {product.key_ingredients?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Key Ingredients</p>
                  <div className="flex flex-wrap gap-1">
                    {product.key_ingredients.map((ing, i) => (
                      <span key={i} className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-full">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-400">Added {new Date(product.created_date).toLocaleDateString()}</p>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500 h-7 px-2" onClick={() => onDelete(product.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProductAnalytics() {
  const [user, setUser] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['savedProducts', user?.email],
    queryFn: () => base44.entities.SavedProduct.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: skinAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: async () => {
      const r = await base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1);
      return r[0] || null;
    },
    enabled: !!user?.email,
  });

  const deleteProduct = async (id) => {
    await base44.entities.SavedProduct.delete(id);
    refetch();
  };

  // Analytics data
  const categoryBreakdown = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const catChartData = Object.entries(categoryBreakdown).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  const priceBreakdown = products.reduce((acc, p) => {
    acc[p.price_range || 'unknown'] = (acc[p.price_range || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  const avgRating = products.length ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : 0;

  // Ingredient frequency
  const ingredientFreq = {};
  products.forEach(p => p.key_ingredients?.forEach(ing => { ingredientFreq[ing] = (ingredientFreq[ing] || 0) + 1; }));
  const topIngredients = Object.entries(ingredientFreq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));

  const generateAIInsight = async () => {
    if (!products.length) return;
    setLoadingAI(true);
    const productList = products.map(p => `${p.product_name} (${p.category}, ${p.key_ingredients?.join(', ')})`).join('\n');
    const skinCtx = skinAnalysis ? `Skin: ${skinAnalysis.skin_type}, Score: ${skinAnalysis.overall_score}/100, Acne: ${skinAnalysis.acne_level}/10, Oiliness: ${skinAnalysis.oiliness}/10, Dryness: ${skinAnalysis.dryness}/10` : '';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatologist analyzing a user's skincare product collection.
PRODUCTS IN USE:
${productList}
${skinCtx}

Provide:
1. ingredient_conflicts: Any dangerous combinations in their current routine (e.g. Retinol + AHA, Vitamin C + Niacinamide issues etc.)
2. missing_steps: What essential categories/ingredients are missing for their skin type
3. redundant_products: Products doing the same thing (duplicates/overlap)
4. routine_efficiency_score: Score 0-100 how well-optimized this collection is
5. top_recommendation: The single most impactful change they should make
6. morning_stack: Best 3-4 products from their list for morning
7. night_stack: Best 3-4 products from their list for night`,
      response_json_schema: {
        type: 'object',
        properties: {
          ingredient_conflicts: { type: 'array', items: { type: 'string' } },
          missing_steps: { type: 'array', items: { type: 'string' } },
          redundant_products: { type: 'array', items: { type: 'string' } },
          routine_efficiency_score: { type: 'number' },
          top_recommendation: { type: 'string' },
          morning_stack: { type: 'array', items: { type: 'string' } },
          night_stack: { type: 'array', items: { type: 'string' } },
        }
      }
    });
    setAiInsight(result);
    setLoadingAI(false);
  };

  if (!user) return (
    <div className="max-w-4xl mx-auto">
      <GlassCard className="text-center py-12">
        <ShoppingBag className="w-12 h-12 text-pink-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Product Analytics</h2>
        <p className="text-gray-500 mb-6">Sign in to view your product analytics</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">Sign In</Button>
      </GlassCard>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'products', label: 'My Products', icon: ShoppingBag },
    { id: 'ingredients', label: 'Ingredients', icon: FlaskConical },
    { id: 'ai', label: 'AI Analysis', icon: Sparkles },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Analytics</h1>
        <p className="text-gray-500 mt-1">Deep insights into your skincare collection</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-md shadow-pink-400/30'
                  : 'glass border border-white/20 text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Products', value: products.length, icon: ShoppingBag, color: 'text-pink-500' },
              { label: 'Avg Rating', value: avgRating, icon: Star, color: 'text-amber-500' },
              { label: 'Categories', value: Object.keys(categoryBreakdown).length, icon: FlaskConical, color: 'text-violet-500' },
              { label: 'Top Ingredient', value: topIngredients[0]?.name || '–', icon: Zap, color: 'text-emerald-500', small: true },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <GlassCard key={i} animate delay={i * 0.05} className="!p-4 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className={`text-2xl font-black ${stat.small ? 'text-sm' : ''} ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </GlassCard>
              );
            })}
          </div>

          {/* Category breakdown chart */}
          {catChartData.length > 0 && (
            <GlassCard>
              <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-pink-500" /> Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {catChartData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Price Range pie */}
          {Object.keys(priceBreakdown).length > 0 && (
            <GlassCard>
              <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Price Range Mix</h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={Object.entries(priceBreakdown).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {Object.keys(priceBreakdown).map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {Object.entries(priceBreakdown).map(([range, count], i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[i] }} />
                      <span className="text-sm capitalize">{range}: <strong>{count}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          {products.length === 0 && (
            <GlassCard className="text-center py-10">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No products saved yet. Go to your Routine and pick products for each step!</p>
            </GlassCard>
          )}
        </div>
      )}

      {/* My Products */}
      {activeTab === 'products' && (
        <div className="space-y-3">
          {isLoading ? (
            [1,2,3].map(i => <div key={i} className="h-16 glass rounded-2xl animate-pulse" />)
          ) : products.length === 0 ? (
            <GlassCard className="text-center py-10">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No products saved yet.</p>
            </GlassCard>
          ) : products.map(p => (
            <ProductCard key={p.id} product={p} onDelete={deleteProduct} />
          ))}
        </div>
      )}

      {/* Ingredients */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          {topIngredients.length > 0 ? (
            <GlassCard>
              <h3 className="font-bold mb-4 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-violet-500" /> Your Most-Used Ingredients</h3>
              <div className="space-y-3">
                {topIngredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white" style={{ background: CATEGORY_COLORS[i] }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{ing.name}</span>
                        <span className="text-xs text-gray-400">{ing.count} product{ing.count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(ing.count / products.length) * 100}%` }}
                          className="h-full rounded-full"
                          style={{ background: CATEGORY_COLORS[i] }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="text-center py-10">
              <FlaskConical className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No ingredient data yet.</p>
            </GlassCard>
          )}
        </div>
      )}

      {/* AI Analysis */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-500" /> AI Routine Analysis</h3>
                <p className="text-xs text-gray-500 mt-0.5">Detect conflicts, gaps & optimize your stack</p>
              </div>
              <Button
                onClick={generateAIInsight}
                disabled={loadingAI || products.length === 0}
                className="bg-gradient-to-r from-violet-500 to-pink-500"
                size="sm"
              >
                {loadingAI ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Analyzing...</> : <><Sparkles className="w-4 h-4 mr-1" /> Analyze</>}
              </Button>
            </div>
          </GlassCard>

          {loadingAI && (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 glass rounded-2xl animate-pulse" />)}
            </div>
          )}

          {aiInsight && !loadingAI && (
            <div className="space-y-4">
              {/* Efficiency Score */}
              <GlassCard className="text-center">
                <p className="text-xs text-gray-500 mb-1">Routine Efficiency Score</p>
                <p className={`text-5xl font-black ${aiInsight.routine_efficiency_score >= 70 ? 'text-emerald-500' : aiInsight.routine_efficiency_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {aiInsight.routine_efficiency_score}
                </p>
                <p className="text-xs text-gray-400">out of 100</p>
                {aiInsight.top_recommendation && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-xl">
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-300 mb-1">⚡ Top Recommendation</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{aiInsight.top_recommendation}</p>
                  </div>
                )}
              </GlassCard>

              {/* Conflicts */}
              {aiInsight.ingredient_conflicts?.length > 0 && (
                <GlassCard>
                  <h4 className="font-bold text-red-500 mb-3 flex items-center gap-2">⚠️ Ingredient Conflicts</h4>
                  <ul className="space-y-2">
                    {aiInsight.ingredient_conflicts.map((c, i) => (
                      <li key={i} className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">• {c}</li>
                    ))}
                  </ul>
                </GlassCard>
              )}

              {/* Missing */}
              {aiInsight.missing_steps?.length > 0 && (
                <GlassCard>
                  <h4 className="font-bold text-amber-500 mb-3">🔍 Missing From Your Routine</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiInsight.missing_steps.map((m, i) => (
                      <Badge key={i} className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">{m}</Badge>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Morning/Night Stack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiInsight.morning_stack?.length > 0 && (
                  <GlassCard>
                    <h4 className="font-bold text-amber-500 mb-3">☀️ Optimal Morning Stack</h4>
                    <ol className="space-y-1">
                      {aiInsight.morning_stack.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </GlassCard>
                )}
                {aiInsight.night_stack?.length > 0 && (
                  <GlassCard>
                    <h4 className="font-bold text-indigo-500 mb-3">🌙 Optimal Night Stack</h4>
                    <ol className="space-y-1">
                      {aiInsight.night_stack.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </GlassCard>
                )}
              </div>
            </div>
          )}

          {!aiInsight && !loadingAI && products.length === 0 && (
            <GlassCard className="text-center py-8">
              <Sparkles className="w-10 h-10 mx-auto text-violet-300 mb-3" />
              <p className="text-sm text-gray-400">Add products from your Routine steps first, then run AI Analysis.</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}