import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Activity, Calendar, Sparkles, AlertCircle, TrendingUp,
  Check, ChevronRight, Moon, Sun, Zap, Heart, Droplets
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format, addDays, differenceInDays } from 'date-fns';

const CYCLE_PHASES = [
  {
    phase: 'Menstrual', days: '1-5', icon: '🔴', color: 'from-red-400 to-rose-400',
    skin_changes: ['Increased sensitivity & redness', 'Lower estrogen = less collagen', 'Oiliness may decrease'],
    skincare: ['Skip actives (retinol, AHA, BHA)', 'Use calming, anti-inflammatory products', 'Gentle cleanser only', 'Extra moisture barrier support'],
    foods: ['Iron-rich foods', 'Anti-inflammatory omega-3', 'Dark chocolate (magnesium)', 'Chamomile tea']
  },
  {
    phase: 'Follicular', days: '6-13', icon: '🌱', color: 'from-emerald-400 to-teal-400',
    skin_changes: ['Rising estrogen = more collagen', 'Skin is at its BEST here', 'Natural glow peaks', 'Pores appear smaller'],
    skincare: ['Best time for active treatments', 'Introduce/increase retinol', 'Vitamin C for glow boost', 'Exfoliation is safe & effective'],
    foods: ['Fermented foods for gut health', 'Leafy greens', 'Seeds (flaxseed for estrogen)', 'Berries & antioxidants']
  },
  {
    phase: 'Ovulation', days: '14-16', icon: '✨', color: 'from-amber-400 to-yellow-400',
    skin_changes: ['Peak estrogen = maximum glow', 'Skin looks most radiant', 'May get slight oiliness increase', 'Natural lip plumpness increase'],
    skincare: ['Maintain active routine', 'Light oil-control if needed', 'This is your best selfie window!', 'Perfect time for professional treatments'],
    foods: ['Zinc-rich foods (pumpkin seeds)', 'Vitamin C foods', 'Anti-inflammatory turmeric', 'Collagen-boosting bone broth']
  },
  {
    phase: 'Luteal', days: '17-28', icon: '🌙', color: 'from-violet-400 to-purple-400',
    skin_changes: ['Progesterone rises = more oil production', 'Pre-menstrual breakouts likely', 'Pores look larger', 'Skin may feel congested'],
    skincare: ['Introduce BHA (salicylic acid) for congestion', 'Clay masks 2x/week', 'Lighter moisturizer', 'Spot treatments ready'],
    foods: ['Reduce dairy (acne trigger)', 'Reduce sugar', 'B6 for hormone balance', 'Magnesium-rich foods']
  }
];

