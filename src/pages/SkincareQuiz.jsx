import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, Sparkles, Loader2, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/ui/GlassCard';

const QUESTIONS = [
  { id: 'skin_feel', q: 'How does your skin feel mid-day?', opts: ['Tight & dry', 'Normal', 'Oily all over', 'Oily T-zone, dry cheeks', 'Sensitive & reactive'] },
  { id: 'pore_size', q: 'How visible are your pores?', opts: ['Very small/invisible', 'Noticeable on nose', 'Large & visible', 'Very large & clogged'] },
  { id: 'breakouts', q: 'How often do you get breakouts?', opts: ['Almost never', 'Once a month', 'Weekly', 'Daily', 'Mostly around periods'] },
  { id: 'after_wash', q: 'After washing your face it feels:', opts: ['Comfortable', 'Dry & tight', 'Still oily', 'Clean but sensitive', 'Flaky'] },
  { id: 'lifestyle', q: 'Your biggest lifestyle challenge:', opts: ['Lack of sleep', 'High stress', 'Poor diet', 'No exercise', 'Dehydration'] },
  { id: 'concern', q: 'Your #1 skin concern:', opts: ['Acne & breakouts', 'Dark spots', 'Wrinkles & aging', 'Redness', 'Dullness', 'Large pores'] },
  { id: 'routine', q: 'Current routine:', opts: ['None', 'Just cleanser', 'Basic 3-step', 'Full AM+PM', 'Occasional'] },
  { id: 'products', q: 'How does your skin react to new products?', opts: ['Fine usually', 'Sometimes breaks out', 'Irritated often', 'Rarely react', 'Very sensitive'] },
];

export default function SkincareQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const current = QUESTIONS[step];
  const progress = (step / QUESTIONS.length) * 100;

  const answer = async (opt) => {
    const newAnswers = { ...answers, [current.id]: opt };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      setLoading(true);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this skincare quiz: ${JSON.stringify(newAnswers)}
Determine: skin type, top 3 concerns, recommended routine steps, 5 key ingredients, 3 products to try.`,
        response_json_schema: {
          type: "object",
          properties: {
            skin_type: { type: "string" },
            skin_profile: { type: "string" },
            top_concerns: { type: "array", items: { type: "string" } },
            routine_steps: { type: "array", items: { type: "string" } },
            key_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, why: { type: "string" } } } },
            avoid_ingredients: { type: "array", items: { type: "string" } },
            lifestyle_tips: { type: "array", items: { type: "string" } },
            verdict: { type: "string" }
          }
        }
      });
      if (user) {
        await base44.entities.QuizResult.create({ user_email: user.email, skin_type: res.skin_type, concerns: res.top_concerns, recommendations: res.routine_steps });
      }
      setResult(res);
      setLoading(false);
    }
  };

  const reset = () => { setStep(0); setAnswers({}); setResult(null); };

  if (loading) return (
    <div className="max-w-lg mx-auto flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Analyzing your skin profile...</p>
      </div>
    </div>
  );

  if (result) return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassCard className="text-center bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          <h2 className="text-2xl font-black mb-1">Your Skin Type: <span className="text-pink-500 capitalize">{result.skin_type}</span></h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">{result.verdict}</p>
        </GlassCard>
      </motion.div>

      <GlassCard>
        <h3 className="font-bold mb-2">Top Concerns</h3>
        <div className="flex gap-2 flex-wrap">{result.top_concerns?.map((c, i) => <Badge key={i} className="bg-pink-500">{c}</Badge>)}</div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold mb-2">🧴 Recommended Routine</h3>
        {result.routine_steps?.map((s, i) => <p key={i} className="text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">{i+1}. {s}</p>)}
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold mb-3">⭐ Key Ingredients for You</h3>
        <div className="space-y-2">
          {result.key_ingredients?.map((ing, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-white/50 dark:bg-white/5 rounded-xl">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div><p className="text-sm font-semibold">{ing.name}</p><p className="text-xs text-gray-500">{ing.why}</p></div>
            </div>
          ))}
        </div>
      </GlassCard>

      {result.avoid_ingredients?.length > 0 && (
        <GlassCard className="bg-red-50 dark:bg-red-900/20">
          <h3 className="font-bold text-red-600 mb-2">❌ Avoid These</h3>
          <div className="flex gap-1 flex-wrap">{result.avoid_ingredients.map((a, i) => <Badge key={i} className="bg-red-500 text-xs">{a}</Badge>)}</div>
        </GlassCard>
      )}

      <Button onClick={reset} variant="outline" className="w-full gap-2"><RefreshCw className="w-4 h-4" /> Retake Quiz</Button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><HelpCircle className="w-7 h-7 text-pink-500" /> Skin Type Quiz</h1>
        <p className="text-gray-500 mt-1">8 questions to unlock your personalized skin profile</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Question {step + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <GlassCard>
            <h2 className="text-xl font-bold mb-6">{current.q}</h2>
            <div className="space-y-2">
              {current.opts.map(opt => (
                <button key={opt} onClick={() => answer(opt)}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all flex items-center justify-between group">
                  <span className="text-sm font-medium">{opt}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-pink-400" />
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="text-gray-400">← Back</Button>
      )}
    </div>
  );
}