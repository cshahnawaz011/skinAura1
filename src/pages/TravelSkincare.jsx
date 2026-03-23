import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Globe, Plane, Sparkles, Droplets, Sun, Wind, Thermometer,
  Check, AlertCircle, Package, Map, Cloud, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const CLIMATE_PRESETS = [
  { name: 'Tropical / Humid', icon: '🌴', emoji: '🌡️💧', color: 'from-emerald-400 to-teal-400',
    tips: ['Lightweight gel moisturizer only', 'SPF 50+ (reapply every 2h)', 'Blotting papers essential', 'No heavy occlusives'] },
  { name: 'Cold / Dry', icon: '❄️', emoji: '🥶', color: 'from-blue-400 to-indigo-400',
    tips: ['Layer: hydrating serum + rich cream + occlusive', 'Internal humidifier for room', 'Ceramide-rich products', 'Avoid foaming cleansers'] },
  { name: 'Desert / Arid', icon: '🏜️', emoji: '🌵', color: 'from-amber-400 to-orange-400',
    tips: ['3x daily facial mist', 'Hyaluronic acid on damp skin ONLY', 'Skip exfoliation first 3 days', 'SPF 50+ mandatory all day'] },
  { name: 'High Altitude', icon: '⛰️', emoji: '🗻', color: 'from-gray-400 to-slate-400',
    tips: ['UV radiation 4% stronger per 300m', 'SPF 50+ is minimum', 'Skin dries faster — extra hydration', 'Antioxidant vitamin C morning essential'] },
  { name: 'Long Haul Flight', icon: '✈️', emoji: '🛫', color: 'from-violet-400 to-purple-400',
    tips: ['Cabin humidity <20% (skin loses moisture rapidly)', 'Hydrating sheet mask 2h into flight', 'Avoid makeup during flight', 'Drink 250ml water per hour', 'Face mist every 2 hours'] },
];

const TRAVEL_KIT = {
  essentials: ['Mini SPF 50 stick', 'Hydrating facial mist', 'Gentle cleanser wipes', 'Travel moisturizer (fragrance-free)', 'Lip balm with SPF'],
  liquids_under_100ml: ['Vitamin C serum', 'Hyaluronic acid serum', 'Face wash', 'Toner', 'Eye cream'],
  extras: ['Sheet mask x2 (for flight)', 'Jade roller (not liquid!)', 'Retinol (night only, skip if sensitive)', 'Snail mucin sleeping mask']
};

