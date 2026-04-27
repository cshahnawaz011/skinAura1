import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, ChevronDown, ChevronUp, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';

const EXERCISES = [
  { id: 1, name: 'Forehead Smoother', emoji: '😌', duration: 60, reps: '10 reps', target: 'Forehead lines & tension', instructions: 'Place both hands flat on your forehead, spreading fingers between hairline and brows. Apply gentle pressure and slowly sweep hands outward to temples. Hold for 2 seconds, release.', benefit: 'Relaxes frontalis muscle, reduces horizontal forehead lines', science: 'Counteracts the habitual frowning & tension that creates deep forehead wrinkles over time', tip: 'Do this first thing in the morning when your face is most tense from sleep' },
  { id: 2, name: 'Cheek Lifter', emoji: '😊', duration: 45, reps: '15 reps', target: 'Sagging cheeks & nasolabial folds', instructions: 'Open your mouth into an "O" shape, fold your upper lip over your upper teeth. Smile using your cheek muscles only, lifting your cheeks up toward your eyes. Hold for 1 second, release.', benefit: 'Strengthens zygomaticus major, lifts sagging cheeks', science: 'Targets the levator labii muscles that define cheekbone prominence and reduce marionette lines', tip: "You should feel a burn in your upper cheeks — that means it's working" },
  { id: 3, name: 'Jaw & Neck Definer', emoji: '💪', duration: 60, reps: '10 reps each side', target: 'Double chin & jawline definition', instructions: 'Tilt head slightly back, look at ceiling. Press tongue to roof of mouth. Smile and turn head to one side, then the other. Feel the stretch along your neck and jawline.', benefit: 'Tones platysma muscle, sharpens jawline definition', science: 'Activates the digastric and platysma muscles that create jawline definition and reduce neck sagging', tip: 'Combine with neck cream or face oil for enhanced massage benefits' },
  { id: 4, name: 'Eye Brightener', emoji: '👁️', duration: 30, reps: '10 reps', target: 'Under-eye hollows & drooping lids', instructions: 'Place index fingers gently under each eye on the orbital bone. Look up toward ceiling without moving your head. Squint your lower eyelid upward, hold 1 second, release.', benefit: 'Tones orbicularis oculi, reduces eye puffiness', science: 'Stimulates lymphatic drainage under the eyes, reducing dark circles and under-eye bags', tip: 'Cool jade roller after this exercise amplifies the depuffing effect' },
  { id: 5, name: 'Lip Plumper', emoji: '💋', duration: 45, reps: '12 reps', target: 'Thin lips & perioral lines', instructions: 'Smile with lips pressed together, then pucker into a kiss. Alternate between smile and pucker. On the pucker, try to make your lips as full as possible by pressing them slightly outward.', benefit: 'Increases blood flow to lip area, plumps lip border', science: 'Exercises orbicularis oris muscle ring around the mouth, naturally enhancing lip volume', tip: 'Apply a vitamin E oil to lips afterward to maximize the plumping effect' },
  { id: 6, name: 'Neck Column Stretch', emoji: '🦢', duration: 60, reps: '5 each direction', target: 'Tech neck & horizontal neck lines', instructions: 'Sit tall, slowly tilt ear to shoulder and hold 10 seconds. Return to center. Look up diagonally to right, hold 10 seconds. Then left. Finish with gentle neck rolls.', benefit: 'Releases sternocleidomastoid tension, smooths neck lines', science: 'Counteracts forward head posture (text neck) that creates permanent horizontal neck creases', tip: 'The chin should never jut forward — keep it slightly tucked throughout' },
  { id: 7, name: 'Temple Circulation Boost', emoji: '✨', duration: 30, reps: 'Continuous', target: 'Overall skin circulation & glow', instructions: 'Using three middle fingers, make small circular motions on your temples. Gradually expand outward through cheeks, jawline, and forehead. Apply light-medium pressure.', benefit: 'Stimulates microcirculation, delivers oxygen to skin cells', science: 'Increases dermal blood flow by up to 22%, delivering nutrients and flushing toxins — the instant glow technique', tip: 'Do this with face oil — your skin absorbs nutrients 40% better during massage' },
  { id: 8, name: 'Brow Lift', emoji: '🤨', duration: 45, reps: '10 reps', target: 'Drooping brows & hooded eyes', instructions: 'Place index fingers just above eyebrows. Using your brow muscles, try to lift your brows while resisting with your fingers. Hold 5 seconds, release.', benefit: 'Strengthens frontalis muscle to lift brow position', science: 'Isometric resistance training for the brow elevators creates lasting lift comparable to 3 months of subtle results', tip: 'This is best done in the morning — avoid it at night as it can cause tension headaches' },
];

