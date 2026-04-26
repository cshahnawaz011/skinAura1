import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, ChevronDown, ChevronUp, MapPin, Loader2, RefreshCw, Wind, Droplets, Sun, Thermometer } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

function getSkinModeFromWeather(temp, humidity, uvIndex, weatherCode) {
  const isRainy = weatherCode >= 51 && weatherCode <= 82;
  if (isRainy) return {
    emoji: '🌧️', label: 'Monsoon Mode', color: '#38bdf8',
    rec: 'Use clarifying cleanser. Skip heavy creams — high humidity traps oil. Oil-control toner recommended.',
    warning: humidity > 80 ? '⚠️ Very high humidity — avoid occlusives tonight' : null,
  };
  if (temp >= 35) return {
    emoji: '🔥', label: 'Extreme Heat', color: '#ef4444',
    rec: 'SPF 50+ mandatory. Lightweight gel moisturizer only. Mist face every 2 hrs. Avoid actives in morning.',
    warning: uvIndex >= 8 ? '🚨 UV is very high — reapply SPF every 2 hours' : null,
  };
  if (temp >= 28) return {
    emoji: '☀️', label: 'Summer Mode', color: '#f59e0b',
    rec: 'Lightweight gel moisturizer, SPF 50+, avoid heavy actives midday. Vitamin C in AM for UV protection.',
    warning: uvIndex >= 6 ? '⚠️ High UV — SPF is non-negotiable today' : null,
  };
  if (temp <= 10) return {
    emoji: '❄️', label: 'Winter Mode', color: '#818cf8',
    rec: 'Ceramide-rich cream, add facial oil. Skip harsh exfoliation. Double moisturize — serum + cream.',
    warning: humidity < 30 ? '⚠️ Very dry air — use humidifier if possible' : null,
  };
  if (temp <= 20) return {
    emoji: '🌸', label: 'Spring/Cool Mode', color: '#34d399',
    rec: 'Vitamin C in AM. Gradually increase active frequency. Balanced moisturizer.',
    warning: null,
  };
  return {
    emoji: '🌤️', label: 'Mild Weather', color: '#a78bfa',
    rec: 'Balanced routine. Lightweight moisturizer + SPF. Good day to introduce a new active at low frequency.',
    warning: null,
  };
}

function getUVLabel(uv) {
  if (uv <= 2) return { label: 'Low', color: '#34d399' };
  if (uv <= 5) return { label: 'Moderate', color: '#facc15' };
  if (uv <= 7) return { label: 'High', color: '#fb923c' };
  if (uv <= 10) return { label: 'Very High', color: '#ef4444' };
  return { label: 'Extreme', color: '#7c3aed' };
}

