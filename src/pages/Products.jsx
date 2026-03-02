import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Heart, Star, Loader2, Sparkles,
  AlertTriangle, Check, X, ChevronDown
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

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this ingredient list for skincare product safety and effectiveness for ${latestAnalysis?.skin_type || 'normal'} skin:

"${ingredientInput}"

For each ingredient, provide:
1. Name
2. Rating: good (beneficial), neutral (okay), or bad (potentially harmful)
3. What it does
4. Comedogenic rating (0-5) for oily skin
5. Any allergen warnings

Also provide overall product assessment.`,
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
                comedogenic_rating: { type: "number" },
                allergen_warning: { type: "string" }
              }
            }
          },
          overall_assessment: { type: "string" },
          suitability_score: { type: "number" }
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Product Finder</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Discover products perfect for your skin
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredient Scanner</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedProducts.length})</TabsTrigger>
        </TabsList>
      </Tabs>

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

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Badge
                      className={`capitalize ${
                        product.price_range === 'budget' ? 'bg-emerald-100 text-emerald-700' :
                        product.price_range === 'mid' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {product.price_range}
                    </Badge>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Overall Assessment */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Overall Assessment</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-pink-500">
                        {ingredientAnalysis.suitability_score}/10
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {ingredientAnalysis.overall_assessment}
                  </p>
                </GlassCard>

                {/* Ingredient Breakdown */}
                <GlassCard>
                  <h3 className="text-xl font-semibold mb-4">Ingredient Breakdown</h3>
                  <div className="space-y-3">
                    {ingredientAnalysis.ingredients?.map((ing, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl ${
                          ing.rating === 'good' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                          ing.rating === 'bad' ? 'bg-red-50 dark:bg-red-900/20' :
                          'bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{ing.name}</span>
                          <div className="flex items-center gap-2">
                            {ing.rating === 'good' && (
                              <Badge className="bg-emerald-500">
                                <Check className="w-3 h-3 mr-1" /> Good
                              </Badge>
                            )}
                            {ing.rating === 'bad' && (
                              <Badge className="bg-red-500">
                                <X className="w-3 h-3 mr-1" /> Avoid
                              </Badge>
                            )}
                            {ing.rating === 'neutral' && (
                              <Badge variant="secondary">Neutral</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {ing.function}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded">
                            Comedogenic: {ing.comedogenic_rating}/5
                          </span>
                          {ing.allergen_warning && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {ing.allergen_warning}
                            </span>
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