import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, CloudRain, Wind, Thermometer, Loader2, Shield,
  Droplets, AlertTriangle, RefreshCw, MapPin, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

function UVBadge({ uv }) {
  if (uv <= 2) return <Badge className="bg-emerald-500">UV Low ({uv})</Badge>;
  if (uv <= 5) return <Badge className="bg-yellow-500">UV Moderate ({uv})</Badge>;
  if (uv <= 7) return <Badge className="bg-orange-500">UV High ({uv})</Badge>;
  if (uv <= 10) return <Badge className="bg-red-500">UV Very High ({uv})</Badge>;
  return <Badge className="bg-purple-700">UV Extreme ({uv})</Badge>;
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function WeatherAdvisor({ skinAnalysis }) {
  const [weather, setWeather] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // Auto-load on mount
    fetchWeatherAndAdvice();
  }, []);

  const fetchWeatherAndAdvice = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await loadWeather(latitude, longitude);
      },
      (err) => {
        setLocationError('Location access denied. Enable location to get weather skin advice.');
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const loadWeather = async (lat, lon) => {
    // Use AI with internet to fetch weather data
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Fetch current real-time weather data for coordinates: latitude ${lat}, longitude ${lon}.

Return the CURRENT weather data including:
- City/location name
- Temperature in Celsius
- Humidity percentage
- UV index (current or forecasted)
- Air quality index (AQI) if available
- Weather condition (sunny, cloudy, rainy, etc.)
- Wind speed in km/h

Use current real data from weather APIs or your knowledge of current conditions.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          city: { type: "string" },
          temperature: { type: "number" },
          humidity: { type: "number" },
          uv_index: { type: "number" },
          aqi: { type: "number" },
          condition: { type: "string" },
          wind_speed: { type: "number" },
          feels_like: { type: "number" }
        }
      }
    });

    setWeather(result);
    setLocationName(result.city || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    await generateSkinAdvice(result);
  };

  const generateSkinAdvice = async (w) => {
    const skinContext = skinAnalysis
      ? `User has ${skinAnalysis.skin_type} skin (score ${skinAnalysis.overall_score}/100). Oiliness: ${skinAnalysis.oiliness}/10, Dryness: ${skinAnalysis.dryness}/10, Sensitivity: ${skinAnalysis.sensitivity}/10, Redness: ${skinAnalysis.redness}/10.`
      : 'No skin analysis available — give general advice for all skin types.';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatologist providing proactive, urgent skin advice based on today's weather.

CURRENT WEATHER:
- Location: ${w.city}
- Temperature: ${w.temperature}°C (feels like ${w.feels_like || w.temperature}°C)
- Humidity: ${w.humidity}%
- UV Index: ${w.uv_index} (0-11+ scale)
- Air Quality (AQI): ${w.aqi || 'unknown'}
- Condition: ${w.condition}
- Wind: ${w.wind_speed} km/h

PATIENT SKIN PROFILE: ${skinContext}

Generate PROACTIVE, URGENT, highly specific skin advice for today. Be like a dermatologist texting their patient a morning briefing.

Provide:
1. daily_alert: A punchy, urgent 1-sentence alert (e.g. "UV index is critically high today — reapply SPF every 90 minutes!")
2. alert_severity: "low", "medium", "high", "critical"
3. spf_recommendation: Specific SPF advice based on UV index (e.g. "Use SPF 50+ PA++++ today, reapply every 90 min")
4. hydration_tip: Weather-specific hydration advice for their skin type
5. product_adjustments: What to add or swap in their routine TODAY due to weather (e.g. "Switch to gel moisturizer — high humidity today makes cream too heavy")
6. skin_risks_today: Array of 2-3 specific skin risks from today's weather for their skin type
7. quick_actions: Array of 3-4 immediate actions to take before leaving home
8. recovery_tip: Evening recovery tip based on today's conditions
9. avoid_today: What to avoid today (ingredients, activities, products)
10. weather_mood: emoji + one word to summarize today's skin weather (e.g. "☀️ Hazardous", "🌧️ Protective", "💨 Drying")`,
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

    setAdvice(result);
    setLastUpdated(new Date());
    setLoading(false);
  };

  const severityColors = {
    low: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20',
    medium: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20',
    high: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
    critical: 'border-red-400 bg-red-50 dark:bg-red-900/20',
  };

  const severityTextColors = {
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
          {advice?.weather_mood && (
            <span className="text-sm font-medium">{advice.weather_mood}</span>
          )}
          <Button variant="ghost" size="icon" onClick={fetchWeatherAndAdvice} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 justify-center">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <p className="text-gray-500">Fetching your location's weather & generating skin advice...</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        </div>
      )}

      {locationError && !loading && (
        <div className="text-center py-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">{locationError}</p>
          <Button size="sm" onClick={fetchWeatherAndAdvice} variant="outline">
            <MapPin className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      )}

      <AnimatePresence>
        {weather && advice && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Weather Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatPill icon={Thermometer} label="Temperature" value={`${weather.temperature}°C`} color="text-orange-500" />
              <StatPill icon={Droplets} label="Humidity" value={`${weather.humidity}%`} color="text-blue-500" />
              <StatPill icon={Wind} label="Wind" value={`${weather.wind_speed} km/h`} color="text-cyan-500" />
              <StatPill icon={Eye} label="Air Quality" value={weather.aqi ? `AQI ${weather.aqi}` : weather.condition} color="text-purple-500" />
            </div>

            {/* UV Badge */}
            <div className="flex items-center gap-3">
              <UVBadge uv={weather.uv_index} />
              <span className="text-sm text-gray-500">{weather.condition}</span>
            </div>

            {/* Daily Alert Banner */}
            <div className={`p-4 rounded-2xl border-2 ${severityColors[advice.alert_severity] || severityColors.medium}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${severityTextColors[advice.alert_severity] || severityTextColors.medium}`} />
                <div>
                  <p className={`font-bold text-sm ${severityTextColors[advice.alert_severity] || severityTextColors.medium}`}>
                    Today's Skin Alert
                  </p>
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
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 p-2 bg-white/40 dark:bg-white/5 rounded-xl"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{action}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* SPF + Adjustments Row */}
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

            {/* Product Adjustments */}
            {advice.product_adjustments && (
              <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-1">🔄 Routine Adjustment for Today</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{advice.product_adjustments}</p>
              </div>
            )}

            {/* Skin Risks + Avoid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {advice.skin_risks_today?.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Skin Risks Today</p>
                  <ul className="space-y-1">
                    {advice.skin_risks_today.map((risk, i) => (
                      <li key={i} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1">
                        <span>•</span> {risk}
                      </li>
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

            {/* Evening Recovery */}
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