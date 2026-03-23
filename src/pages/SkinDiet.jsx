import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Apple, Loader2, Sparkles, ChevronDown, ChevronUp, Flame, Droplets, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DIET_PLANS = [
  { id: 'anti_acne', label: 'Anti-Acne', emoji: '🎯', color: 'from-red-400 to-pink-400' },
  { id: 'anti_aging', label: 'Anti-Aging', emoji: '✨', color: 'from-violet-400 to-purple-400' },
  { id: 'glow', label: 'Glow Boost', emoji: '🌟', color: 'from-amber-400 to-orange-400' },
  { id: 'hydration', label: 'Hydration', emoji: '💧', color: 'from-blue-400 to-cyan-400' },
];

export default function SkinDiet() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState('glow');
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [cooldown, setCooldown] = useState(getCooldownSeconds('skin_diet'));

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => p <= 1 ? 0 : p - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const { data: analysis } = useQuery({
    queryKey: ['dietAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0]),
    enabled: !!user?.email,
  });

  const generatePlan = async () => {
    const { allowed } = checkAICooldown('skin_diet');
    if (!allowed) return;
    setLoading(true);
    const goal = DIET_PLANS.find(d => d.id === selectedGoal);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a 1-day skin diet meal plan for goal: "${goal?.label}" 
${analysis ? `Skin profile: type ${analysis.skin_type}, acne ${analysis.acne_level}/10, oiliness ${analysis.oiliness}/10, dryness ${analysis.dryness}/10` : ''}
Include breakfast, lunch, dinner, and a snack. Focus on foods that directly improve ${goal?.label.toLowerCase()} for skin.`,
      response_json_schema: {
        type: "object",
        properties: {
          goal_explanation: { type: "string" },
          meals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                meal_type: { type: "string" },
                name: { type: "string" },
                foods: { type: "array", items: { type: "string" } },
                skin_benefits: { type: "string" },
                key_nutrient: { type: "string" },
                calories_approx: { type: "number" },
                prep_time: { type: "string" }
              }
            }
          },
          foods_to_avoid: { type: "array", items: { type: "string" } },
          daily_tip: { type: "string" }
        }
      }
    });
    setPlan(res);
    recordAIUsage('skin_diet');
    setCooldown(3 * 60);
    setLoading(false);
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto">
      <GlassCard className="text-center py-12">
        <Apple className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Skin Diet Planner</h2>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-emerald-500 to-teal-500">Sign In</Button>
      </GlassCard>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Apple className="w-7 h-7 text-emerald-500" /> Skin Diet Planner</h1>
        <p className="text-gray-500 mt-1">AI-personalized meal plans for your skin goals</p>
      </div>

      <GlassCard>
        <h3 className="font-bold mb-3">Choose Your Skin Goal</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {DIET_PLANS.map(dp => (
            <button key={dp.id} onClick={() => setSelectedGoal(dp.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${selectedGoal === dp.id ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <span className="text-2xl">{dp.emoji}</span>
              <p className="font-bold text-sm mt-1">{dp.label}</p>
            </button>
          ))}
        </div>
        <Button onClick={generatePlan} disabled={loading || cooldown > 0} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Plan...</>
            : cooldown > 0 ? `⏳ ${Math.floor(cooldown/60)}:${String(cooldown%60).padStart(2,'0')}`
            : <><Sparkles className="w-4 h-4 mr-2" /> Generate Meal Plan</>}
        </Button>
      </GlassCard>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <GlassCard className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <p className="text-sm text-gray-700 dark:text-gray-300">{plan.goal_explanation}</p>
            {plan.daily_tip && <p className="mt-2 text-sm font-semibold text-emerald-600">💡 {plan.daily_tip}</p>}
          </GlassCard>

          {plan.meals?.map((meal, i) => (
            <GlassCard key={i}>
              <button className="w-full flex items-center justify-between" onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{['🌅','☀️','🌙','🍎'][i] || '🍽️'}</span>
                  <div className="text-left">
                    <p className="font-bold">{meal.meal_type}: {meal.name}</p>
                    <p className="text-xs text-gray-500">{meal.key_nutrient} • ~{meal.calories_approx} cal • {meal.prep_time}</p>
                  </div>
                </div>
                {expandedMeal === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedMeal === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {meal.foods?.map((f, fi) => <Badge key={fi} variant="outline" className="text-xs">{f}</Badge>)}
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-1">
                    <Leaf className="w-3 h-3 mt-0.5 flex-shrink-0" />{meal.skin_benefits}
                  </p>
                </motion.div>
              )}
            </GlassCard>
          ))}

          {plan.foods_to_avoid?.length > 0 && (
            <GlassCard className="bg-red-50 dark:bg-red-900/20">
              <h4 className="font-bold text-red-600 mb-2">🚫 Avoid Today</h4>
              <div className="flex flex-wrap gap-1">
                {plan.foods_to_avoid.map((f, i) => <Badge key={i} className="bg-red-500 text-xs">{f}</Badge>)}
              </div>
            </GlassCard>
          )}
        </motion.div>
      )}
    </div>
  );
}