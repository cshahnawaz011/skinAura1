import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, Loader2, MapPin, Check, ChevronDown, ChevronUp, ExternalLink, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Location → popular stores/brands map
const LOCATION_BRANDS = {
  IN: { stores: ['Nykaa', 'Myntra', 'Amazon India', 'Flipkart', 'BigBasket'], brands: ['Minimalist', 'Dot & Key', 'Plum', 'Mamaearth', 'WOW Skin Science', 'mCaffeine', 'The Derma Co', 'BBLAB'] },
  US: { stores: ['Sephora', 'Ulta', 'Amazon', 'Target', 'CVS'], brands: ['CeraVe', 'The Ordinary', "Paula's Choice", 'Neutrogena', 'Drunk Elephant', 'Sunday Riley', 'Tatcha'] },
  GB: { stores: ['Boots', 'Lookfantastic', 'Holland & Barrett', 'Cult Beauty'], brands: ['The Ordinary', 'REN', 'Emma Hardie', 'Indeed Labs', 'Alpha-H'] },
  AU: { stores: ['Adore Beauty', 'Mecca', 'Priceline', 'Chemist Warehouse'], brands: ['Alpha-H', 'Aesop', 'Sodashi', 'Napoleon Perdis'] },
  DEFAULT: { stores: ['Amazon', 'ASOS', 'iHerb', 'Lookfantastic'], brands: ['The Ordinary', 'CeraVe', 'Neutrogena', 'La Roche-Posay', 'Vichy'] },
};

function detectCountry() {
  const lang = navigator.language || '';
  if (lang.includes('IN') || lang === 'hi') return 'IN';
  if (lang.includes('GB')) return 'GB';
  if (lang.includes('AU')) return 'AU';
  if (lang.includes('US')) return 'US';
  return 'DEFAULT';
}

export default function ProductPicker({ step, userEmail, selectedProduct, onSelect }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const country = detectCountry();
  const { stores, brands } = LOCATION_BRANDS[country] || LOCATION_BRANDS.DEFAULT;

  const fetchSuggestions = async () => {
    if (suggestions) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a skincare expert. Recommend 4 specific products for the step: "${step.product_type}" (Key ingredient: ${step.key_ingredient || 'as needed'}).
The user is in ${country === 'IN' ? 'India' : country === 'US' ? 'USA' : country === 'GB' ? 'UK' : country === 'AU' ? 'Australia' : 'their country'}.
Prefer brands available locally: ${brands.join(', ')}.
For each product: name, brand, price_inr (approx in local currency), rating (out of 5), why_fits (1 sentence for this step), buy_link_query (google search query to buy).`,
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
                price_inr: { type: 'number' },
                rating: { type: 'number' },
                why_fits: { type: 'string' },
                buy_link_query: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setSuggestions(result.products || []);
    setLoading(false);
  };

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) fetchSuggestions();
  };

  const handleSelect = async (product) => {
    onSelect(product);
    // Save to SavedProduct entity
    try {
      await base44.entities.SavedProduct.create({
        user_email: userEmail,
        product_name: product.name,
        category: step.phase_tag || 'serum',
        key_ingredients: [step.key_ingredient].filter(Boolean),
        benefits: product.why_fits,
        price_range: product.price_inr < 500 ? 'budget' : product.price_inr < 2000 ? 'mid' : 'premium',
        rating: product.rating,
      });
    } catch {}
    setOpen(false);
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 border border-pink-200/40 dark:border-pink-700/30 hover:opacity-90 transition"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-pink-500" />
          {selectedProduct ? (
            <div className="text-left">
              <p className="text-xs font-semibold text-pink-700 dark:text-pink-300">{selectedProduct.name}</p>
              <p className="text-[10px] text-gray-500">{selectedProduct.brand} · ₹{selectedProduct.price_inr?.toLocaleString?.() || '–'}</p>
            </div>
          ) : (
            <span className="text-xs font-medium text-pink-600 dark:text-pink-400">
              Pick a product for this step <MapPin className="w-3 h-3 inline ml-1" />
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-2">
              {loading && (
                <div className="flex items-center gap-2 py-3 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                  <span className="text-xs text-gray-500">Finding best products in your region...</span>
                </div>
              )}
              {suggestions?.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedProduct?.name === p.name
                      ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/30'
                      : 'border-white/30 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                  onClick={() => handleSelect(p)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{p.name}</span>
                      {selectedProduct?.name === p.name && <Check className="w-4 h-4 text-pink-500" />}
                    </div>
                    <p className="text-xs text-gray-500">{p.brand}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.why_fits}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold">{p.rating}</span>
                    </div>
                    {p.price_inr && <p className="text-xs font-bold text-pink-600 mt-0.5">₹{p.price_inr?.toLocaleString?.()}</p>}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(p.buy_link_query || p.name + ' buy')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:underline mt-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> Buy
                    </a>
                  </div>
                </motion.div>
              ))}
              <p className="text-[10px] text-gray-400 text-center">Available at: {stores.join(' · ')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}