import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Wind, Thermometer, Loader2, Shield,
  Droplets, AlertTriangle, RefreshCw, MapPin, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

function UVBadge({ uv }) {
  if (!uv && uv !== 0) return null;
  if (uv <= 2) return <Badge className="bg-emerald-500">UV Low ({uv})</Badge>;
  if (uv <= 5) return <Badge className="bg-yellow-500 text-white">UV Moderate ({uv})</Badge>;
  if (uv <= 7) return <Badge className="bg-orange-500">UV High ({uv})</Badge>;
  if (uv <= 10) return <Badge className="bg-red-500">UV Very High ({uv})</Badge>;
  return <Badge className="bg-purple-700">UV Extreme ({uv})</Badge>;
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

const CACHE_KEY = 'glowai_weather_cache';
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

// Country code → language code mapping
const COUNTRY_TO_LANG = {
  IN: 'hi', SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', JO: 'ar', IQ: 'ar', SY: 'ar', LB: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar', YE: 'ar',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', BO: 'es', PY: 'es', UY: 'es', CU: 'es',
  FR: 'fr', BE: 'fr', CH: 'fr', SN: 'fr', CI: 'fr', CM: 'fr',
  DE: 'de', AT: 'de',
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
  JP: 'ja', KR: 'ko',
  BR: 'pt', PT: 'pt',
  RU: 'ru', BY: 'ru', KZ: 'ru',
  TR: 'tr',
};

const LANG_NAMES = {
  en: 'English', hi: 'Hindi', ar: 'Arabic', es: 'Spanish', fr: 'French',
  de: 'German', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', pt: 'Portuguese',
  ru: 'Russian', tr: 'Turkish',
};

function setLanguageFromCountry(countryCode) {
  // Only auto-set if user hasn't manually chosen a language
  if (localStorage.getItem('glowai-lang-manual')) return;
  const lang = COUNTRY_TO_LANG[countryCode];
  if (lang && lang !== localStorage.getItem('glowai-lang')) {
    localStorage.setItem('glowai-lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    window.location.reload();
  }
}

export default function WeatherAdvisor({ skinAnalysis }) {
  const [weather, setWeather] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [manualCity, setManualCity] = useState('');
  const [showCityInput, setShowCityInput] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft(prev => {
        if (prev <= 1000) { clearInterval(interval); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  useEffect(() => {
    // Load from cache on mount
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        setWeather(cached.weather);
        setAdvice(cached.advice);
        setLocationName(cached.locationName);
        setLastUpdated(new Date(cached.timestamp));
        const remaining = CACHE_DURATION_MS - (Date.now() - cached.timestamp);
        setCooldownLeft(remaining);
        return;
      }
    } catch {}
  }, []);

  const fetchWeatherAndAdvice = () => {
    if (cooldownLeft > 0) return;
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      fetchLocationByIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await loadWeatherByCoords(latitude, longitude);
      },
      () => {
        // GPS denied — fall back to IP geolocation
        fetchLocationByIP();
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const fetchLocationByIP = async () => {
    try {
      // Try multiple IP geolocation APIs for better accuracy
      let city = null;

      try {
        const res = await fetch('https://ip-api.com/json/?fields=city,regionName,country,countryCode');
        const data = await res.json();
        if (data.city) city = data.city;
        if (data.countryCode) setLanguageFromCountry(data.countryCode);
      } catch {}

      if (!city) {
        const res2 = await fetch('https://ipwho.is/');
        const data2 = await res2.json();
        if (data2.city) city = data2.city;
        if (data2.country_code) setLanguageFromCountry(data2.country_code);
      }

      if (city) {
        setLocationName(city);
        await loadWeatherByCity(city);
      } else {
        setShowCityInput(true);
        setLocationError('Could not detect location. Enter your city manually.');
        setLoading(false);
      }
    } catch {
      setShowCityInput(true);
      setLocationError('Could not detect location. Enter your city manually.');
      setLoading(false);
    }
  };

  const loadWeatherByCoords = async (lat, lon) => {
    // Reverse geocode using OpenStreetMap Nominatim (free, no key needed)
    let cityName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const geoData = await geoRes.json();
      cityName =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        geoData.address?.county ||
        cityName;
    } catch {}

    setLocationName(cityName);

    // Try to detect country from GPS reverse geocode for language setting
    try {
      const geoRes2 = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
      const geoData2 = await geoRes2.json();
      const countryCode = geoData2.address?.country_code?.toUpperCase();
      if (countryCode) setLanguageFromCountry(countryCode);
    } catch {}

    const userLang = LANG_NAMES[localStorage.getItem('glowai-lang') || 'en'] || 'English';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Get current real-time weather for the city "${cityName}" (GPS: lat=${lat}, lon=${lon}).
Return: city name, temperature (°C), feels_like (°C), humidity (%), uv_index (0-11), aqi (air quality index number), weather condition (one word: sunny/cloudy/rainy/etc), wind_speed (km/h).
Use real current data. Respond in ${userLang}.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          city: { type: "string" },
          temperature: { type: "number" },
          feels_like: { type: "number" },
          humidity: { type: "number" },
          uv_index: { type: "number" },
          aqi: { type: "number" },
          condition: { type: "string" },
          wind_speed: { type: "number" }
        }
      }
    });
    result.city = cityName; // force exact city from GPS
    await generateSkinAdvice(result);
  };

  const loadWeatherByCity = async (city) => {
    if (!loading) setLoading(true);
    setLocationError(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Get current real-time weather for the city: "${city}".
Return: city name (official), temperature (°C), feels_like (°C), humidity (%), uv_index (0-11), aqi (air quality index number), weather condition (one word), wind_speed (km/h).
Use real current data.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          city: { type: "string" },
          temperature: { type: "number" },
          feels_like: { type: "number" },
          humidity: { type: "number" },
          uv_index: { type: "number" },
          aqi: { type: "number" },
          condition: { type: "string" },
          wind_speed: { type: "number" }
        }
      }
    });
    setLocationName(result.city || city);
    setShowCityInput(false);
    await generateSkinAdvice(result);
  };

  const generateSkinAdvice = async (w) => {
    const skinContext = skinAnalysis
      ? `Patient has ${skinAnalysis.skin_type} skin (score ${skinAnalysis.overall_score}/100). Oiliness: ${skinAnalysis.oiliness}/10, Dryness: ${skinAnalysis.dryness}/10, Sensitivity: ${skinAnalysis.sensitivity}/10, Redness: ${skinAnalysis.redness}/10, Acne: ${skinAnalysis.acne_level}/10.`
      : 'No skin profile — give general advice for all skin types.';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatologist sending a morning skin briefing to a patient.

TODAY'S WEATHER in ${w.city}:
- Temp: ${w.temperature}°C (feels ${w.feels_like || w.temperature}°C)
- Humidity: ${w.humidity}%  
- UV: ${w.uv_index}/11
- AQI: ${w.aqi || 'unknown'}
- Condition: ${w.condition}
- Wind: ${w.wind_speed} km/h

SKIN PROFILE: ${skinContext}

Provide urgent, specific, proactive skin advice. Be direct and clinical.

1. daily_alert: Punchy 1-sentence urgent alert
2. alert_severity: "low"|"medium"|"high"|"critical"
3. spf_recommendation: Exact SPF advice for this UV level
4. hydration_tip: Weather-specific hydration advice
5. product_adjustments: Specific product/routine swap for today's weather
6. skin_risks_today: 2-3 specific risks today
7. quick_actions: 3-4 actions before leaving home
8. recovery_tip: Evening routine tip for today
9. avoid_today: Ingredients/activities to avoid
10. weather_mood: emoji + 1 word (e.g. "☀️ Hazardous")`,
      response_json_schema: {
        type: "object",
        properties: {
          daily_alert: { type: "string" },
          alert_severity: { type: "string" },
          spf_recommendation: { type: "string" },
          hydration_tip: { type: "string" },
          product_adjustments: { type: "string" },
          skin_risks_today: { type: "array", items: { type: "string" } },
          quick_actions: { type: "array", items: { type: "string" } },
          recovery_tip: { type: "string" },
          avoid_today: { type: "string" },
          weather_mood: { type: "string" }
        }
      }
    });

    setWeather(w);
    setAdvice(result);
    const now = new Date();
    setLastUpdated(now);
    setLoading(false);
    setCooldownLeft(CACHE_DURATION_MS);
    // Cache to localStorage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        weather: w,
        advice: result,
        locationName: w.city,
        timestamp: now.getTime()
      }));
    } catch {}
  };

  const severityColors = {
    low: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20',
    medium: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20',
    high: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
    critical: 'border-red-400 bg-red-50 dark:bg-red-900/20',
  };
  const severityText = {
    low: 'text-emerald-600 dark:text-emerald-400',
    medium: 'text-amber-600 dark:text-amber-400',
    high: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400',
  };

  return (
    <GlassCard className="col-span-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
            <Sun className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">Weather Skin Advisor</h3>
            {locationName && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {locationName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {advice?.weather_mood && <span className="text-sm font-medium">{advice.weather_mood}</span>}
          <Button variant="ghost" size="sm" onClick={fetchWeatherAndAdvice} disabled={loading || cooldownLeft > 0} title="Refresh" className="flex items-center gap-1">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {cooldownLeft > 0 && (
              <span className="text-xs text-gray-400">{Math.ceil(cooldownLeft / 1000)}s</span>
            )}
          </Button>
        </div>
      </div>

      {/* Manual city input */}
      {showCityInput && !loading && (
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter your city (e.g. London, New York...)"
            value={manualCity}
            onChange={(e) => setManualCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && manualCity.trim() && loadWeatherByCity(manualCity)}
            className="flex-1"
          />
          <Button
            onClick={() => manualCity.trim() && loadWeatherByCity(manualCity)}
            disabled={!manualCity.trim()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500"
          >
            <MapPin className="w-4 h-4 mr-1" /> Get Advice
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 justify-center">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <p className="text-gray-500 text-sm">Fetching weather & generating your skin briefing...</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        </div>
      )}

      {locationError && !loading && !showCityInput && (
        <div className="text-center py-3">
          <p className="text-sm text-amber-600 dark:text-amber-400">{locationError}</p>
        </div>
      )}

      <AnimatePresence>
        {weather && advice && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatPill icon={Thermometer} label="Temperature" value={`${weather.temperature}°C`} color="text-orange-500" />
              <StatPill icon={Droplets} label="Humidity" value={`${weather.humidity}%`} color="text-blue-500" />
              <StatPill icon={Wind} label="Wind" value={`${weather.wind_speed} km/h`} color="text-cyan-500" />
              <StatPill icon={Eye} label="Air Quality" value={weather.aqi ? `AQI ${weather.aqi}` : weather.condition} color="text-purple-500" />
            </div>

            <div className="flex items-center gap-3">
              <UVBadge uv={weather.uv_index} />
              <span className="text-sm text-gray-500 capitalize">{weather.condition}</span>
            </div>

            {/* Alert Banner */}
            <div className={`p-4 rounded-2xl border-2 ${severityColors[advice.alert_severity] || severityColors.medium}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${severityText[advice.alert_severity] || severityText.medium}`} />
                <div>
                  <p className={`font-bold text-sm ${severityText[advice.alert_severity] || severityText.medium}`}>Today's Skin Alert</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{advice.daily_alert}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {advice.quick_actions?.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-pink-500" /> Before You Leave Home
                </p>
                <div className="space-y-2">
                  {advice.quick_actions.map((action, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 p-2 bg-white/40 dark:bg-white/5 rounded-xl">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{action}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* SPF + Hydration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">☀️ SPF Today</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{advice.spf_recommendation}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">💧 Hydration</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{advice.hydration_tip}</p>
              </div>
            </div>

            {advice.product_adjustments && (
              <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-1">🔄 Routine Adjustment for Today</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{advice.product_adjustments}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {advice.skin_risks_today?.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Skin Risks Today</p>
                  <ul className="space-y-1">
                    {advice.skin_risks_today.map((r, i) => (
                      <li key={i} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1"><span>•</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {advice.avoid_today && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">🚫 Avoid Today</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{advice.avoid_today}</p>
                </div>
              )}
            </div>

            {advice.recovery_tip && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">🌙 Tonight's Recovery</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{advice.recovery_tip}</p>
              </div>
            )}

            {lastUpdated && (
              <p className="text-xs text-gray-400 text-right">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}