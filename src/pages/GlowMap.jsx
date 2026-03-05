import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Globe, Loader2, Sparkles, TrendingUp, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch all users' analyses to show real user locations
  const { data: allAnalyses = [] } = useQuery({
    queryKey: ['allAnalysesMap'],
    queryFn: () => base44.entities.SkinAnalysis.list('-created_date', 200),
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['allProfilesMap'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

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

  // Map real user analyses to their city markers (match by location from UserProfile)
  const userCityMap = {};
  allAnalyses.forEach(a => {
    const profile = allProfiles.find(p => p.user_email === a.user_email);
    if (profile?.location) {
      const loc = profile.location.trim().toLowerCase();
      const matchedCity = CITIES.find(c => loc.includes(c.city.toLowerCase()) || loc.includes(c.country.toLowerCase()));
      if (matchedCity) {
        if (!userCityMap[matchedCity.city]) userCityMap[matchedCity.city] = [];
        userCityMap[matchedCity.city].push({ email: a.user_email, score: a.overall_score, skin_type: a.skin_type });
      }
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Title Bar */}
      <div className="px-4 py-3 border-b border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6 text-teal-500" /> AI Glow Map
        </h1>
      </div>

      {!cityData ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <GlassCard className="text-center py-12 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 max-w-md">
            <Globe className="w-16 h-16 text-teal-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">World Skin Intelligence</h3>
            <p className="text-gray-500 mb-6 text-sm">AI analyses climate, pollution, diet & skincare culture across 15 major cities to generate a live global glow map.</p>
            <Button onClick={loadMap} disabled={loading || cooldown > 0} className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-3 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                : cooldown > 0 ? `⏳ ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
                : <><Sparkles className="w-4 h-4 mr-2" /> Generate Map</>}
            </Button>
          </GlassCard>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-4 p-4">
          {/* Map Section */}
          <div className="flex-1 flex flex-col">
            <GlassCard className="flex-1 p-0 overflow-hidden">
              <div className="w-full h-full" style={{ position: 'relative', minHeight: '300px' }}>
                <MapContainer
                  center={[20, 0]}
                  zoom={2}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                  {cityData.cities.map((c) => {
                    const usersHere = userCityMap[c.city] || [];
                    return (
                      <CircleMarker
                        key={c.city}
                        center={[c.lat, c.lng]}
                        radius={Math.max(8, c.avg_glow_score / 8)}
                        fillColor={getColor(c.avg_glow_score)}
                        color="white"
                        weight={2}
                        fillOpacity={0.85}
                      >
                        <Popup>
                          <div style={{ minWidth: 160 }}>
                            <p style={{ fontWeight: 700, fontSize: 15 }}>{c.city}, {c.country}</p>
                            <p style={{ fontSize: 22, fontWeight: 900, color: getColor(c.avg_glow_score), margin: '4px 0 0' }}>{c.avg_glow_score}<span style={{ fontSize: 12, color: '#888' }}>/100</span></p>
                            <p style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Avg Glow Score</p>
                            <p style={{ fontSize: 11, color: '#888' }}>⚠️ {c.top_skin_concern}</p>
                            <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>🌤 {c.skin_climate}</p>
                            {usersHere.length > 0 && (
                              <div style={{ marginTop: 8, borderTop: '1px solid #eee', paddingTop: 6 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>👥 {usersHere.length} GlowAI User{usersHere.length > 1 ? 's' : ''} Here</p>
                                <p style={{ fontSize: 11, color: '#888' }}>Avg User Score: {Math.round(usersHere.reduce((s, u) => s + u.score, 0) / usersHere.length)}/100</p>
                              </div>
                            )}
                            <p style={{ fontSize: 10, color: '#aaa', marginTop: 6, fontStyle: 'italic' }}>{c.fun_fact}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            </GlassCard>
            <div className="text-xs text-gray-500 mt-2 flex gap-3 flex-wrap px-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> High (75+)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Med (60-74)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Low (&lt;60)</span>
            </div>
          </div>

          {/* Scrollable Right Panel */}
          <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto max-h-96 lg:max-h-full lg:min-h-0">
            {/* Top 5 cities */}
            <GlassCard className="flex-shrink-0">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Top 5 Glowing Cities</h3>
              <div className="space-y-2">
                {topCities.map((c, i) => (
                  <div key={c.city} className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{c.city}, {c.country}</span>
                        <span className="font-bold text-teal-600 text-sm whitespace-nowrap">{c.avg_glow_score}/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" style={{ width: `${c.avg_glow_score}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{c.fun_fact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Global Insight */}
            <GlassCard className="flex-shrink-0 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-teal-700 dark:text-teal-300 mb-1 text-sm">Global Insight</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-4">{cityData.global_insight}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}