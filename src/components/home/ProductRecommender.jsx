import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ShoppingBag, Star, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const COMPANIES = [
  { name: 'The Ordinary', country: '🇬🇧', priceRange: 'Budget', tag: 'Science-backed' },
  { name: 'CeraVe', country: '🇺🇸', priceRange: 'Budget', tag: 'Dermatologist-recommended' },
  { name: 'Minimalist', country: '🇮🇳', priceRange: 'Budget', tag: 'High actives' },
  { name: 'Dot & Key', country: '🇮🇳', priceRange: 'Mid', tag: 'Indian skin-focused' },
  { name: 'Plum', country: '🇮🇳', priceRange: 'Budget', tag: 'Vegan & natural' },
  { name: 'Neutrogena', country: '🇺🇸', priceRange: 'Mid', tag: 'Clinically tested' },
  { name: "Paula's Choice", country: '🇺🇸', priceRange: 'Premium', tag: 'Science-proven' },
  { name: 'Innisfree', country: '🇰🇷', priceRange: 'Mid', tag: 'K-beauty natural' },
  { name: 'Cosrx', country: '🇰🇷', priceRange: 'Mid', tag: 'K-beauty actives' },
  { name: 'Kiehl\'s', country: '🇺🇸', priceRange: 'Premium', tag: 'Heritage brand' },
  { name: 'La Roche-Posay', country: '🇫🇷', priceRange: 'Mid-Premium', tag: 'Sensitive skin' },
  { name: 'Mamaearth', country: '🇮🇳', priceRange: 'Budget', tag: 'Toxin-free' },
];

const COOLDOWN_KEY = 'product_recommender';

const PRICE_COLORS = {
  'Budget': 'bg-green-100 text-green-700',
  'Mid': 'bg-blue-100 text-blue-700',
  'Premium': 'bg-purple-100 text-purple-700',
  'Mid-Premium': 'bg-indigo-100 text-indigo-700',
};

export default function ProductRecommender({ skinAnalysis }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(getCooldownSeconds(COOLDOWN_KEY));
  const [expanded, setExpanded] = useState({});

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        const secs = getCooldownSeconds(COOLDOWN_KEY);
        setCooldown(secs);
        if (secs <= 0) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const formatCooldown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleGenerate = async () => {
    const { allowed } = checkAICooldown(COOLDOWN_KEY);
    if (!allowed) return;

    if (!skinAnalysis) {
      alert('Please complete a Skin Analysis first to get personalized product recommendations.');
      return;
    }

    setLoading(true);
    recordAIUsage(COOLDOWN_KEY);
    setCooldown(180);

    const skinContext = `
Skin type: ${skinAnalysis.skin_type}
Overall score: ${skinAnalysis.overall_score}/100
Acne level: ${skinAnalysis.acne_level}/10
Dark spots: ${skinAnalysis.dark_spots}/10
Oiliness: ${skinAnalysis.oiliness}/10
Dryness: ${skinAnalysis.dryness}/10
Redness: ${skinAnalysis.redness}/10
Sensitivity: ${skinAnalysis.sensitivity}/10
Wrinkles: ${skinAnalysis.wrinkles}/10
Pores: ${skinAnalysis.pores}/10
Skin tone: ${skinAnalysis.skin_tone || 'not specified'}
    `.trim();

    const companies = COMPANIES.map(c => c.name).join(', ');

    const prompt = `You are an expert dermatologist and skincare product specialist. Based on this skin analysis, recommend specific products from these brands: ${companies}.

SKIN PROFILE:
${skinContext}

For each of the 12 brands, recommend exactly ONE specific product that best suits this skin profile. Be specific with actual product names.

Return a JSON object with key "brands" as an array of 12 objects, each with:
- brand: brand name (exact match from list)
- product: exact product name
- category: product category (cleanser/toner/serum/moisturizer/sunscreen/treatment/mask)
- why: 1 sentence why this suits the skin profile
- key_ingredient: main active ingredient
- price_approx: approximate price in INR (number only)
- rating: estimated rating out of 5 (number)
- buy_search: a simple Google search query to find and buy this product`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          brands: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                brand: { type: 'string' },
                product: { type: 'string' },
                category: { type: 'string' },
                why: { type: 'string' },
                key_ingredient: { type: 'string' },
                price_approx: { type: 'number' },
                rating: { type: 'number' },
                buy_search: { type: 'string' },
              }
            }
          }
        }
      }
    });

    setRecommendations(result.brands || []);
    setLoading(false);
  };

  const toggleExpand = (idx) => setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));

  const getCategoryIcon = (cat) => {
    const icons = { cleanser: '🧴', toner: '💧', serum: '✨', moisturizer: '🌸', sunscreen: '☀️', treatment: '💊', mask: '🎭' };
    return icons[cat?.toLowerCase()] || '🧴';
  };

  return (
    <GlassCard className="!p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">AI Product Recommender</h2>
            <p className="text-xs text-gray-500">Personalized picks from top skincare brands</p>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || cooldown > 0 || !skinAnalysis}
          className="bg-gradient-to-r from-pink-500 to-amber-500 flex-shrink-0"
          size="sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Analyzing...</>
          ) : cooldown > 0 ? (
            <><Clock className="w-4 h-4 mr-1" /> {formatCooldown(cooldown)}</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-1" /> {recommendations ? 'Refresh' : 'Get Recommendations'}</>
          )}
        </Button>
      </div>

      {!skinAnalysis && !recommendations && (
        <div className="text-center py-6 text-gray-400">
          <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Complete a Skin Analysis to unlock personalized product recommendations</p>
        </div>
      )}

      {skinAnalysis && !recommendations && !loading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
          {COMPANIES.map(c => (
            <div key={c.name} className="bg-white/60 dark:bg-white/10 rounded-xl p-2 text-center">
              <p className="text-lg">{c.country}</p>
              <p className="text-[10px] font-semibold leading-tight">{c.name}</p>
              <span className={`text-[9px] px-1 rounded-full ${PRICE_COLORS[c.priceRange] || 'bg-gray-100 text-gray-600'}`}>
                {c.priceRange}
              </span>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
          <p className="text-sm text-gray-500">Analyzing your skin profile & matching products...</p>
        </div>
      )}

      {recommendations && (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => {
            const company = COMPANIES.find(c => c.name === rec.brand) || {};
            const isExpanded = expanded[idx];
            return (
              <div key={idx} className="bg-white/60 dark:bg-white/10 rounded-2xl overflow-hidden border border-white/30">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => toggleExpand(idx)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">{company.country || '🌍'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{rec.brand}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PRICE_COLORS[company.priceRange] || 'bg-gray-100 text-gray-600'}`}>
                          {company.priceRange}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {getCategoryIcon(rec.category)} {rec.product}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium">{rec.rating?.toFixed(1)}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/30 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Product</p>
                      <p className="text-sm font-medium">{rec.product}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Why for you</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{rec.why}</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Key Ingredient</p>
                        <span className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full">{rec.key_ingredient}</span>
                      </div>
                      {rec.price_approx && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Approx Price</p>
                          <span className="text-sm font-bold">₹{rec.price_approx?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(rec.buy_search || rec.product + ' ' + rec.brand + ' buy India')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-pink-500 to-amber-500 text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3" /> Find & Buy
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}