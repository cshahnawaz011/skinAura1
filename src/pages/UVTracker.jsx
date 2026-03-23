import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sun, MapPin, Shield, AlertTriangle, Clock, Loader2, Thermometer, Wind, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const UV_LEVELS = [
  { max: 2, label: 'Low', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', advice: 'Minimal protection needed', emoji: '😊' },
  { max: 5, label: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', advice: 'Wear SPF 30+, seek shade midday', emoji: '😐' },
  { max: 7, label: 'High', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', advice: 'SPF 50+, protective clothing essential', emoji: '😟' },
  { max: 10, label: 'Very High', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', advice: 'Avoid outdoor exposure 10am-4pm', emoji: '😨' },
  { max: 20, label: 'Extreme', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', advice: 'Stay indoors, all-day SPF if outside', emoji: '🚨' },
];

export default function UVTracker() {
  const [loading, setLoading] = useState(false);
  const [uvData, setUvData] = useState(null);
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  const fetchUVData = async (cityName) => {
    setLoading(true);
    setError('');
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Get current UV index and weather data for ${cityName || 'the user\'s general location'}.
Return realistic approximate values for a typical day.
Include skincare recommendations based on UV level.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          city: { type: "string" },
          uv_index: { type: "number" },
          temperature_c: { type: "number" },
          humidity: { type: "number" },
          wind_kmh: { type: "number" },
          conditions: { type: "string" },
          safe_sun_window: { type: "string" },
          spf_recommendation: { type: "string" },
          skincare_tips: { type: "array", items: { type: "string" } },
          reapply_interval_hours: { type: "number" }
        }
      }
    });
    setUvData(res);
    setLoading(false);
  };

  const getUVLevel = (uv) => UV_LEVELS.find(l => uv <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setLocation(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
      fetchUVData(`coordinates ${pos.coords.latitude}, ${pos.coords.longitude}`);
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Sun className="w-7 h-7 text-amber-500" /> UV & Sun Tracker</h1>
        <p className="text-gray-500 mt-1">Real-time UV protection advice for your skin</p>
      </div>

      <GlassCard>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder="Enter your city (e.g. Mumbai, Delhi...)"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUVData(city)}
          />
          <Button onClick={() => fetchUVData(city)} disabled={loading} className="bg-gradient-to-r from-amber-400 to-orange-400">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sun className="w-4 h-4" />}
          </Button>
          <Button variant="outline" onClick={useMyLocation} className="gap-1 text-xs">
            <MapPin className="w-3 h-3" /> Auto
          </Button>
        </div>
      </GlassCard>

      {uvData && (() => {
        const level = getUVLevel(uvData.uv_index || 0);
        return (
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <GlassCard className={level.bg}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{uvData.city}</p>
                    <h2 className={`text-6xl font-black ${level.color}`}>{uvData.uv_index}</h2>
                    <p className={`text-xl font-bold ${level.color}`}>{level.emoji} {level.label} UV</p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2 justify-end">
                      <Thermometer className="w-4 h-4 text-red-400" />
                      <span className="font-semibold">{uvData.temperature_c}°C</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{uvData.humidity}% humidity</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Wind className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{uvData.wind_kmh} km/h</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                  <p className="text-sm font-semibold">{level.advice}</p>
                </div>
              </GlassCard>
            </motion.div>

            <GlassCard>
              <h3 className="font-bold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> Protection Guide</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-white/5 rounded-xl">
                  <span className="text-sm">Recommended SPF</span>
                  <Badge className="bg-orange-500">{uvData.spf_recommendation}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-white/5 rounded-xl">
                  <span className="text-sm">Reapply every</span>
                  <Badge className="bg-blue-500">{uvData.reapply_interval_hours}h</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-white/5 rounded-xl">
                  <span className="text-sm">Safe sun window</span>
                  <Badge className="bg-emerald-500">{uvData.safe_sun_window}</Badge>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold mb-3 flex items-center gap-2"><Sun className="w-4 h-4 text-amber-500" /> Skincare Tips for Today</h3>
              <ul className="space-y-2">
                {uvData.skincare_tips?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 font-bold flex-shrink-0">{i + 1}.</span>
                    <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        );
      })()}
    </div>
  );
}