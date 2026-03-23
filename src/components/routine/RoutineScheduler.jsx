import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Clock, Sun, Moon, Zap, Calendar, Check, Bell, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const TIME_PRESETS = {
  morning: [
    { label: 'Early Bird', time: '06:00', icon: '🐦', desc: 'Best for busy schedules' },
    { label: 'Standard', time: '07:30', icon: '☀️', desc: 'Most popular' },
    { label: 'Relaxed', time: '09:00', icon: '🌅', desc: 'Weekends or WFH' },
  ],
  night: [
    { label: 'Early Night', time: '20:00', icon: '🌙', desc: 'For early sleepers' },
    { label: 'Standard', time: '21:30', icon: '✨', desc: 'Most popular' },
    { label: 'Late Night', time: '23:00', icon: '🌟', desc: 'Night owls' },
  ]
};

const ROUTINE_TIPS = {
  morning: [
    '⏰ Apply vitamin C 20 mins before sunscreen for best results',
    '💧 Drink a glass of water before starting your routine',
    '🧊 Use cold water for the final rinse to close pores',
    '☀️ Never skip SPF, even on cloudy days',
  ],
  night: [
    '🌙 Night is when skin repairs — actives work best now',
    '⏳ Apply retinol last to reduce irritation',
    '💤 Clean pillowcase = clearer skin',
    '🧴 Layer thinnest to thickest products',
  ]
};

export default function RoutineScheduler({ routine, routineType, onSave }) {
  const [selectedTime, setSelectedTime] = useState(routine?.reminder_time || (routineType === 'morning' ? '07:30' : '21:30'));
  const [enabled, setEnabled] = useState(routine?.reminder_enabled || false);
  const [saved, setSaved] = useState(false);
  const [aiSchedule, setAiSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    onSave({ ...routine, reminder_time: selectedTime, reminder_enabled: enabled });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getSmartSchedule = async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `A user wants to schedule their ${routineType} skincare routine.
Their routine has ${routine?.steps?.length || 5} steps and takes about ${routine?.total_time || '15 minutes'}.
Based on typical lifestyle patterns, suggest:
- optimal_time: best time (HH:MM format)
- reason: why this time is ideal (1 sentence)
- tips: 2 short tips to make the routine a habit
Respond for ${routineType} routine.`,
      response_json_schema: {
        type: "object",
        properties: {
          optimal_time: { type: "string" },
          reason: { type: "string" },
          tips: { type: "array", items: { type: "string" } }
        }
      }
    });
    setAiSchedule(res);
    setSelectedTime(res.optimal_time);
    setLoading(false);
  };

  const tips = ROUTINE_TIPS[routineType] || [];
  const isMorning = routineType === 'morning';

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMorning ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
          {isMorning ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </div>
        <div>
          <h3 className="font-bold">Smart Routine Scheduler</h3>
          <p className="text-xs text-gray-500">Set reminders & build the habit</p>
        </div>
      </div>

      {/* Time Presets */}
      <div>
        <p className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">Quick Presets</p>
        <div className="grid grid-cols-3 gap-2">
          {TIME_PRESETS[routineType].map((preset) => (
            <button
              key={preset.time}
              onClick={() => setSelectedTime(preset.time)}
              className={`p-2 rounded-xl border-2 text-center transition-all ${
                selectedTime === preset.time
                  ? `border-pink-400 ${isMorning ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`
                  : 'border-gray-200 dark:border-gray-700 hover:border-pink-200'
              }`}
            >
              <div className="text-xl mb-1">{preset.icon}</div>
              <p className="text-xs font-bold">{preset.label}</p>
              <p className="text-xs text-gray-400">{preset.time}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Time */}
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <Input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="flex-1" />
        <Button size="sm" variant="outline" onClick={getSmartSchedule} disabled={loading} className="gap-1 flex-shrink-0">
          <BrainCircuit className="w-3 h-3" />
          {loading ? 'AI...' : 'AI Pick'}
        </Button>
      </div>

      {/* AI Suggestion */}
      {aiSchedule && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-700">
          <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3" /> AI Recommendation: {aiSchedule.optimal_time}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">{aiSchedule.reason}</p>
          {aiSchedule.tips?.map((tip, i) => (
            <p key={i} className="text-xs text-gray-500 mt-1">• {tip}</p>
          ))}
        </motion.div>
      )}

      {/* Enable Reminder Toggle */}
      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl">
        <div className="flex items-center gap-2">
          <Bell className={`w-4 h-4 ${enabled ? 'text-pink-500' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">{enabled ? 'Reminder ON' : 'Enable Reminder'}</span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`w-12 h-6 rounded-full transition-all relative ${enabled ? 'bg-pink-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {/* Pro Tips */}
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Routine Tips</p>
        {tips.map((tip, i) => (
          <p key={i} className="text-xs text-gray-600 dark:text-gray-400">{tip}</p>
        ))}
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        className={`w-full ${isMorning ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
      >
        {saved ? <><Check className="w-4 h-4 mr-2" /> Saved!</> : <><Calendar className="w-4 h-4 mr-2" /> Save Schedule</>}
      </Button>
    </GlassCard>
  );
}