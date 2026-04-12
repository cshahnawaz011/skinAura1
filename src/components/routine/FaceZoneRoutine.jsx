import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MapPin, Sparkles, X, Droplets, Sun, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ZONES = [
  { id: 'forehead', label: 'Forehead', cx: 200, cy: 88, r: 38, concern: 'oiliness', emoji: '🌿' },
  { id: 'left_cheek', label: 'Left Cheek', cx: 126, cy: 190, r: 32, concern: 'dryness', emoji: '💧' },
  { id: 'right_cheek', label: 'Right Cheek', cx: 274, cy: 190, r: 32, concern: 'redness', emoji: '🌸' },
  { id: 'nose', label: 'T-Zone / Nose', cx: 200, cy: 185, r: 24, concern: 'pores', emoji: '🔍' },
  { id: 'chin', label: 'Chin', cx: 200, cy: 275, r: 26, concern: 'acne_level', emoji: '⚡' },
  { id: 'under_eye', label: 'Under-Eye', cx: 200, cy: 148, r: 20, concern: 'dark_spots', emoji: '🎯' },
  { id: 'jawline', label: 'Jawline', cx: 200, cy: 316, r: 22, concern: 'sensitivity', emoji: '🛡️' },
];

const ZONE_PRODUCTS = {
  oiliness: {
    morning: ['Salicylic Acid 2% BHA Cleanser', 'Niacinamide 10% + Zinc Serum', 'Oil-Free Gel Moisturizer', 'Matte SPF 50'],
    night: ['Charcoal Deep Pore Cleanser', 'BHA Exfoliant Toner', 'Retinol 0.5% Serum', 'Lightweight Gel Moisturizer'],
  },
  dryness: {
    morning: ['Gentle Cream Cleanser', 'Hyaluronic Acid Serum', 'Ceramide Moisturizer', 'Hydrating SPF 50'],
    night: ['Micellar Oil Cleanser', 'Glycerin + Squalane Serum', 'Rich Peptide Cream', 'Sleeping Mask'],
  },
  redness: {
    morning: ['Centella Asiatica Cleanser', 'Azelaic Acid 10% Serum', 'Cica Barrier Cream', 'Mineral SPF 50'],
    night: ['Soothing Rice Water Toner', 'Panthenol + Allantoin Serum', 'Barrier Repair Cream', 'Green Tea Sleeping Pack'],
  },
  pores: {
    morning: ['Foam Cleanser with AHA', 'Witch Hazel Toner', 'Pore-Minimizing Primer SPF', 'Blurring Powder'],
    night: ['Double Cleanse', 'AHA 10% + BHA 2% Exfoliant', 'Clay + Niacinamide Mask', 'Lightweight Gel Moisturizer'],
  },
  acne_level: {
    morning: ['Benzoyl Peroxide 2.5% Cleanser', 'Salicylic Acid Toner', 'Niacinamide Spot Serum', 'Non-Comedogenic SPF'],
    night: ['Sulfur Spot Treatment Cleanser', 'BHA + AHA Exfoliant', 'Adapalene 0.1% Gel', 'Oil-Free Moisturizer'],
  },
  dark_spots: {
    morning: ['Brightening Vitamin C Cleanser', 'Vitamin C 20% + E + Ferulic Serum', 'Kojic Acid Cream', 'SPF 50+ PA++++'],
    night: ['Tranexamic Acid Toner', 'Alpha Arbutin 2% Serum', 'Retinol + Niacinamide Cream', 'Brightening Mask (weekly)'],
  },
  sensitivity: {
    morning: ['Fragrance-Free Gentle Cleanser', 'Panthenol Soothing Toner', 'Ceramide + Peptide Serum', 'Mineral SPF 30'],
    night: ['Micellar Water Cleanse Only', 'Madecassoside Serum', 'Minimal Ingredient Barrier Cream', 'Patch Test New Products'],
  },
  wrinkles: {
    morning: ['Antioxidant Cleanser', 'Vitamin C Serum', 'Peptide Moisturizer', 'Broad-Spectrum SPF 50'],
    night: ['Gentle Cleanser', 'Retinol 0.3% Serum', 'Collagen Peptide Cream', 'Eye Cream with Caffeine'],
  },
};

const CLIMATE_ADJUSTMENTS = {
  hot_humid: { label: '☀️ Hot & Humid', note: 'Use lighter textures — gel formulas over creams. Double-cleanse to remove sweat & sunscreen.' },
  hot_dry: { label: '🌵 Hot & Dry', note: 'Layer hydration — apply products on damp skin. Use humectants + occlusives. Reapply SPF every 2 hrs.' },
  cold_dry: { label: '❄️ Cold & Dry', note: 'Add occlusive layers. Use cream/oil formulas. Avoid foaming cleansers that strip barrier.' },
  cold_humid: { label: '🌧️ Cold & Humid', note: 'Barrier protection is key. Ceramide-rich products. Avoid heavy occlusives that cause congestion.' },
  temperate: { label: '🌤️ Temperate', note: 'Standard routine works well. Adjust weight of moisturizer seasonally.' },
};