const PROGRAMS = [
  { name: '5-Minute Morning Glow', exercises: [7, 4, 2], description: 'Quick circulation boost', duration: '5 min' },
  { name: '10-Minute Lift & Define', exercises: [8, 2, 3, 1], description: 'Anti-aging full routine', duration: '10 min' },
  { name: '15-Minute Full Face Workout', exercises: [7, 1, 8, 2, 4, 5, 3, 6], description: 'Complete transformation', duration: '15 min' },
];

export default function FaceYoga() {
  const [user, setUser] = useState(null);
  const [activeEx, setActiveEx] = useState(null);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);
  const [programStep, setProgramStep] = useState(0);
  const [synced, setSynced] = useState(false);
  const intervalRef = useRef(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const saved = localStorage.getItem('faceyoga-completed-' + new Date().toDateString());
    if (saved) setCompleted(new Set(JSON.parse(saved)));
  }, []);

  // Sync Face Yoga completions to GlowDashboard + DietLog
  const syncToFeatures = async (newCompleted, user) => {
    if (!user || synced) return;
    const completedCount = newCompleted.size;
    const totalMinutes = [...newCompleted].reduce((sum, id) => {
      const ex = EXERCISES.find(e => e.id === id);
      return sum + (ex ? Math.round(ex.duration / 60) : 1);
    }, 0);

    const todayStr = today;

    // 1. Sync to DailyGlowMetrics — mark face_yoga habit
    try {
      const existing = await base44.entities.DailyGlowMetrics.filter({ user_email: user.email, date: todayStr });
      const metric = existing[0];
      const tasksDone = metric?.tasks_done || [];
      const updatedTasks = tasksDone.includes('face_yoga') ? tasksDone : [...tasksDone, 'face_yoga'];
      if (metric?.id) {
        await base44.entities.DailyGlowMetrics.update(metric.id, {
          tasks_done: updatedTasks,
          note: `Face Yoga: ${completedCount} exercises completed (${totalMinutes} min)`,
        });
      } else {
        await base44.entities.DailyGlowMetrics.create({
          user_email: user.email,
          date: todayStr,
          tasks_done: updatedTasks,
          glow_score: Math.min(100, completedCount * 12),
          note: `Face Yoga: ${completedCount} exercises completed`,
        });
      }
    } catch (e) { console.warn('FaceYoga→GlowMetrics sync failed', e); }

    // 2. Sync exercise time to DietLog's exercise_minutes
    try {
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: todayStr }, '-created_date', 1);
      const log = logs[0];
      if (log?.id) {
        await base44.entities.DietLog.update(log.id, {
          exercise_minutes: (log.exercise_minutes || 0) + totalMinutes,
        });
      } else {
        await base44.entities.DietLog.create({
          user_email: user.email,
          log_date: todayStr,
          exercise_minutes: totalMinutes,
        });
      }
    } catch (e) { console.warn('FaceYoga→DietLog sync failed', e); }

    setSynced(true);
  };

  useEffect(() => {
    if (running && activeEx) {
      intervalRef.current = setInterval(() => {
        setTimer(t => {
          if (t >= activeEx.duration) {
            clearInterval(intervalRef.current);
            setRunning(false);
            const newCompleted = new Set([...completed, activeEx.id]);
            setCompleted(newCompleted);
            localStorage.setItem('faceyoga-completed-' + new Date().toDateString(), JSON.stringify([...newCompleted]));
            // Sync to connected features
            if (user) syncToFeatures(newCompleted, user);
            // Auto-advance program
            if (activeProgram) {
              const nextStep = programStep + 1;
              if (nextStep < activeProgram.exercises.length) {
                setProgramStep(nextStep);
                const nextEx = EXERCISES.find(e => e.id === activeProgram.exercises[nextStep]);
                if (nextEx) { setActiveEx(nextEx); setTimer(0); setTimeout(() => setRunning(true), 2000); }
              } else {
                setActiveProgram(null);
              }
            }
            return activeEx.duration;
          }
          return t + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, activeEx, user]);

  const startExercise = (ex) => { setActiveEx(ex); setTimer(0); setRunning(true); setExpanded(ex.id); };
  const startProgram = (prog) => {
    setActiveProgram(prog);
    setProgramStep(0);
    const firstEx = EXERCISES.find(e => e.id === prog.exercises[0]);
    if (firstEx) startExercise(firstEx);
  };

  const progress = activeEx ? Math.round((timer / activeEx.duration) * 100) : 0;
  const totalMinutesDone = [...completed].reduce((sum, id) => {
    const ex = EXERCISES.find(e => e.id === id);
    return sum + (ex ? Math.round(ex.duration / 60) : 1);
  }, 0);

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🧘</div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Face Yoga</h1>
          <p className="text-sm text-gray-500">Natural face lifting & anti-aging exercises</p>
        </div>
      </div>

      {/* Active Timer */}
      {activeEx && (
        <div className="rounded-3xl p-5" style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.10))', border: '1.5px solid rgba(244,114,182,0.2)' }}>
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#ec4899" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">{activeEx.emoji}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-black text-lg">{activeEx.name}</p>
              <p className="text-sm text-gray-500 mb-2">{activeEx.reps}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setRunning(!running)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${running ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                  {running ? <><Pause className="w-3 h-3" />Pause</> : <><Play className="w-3 h-3" />Resume</>}
                </button>
                <button onClick={() => { setTimer(0); setRunning(false); }}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 transition-all">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-mono font-bold text-pink-500">{activeEx.duration - timer}s</span>
              </div>
            </div>
            {activeProgram && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">Program</p>
                <p className="font-black text-lg text-pink-500">{programStep + 1}/{activeProgram.exercises.length}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's Progress */}
      <div className="rounded-3xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm">Today's Progress</p>
          <div className="flex items-center gap-3">
            {synced && user && <span className="text-[10px] text-emerald-500 font-bold">✓ Synced to Dashboard</span>}
            <span className="font-black text-pink-500">{completed.size}/{EXERCISES.length} · {totalMinutesDone}m</span>
          </div>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
          <motion.div className="h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa)' }}
            animate={{ width: `${(completed.size / EXERCISES.length) * 100}%` }} transition={{ duration: 0.6 }} />
        </div>
        {!user && (
          <p className="text-xs text-amber-600 mt-2">💡 Sign in to sync Face Yoga to your Glow Dashboard & Health Insights</p>
        )}
      </div>

      {/* Programs */}
      <div className="rounded-3xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-black text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Quick Programs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PROGRAMS.map((prog) => (
            <button key={prog.name} onClick={() => startProgram(prog)}
              className="p-3 rounded-2xl text-left hover:scale-[1.02] transition-transform"
              style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.06),rgba(167,139,250,0.08))', border: '1px solid rgba(244,114,182,0.15)' }}>
              <p className="font-black text-xs">{prog.name}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{prog.description}</p>
              <p className="text-[10px] text-pink-500 mt-1 font-semibold">{prog.exercises.length} exercises · {prog.duration}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">All Exercises</p>
        {EXERCISES.map((ex) => {
          const isDone = completed.has(ex.id);
          const isExpanded = expanded === ex.id;
          return (
            <div key={ex.id} className={`rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border shadow-sm transition-all ${isDone ? 'border-emerald-200 dark:border-emerald-800 opacity-80' : 'border-gray-100 dark:border-gray-800'}`}>
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : ex.id)}>
                <span className="text-2xl">{ex.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-bold text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>{ex.name}</p>
                    {isDone && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Done ✓</span>}
                  </div>
                  <p className="text-xs text-gray-400">{ex.target} · {ex.reps} · {ex.duration}s</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); startExercise(ex); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white ios-button-3d"
                    style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                    <Play className="w-3 h-3" /> Start
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 dark:border-gray-800">
                    <div className="p-4 space-y-2">
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-[10px] font-bold text-blue-600 mb-1">📋 Instructions</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{ex.instructions}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                          <p className="text-[10px] font-bold text-emerald-600 mb-1">✅ Benefit</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{ex.benefit}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20">
                          <p className="text-[10px] font-bold text-amber-600 mb-1">💡 Pro Tip</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{ex.tip}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20">
                        <p className="text-[10px] font-bold text-purple-600 mb-1">🔬 The Science</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{ex.science}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}