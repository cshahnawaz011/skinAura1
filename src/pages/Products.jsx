import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, Star, Loader2, Sparkles,
  AlertTriangle, Check, X, Plus, Package, FlaskConical, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GlassCard from '@/components/ui/GlassCard';
import AddProductModal from '@/components/products/AddProductModal';
import ShelfInsights from '@/components/products/ShelfInsights';

const categories = [
  { value: 'cleanser', label: 'Cleanser', icon: '🧴' },
  { value: 'toner', label: 'Toner', icon: '💧' },
  { value: 'serum', label: 'Serum', icon: '✨' },
  { value: 'moisturizer', label: 'Moisturizer', icon: '🧈' },
  { value: 'sunscreen', label: 'Sunscreen', icon: '☀️' },
  { value: 'eye_cream', label: 'Eye Cream', icon: '👁️' },
  { value: 'face_mask', label: 'Face Mask', icon: '🎭' },
];

export default function Products() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientAnalysis, setIngredientAnalysis] = useState(null);
  const [analyzingIngredients, setAnalyzingIngredients] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [analyzingProduct, setAnalyzingProduct] = useState(null);
  const [productAnalysisResults, setProductAnalysisResults] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: savedProducts = [] } = useQuery({
    queryKey: ['savedProducts', user?.email],
    queryFn: () => base44.entities.SavedProduct.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: async () => {
      const analyses = await base44.entities.SkinAnalysis.filter(
        { user_email: user.email },
        '-created_date',
        1
      );
      return analyses[0] || null;
    },
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (product) => base44.entities.SavedProduct.create({
      user_email: user.email,
      ...product,
    }),
    onSuccess: () => queryClient.invalidateQueries(['savedProducts']),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedProduct.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['savedProducts']),
  });

  const generateRecommendations = async () => {
    if (!latestAnalysis) return;
    
    setGenerating(true);

    const concerns = [];
    if (latestAnalysis.acne_level > 4) concerns.push('acne-prone');
    if (latestAnalysis.dark_spots > 4) concerns.push('hyperpigmentation');
    if (latestAnalysis.wrinkles > 4) concerns.push('anti-aging');
    if (latestAnalysis.oiliness > 4) concerns.push('excess oil');
    if (latestAnalysis.dryness > 4) concerns.push('dehydration');
    if (latestAnalysis.sensitivity > 4) concerns.push('sensitivity');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Recommend skincare products for someone with:
- Skin type: ${latestAnalysis.skin_type}
- Main concerns: ${concerns.join(', ') || 'general maintenance'}

For each of these categories, recommend 2 products (1 budget, 1 premium):
1. Cleanser
2. Toner
3. Serum
4. Moisturizer
5. Sunscreen

For each product include:
- Product name (realistic product name)
- Key ingredients (3-5)
- Benefits specific to their skin
- Price range (budget/mid/premium)
- Rating (4.0-5.0)`,
      response_json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                category: { type: "string" },
                key_ingredients: { type: "array", items: { type: "string" } },
                benefits: { type: "string" },
                price_range: { type: "string" },
                rating: { type: "number" }
              }
            }
          }
        }
      }
    });

    setRecommendations(result.products || []);
    setGenerating(false);
  };

  const analyzeIngredients = async () => {
    if (!ingredientInput.trim()) return;
    setAnalyzingIngredients(true);

    const skinProfile = latestAnalysis
      ? `${latestAnalysis.skin_type} skin, acne ${latestAnalysis.acne_level}/10, oiliness ${latestAnalysis.oiliness}/10, dryness ${latestAnalysis.dryness}/10, sensitivity ${latestAnalysis.sensitivity}/10, redness ${latestAnalysis.redness}/10`
      : 'unknown skin type';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cosmetic chemist performing a deep clinical ingredient analysis.

PATIENT SKIN PROFILE: ${skinProfile}

INGREDIENT LIST TO ANALYZE:
"${ingredientInput}"

For EACH ingredient provide a thorough analysis:
1. name: Standardized INCI name
2. rating: "good" | "neutral" | "bad" | "avoid" (for their specific skin type)
3. function: What this ingredient does in a formulation (specific mechanism)
4. skin_benefit: How this ingredient benefits or harms THIS patient's specific skin profile
5. comedogenic_rating: 0-5 (0=non-comedogenic, 5=highly comedogenic)
6. concentration_concern: true/false — is it likely at a concerning concentration in this product?
7. allergen_warning: Any known allergen or sensitizer risks (null if none)
8. interactions: Any notable interactions with other ingredients in this list (null if none)
9. evidence_level: "strong" | "moderate" | "weak" — scientific evidence for claims

Overall product analysis:
- overall_assessment: Detailed paragraph on product suitability
- suitability_score: 1-10 for this specific skin type
- top_concern: The single biggest concern with this formula
- top_benefit: The single biggest benefit
- avoid_if: When this product should be avoided
- pair_with: What to use alongside this product
- fragrance_free: true/false
- alcohol_free: true/false
- reef_safe: true/false if any UV filters present`,
      response_json_schema: {
        type: "object",
        properties: {
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                rating: { type: "string" },
                function: { type: "string" },
                skin_benefit: { type: "string" },
                comedogenic_rating: { type: "number" },
                concentration_concern: { type: "boolean" },
                allergen_warning: { type: "string" },
                interactions: { type: "string" },
                evidence_level: { type: "string" }
              }
            }
          },
          overall_assessment: { type: "string" },
          suitability_score: { type: "number" },
          top_concern: { type: "string" },
          top_benefit: { type: "string" },
          avoid_if: { type: "string" },
          pair_with: { type: "string" },
          fragrance_free: { type: "boolean" },
          alcohol_free: { type: "boolean" }
        }
      }
    });

    setIngredientAnalysis(result);
    setAnalyzingIngredients(false);
  };

  const isProductSaved = (productName) => {
    return savedProducts.some(p => p.product_name === productName);
  };

  const filteredRecommendations = recommendations.filter(product => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
    if (priceFilter !== 'all' && product.price_range !== priceFilter) return false;
    if (searchQuery && !product.product_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAddProduct = (product) => {
    saveMutation.mutate(product);
  };

  const analyzeProductForSkin = async (product) => {
    if (!latestAnalysis) return;
    setAnalyzingProduct(product.product_name);
    const a = latestAnalysis;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze if the product "${product.product_name}" (category: ${product.category}, ingredients: ${(product.key_ingredients || []).join(', ')}) is suitable for this patient.

Patient: ${a.skin_type} skin, Acne: ${a.acne_level}/10, Oiliness: ${a.oiliness}/10, Dryness: ${a.dryness}/10, Sensitivity: ${a.sensitivity}/10, Dark spots: ${a.dark_spots}/10.

Provide:
- suitability_score: 1–10
- verdict: "excellent" | "good" | "caution" | "avoid"
- summary: 2-sentence analysis for this specific skin
- key_benefit: biggest benefit for this skin
- key_concern: biggest concern if any (or null)`,
      response_json_schema: {
        type: 'object',
        properties: {
          suitability_score: { type: 'number' },
          verdict: { type: 'string' },
          summary: { type: 'string' },
          key_benefit: { type: 'string' },
          key_concern: { type: 'string' },
        }
      }
    });
    setProductAnalysisResults(prev => ({ ...prev, [product.product_name]: result }));
    setAnalyzingProduct(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AddProductModal open={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAddProduct} />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Product Finder</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Discover products perfect for your skin
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="recommendations" className="text-xs sm:text-sm">AI Recs</TabsTrigger>
          <TabsTrigger value="shelf" className="text-xs sm:text-sm">My Shelf ({savedProducts.length})</TabsTrigger>
          <TabsTrigger value="ingredients" className="text-xs sm:text-sm">Ingredients</TabsTrigger>
          <TabsTrigger value="saved" className="text-xs sm:text-sm">Saved ({savedProducts.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* My Shelf Tab */}
      {activeTab === 'shelf' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">My Skincare Shelf</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track the products you currently use</p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-pink-500 to-amber-500"
            >
              <Plus className="w-4 h-4 mr-2" />Add Product
            </Button>
          </div>

          <ShelfInsights savedProducts={savedProducts} latestAnalysis={latestAnalysis} />

          {savedProducts.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">Your shelf is empty</h3>
              <p className="text-sm text-gray-500 mb-4">Add the products you currently use to get AI insights</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-pink-500 to-amber-500">
                <Plus className="w-4 h-4 mr-2" />Add First Product
              </Button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="h-full">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="capitalize">{product.category?.replace('_', ' ')}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(product.id)}>
                        <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-base mb-2">{product.product_name}</h3>
                    {product.benefits && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.benefits}</p>}
                    <div className="flex flex-wrap gap-1">
                      {product.key_ingredients?.map((ing, j) => (
                        <Badge key={j} variant="outline" className="text-xs">{ing}</Badge>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs capitalize ${
                          product.price_range === 'budget' ? 'bg-emerald-100 text-emerald-700' :
                          product.price_range === 'mid' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>{product.price_range || 'mid'}</Badge>
                        {latestAnalysis && (
                          <Button size="sm" variant="outline"
                            onClick={() => analyzeProductForSkin(product)}
                            disabled={analyzingProduct === product.product_name}
                            className="text-xs h-7 gap-1">
                            {analyzingProduct === product.product_name
                              ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                              : <><FlaskConical className="w-3 h-3" /> Analyze</>}
                          </Button>
                        )}
                      </div>
                      {productAnalysisResults[product.product_name] && (() => {
                        const r = productAnalysisResults[product.product_name];
                        const col = { excellent: 'bg-emerald-50 text-emerald-700 border-emerald-200', good: 'bg-blue-50 text-blue-700 border-blue-200', caution: 'bg-amber-50 text-amber-700 border-amber-200', avoid: 'bg-red-50 text-red-700 border-red-200' };
                        return (
                          <div className={`p-2.5 rounded-xl border text-xs ${col[r.verdict] || 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex justify-between mb-1">
                              <span className="font-bold capitalize">{r.verdict}</span>
                              <span className="font-black">{r.suitability_score}/10</span>
                            </div>
                            <p>{r.summary}</p>
                            {r.key_benefit && <p className="mt-1 font-medium">✅ {r.key_benefit}</p>}
                            {r.key_concern && <p className="mt-0.5 font-medium">⚠️ {r.key_concern}</p>}
                          </div>
                        );
                      })()}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Generate Button */}
          {recommendations.length === 0 && (
            <GlassCard className="text-center py-12">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Get Personalized Recommendations</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {latestAnalysis
                  ? `Based on your ${latestAnalysis.skin_type} skin type, we'll find products perfect for you`
                  : 'Complete a skin analysis first to get personalized recommendations'}
              </p>
              <Button
                onClick={generateRecommendations}
                disabled={generating || !latestAnalysis}
                className="bg-gradient-to-r from-pink-500 to-amber-500"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finding Products...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Recommendations
                  </>
                )}
              </Button>
            </GlassCard>
          )}

          {/* Filters */}
          {recommendations.length > 0 && (
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="mid">Mid-Range</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={generateRecommendations}
                disabled={generating}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecommendations.map((product, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="capitalize">{product.category?.replace('_', ' ')}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (isProductSaved(product.product_name)) {
                          const saved = savedProducts.find(p => p.product_name === product.product_name);
                          if (saved) removeMutation.mutate(saved.id);
                        } else {
                          saveMutation.mutate(product);
                        }
                      }}
                      disabled={!user}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isProductSaved(product.product_name)
                            ? 'fill-pink-500 text-pink-500'
                            : 'text-gray-400'
                        }`}
                      />
                    </Button>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{product.product_name}</h3>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`w-4 h-4 ${
                            j < Math.floor(product.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{product.rating}</span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {product.benefits}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.key_ingredients?.slice(0, 3).map((ing, j) => (
                      <Badge key={j} variant="outline" className="text-xs">
                        {ing}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={`capitalize ${
                        product.price_range === 'budget' ? 'bg-emerald-100 text-emerald-700' :
                        product.price_range === 'mid' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>{product.price_range}</Badge>
                      {latestAnalysis && (
                        <Button size="sm" variant="outline"
                          onClick={() => analyzeProductForSkin(product)}
                          disabled={analyzingProduct === product.product_name}
                          className="text-xs h-7 gap-1">
                          {analyzingProduct === product.product_name
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Checking...</>
                            : <><FlaskConical className="w-3 h-3" /> Analyze for My Skin</>}
                        </Button>
                      )}
                    </div>
                    {productAnalysisResults[product.product_name] && (() => {
                      const r = productAnalysisResults[product.product_name];
                      const col = { excellent: 'bg-emerald-50 text-emerald-700 border-emerald-200', good: 'bg-blue-50 text-blue-700 border-blue-200', caution: 'bg-amber-50 text-amber-700 border-amber-200', avoid: 'bg-red-50 text-red-700 border-red-200' };
                      return (
                        <div className={`p-2.5 rounded-xl border text-xs ${col[r.verdict] || 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex justify-between mb-1">
                            <span className="font-bold capitalize">{r.verdict}</span>
                            <span className="font-black">{r.suitability_score}/10</span>
                          </div>
                          <p>{r.summary}</p>
                        </div>
                      );
                    })()}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredient Scanner Tab */}
      {activeTab === 'ingredients' && (
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-xl font-semibold mb-4">Ingredient Scanner</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Paste the ingredient list from any product to analyze if it's good for your skin
            </p>
            <Textarea
              placeholder="Paste ingredient list here (e.g., Water, Glycerin, Niacinamide, Hyaluronic Acid...)"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              rows={4}
              className="mb-4"
            />
            <Button
              onClick={analyzeIngredients}
              disabled={analyzingIngredients || !ingredientInput.trim()}
              className="bg-gradient-to-r from-pink-500 to-amber-500"
            >
              {analyzingIngredients ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze Ingredients
                </>
              )}
            </Button>
          </GlassCard>

          {/* Analysis Results */}
          <AnimatePresence>
            {ingredientAnalysis && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                {/* Overall Assessment */}
                <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold">Overall Assessment</h3>
                    <div className="text-center">
                      <span className={`text-3xl font-bold ${
                        ingredientAnalysis.suitability_score >= 7 ? 'text-emerald-500' :
                        ingredientAnalysis.suitability_score >= 5 ? 'text-amber-500' : 'text-red-500'
                      }`}>{ingredientAnalysis.suitability_score}</span>
                      <span className="text-gray-400 text-sm">/10</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{ingredientAnalysis.overall_assessment}</p>

                  {/* Meta badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ingredientAnalysis.fragrance_free && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">✓ Fragrance-Free</Badge>
                    )}
                    {ingredientAnalysis.alcohol_free && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">✓ Alcohol-Free</Badge>
                    )}
                    {!ingredientAnalysis.fragrance_free && (
                      <Badge className="bg-amber-100 text-amber-700 border-0">⚠ Contains Fragrance</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ingredientAnalysis.top_benefit && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <p className="text-xs font-bold text-emerald-600 mb-1">✨ Top Benefit</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{ingredientAnalysis.top_benefit}</p>
                      </div>
                    )}
                    {ingredientAnalysis.top_concern && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-xs font-bold text-red-600 mb-1">⚠ Top Concern</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{ingredientAnalysis.top_concern}</p>
                      </div>
                    )}
                    {ingredientAnalysis.avoid_if && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <p className="text-xs font-bold text-gray-600 mb-1">🚫 Avoid If</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{ingredientAnalysis.avoid_if}</p>
                      </div>
                    )}
                    {ingredientAnalysis.pair_with && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-xs font-bold text-blue-600 mb-1">🔗 Pair With</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{ingredientAnalysis.pair_with}</p>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Ingredient Breakdown */}
                <GlassCard>
                  <h3 className="text-xl font-semibold mb-4">Ingredient Deep Dive ({ingredientAnalysis.ingredients?.length} ingredients)</h3>
                  <div className="space-y-3">
                    {ingredientAnalysis.ingredients?.map((ing, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${
                        ing.rating === 'good' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
                        ing.rating === 'bad' || ing.rating === 'avoid' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                        'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div>
                            <span className="font-semibold">{ing.name}</span>
                            {ing.evidence_level && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                ing.evidence_level === 'strong' ? 'bg-emerald-100 text-emerald-700' :
                                ing.evidence_level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>{ing.evidence_level} evidence</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {(ing.rating === 'good') && <Badge className="bg-emerald-500 text-xs"><Check className="w-3 h-3 mr-1" />Good</Badge>}
                            {(ing.rating === 'bad' || ing.rating === 'avoid') && <Badge className="bg-red-500 text-xs"><X className="w-3 h-3 mr-1" />Avoid</Badge>}
                            {ing.rating === 'neutral' && <Badge variant="secondary" className="text-xs">Neutral</Badge>}
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-2">{ing.function}</p>

                        {ing.skin_benefit && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{ing.skin_benefit}</p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className={`px-2 py-1 rounded font-medium ${
                            ing.comedogenic_rating <= 1 ? 'bg-emerald-100 text-emerald-700' :
                            ing.comedogenic_rating <= 2 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Pore-clogging: {ing.comedogenic_rating}/5
                          </span>
                          {ing.concentration_concern && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">⚠ Concentration concern</span>
                          )}
                          {ing.allergen_warning && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />{ing.allergen_warning}
                            </span>
                          )}
                          {ing.interactions && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">🔗 {ing.interactions}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Saved Products Tab */}
      {activeTab === 'saved' && (
        <div>
          {savedProducts.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Saved Products</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Save products from recommendations to see them here
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard className="h-full">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="capitalize">{product.category?.replace('_', ' ')}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMutation.mutate(product.id)}
                      >
                        <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
                      </Button>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{product.product_name}</h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            className={`w-4 h-4 ${
                              j < Math.floor(product.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {product.benefits}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {product.key_ingredients?.slice(0, 3).map((ing, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {ing}
                        </Badge>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}