function getSeverityColor(value) {
  if (!value && value !== 0) return '#d0d0d0';
  if (value <= 3) return '#5ebd8a';
  if (value <= 6) return '#f0b429';
  return '#e05470';
}

export default function FaceZoneRoutine({ skinAnalysis }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [climate, setClimate] = useState(null);
  const [loadingClimate, setLoadingClimate] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [routineType, setRoutineType] = useState('morning');

  useEffect(() => {
    detectClimate();
  }, []);

  const detectClimate = () => {
    setLoadingClimate(true);
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const cached = localStorage.getItem(`climate-${Math.round(latitude)}-${Math.round(longitude)}`);
      if (cached) {
        setClimate(JSON.parse(cached));
        setLoadingClimate(false);
        return;
      }
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on coordinates lat=${latitude}, lon=${longitude}, determine the current climate type (one of: hot_humid, hot_dry, cold_dry, cold_humid, temperate) and city name.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            climate_type: { type: "string" },
            city: { type: "string" },
            temp_celsius: { type: "number" },
            humidity_pct: { type: "number" },
          }
        }
      });
      localStorage.setItem(`climate-${Math.round(latitude)}-${Math.round(longitude)}`, JSON.stringify(result));
      setClimate(result);
      setLoadingClimate(false);
    }, () => setLoadingClimate(false));
  };

  const getZoneAdvice = async (zone) => {
    setSelectedZone(zone);
    setAiAdvice(null);
    if (!skinAnalysis) return;
    setLoadingAdvice(true);
    const score = skinAnalysis[zone.concern] || 0;
    const climateNote = climate ? CLIMATE_ADJUSTMENTS[climate.climate_type]?.note : '';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatologist. For the facial zone "${zone.label}" with concern "${zone.concern.replace('_', ' ')}" scoring ${score}/10 on skin analysis (skin type: ${skinAnalysis.skin_type}):

Climate context: ${climateNote || 'temperate climate'}

Give:
1. zone_insight: 1 sentence clinical observation about this zone
2. morning_tip: specific AM product step for this zone (1 sentence)
3. night_tip: specific PM product step for this zone (1 sentence)  
4. ingredient: single best ingredient with % if applicable
5. massage_tip: facial massage direction/technique for this zone (1 sentence)`,
      response_json_schema: {
        type: "object",
        properties: {
          zone_insight: { type: "string" },
          morning_tip: { type: "string" },
          night_tip: { type: "string" },
          ingredient: { type: "string" },
          massage_tip: { type: "string" },
        }
      }
    });
    setAiAdvice(result);
    setLoadingAdvice(false);
  };

  const climateInfo = climate ? (CLIMATE_ADJUSTMENTS[climate.climate_type] || CLIMATE_ADJUSTMENTS.temperate) : null;
  const products = selectedZone ? (ZONE_PRODUCTS[selectedZone.concern]?.[routineType] || []) : [];

  return (
    <div className="space-y-4">
      {/* Climate Banner */}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: '#fef9f0', border: '1px solid #f0e0c0' }}>
        <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
        {loadingClimate ? (
          <span className="text-sm text-gray-500">Detecting your location...</span>
        ) : climateInfo ? (
          <div>
            <p className="text-sm font-semibold text-amber-700">{climateInfo.label}{climate?.city ? ` — ${climate.city}` : ''}</p>
            <p className="text-xs text-amber-600">{climateInfo.note}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Enable location for climate-adapted recommendations</span>
            <button onClick={detectClimate} className="text-xs text-amber-600 font-medium underline">Enable</button>
          </div>
        )}
      </div>

      {/* Routine Toggle */}
      <div className="flex gap-2">
        {['morning', 'night'].map(t => (
          <button key={t} onClick={() => setRoutineType(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              routineType === t ? 'text-white' : 'text-gray-500'
            }`}
            style={routineType === t ? {
              background: t === 'morning' ? 'linear-gradient(135deg,#f0b429,#f08030)' : 'linear-gradient(135deg,#6050a0,#4040a0)'
            } : { background: '#f5f0eb' }}>
            {t === 'morning' ? '☀️' : '🌙'} {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SVG Face Map */}
        <div className="rounded-2xl p-4" style={{ background: '#faf6f2', border: '1px solid #ede8e3' }}>
          <p className="text-xs font-semibold text-center mb-3" style={{ color: '#9a7e78' }}>Tap a zone for personalized products</p>
          <svg viewBox="0 0 400 400" className="w-full max-w-xs mx-auto block">
            {/* Face outline */}
            <ellipse cx="200" cy="200" rx="120" ry="155" fill="#fff0e8" stroke="#e0c8b8" strokeWidth="1.5" />
            {/* Hair */}
            <ellipse cx="200" cy="80" rx="115" ry="40" fill="#d4b896" />
            {/* Eyes */}
            <ellipse cx="160" cy="155" rx="18" ry="10" fill="#fff" stroke="#c8b0a0" strokeWidth="1" />
            <ellipse cx="240" cy="155" rx="18" ry="10" fill="#fff" stroke="#c8b0a0" strokeWidth="1" />
            <circle cx="160" cy="155" r="6" fill="#4a3020" />
            <circle cx="240" cy="155" r="6" fill="#4a3020" />
            {/* Nose */}
            <path d="M192 175 Q200 200 208 175" stroke="#c8b0a0" strokeWidth="1.5" fill="none" />
            {/* Mouth */}
            <path d="M178 230 Q200 245 222 230" stroke="#d09080" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Zone overlays */}
            {ZONES.map((zone) => {
              const value = skinAnalysis?.[zone.concern];
              const color = getSeverityColor(value);
              const isSelected = selectedZone?.id === zone.id;
              return (
                <g key={zone.id} onClick={() => getZoneAdvice(zone)} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={zone.cx} cy={zone.cy} r={zone.r}
                    fill={color}
                    fillOpacity={isSelected ? 0.6 : 0.35}
                    stroke={isSelected ? '#c07080' : color}
                    strokeWidth={isSelected ? 2.5 : 1}
                  />
                  <text x={zone.cx} y={zone.cy + 4} textAnchor="middle"
                    fontSize="11" fill="#3d2a2a" fontWeight={isSelected ? 'bold' : 'normal'}>
                    {zone.emoji}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            {[{ c: '#5ebd8a', l: 'Good' }, { c: '#f0b429', l: 'Moderate' }, { c: '#e05470', l: 'Needs Care' }].map(item => (
              <div key={item.l} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: item.c }} />
                <span className="text-xs" style={{ color: '#9a7e78' }}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Detail Panel */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#faf6f2', border: '1px solid #ede8e3' }}>
          {!selectedZone ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <span className="text-4xl mb-3">👆</span>
              <p className="text-sm font-medium" style={{ color: '#3d2a2a' }}>Tap any zone on the face map</p>
              <p className="text-xs mt-1" style={{ color: '#9a7e78' }}>Get targeted product recommendations</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selectedZone.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-base" style={{ color: '#3d2a2a' }}>{selectedZone.emoji} {selectedZone.label}</p>
                    <p className="text-xs capitalize" style={{ color: '#9a7e78' }}>
                      Concern: {selectedZone.concern.replace('_', ' ')} · Score: {skinAnalysis?.[selectedZone.concern] ?? 'N/A'}/10
                    </p>
                  </div>
                  <button onClick={() => setSelectedZone(null)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* AI Advice */}
                {loadingAdvice ? (
                  <div className="flex items-center gap-2 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    <span className="text-xs text-gray-400">Getting zone-specific advice...</span>
                  </div>
                ) : aiAdvice && (
                  <div className="space-y-2 text-xs p-3 rounded-xl" style={{ background: '#fff5f5' }}>
                    <p style={{ color: '#5a3a3a' }}><span className="font-semibold">📋 Insight:</span> {aiAdvice.zone_insight}</p>
                    <p style={{ color: '#5a3a3a' }}><span className="font-semibold">⭐ Key Ingredient:</span> {aiAdvice.ingredient}</p>
                    <p style={{ color: '#5a3a3a' }}><span className="font-semibold">💆 Massage:</span> {aiAdvice.massage_tip}</p>
                  </div>
                )}

                {/* Products for this zone */}
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: '#3d2a2a' }}>
                    {routineType === 'morning' ? '☀️ Morning' : '🌙 Night'} Products for This Zone
                  </p>
                  <div className="space-y-1.5">
                    {products.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: '#fff', border: '1px solid #ede8e3' }}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: routineType === 'morning' ? '#f0b429' : '#6050a0' }}>{i + 1}</span>
                        <span className="text-xs" style={{ color: '#3d2a2a' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {aiAdvice && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl" style={{ background: '#f0f9f0' }}>
                      <p className="font-semibold text-green-700 mb-1">☀️ AM Step</p>
                      <p className="text-green-600">{aiAdvice.morning_tip}</p>
                    </div>
                    <div className="p-2 rounded-xl" style={{ background: '#f5f0ff' }}>
                      <p className="font-semibold text-violet-700 mb-1">🌙 PM Step</p>
                      <p className="text-violet-600">{aiAdvice.night_tip}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}