export default function HormoneTracker() {
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [dayOfCycle, setDayOfCycle] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  const SYMPTOMS = ['Breakout', 'Oily skin', 'Dry skin', 'Sensitive', 'Dull skin', 'Puffiness', 'Dark circles', 'Redness', 'Tight pores'];

  useEffect(() => {
    const saved = localStorage.getItem('hormone-tracker');
    if (saved) {
      const data = JSON.parse(saved);
      setLastPeriod(data.lastPeriod || '');
      setCycleLength(data.cycleLength || 28);
    }
  }, []);

  useEffect(() => {
    if (!lastPeriod) return;
    const today = new Date();
    const periodDate = new Date(lastPeriod + 'T00:00:00');
    const day = differenceInDays(today, periodDate) + 1;
    setDayOfCycle(day);

    if (day <= 5) setCurrentPhase(CYCLE_PHASES[0]);
    else if (day <= 13) setCurrentPhase(CYCLE_PHASES[1]);
    else if (day <= 16) setCurrentPhase(CYCLE_PHASES[2]);
    else setCurrentPhase(CYCLE_PHASES[3]);

    localStorage.setItem('hormone-tracker', JSON.stringify({ lastPeriod, cycleLength }));
  }, [lastPeriod, cycleLength]);

  const toggleSymptom = (s) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const getAIAdvice = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `I'm on day ${dayOfCycle} of my cycle (${currentPhase?.phase} phase). I'm experiencing: ${symptoms.join(', ')}. Give me specific, science-backed skincare advice for today and the next 7 days, considering my hormonal cycle.`,
      response_json_schema: {
        type: 'object',
        properties: {
          today_priority: { type: 'string' },
          specific_advice: { type: 'array', items: { type: 'string' } },
          next_7_days_preview: { type: 'string' },
          ingredient_focus: { type: 'array', items: { type: 'string' } },
          avoid_now: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    setAiInsight(result);
    setGenerating(false);
  };

  const nextPeriod = lastPeriod ? format(addDays(new Date(lastPeriod + 'T00:00:00'), cycleLength), 'MMM d, yyyy') : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Activity className="w-7 h-7 text-rose-500" />Hormone Skin Tracker</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Sync your skincare routine with your hormonal cycle</p>
      </div>

      {/* Setup */}
      <GlassCard>
        <h3 className="font-bold mb-4">Cycle Setup</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-1">Last Period Start Date</p>
            <Input type="date" value={lastPeriod} onChange={e => setLastPeriod(e.target.value)} />
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Cycle Length: <span className="text-pink-500 font-bold">{cycleLength} days</span></p>
            <input type="range" min={21} max={35} value={cycleLength} onChange={e => setCycleLength(parseInt(e.target.value))}
              className="w-full accent-pink-500" />
          </div>
        </div>
        {nextPeriod && <p className="text-sm text-gray-500 mt-3">Next period estimated: <span className="font-medium text-rose-500">{nextPeriod}</span></p>}
      </GlassCard>

      {/* Current Phase */}
      {currentPhase && dayOfCycle && (
        <GlassCard className={`bg-gradient-to-r ${currentPhase.color} bg-opacity-10`}>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{currentPhase.icon}</span>
            <div>
              <p className="text-sm text-gray-500">Day {dayOfCycle} of cycle</p>
              <h2 className="text-2xl font-bold">{currentPhase.phase} Phase</h2>
              <p className="text-sm text-gray-500">Days {currentPhase.days}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white/50 dark:bg-white/10 rounded-xl">
              <p className="text-xs font-bold text-rose-500 mb-2">🔬 Skin Changes</p>
              {currentPhase.skin_changes.map((c, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1">• {c}</p>)}
            </div>
            <div className="p-3 bg-white/50 dark:bg-white/10 rounded-xl">
              <p className="text-xs font-bold text-blue-500 mb-2">🧴 Skincare Focus</p>
              {currentPhase.skincare.map((c, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1">• {c}</p>)}
            </div>
            <div className="p-3 bg-white/50 dark:bg-white/10 rounded-xl">
              <p className="text-xs font-bold text-emerald-500 mb-2">🥗 Foods for This Phase</p>
              {currentPhase.foods.map((c, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1">• {c}</p>)}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Cycle Timeline */}
      {lastPeriod && (
        <GlassCard>
          <h3 className="font-bold mb-4">Cycle Timeline</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CYCLE_PHASES.map((phase, i) => {
              const isCurrent = currentPhase?.phase === phase.phase;
              return (
                <div key={phase.phase} className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl min-w-[100px] ${isCurrent ? `bg-gradient-to-br ${phase.color} text-white` : 'bg-white/40 dark:bg-white/5'}`}>
                  <span className="text-2xl mb-1">{phase.icon}</span>
                  <p className="text-xs font-bold text-center">{phase.phase}</p>
                  <p className="text-xs opacity-70">Days {phase.days}</p>
                  {isCurrent && <Badge className="mt-1 bg-white/30 text-white text-xs">NOW</Badge>}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Symptoms Log */}
      {lastPeriod && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Today's Skin Symptoms</h3>
            <Button size="sm" onClick={getAIAdvice} disabled={generating || symptoms.length === 0} className="bg-gradient-to-r from-rose-500 to-pink-500">
              {generating ? <Sparkles className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
              Get AI Advice
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map(s => (
              <button key={s} onClick={() => toggleSymptom(s)}
                className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${symptoms.includes(s) ? 'bg-rose-500 text-white border-rose-500' : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* AI Insight */}
      {aiInsight && (
        <GlassCard className="border-rose-200 dark:border-rose-800">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-rose-400" />Personalized Advice for Today</h3>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl mb-3">
            <p className="text-xs font-bold text-rose-600 mb-1">🎯 Today's Priority</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{aiInsight.today_priority}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-blue-600 mb-1">✅ Do This Now</p>
              {aiInsight.specific_advice?.map((a, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1">• {a}</p>)}
            </div>
            <div>
              <p className="text-xs font-bold text-red-600 mb-1">🚫 Avoid Right Now</p>
              {aiInsight.avoid_now?.map((a, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300 mb-1">• {a}</p>)}
            </div>
          </div>
          {aiInsight.next_7_days_preview && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <p className="text-xs font-bold text-amber-600 mb-1">🔮 Next 7 Days</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{aiInsight.next_7_days_preview}</p>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}