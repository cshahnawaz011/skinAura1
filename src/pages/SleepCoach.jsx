import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Moon, Star, Loader2, TrendingUp, Zap, Clock, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function SleepCoach() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: weekLogs = [] } = useQuery({
    queryKey: ['sleepLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 14),
    enabled: !!user?.email,
  });

  const avgSleep = weekLogs.length ? (weekLogs.reduce((a, l) => a + (l.sleep_hours || 0), 0) / weekLogs.length).toFixed(1) : 0;
  const sleepData = weekLogs.slice(0, 7).reverse().map(l => ({
    day: new Date(l.log_date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
    hours: l.sleep_hours || 0,
    stress: l.stress_level || 0,
  }));

  const getAdvice = async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Sleep coach for skin health. User sleeps ${sleepHours} hours, quality ${sleepQuality}/5.
Average over past week: ${avgSleep} hours. 
Provide personalized sleep advice for better skin.`,
      response_json_schema: {
        type: "object",
        properties: {
          sleep_score: { type: "number" },
          skin_impact: { type: "string" },
          bedtime_routine: { type: "array", items: { type: "string" } },
          foods_to_avoid: { type: "array", items: { type: "string" } },
          foods_to_eat: { type: "array", items: { type: "string" } },
          quick_tips: { type: "array", items: { type: "string" } },
          ideal_bedtime: { type: "string" },
          ideal_wake_time: { type: "string" }
        }
      }
    });
    setAdvice(res);
    setLoading(false);
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto">
      <GlassCard className="text-center py-12">
        <Moon className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sleep Coach</h2>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-indigo-500 to-purple-500">Sign In</Button>
      </GlassCard>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Moon className="w-7 h-7 text-indigo-500" /> Sleep Coach</h1>
        <p className="text-gray-500 mt-1">Better sleep = better skin. Your personal sleep optimizer.</p>
      </div>

      {/* Sleep Stats */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="text-center">
          <Moon className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
          <p className="text-3xl font-bold text-indigo-500">{avgSleep}</p>
          <p className="text-xs text-gray-500">Avg hrs/night (2 weeks)</p>
        </GlassCard>
        <GlassCard className="text-center">
          <Star className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-3xl font-bold text-amber-500">{avgSleep >= 7 ? '😊' : avgSleep >= 6 ? '😐' : '😟'}</p>
          <p className="text-xs text-gray-500">{avgSleep >= 7 ? 'Great sleep!' : avgSleep >= 6 ? 'Needs improvement' : 'Poor sleep — affects skin!'}</p>
        </GlassCard>
      </div>

      {/* Weekly Chart */}
      {sleepData.length > 1 && (
        <GlassCard>
          <h3 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Sleep This Week</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData}>
                <XAxis dataKey="day" fontSize={11} />
                <YAxis domain={[0, 12]} fontSize={11} />
                <Tooltip />
                <Bar dataKey="hours" fill="#6366f1" name="Sleep hours" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Input */}
      <GlassCard>
        <h3 className="font-bold mb-4 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-violet-500" /> Get Sleep Advice</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Last night's sleep</label>
              <span className="font-bold text-indigo-500">{sleepHours}h</span>
            </div>
            <Slider value={[sleepHours]} onValueChange={([v]) => setSleepHours(v)} min={1} max={12} step={0.5} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Sleep quality</label>
              <span className="font-bold text-amber-500">{sleepQuality}/5</span>
            </div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(q => (
                <button key={q} onClick={() => setSleepQuality(q)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${sleepQuality >= q ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {['😩','😔','😐','🙂','😄'][q-1]}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={getAdvice} disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</> : <><Zap className="w-4 h-4 mr-2" /> Get AI Sleep Advice</>}
          </Button>
        </div>
      </GlassCard>

      {advice && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <GlassCard className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">Sleep Score: {advice.sleep_score}/100</h3>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-sm">{advice.ideal_bedtime} → {advice.ideal_wake_time}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{advice.skin_impact}</p>
          </GlassCard>

          <GlassCard>
            <h4 className="font-bold mb-2 text-indigo-600">🌙 Bedtime Routine</h4>
            {advice.bedtime_routine?.map((item, i) => <p key={i} className="text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">{i+1}. {item}</p>)}
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <GlassCard>
              <h4 className="font-bold mb-2 text-emerald-600 text-sm">✅ Eat Before Bed</h4>
              {advice.foods_to_eat?.map((f, i) => <Badge key={i} className="bg-emerald-500 mr-1 mb-1 text-xs">{f}</Badge>)}
            </GlassCard>
            <GlassCard>
              <h4 className="font-bold mb-2 text-red-600 text-sm">❌ Avoid</h4>
              {advice.foods_to_avoid?.map((f, i) => <Badge key={i} className="bg-red-500 mr-1 mb-1 text-xs">{f}</Badge>)}
            </GlassCard>
          </div>

          <GlassCard>
            <h4 className="font-bold mb-2">💡 Quick Tips</h4>
            {advice.quick_tips?.map((tip, i) => <p key={i} className="text-sm text-gray-600 dark:text-gray-300 py-1">• {tip}</p>)}
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}