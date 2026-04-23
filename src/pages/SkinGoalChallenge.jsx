import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Check, Star, Sparkles, Loader2,
  Target, Award, RefreshCw, ChevronDown, ChevronUp,
  Droplets, Moon, Sun, Apple, Dumbbell, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format, addDays, differenceInDays } from 'date-fns';

const SKIN_GOALS = [
  { id: 'reduce_acne', label: 'Reduce Acne', emoji: '🔴', desc: 'Clear breakouts and prevent future pimples' },
  { id: 'hydrate_skin', label: 'Hydrate Skin', emoji: '💧', desc: 'Boost moisture levels for plump, dewy skin' },
  { id: 'reduce_dark_spots', label: 'Fade Dark Spots', emoji: '🌙', desc: 'Even out skin tone and reduce hyperpigmentation' },
  { id: 'anti_aging', label: 'Anti-Aging', emoji: '⏳', desc: 'Reduce fine lines and improve skin firmness' },
  { id: 'reduce_oiliness', label: 'Control Oiliness', emoji: '✨', desc: 'Balance sebum and minimize pores' },
  { id: 'brighten_skin', label: 'Brighten Skin', emoji: '☀️', desc: 'Achieve a radiant, glowing complexion' },
  { id: 'reduce_redness', label: 'Reduce Redness', emoji: '🌸', desc: 'Calm irritation and soothe sensitive skin' },
  { id: 'overall_glow', label: 'Overall Glow Up', emoji: '💫', desc: 'Holistic skin health improvement' },
];

const TASK_ICONS = {
  skincare: <Sparkles className="w-4 h-4 text-pink-500" />,
  diet: <Apple className="w-4 h-4 text-emerald-500" />,
  lifestyle: <Dumbbell className="w-4 h-4 text-violet-500" />,
  water: <Droplets className="w-4 h-4 text-blue-500" />,
  sleep: <Moon className="w-4 h-4 text-indigo-500" />,
};

function buildAIPlanPrompt(goal, skinAnalysis, todayLog, savedRoutine) {
  const goalInfo = SKIN_GOALS.find(g => g.id === goal);
  const skinProfile = skinAnalysis
    ? `Skin type: ${skinAnalysis.skin_type}, Score: ${skinAnalysis.overall_score}/100, Acne: ${skinAnalysis.acne_level}/10, Dryness: ${skinAnalysis.dryness}/10, Oiliness: ${skinAnalysis.oiliness}/10, Dark spots: ${skinAnalysis.dark_spots}/10, Sensitivity: ${skinAnalysis.sensitivity}/10`
    : 'No skin analysis — assume balanced/normal skin.';

  const routineInfo = savedRoutine?.steps?.morning_routine
    ? `User has a morning routine with ${savedRoutine.steps.morning_routine.length} steps.`
    : 'No routine saved yet.';

  return `You are an expert dermatologist and skin health coach. Create a strict, science-backed 21-day skin challenge plan for this user.

USER'S SKIN GOAL: ${goalInfo?.label} — ${goalInfo?.desc}

SKIN PROFILE:
${skinProfile}

ROUTINE STATUS: ${routineInfo}

RULES:
1. Generate exactly 21 tasks, one per day (day 1 through day 21)
2. Each task must be highly specific and actionable — not vague
3. Tasks must cover ALL THREE areas: skincare product usage, dietary habits, and lifestyle habits
4. Tasks should progressively build on each other week by week:
   - Week 1 (Days 1-7): Foundation — gentle, beginner-level habits
   - Week 2 (Days 8-14): Activation — add targeted actives and dietary adjustments
   - Week 3 (Days 15-21): Transformation — advanced habits, consistency, and tracking
5. Every task MUST directly target the user's specific goal: "${goalInfo?.label}"
6. Include a mix of morning and evening tasks
7. Be STRICT and specific — no generic advice

Return strict JSON:
{
  "goal_summary": "string (1-2 sentences about the plan strategy)",
  "week_themes": {
    "week1": "string",
    "week2": "string",
    "week3": "string"
  },
  "days": [
    {
      "day": 1,
      "title": "string (short catchy title)",
      "task": "string (specific actionable task)",
      "category": "skincare|diet|lifestyle",
      "why": "string (1 sentence — why this helps the goal)",
      "points": number (10-50 based on difficulty),
      "emoji": "single emoji"
    }
  ],
  "success_tips": ["string", "string", "string"]
}`;
}

