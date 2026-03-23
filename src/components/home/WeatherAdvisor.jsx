import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Wind, Thermometer, Loader2, Shield,
  Droplets, AlertTriangle, RefreshCw, MapPin, Eye,
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

function UVBadge({ uv }) {
  if (!uv && uv !== 0) return null;
  if (uv <= 2) return <Badge className="bg-emerald-500 text-white">UV Low ({uv})</Badge>;
  if (uv <= 5) return <Badge className="bg-yellow-500 text-white">UV Moderate ({uv})</Badge>;
  if (uv <= 7) return <Badge className="bg-orange-500 text-white">UV High ({uv})</Badge>;
  if (uv <= 10) return <Badge className="bg-red-500 text-white">UV Very High ({uv})</Badge>;
  return <Badge className="bg-purple-700 text-white">UV Extreme ({uv})</Badge>;
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/30">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

// Collapsible section
function CollapseSection({ title, children, defaultOpen = false, accent = 'pink' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/20 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-semibold">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CACHE_KEY = 'glowai_weather_cache';
const CACHE_DURATION_MS = 3 * 60 * 1000;

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

  // Load from cache on mount — NO auto-fetch
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        setWeather(cached.weather);
        setAdvice(cached.advice);
        setLocationName(cached.locationName);
        setLastUpdated(new Date(cached.timestamp));
        const remaining = CACHE_DURATION_MS - (Date.now() - cached.timestamp);
        setCooldownLeft(remaining);
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
      () => fetchLocationByIP(),
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const fetchLocationByIP = async () => {
    try {
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
    let cityName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { 'Accept-Language': 'en' } });
      const geoData = await geoRes.json();
      cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || cityName;
      const countryCode = geoData.address?.country_code?.toUpperCase();
      if (countryCode) setLanguageFromCountry(countryCode);
    } catch {}

    setLocationName(cityName);
    const userLang = LANG_NAMES[localStorage.getItem('glowai-lang') || 'en'] || 'English';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Get current real-time weather for "${cityName}" (GPS: lat=${lat}, lon=${lon}). Return: city, temperature (°C), feels_like (°C), humidity (%), uv_index (0-11), aqi, condition (one word), wind_speed (km/h). Respond in ${userLang}.`,
      add_context_from_internet: true,
      response_json_schema: { type: "object", properties: { city: {type:"string"}, temperature:{type:"number"}, feels_like:{type:"number"}, humidity:{type:"number"}, uv_index:{type:"number"}, aqi:{type:"number"}, condition:{type:"string"}, wind_speed:{type:"number"} } }
    });
    result.city = cityName;
    await generateSkinAdvice(result);
  };

  const loadWeatherByCity = async (city) => {
    if (!loading) setLoading(true);
    setLocationError(null);
    const userLang = LANG_NAMES[localStorage.getItem('glowai-lang') || 'en'] || 'English';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Get current real-time weather for "${city}". Return: city, temperature (°C), feels_like (°C), humidity (%), uv_index (0-11), aqi, condition (one word), wind_speed (km/h). Respond in ${userLang}.`,
      add_context_from_internet: true,
      response_json_schema: { type: "object", properties: { city:{type:"string"}, temperature:{type:"number"}, feels_like:{type:"number"}, humidity:{type:"number"}, uv_index:{type:"number"}, aqi:{type:"number"}, condition:{type:"string"}, wind_speed:{type:"number"} } }
    });
    setLocationName(result.city || city);
    setShowCityInput(false);
    await generateSkinAdvice(result);
  };

  const generateSkinAdvice = async (w) => {
    const skinContext = skinAnalysis
      ? `Patient has ${skinAnalysis.skin_type} skin (score ${skinAnalysis.overall_score}/100). Oiliness: ${skinAnalysis.oiliness}/10, Dryness: ${skinAnalysis.dryness}/10, Sensitivity: ${skinAnalysis.sensitivity}/10, Redness: ${skinAnalysis.redness}/10, Acne: ${skinAnalysis.acne_level}/10.`
      : 'No skin profile — give general advice for all skin types.';
    const userLang = LANG_NAMES[localStorage.getItem('glowai-lang') || 'en'] || 'English';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatologist sending a morning skin briefing to a patient. Respond entirely in ${userLang}.
TODAY'S WEATHER in ${w.city}: Temp: ${w.temperature}°C (feels ${w.feels_like || w.temperature}°C), Humidity: ${w.humidity}%, UV: ${w.uv_index}/11, AQI: ${w.aqi || 'unknown'}, Condition: ${w.condition}, Wind: ${w.wind_speed} km/h
SKIN PROFILE: ${skinContext}
Provide urgent, specific, proactive skin advice. 1. daily_alert 2. alert_severity: "low"|"medium"|"high"|"critical" 3. spf_recommendation 4. hydration_tip 5. product_adjustments 6. skin_risks_today (2-3) 7. quick_actions (3-4) 8. recovery_tip 9. avoid_today 10. weather_mood: emoji+word`,
      response_json_schema: { type:"object", properties: { daily_alert:{type:"string"}, alert_severity:{type:"string"}, spf_recommendation:{type:"string"}, hydration_tip:{type:"string"}, product_adjustments:{type:"string"}, skin_risks_today:{type:"array",items:{type:"string"}}, quick_actions:{type:"array",items:{type:"string"}}, recovery_tip:{type:"string"}, avoid_today:{type:"string"}, weather_mood:{type:"string"} } }
    });

    setWeather(w);
    setAdvice(result);
    const now = new Date();
    setLastUpdated(now);
    setLoading(false);
    setCooldownLeft(CACHE_DURATION_MS);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ weather: w, advice: result, locationName: w.city, timestamp: now.getTime() }));
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-400/30">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-1">
              Weather Skin Advisor
              {advice?.weather_mood && <span className="ml-1">{advice.weather_mood}</span>}
            </h3>
            {locationName && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {locationName}
                {lastUpdated && <span className="ml-1 text-gray-400">· {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={fetchWeatherAndAdvice}
          disabled={loading || cooldownLeft > 0}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 shadow-md shadow-cyan-400/30 flex items-center gap-2"
          size="sm"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</>
          ) : cooldownLeft > 0 ? (
            <><RefreshCw className="w-4 h-4" /> {Math.ceil(cooldownLeft / 1000)}s</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {weather ? 'Refresh' : 'Get Weather Advice'}</>
          )}
        </Button>
      </div>

      {/* Manual city input */}
      {showCityInput && !loading && (
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter your city (e.g. Mumbai, London...)"
            value={manualCity}
            onChange={(e) => setManualCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && manualCity.trim() && loadWeatherByCity(manualCity)}
            className="flex-1"
          />
          <Button onClick={() => manualCity.trim() && loadWeatherByCity(manualCity)} disabled={!manualCity.trim()} className="bg-gradient-to-r from-blue-500 to-cyan-500">
            <MapPin className="w-4 h-4 mr-1" /> Go
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3 py-6">
          <div className="flex items-center gap-3 justify-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-gray-500 text-sm">Fetching weather & crafting your skin briefing...</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse" />)}
          </div>
        </div>
      )}

      {locationError && !loading && !showCityInput && (
        <p className="text-sm text-amber-600 dark:text-amber-400 text-center py-3">{locationError}</p>
      )}

      {/* Empty state */}
      {!weather && !loading && !showCityInput && (
        <div className="text-center py-8 space-y-2">
          <Sun className="w-12 h-12 mx-auto text-amber-300 opacity-50" />
          <p className="text-sm text-gray-400">Tap "Get Weather Advice" for real-time skin briefing based on your local weather.</p>
        </div>
      )}

      {/* Results — Collapsible sections */}
      <AnimatePresence>
        {weather && advice && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Stats pills */}
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

            {/* Alert Banner — always visible */}
            <div className={`p-4 rounded-2xl border-2 ${severityColors[advice.alert_severity] || severityColors.medium}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${severityText[advice.alert_severity] || severityText.medium}`} />
                <div>
                  <p className={`font-bold text-sm ${severityText[advice.alert_severity] || severityText.medium}`}>Today's Skin Alert</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{advice.daily_alert}</p>
                </div>
              </div>
            </div>

            {/* Collapsible: Quick Actions */}
            {advice.quick_actions?.length > 0 && (
              <CollapseSection title={`🛡️ Before You Leave Home (${advice.quick_actions.length} steps)`} defaultOpen={true}>
                <div className="space-y-2">
                  {advice.quick_actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-white/40 dark:bg-white/5 rounded-xl">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow shadow-pink-400/30">
                        <span className="text-white text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{action}</p>
                    </div>
                  ))}
                </div>
              </CollapseSection>
            )}

            {/* Collapsible: SPF & Hydration */}
            <CollapseSection title="☀️ SPF & Hydration Advice">
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
            </CollapseSection>

            {/* Collapsible: Routine & Risks */}
            <CollapseSection title="🔄 Routine Adjustments & Risks">
              <div className="space-y-3">
                {advice.product_adjustments && (
                  <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-1">🔄 Routine Adjustment</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{advice.product_adjustments}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {advice.skin_risks_today?.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Skin Risks</p>
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
              </div>
            </CollapseSection>

            {/* Collapsible: Evening Recovery */}
            {advice.recovery_tip && (
              <CollapseSection title="🌙 Evening Recovery Routine">
                <p className="text-sm text-gray-700 dark:text-gray-300">{advice.recovery_tip}</p>
              </CollapseSection>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}