export default function SeasonalSynthesisCard() {
  const [open, setOpen] = useState(true);
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hourlyTrend, setHourlyTrend] = useState([]);
  const [source, setSource] = useState('');

  const fetchWeatherByCoords = async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,uv_index&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    const data = await res.json();
    const current = data.current;
    setWeather({
      temp: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      uvIndex: current.uv_index ?? 0,
      weatherCode: current.weather_code,
      wind: current.wind_speed_10m,
    });
    const hours = data.hourly;
    const now = new Date().getHours();
    const trend = [];
    for (let i = Math.max(0, now - 3); i <= Math.min(23, now + 4); i++) {
      trend.push({
        time: `${i}:00`,
        temp: hours.temperature_2m[i],
        humidity: hours.relative_humidity_2m[i],
        uv: hours.uv_index[i] ?? 0,
      });
    }
    setHourlyTrend(trend);
  };

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    setWeather(null);

    // Step 1 — GPS (works on real HTTPS devices)
    const tryGPS = () => new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject('no_geo');
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });

    try {
      const pos = await tryGPS();
      const { latitude, longitude } = pos.coords;
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const geoData = await geoRes.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Location';
        setLocation({ city, lat: latitude, lon: longitude });
      } catch {
        setLocation({ city: 'Your Location', lat: latitude, lon: longitude });
      }
      setSource('GPS');
      await fetchWeatherByCoords(latitude, longitude);
      setLoading(false);
      return;
    } catch {
      // GPS unavailable — try IP fallback
    }

    // Step 2 — IP-based fallback (works in preview/browser without permission)
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      if (ipData.latitude && ipData.longitude) {
        setLocation({ city: ipData.city || ipData.region || 'Your Location', lat: ipData.latitude, lon: ipData.longitude });
        setSource('IP');
        await fetchWeatherByCoords(ipData.latitude, ipData.longitude);
        setLoading(false);
        return;
      }
    } catch {
      // IP also failed
    }

    setError('Location detect nahi hua. Browser mein location allow karein.');
    setLoading(false);
  };

  useEffect(() => { fetchLocation(); }, []);

  const mode = weather
    ? getSkinModeFromWeather(weather.temp, weather.humidity, weather.uvIndex, weather.weatherCode)
    : { emoji: '🌤️', label: 'Loading…', color: '#a78bfa', rec: '', warning: null };

  const uvInfo = weather ? getUVLabel(weather.uvIndex) : null;

  return (
    <div className="rounded-2xl border-2 overflow-hidden"
      style={{ borderColor: `${mode.color}40`, background: 'rgba(255,255,255,0.95)' }}>

      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${mode.color}15` }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: mode.color }} /> : mode.emoji}
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Real-Time Weather Skin Synthesis</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400">
                {loading ? 'Detecting location…' : location ? `${location.city} ${source === 'IP' ? '(IP-based)' : '(GPS)'}` : 'Location unavailable'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); fetchLocation(); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {!loading && weather && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: mode.color }}>{mode.label}</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">

              {loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                  <p className="text-sm text-gray-500">Location aur weather detect ho raha hai…</p>
                </div>
              )}

              {error && !loading && (
                <div className="rounded-xl p-4 bg-red-50 border border-red-200 text-center space-y-2">
                  <p className="text-xs font-bold text-red-600">📍 {error}</p>
                  <button onClick={fetchLocation}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500">
                    Retry
                  </button>
                </div>
              )}

              {weather && !loading && (
                <>
                  {mode.warning && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs font-bold text-amber-700">{mode.warning}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-xl p-2.5 text-center bg-orange-50 border border-orange-100">
                      <Thermometer className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                      <p className="text-base font-black text-orange-600">{Math.round(weather.temp)}°</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Temp</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center bg-sky-50 border border-sky-100">
                      <Droplets className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                      <p className="text-base font-black text-sky-600">{weather.humidity}%</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Humidity</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center bg-amber-50 border border-amber-100">
                      <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-base font-black" style={{ color: uvInfo?.color }}>{weather.uvIndex?.toFixed(1)}</p>
                      <p className="text-[9px] font-bold mt-0.5" style={{ color: uvInfo?.color }}>{uvInfo?.label}</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center bg-gray-50 border border-gray-100">
                      <Wind className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-base font-black text-gray-600">{Math.round(weather.wind)}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">km/h</p>
                    </div>
                  </div>

                  {hourlyTrend.length > 0 && (
                    <div className="rounded-xl p-3 bg-white border border-gray-100">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Today's Hourly Trend</p>
                      <ResponsiveContainer width="100%" height={72}>
                        <AreaChart data={hourlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="tempGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="humidGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                          <Area type="monotone" dataKey="temp" stroke="#fb923c" strokeWidth={2} fill="url(#tempGrad2)" name="Temp °C" dot={false} />
                          <Area type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} fill="url(#humidGrad2)" name="Humidity %" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="rounded-xl p-3 flex items-start gap-2"
                    style={{ background: `${mode.color}0e`, border: `1px solid ${mode.color}30` }}>
                    <Cloud className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: mode.color }} />
                    <div>
                      <p className="text-[10px] font-black mb-0.5" style={{ color: mode.color }}>Aaj ki Skin Recommendation</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{mode.rec}</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 text-right">
                    📡 Live · Open-Meteo · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}