// ── Day Card ────────────────────────────────────────────────────────────────
function DayCard({ dayData, dayNum, isDone, isUnlocked, isToday, onComplete, completing }) {
  const [expanded, setExpanded] = useState(isToday);
  const categoryColors = {
    skincare: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    diet: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    lifestyle: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayNum * 0.02 }}
      className={`rounded-2xl border-2 transition-all ${
        isDone ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10' :
        isToday ? 'border-pink-400 dark:border-pink-600 bg-pink-50 dark:bg-pink-900/10 ring-2 ring-pink-300 ring-offset-1' :
        isUnlocked ? 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-white/3' :
        'border-gray-100 dark:border-gray-800 opacity-50 bg-gray-50 dark:bg-gray-900/20'
      }`}
    >
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => isUnlocked && setExpanded(e => !e)}
        disabled={!isUnlocked}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-black ${
          isDone ? 'bg-emerald-400 text-white' :
          isToday ? 'bg-gradient-to-br from-pink-500 to-amber-400 text-white' :
          'bg-gray-200 dark:bg-gray-700 text-gray-500'
        }`}>
          {isDone ? '✓' : dayData?.emoji || dayNum}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-400">Day {dayNum}</span>
            {isToday && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white">TODAY</span>}
            {isDone && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">Done ✓</span>}
          </div>
          <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
            {dayData?.title || `Day ${dayNum}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-amber-500">+{dayData?.points || 10}pts</span>
          {isUnlocked && (expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && isUnlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-start gap-2">
                {TASK_ICONS[dayData?.category] || <Star className="w-4 h-4 text-amber-500" />}
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{dayData?.task}</p>
              </div>
              {dayData?.category && (
                <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${categoryColors[dayData.category] || ''}`}>
                  {dayData.category}
                </span>
              )}
              {dayData?.why && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">💡 {dayData.why}</p>
              )}
              {!isDone && (
                <Button
                  size="sm"
                  onClick={() => onComplete(dayNum, dayData?.points || 10)}
                  disabled={completing === dayNum}
                  className="w-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white"
                >
                  {completing === dayNum
                    ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Saving...</>
                    : <><Check className="w-3 h-3 mr-1" />Mark as Done</>}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SkinGoalChallenge() {
  const [user, setUser] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch active challenge
  const { data: challenge, isLoading: loadingChallenge } = useQuery({
    queryKey: ['skinChallenge', user?.email],
    queryFn: () => base44.entities.SkinChallenge.filter({ user_email: user.email, status: 'active' }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  // Fetch supporting data
  const { data: skinAnalysis } = useQuery({
    queryKey: ['skinAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });
  const { data: savedRoutine } = useQuery({
    queryKey: ['savedRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });
  const { data: todayLog } = useQuery({
    queryKey: ['todayLog', user?.email],
    queryFn: async () => {
      const today = new Date().toLocaleDateString('en-CA');
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: today });
      return logs[0] || null;
    },
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SkinChallenge.create(data),
    onSuccess: () => queryClient.invalidateQueries(['skinChallenge']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SkinChallenge.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['skinChallenge']),
  });

  const abandonMutation = useMutation({
    mutationFn: (id) => base44.entities.SkinChallenge.update(id, { status: 'abandoned' }),
    onSuccess: () => queryClient.invalidateQueries(['skinChallenge']),
  });

  const generateAndStart = async () => {
    if (!selectedGoal || !user) return;
    setGenerating(true);

    const prompt = buildAIPlanPrompt(selectedGoal, skinAnalysis, todayLog, savedRoutine);
    const aiPlan = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          goal_summary: { type: 'string' },
          week_themes: { type: 'object', properties: { week1: { type: 'string' }, week2: { type: 'string' }, week3: { type: 'string' } } },
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'number' },
                title: { type: 'string' },
                task: { type: 'string' },
                category: { type: 'string' },
                why: { type: 'string' },
                points: { type: 'number' },
                emoji: { type: 'string' },
              }
            }
          },
          success_tips: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    const today = new Date().toLocaleDateString('en-CA');
    await createMutation.mutateAsync({
      user_email: user.email,
      goal: selectedGoal,
      status: 'active',
      start_date: today,
      end_date: format(addDays(new Date(), 20), 'yyyy-MM-dd'),
      ai_plan: aiPlan,
      completed_days: [],
      total_points: 0,
      badges: [],
    });

    setGenerating(false);
  };

  const completeDay = async (dayNum, points) => {
    if (!challenge) return;
    setCompleting(dayNum);
    const newCompleted = [...(challenge.completed_days || []), dayNum];
    const newPoints = (challenge.total_points || 0) + points;

    const newBadges = [...(challenge.badges || [])];
    if (newCompleted.length >= 7 && !newBadges.includes('week1_hero')) newBadges.push('week1_hero');
    if (newCompleted.length >= 14 && !newBadges.includes('consistency_king')) newBadges.push('consistency_king');
    if (newCompleted.length >= 21 && !newBadges.includes('transformation')) newBadges.push('transformation');
    if (newPoints >= 300 && !newBadges.includes('point_master')) newBadges.push('point_master');

    await updateMutation.mutateAsync({
      id: challenge.id,
      data: {
        completed_days: newCompleted,
        total_points: newPoints,
        badges: newBadges,
        status: newCompleted.length >= 21 ? 'completed' : 'active',
      }
    });
    setCompleting(null);
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const completedDays = new Set(challenge?.completed_days || []);
  const currentDay = challenge?.start_date
    ? Math.min(21, Math.max(1, differenceInDays(new Date(), new Date(challenge.start_date)) + 1))
    : 1;
  const overallProgress = Math.round((completedDays.size / 21) * 100);
  const aiPlan = challenge?.ai_plan;
  const goalInfo = SKIN_GOALS.find(g => g.id === challenge?.goal);

  const getDaysForWeek = (w) => {
    const start = (w - 1) * 7 + 1;
    return Array.from({ length: 7 }, (_, i) => start + i);
  };

  const BADGE_CONFIG = {
    week1_hero: { emoji: '🌱', name: 'Week 1 Hero' },
    consistency_king: { emoji: '👑', name: 'Consistency King' },
    transformation: { emoji: '🌟', name: 'Transformed!' },
    point_master: { emoji: '💰', name: 'Point Master' },
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard className="text-center py-12">
          <Trophy className="w-14 h-14 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">21-Day Skin Goal Challenge</h2>
          <p className="text-gray-500 mb-6">Sign in to start your personalized AI-driven skin transformation</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">Sign In</Button>
        </GlassCard>
      </div>
    );
  }

  if (loadingChallenge) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // ── Goal Selection Screen ──────────────────────────────────────────────────
  if (!challenge) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow"
            style={{ background: 'linear-gradient(135deg,#f472b6,#fbbf24)' }}>🏆</div>
          <h1 className="text-3xl font-bold mb-1">21-Day Skin Goal Challenge</h1>
          <p className="text-gray-500">AI creates your personalized daily tasks based on your skin data</p>
        </div>

        {skinAnalysis && (
          <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 py-3">
            <p className="text-xs text-gray-500 mb-1">Using your skin analysis</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-pink-500 text-white capitalize">{skinAnalysis.skin_type} Skin</Badge>
              <span className="text-sm font-semibold">Score: {skinAnalysis.overall_score}/100</span>
              {skinAnalysis.acne_level > 4 && <Badge variant="outline" className="text-xs">⚠ Acne-Prone</Badge>}
              {skinAnalysis.dryness > 4 && <Badge variant="outline" className="text-xs">🏜 Dry</Badge>}
            </div>
          </GlassCard>
        )}

        <div>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3">Choose your primary skin goal:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SKIN_GOALS.map(goal => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedGoal === goal.id
                    ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20 ring-2 ring-pink-300 ring-offset-1'
                    : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-white/5 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{goal.emoji}</span>
                <div>
                  <p className="font-bold text-sm">{goal.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{goal.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={generateAndStart}
          disabled={!selectedGoal || generating}
          className="w-full bg-gradient-to-r from-pink-500 to-amber-500 py-6 text-base font-bold"
        >
          {generating
            ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />AI is creating your 21-day plan...</>
            : <><Flame className="w-5 h-5 mr-2" />Generate My AI Challenge Plan</>}
        </Button>
        {generating && (
          <p className="text-center text-xs text-gray-400">This takes about 15-20 seconds. The AI is personalizing 21 daily tasks just for you.</p>
        )}
      </div>
    );
  }

  // ── Active Challenge View ──────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow"
          style={{ background: 'linear-gradient(135deg,#f472b6,#fbbf24)' }}>🏆</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">21-Day Skin Goal Challenge</h1>
          <p className="text-sm text-gray-500">Goal: <span className="font-semibold text-pink-500">{goalInfo?.emoji} {goalInfo?.label}</span></p>
        </div>
        <button
          onClick={() => { if (window.confirm('Abandon this challenge and start over?')) abandonMutation.mutate(challenge.id); }}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg"
        >
          Restart
        </button>
      </div>

      {/* Stats */}
      <GlassCard className="bg-gradient-to-r from-amber-50 to-pink-50 dark:from-amber-900/20 dark:to-pink-900/20">
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          <div>
            <p className="text-2xl font-black text-amber-500">{completedDays.size}</p>
            <p className="text-[10px] text-gray-500">Done</p>
          </div>
          <div>
            <p className="text-2xl font-black text-pink-500">{challenge.total_points || 0}</p>
            <p className="text-[10px] text-gray-500">Points</p>
          </div>
          <div>
            <p className="text-2xl font-black text-violet-500">Day {currentDay}</p>
            <p className="text-[10px] text-gray-500">Current</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-500">{overallProgress}%</p>
            <p className="text-[10px] text-gray-500">Progress</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div className="bg-gradient-to-r from-amber-400 to-pink-500 h-3 rounded-full"
            animate={{ width: `${overallProgress}%` }} transition={{ duration: 1 }} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          {21 - completedDays.size} tasks remaining • Ends {format(new Date(challenge.end_date), 'MMM d, yyyy')}
        </p>
      </GlassCard>

      {/* AI Goal Summary */}
      {aiPlan?.goal_summary && (
        <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 border border-violet-100 dark:border-violet-800">
          <p className="text-xs font-bold text-violet-600 dark:text-violet-300 mb-1">🤖 AI Strategy</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{aiPlan.goal_summary}</p>
        </div>
      )}

      {/* Badges */}
      {challenge.badges?.length > 0 && (
        <GlassCard>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" />Badges Earned</h3>
          <div className="flex flex-wrap gap-3">
            {challenge.badges.map(b => {
              const cfg = BADGE_CONFIG[b];
              if (!cfg) return null;
              return (
                <div key={b} className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 min-w-[70px]">
                  <span className="text-2xl mb-1">{cfg.emoji}</span>
                  <p className="text-[10px] font-bold text-center">{cfg.name}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Week Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3].map(w => {
          const weekDone = getDaysForWeek(w).filter(d => completedDays.has(d)).length;
          const theme = aiPlan?.week_themes?.[`week${w}`];
          return (
            <button key={w} onClick={() => setActiveWeek(w)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                activeWeek === w
                  ? 'bg-gradient-to-r from-pink-500 to-amber-400 text-white shadow'
                  : 'bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <div>Week {w}</div>
              <div className="opacity-80">{weekDone}/7 done</div>
            </button>
          );
        })}
      </div>

      {/* Week theme */}
      {aiPlan?.week_themes?.[`week${activeWeek}`] && (
        <p className="text-xs text-center text-gray-500 italic">
          Week {activeWeek} Theme: <span className="font-semibold text-pink-500">{aiPlan.week_themes[`week${activeWeek}`]}</span>
        </p>
      )}

      {/* Day Cards */}
      <div className="space-y-2">
        {getDaysForWeek(activeWeek).map(dayNum => {
          const dayData = aiPlan?.days?.find(d => d.day === dayNum);
          const isDone = completedDays.has(dayNum);
          const isUnlocked = dayNum <= currentDay + 1;
          const isToday = dayNum === currentDay;
          return (
            <DayCard
              key={dayNum}
              dayNum={dayNum}
              dayData={dayData}
              isDone={isDone}
              isUnlocked={isUnlocked}
              isToday={isToday}
              onComplete={completeDay}
              completing={completing}
            />
          );
        })}
      </div>

      {/* Success Tips */}
      {aiPlan?.success_tips?.length > 0 && (
        <GlassCard>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" />AI Success Tips</h3>
          <div className="space-y-2">
            {aiPlan.success_tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-pink-500 font-bold flex-shrink-0">✦</span>
                <span className="text-gray-700 dark:text-gray-300">{tip}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Completed! */}
      {challenge.status === 'completed' && (
        <GlassCard className="text-center py-8 bg-gradient-to-r from-amber-50 to-pink-50 dark:from-amber-900/20 dark:to-pink-900/20">
          <span className="text-5xl block mb-3">🌟</span>
          <h2 className="text-2xl font-black mb-2">Challenge Complete!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">You completed all 21 days with {challenge.total_points} points!</p>
          <Button onClick={() => abandonMutation.mutate(challenge.id)} className="bg-gradient-to-r from-pink-500 to-amber-500">
            Start a New Challenge
          </Button>
        </GlassCard>
      )}
    </div>
  );
}