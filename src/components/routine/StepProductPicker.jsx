import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingBag, Clock, MapPin, Layers, ChevronDown, ChevronUp, Star, X, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COUNTRY_OPTIONS = [
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'US', label: '🇺🇸 USA' },
  { code: 'UK', label: '🇬🇧 UK' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'KR', label: '🇰🇷 South Korea' },
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'AE', label: '🇦🇪 UAE' },
];

function ProductCard({ product, onSelect, selected }) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selected?.name === product.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        isSelected
          ? 'border-pink-400 shadow-lg shadow-pink-200/30'
          : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
      }`}
    >
      {/* Header */}
      <div className="p-3 bg-white/70 dark:bg-white/5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{product.name}</p>
              {product.brand && (
                <span className="text-[10px] text-gray-400 font-medium">{product.brand}</span>
              )}
            </div>

            {/* Star rating */}
            {product.rating && (
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                ))}
                <span className="text-[10px] text-gray-400 ml-1">{product.rating}/5</span>
              </div>
            )}

            {/* Price & availability */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {product.price_range && (
                <Badge className={`text-[10px] px-1.5 py-0 ${
                  product.price_range === 'budget' ? 'bg-emerald-100 text-emerald-700' :
                  product.price_range === 'mid' ? 'bg-amber-100 text-amber-700' :
                  'bg-violet-100 text-violet-700'
                }`}>
                  {product.price_range === 'budget' ? '💰 Budget' : product.price_range === 'mid' ? '💳 Mid-range' : '👑 Premium'}
                </Badge>
              )}
              {product.price_local && (
                <span className="text-[10px] font-bold text-pink-500">{product.price_local}</span>
              )}
            </div>
          </div>

          {/* Select button */}
          <button
            onClick={() => onSelect(isSelected ? null : product)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isSelected
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-pink-100 hover:text-pink-600'
            }`}
          >
            {isSelected ? '✓ Selected' : 'Use This'}
          </button>
        </div>

        {/* Quick info row */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {product.apply_time && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Clock className="w-3 h-3 text-amber-400" />
              Apply: {product.apply_time}
            </div>
          )}
          {product.wait_time && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Clock className="w-3 h-3 text-blue-400" />
              Wait: {product.wait_time}
            </div>
          )}
          {product.availability && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <MapPin className="w-3 h-3 text-pink-400" />
              {product.availability}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-[10px] text-pink-500 font-semibold mt-2"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less info' : 'Full details'}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 space-y-2 border-t border-gray-100 dark:border-gray-800 text-xs">

              {/* How to apply process */}
              {product.application_process && (
                <div>
                  <p className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-violet-500" /> How to Apply
                  </p>
                  <ol className="space-y-0.5 pl-3">
                    {product.application_process.map((step, i) => (
                      <li key={i} className="text-gray-600 dark:text-gray-400 list-decimal">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Key ingredients */}
              {product.key_ingredients?.length > 0 && (
                <div>
                  <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">✨ Key Ingredients</p>
                  <div className="flex flex-wrap gap-1">
                    {product.key_ingredients.map((ing, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{ing}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {product.warnings?.length > 0 && (
                <div>
                  <p className="font-bold text-amber-600 mb-1">⚠️ Warnings</p>
                  {product.warnings.map((w, i) => (
                    <p key={i} className="text-amber-700 dark:text-amber-300">• {w}</p>
                  ))}
                </div>
              )}

              {/* Where to buy */}
              {product.where_to_buy?.length > 0 && (
                <div>
                  <p className="font-bold text-gray-600 dark:text-gray-300 mb-1">
                    <Globe className="w-3 h-3 inline mr-1 text-blue-400" />Where to Buy
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {product.where_to_buy.map((store, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px]">{store}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Beginner tip */}
              {product.beginner_tip && (
                <p className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                  💡 {product.beginner_tip}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StepProductPicker({ stepName, stepType, country, onCountryChange, selectedProduct, onProductSelect }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    if (products.length > 0) { setOpen(true); return; }
    setLoading(true);
    setOpen(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a skincare product expert. Recommend 4 real, widely-available skincare products for the step: "${stepName}" (type: ${stepType || 'general skincare'}).

Country: ${COUNTRY_OPTIONS.find(c => c.code === country)?.label || country}

For each product provide:
- Exact product name and brand
- Whether it's budget/mid/premium
- Local price estimate in the country's currency
- Rating out of 5
- Apply time (e.g. "30 seconds", "1 minute")
- Wait time before next step (e.g. "60 seconds", "2 minutes", "none")
- Step-by-step application process (3–5 steps)
- Key active ingredients (max 5)
- Warnings or patch-test notes
- Where to buy in that country (e.g. specific stores / websites)
- One beginner tip
- Availability (e.g. "Widely available", "Online only", "Pharmacy")

Focus on products actually sold in ${COUNTRY_OPTIONS.find(c => c.code === country)?.label || country}. Include 1 budget, 2 mid-range, 1 premium.`,
      response_json_schema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                brand: { type: 'string' },
                price_range: { type: 'string', enum: ['budget', 'mid', 'premium'] },
                price_local: { type: 'string' },
                rating: { type: 'number' },
                apply_time: { type: 'string' },
                wait_time: { type: 'string' },
                availability: { type: 'string' },
                application_process: { type: 'array', items: { type: 'string' } },
                key_ingredients: { type: 'array', items: { type: 'string' } },
                warnings: { type: 'array', items: { type: 'string' } },
                where_to_buy: { type: 'array', items: { type: 'string' } },
                beginner_tip: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setProducts(result?.products || []);
    setLoading(false);
  };

  return (
    <div className="mt-2">
      {/* Trigger row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={fetchProducts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-100 to-amber-100 dark:from-pink-900/30 dark:to-amber-900/30 text-pink-700 dark:text-pink-300 hover:from-pink-200 hover:to-amber-200 border border-pink-200 dark:border-pink-800 transition-all"
        >
          <ShoppingBag className="w-3 h-3" />
          {selectedProduct ? `📦 ${selectedProduct.name}` : 'Pick a Product'}
        </button>

        {selectedProduct && (
          <button
            onClick={() => onProductSelect(null)}
            className="text-[10px] text-gray-400 hover:text-red-400 flex items-center gap-0.5"
          >
            <X className="w-3 h-3" /> remove
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 p-3 space-y-3">
              {/* Country selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Country:</span>
                <div className="flex flex-wrap gap-1">
                  {COUNTRY_OPTIONS.map(c => (
                    <button
                      key={c.code}
                      onClick={() => { onCountryChange(c.code); setProducts([]); }}
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-all ${
                        country === c.code
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-pink-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {products.length > 0 && (
                  <button
                    onClick={() => { setProducts([]); fetchProducts(); }}
                    className="text-[10px] text-pink-500 hover:underline ml-auto"
                  >
                    🔄 Reload for {COUNTRY_OPTIONS.find(c2 => c2.code === country)?.label}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> close
                </button>
              </div>

              {loading && (
                <div className="flex items-center gap-2 py-4 justify-center text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                  Finding products in {COUNTRY_OPTIONS.find(c => c.code === country)?.label}...
                </div>
              )}

              <div className="space-y-2">
                {products.map((product, i) => (
                  <ProductCard
                    key={i}
                    product={product}
                    selected={selectedProduct}
                    onSelect={(p) => { onProductSelect(p); if (p) setOpen(false); }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}