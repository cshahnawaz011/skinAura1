import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Globe, Loader2, Sparkles, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';

const CITIES = [
  { city: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.69 },
  { city: 'Seoul', country: 'South Korea', lat: 37.57, lng: 126.98 },
  { city: 'Stockholm', country: 'Sweden', lat: 59.33, lng: 18.06 },
  { city: 'Sydney', country: 'Australia', lat: -33.87, lng: 151.21 },
  { city: 'Vancouver', country: 'Canada', lat: 49.28, lng: -123.12 },
  { city: 'Paris', country: 'France', lat: 48.86, lng: 2.35 },
  { city: 'Singapore', country: 'Singapore', lat: 1.35, lng: 103.82 },
  { city: 'New York', country: 'USA', lat: 40.71, lng: -74.01 },
  { city: 'Mumbai', country: 'India', lat: 19.08, lng: 72.88 },
  { city: 'London', country: 'UK', lat: 51.51, lng: -0.13 },
  { city: 'Dubai', country: 'UAE', lat: 25.20, lng: 55.27 },
  { city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.40 },
  { city: 'São Paulo', country: 'Brazil', lat: -23.55, lng: -46.63 },
  { city: 'Cape Town', country: 'South Africa', lat: -33.93, lng: 18.42 },
  { city: 'Bangkok', country: 'Thailand', lat: 13.76, lng: 100.50 },
];

export default function GlowMap() {
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(getCooldownSeconds('glow_map'));
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => p <= 1 ? (clearInterval(t), 0) : p - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const loadMap = async () => {
    const { allowed } = checkAICooldown('glow_map');
    if (!allowed) return;
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a global skin health research expert. Based on real-world epidemiology, climate data, diet patterns, pollution, and skincare culture, estimate realistic average glow/skin health scores for each of these cities.

Consider: air quality, UV index, humidity, diet (omega-3, antioxidants), stress levels, skincare adoption rates, water quality, pollution levels.

Cities: ${CITIES.map(c => `${c.city}, ${c.country}`).join(' | ')}

For each city provide:
- avg_glow_score (0-100): realistic population average skin health
- top_skin_concern: most common skin issue in that city (e.g., "Pollution-driven dullness", "UV damage", "Dryness from cold weather")
- skin_climate: one word climate type (e.g., "Humid", "Dry", "Polluted", "Balanced")
- fun_fact: one interesting skin fact about that city/country`,
      response_json_schema: {
        type: "object",
        properties: {
          cities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                city: { type: "string" },
                avg_glow_score: { type: "number" },
                top_skin_concern: { type: "string" },
                skin_climate: { type: "string" },
                fun_fact: { type: "string" }
              }
            }
          },
          global_insight: { type: "string", description: "One key global insight about skin health trends worldwide" }
        }
      }
    });
    // Merge lat/lng from our CITIES array
    const merged = res.cities.map(c => {
      const found = CITIES.find(x => x.city === c.city);
      return { ...c, lat: found?.lat || 0, lng: found?.lng || 0, country: found?.country || '' };
    });
    setCityData({ cities: merged, global_insight: res.global_insight });
    recordAIUsage('glow_map');
    setCooldown(3 * 60);
    setLoading(false);
  };

  const getColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const topCities = cityData?.cities ? [...cityData.cities].sort((a, b) => b.avg_glow_score - a.avg_glow_score).slice(0, 5) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Globe className="w-8 h-8 text-teal-500" /> AI Glow Map</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Global skin health intelligence — cities with the best & worst skin scores</p>
      </div>

      {!cityData ? (
        <GlassCard className="text-center py-12 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
          <Globe className="w-16 h-16 text-teal-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">World Skin Intelligence</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">AI analyses climate, pollution, diet & skincare culture across 15 major cities to generate a live global glow map.</p>
          <Button onClick={loadMap} disabled={loading || cooldown > 0} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-4">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Global Map...</>
              : cooldown > 0 ? `⏳ ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
              : <><Sparkles className="w-4 h-4 mr-2" /> Generate Glow Map</>}
          </Button>
        </GlassCard>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Map */}
            <GlassCard className="p-0 overflow-hidden">
              <div style={{ height: '450px' }}>
                <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {cityData.cities.map((c) => (
                    <CircleMarker
                      key={c.city}
                      center={[c.lat, c.lng]}
                      radius={Math.max(8, c.avg_glow_score / 8)}
                      fillColor={getColor(c.avg_glow_score)}
                      color="white"
                      weight={2}
                      fillOpacity={0.8}
                      eventHandlers={{ click: () => setSelected(c) }}
                    >
                      <Popup>
                        <div className="text-center p-1">
                          <p className="font-bold text-base">{c.city}</p>
                          <p className="text-xs text-gray-500">{c.country}</p>
                          <p className="text-2xl font-black mt-1" style={{ color: getColor(c.avg_glow_score) }}>{c.avg_glow_score}</p>
                          <p className="text-xs font-medium">Glow Score</p>
                          <p className="text-xs text-gray-500 mt-1">{c.top_skin_concern}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
              <div className="p-4 flex gap-4 flex-wrap text-sm text-gray-500 border-t border-white/20">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> High Glow (75+)</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Medium (60-74)</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Needs Attention (&lt;60)</span>
              </div>
            </GlassCard>

            {/* Top 5 cities */}
            <GlassCard>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Top 5 Glowing Cities</h3>
              <div className="space-y-3">
                {topCities.map((c, i) => (
                  <div key={c.city} className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'}`}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{c.city}, {c.country}</span>
                        <span className="font-bold text-teal-600">{c.avg_glow_score}/100</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" style={{ width: `${c.avg_glow_score}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{c.fun_fact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Global Insight */}
            <GlassCard className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-teal-700 dark:text-teal-300 mb-1">Global Skin Insight</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{cityData.global_insight}</p>
                </div>
              </div>
            </GlassCard>

            {/* All cities grid */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-teal-500" /> All Cities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {cityData.cities.map((c) => (
                  <div key={c.city} className="p-3 rounded-xl border border-white/30 dark:border-white/10 text-center hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <p className="font-semibold text-sm">{c.city}</p>
                    <p className="text-2xl font-black mt-1" style={{ color: getColor(c.avg_glow_score) }}>{c.avg_glow_score}</p>
                    <p className="text-xs text-gray-400 mt-1">{c.skin_climate}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}