import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, Apple, AlertCircle, Check, TrendingUp,
  Zap, Shield, Droplets, Star, ChevronDown, ChevronUp, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const QUICK_FOODS = [
  'Salmon', 'Avocado', 'Blueberries', 'Dark Chocolate', 'Green Tea',
  'Spinach', 'Walnuts', 'Sweet Potato', 'Broccoli', 'Eggs',
  'Sugar', 'Fast Food', 'Soda', 'White Bread', 'Chips', 'Dairy Milk'
];

export default function NutritionScanner() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const scanFood = async (foodName) => {
    const food = foodName || query;
    if (!food.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze "${food}" for its impact on skin health. Be specific about mechanisms, nutrients, and real skin effects.`,
      response_json_schema: {
        type: 'object',
        properties: {
          food_name: { type: 'string' },
          skin_score: { type: 'number', description: '-10 to +10 skin impact score' },
          verdict: { type: 'string', enum: ['excellent', 'good', 'neutral', 'caution', 'avoid'] },
          summary: { type: 'string' },
          key_nutrients: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, benefit: { type: 'string' }, amount: { type: 'string' } } } },
          skin_benefits: { type: 'array', items: { type: 'string' } },
          skin_risks: { type: 'array', items: { type: 'string' } },
          best_for_skin_types: { type: 'array', items: { type: 'string' } },
          avoid_if: { type: 'array', items: { type: 'string' } },
          how_much: { type: 'string' },
          best_time_to_eat: { type: 'string' },
          synergies: { type: 'string', description: 'Foods that pair well for enhanced skin benefits' }
        }
      }
    });
    setResult(res);
    setHistory(prev => [{ ...res, id: Date.now() }, ...prev.slice(0, 9)]);
    setLoading(false);
  };

  const scanPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: 'Identify the food(s) in this image and analyze their skin health impact. List each food and give an overall skin score.',
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          foods_detected: { type: 'array', items: { type: 'string' } },
          overall_skin_score: { type: 'number' },
          food_name: { type: 'string' },
          verdict: { type: 'string' },
          summary: { type: 'string' },
          skin_benefits: { type: 'array', items: { type: 'string' } },
          skin_risks: { type: 'array', items: { type: 'string' } },
          key_nutrients: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, benefit: { type: 'string' } } } }
        }
      }
    });
    setResult(res);
    setUploadLoading(false);
  };

  const verdictConfig = {
    excellent: { color: 'bg-emerald-500', label: '🌟 Excellent for Skin', textColor: 'text-emerald-600' },
    good: { color: 'bg-green-400', label: '✅ Good for Skin', textColor: 'text-green-600' },
    neutral: { color: 'bg-gray-400', label: '😐 Neutral', textColor: 'text-gray-600' },
    caution: { color: 'bg-amber-400', label: '⚠️ Use Caution', textColor: 'text-amber-600' },
    avoid: { color: 'bg-red-500', label: '🚫 Avoid for Clear Skin', textColor: 'text-red-600' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Apple className="w-7 h-7 text-emerald-500" /> Nutrition Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered food analysis for your skin</p>
      </div>

      {/* Search */}
      <GlassCard>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && scanFood()}
              placeholder="Enter any food (e.g. 'salmon', 'matcha latte', 'pizza')..."
              className="pl-9"
            />
          </div>
          <Button onClick={() => scanFood()} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-teal-500">
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" capture="environment" onChange={scanPhoto} className="hidden" />
            <Button variant="outline" disabled={uploadLoading} asChild>
              <span>{uploadLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}</span>
            </Button>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_FOODS.map(food => (
            <button key={food} onClick={() => { setQuery(food); scanFood(food); }}
              className="px-3 py-1 text-xs rounded-full bg-white/60 dark:bg-white/10 hover:bg-pink-100 dark:hover:bg-pink-900/30 border border-gray-200 dark:border-gray-700 transition-all">
              {food}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Loading */}
      {loading && (
        <GlassCard className="text-center py-8">
          <Sparkles className="w-8 h-8 text-emerald-500 mx-auto animate-spin mb-3" />
          <p className="text-gray-600 dark:text-gray-300">Analyzing skin impact...</p>
        </GlassCard>
      )}

      {/* Result */}
      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">{result.food_name}</h2>
                {result.foods_detected && <p className="text-sm text-gray-500 mt-1">Detected: {result.foods_detected.join(', ')}</p>}
              </div>
              <div className="text-center">
                <div className={`text-3xl font-black ${result.skin_score > 5 ? 'text-emerald-500' : result.skin_score > 0 ? 'text-green-500' : result.skin_score > -3 ? 'text-amber-500' : 'text-red-500'}`}>
                  {result.skin_score > 0 ? '+' : ''}{result.skin_score}
                </div>
                <p className="text-xs text-gray-400">skin score</p>
              </div>
            </div>

            {result.verdict && verdictConfig[result.verdict] && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold mb-4 ${verdictConfig[result.verdict].color}`}>
                {verdictConfig[result.verdict].label}
              </div>
            )}

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{result.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.skin_benefits?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-2">✅ Skin Benefits</p>
                  {result.skin_benefits.map((b, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1 flex items-start gap-1"><Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />{b}</p>)}
                </div>
              )}
              {result.skin_risks?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-red-600 uppercase mb-2">⚠️ Skin Risks</p>
                  {result.skin_risks.map((r, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1 flex items-start gap-1"><AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />{r}</p>)}
                </div>
              )}
            </div>

            {result.key_nutrients?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">🔬 Key Nutrients</p>
                <div className="flex flex-wrap gap-2">
                  {result.key_nutrients.map((n, i) => (
                    <div key={i} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-xs font-bold text-blue-600">{n.name}</p>
                      <p className="text-xs text-gray-500">{n.benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {result.how_much && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-xs font-bold text-amber-600">📏 How Much to Eat</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{result.how_much}</p>
                </div>
              )}
              {result.best_time_to_eat && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-xs font-bold text-purple-600">⏰ Best Time to Eat</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{result.best_time_to_eat}</p>
                </div>
              )}
              {result.synergies && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl md:col-span-2">
                  <p className="text-xs font-bold text-emerald-600">🤝 Power Pairings</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{result.synergies}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <GlassCard>
          <h3 className="font-bold mb-3">Recent Scans</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => {
              const vc = verdictConfig[h.verdict];
              return (
                <button key={h.id} onClick={() => setResult(h)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium text-white ${vc?.color || 'bg-gray-400'}`}>
                  {h.food_name} ({h.skin_score > 0 ? '+' : ''}{h.skin_score})
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}