export default function TravelSkincare() {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [travelPlan, setTravelPlan] = useState(null);
  const [selectedClimate, setSelectedClimate] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());

  const generateTravelPlan = async () => {
    if (!destination) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a comprehensive travel skincare guide for ${destination} for ${duration || '7'} days. Include climate analysis, packing list, daily routine adaptations, and specific ingredient recommendations for this destination.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          destination: { type: 'string' },
          climate_type: { type: 'string' },
          climate_summary: { type: 'string' },
          uv_index: { type: 'string' },
          humidity_level: { type: 'string' },
          skin_challenges: { type: 'array', items: { type: 'string' } },
          morning_routine: { type: 'array', items: { type: 'string' } },
          night_routine: { type: 'array', items: { type: 'string' } },
          must_pack: { type: 'array', items: { type: 'string' } },
          avoid: { type: 'array', items: { type: 'string' } },
          local_beauty_tips: { type: 'array', items: { type: 'string' } },
          adjustment_period: { type: 'string' }
        }
      }
    });
    setTravelPlan(result);
    setLoading(false);
  };

  const toggleItem = (item) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Globe className="w-7 h-7 text-blue-500" />Travel Skincare Guide</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Climate-adaptive skincare for every destination</p>
      </div>

      {/* Destination Search */}
      <GlassCard>
        <h3 className="font-bold mb-4 flex items-center gap-2"><Plane className="w-5 h-5 text-blue-500" />Where are you going?</h3>
        <div className="flex gap-3">
          <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Tokyo, Bali, Iceland, New York..." className="flex-1" />
          <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Days" className="w-24" type="number" />
          <Button onClick={generateTravelPlan} disabled={loading || !destination} className="bg-gradient-to-r from-blue-500 to-violet-500">
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>
      </GlassCard>

      {/* Loading */}
      {loading && (
        <GlassCard className="text-center py-8">
          <Globe className="w-8 h-8 text-blue-500 mx-auto animate-spin mb-3" />
          <p className="text-gray-600">Analyzing climate & creating your travel skincare kit...</p>
        </GlassCard>
      )}

      {/* Travel Plan Result */}
      {travelPlan && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <GlassCard className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-2xl font-bold">{travelPlan.destination}</h2>
                <p className="text-gray-500">{travelPlan.climate_type}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-white/50 dark:bg-white/10 rounded-xl">
                  <p className="text-xs text-gray-500">UV Index</p>
                  <p className="font-bold text-orange-500">{travelPlan.uv_index}</p>
                </div>
                <div className="text-center p-2 bg-white/50 dark:bg-white/10 rounded-xl">
                  <p className="text-xs text-gray-500">Humidity</p>
                  <p className="font-bold text-blue-500">{travelPlan.humidity_level}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{travelPlan.climate_summary}</p>
            {travelPlan.skin_challenges?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {travelPlan.skin_challenges.map((c, i) => <Badge key={i} variant="outline" className="text-orange-500 border-orange-200">{c}</Badge>)}
              </div>
            )}
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard animate={false}>
              <p className="font-bold text-sm text-amber-600 mb-2">☀️ Morning Routine</p>
              {travelPlan.morning_routine?.map((step, i) => (
                <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1 flex items-start gap-1">
                  <span className="text-amber-500 font-bold">{i + 1}.</span>{step}
                </p>
              ))}
            </GlassCard>
            <GlassCard animate={false}>
              <p className="font-bold text-sm text-indigo-600 mb-2">🌙 Night Routine</p>
              {travelPlan.night_routine?.map((step, i) => (
                <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1 flex items-start gap-1">
                  <span className="text-indigo-500 font-bold">{i + 1}.</span>{step}
                </p>
              ))}
            </GlassCard>
          </div>

          <GlassCard animate={false}>
            <p className="font-bold text-sm text-pink-600 mb-3">🧳 Must-Pack List</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {travelPlan.must_pack?.map((item, i) => (
                <button key={i} onClick={() => toggleItem(item)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${checkedItems.has(item) ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checkedItems.has(item) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {checkedItems.has(item) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">{item}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {travelPlan.local_beauty_tips?.length > 0 && (
            <GlassCard animate={false}>
              <p className="font-bold text-sm text-violet-600 mb-2">🌍 Local Beauty Secrets</p>
              {travelPlan.local_beauty_tips.map((tip, i) => (
                <p key={i} className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0 mt-1" />{tip}
                </p>
              ))}
            </GlassCard>
          )}
        </motion.div>
      )}

      {/* Climate Presets */}
      <div>
        <h3 className="font-bold mb-3">Quick Climate Guides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CLIMATE_PRESETS.map((climate) => (
            <button key={climate.name} onClick={() => setSelectedClimate(selectedClimate?.name === climate.name ? null : climate)}
              className={`p-4 rounded-2xl text-left transition-all ${selectedClimate?.name === climate.name ? 'ring-2 ring-pink-400' : ''} glass`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{climate.icon}</span>
                <p className="font-bold text-sm">{climate.name}</p>
              </div>
              {selectedClimate?.name === climate.name && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1 mt-2">
                  {climate.tips.map((tip, i) => (
                    <p key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1">
                      <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />{tip}
                    </p>
                  ))}
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Universal Travel Kit */}
      <GlassCard>
        <h3 className="font-bold mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-pink-500" />Universal Travel Kit</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TRAVEL_KIT).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{category.replace('_', ' ')}</p>
              {items.map((item, i) => (
                <button key={i} onClick={() => toggleItem(`kit-${item}`)}
                  className={`flex items-center gap-2 w-full p-1.5 rounded-lg text-left transition-all text-sm ${checkedItems.has(`kit-${item}`) ? 'line-through text-gray-400' : 'hover:bg-white/30 dark:hover:bg-white/5'}`}>
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${checkedItems.has(`kit-${item}`) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {checkedItems.has(`kit-${item}`) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}