import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, ChevronDown, ChevronUp, Sparkles, Clock, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const EXERCISES = [
  {
    id: 1, name: 'Forehead Smoother', emoji: '😌', duration: 60, reps: '10 reps',
    target: 'Forehead lines & tension',
    instructions: 'Place both hands flat on your forehead, spreading fingers between hairline and brows. Apply gentle pressure and slowly sweep hands outward to temples. Hold for 2 seconds, release.',
    benefit: 'Relaxes frontalis muscle, reduces horizontal forehead lines',
    science: 'Counteracts the habitual frowning & tension that creates deep forehead wrinkles over time',
    tip: 'Do this first thing in the morning when your face is most tense from sleep'
  },
  {
    id: 2, name: 'Cheek Lifter', emoji: '😊', duration: 45, reps: '15 reps',
    target: 'Sagging cheeks & nasolabial folds',
    instructions: 'Open your mouth into an "O" shape, fold your upper lip over your upper teeth. Smile using your cheek muscles only, lifting your cheeks up toward your eyes. Hold for 1 second, release.',
    benefit: 'Strengthens zygomaticus major, lifts sagging cheeks',
    science: 'Targets the levator labii muscles that define cheekbone prominence and reduce marionette lines',
    tip: 'You should feel a burn in your upper cheeks — that means it\'s working'
  },
  {
    id: 3, name: 'Jaw & Neck Definer', emoji: '💪', duration: 60, reps: '10 reps each side',
    target: 'Double chin & jawline definition',
    instructions: 'Tilt head slightly back, look at ceiling. Press tongue to roof of mouth. Smile and turn head to one side, then the other. Feel the stretch along your neck and jawline.',
    benefit: 'Tones platysma muscle, sharpens jawline definition',
    science: 'Activates the digastric and platysma muscles that create jawline definition and reduce neck sagging',
    tip: 'Combine with neck cream or face oil for enhanced massage benefits'
  },
  {
    id: 4, name: 'Eye Brightener', emoji: '👁️', duration: 30, reps: '10 reps',
    target: 'Under-eye hollows & drooping lids',
    instructions: 'Place index fingers gently under each eye on the orbital bone. Look up toward ceiling without moving your head. Squint your lower eyelid upward, hold 1 second, release.',
    benefit: 'Tones orbicularis oculi, reduces eye puffiness',
    science: 'Stimulates lymphatic drainage under the eyes, reducing dark circles and under-eye bags',
    tip: 'Cool jade roller after this exercise amplifies the depuffing effect'
  },
  {
    id: 5, name: 'Lip Plumper', emoji: '💋', duration: 45, reps: '12 reps',
    target: 'Thin lips & perioral lines',
    instructions: 'Smile with lips pressed together, then pucker into a kiss. Alternate between smile and pucker. On the pucker, try to make your lips as full as possible by pressing them slightly outward.',
    benefit: 'Increases blood flow to lip area, plumps lip border',
    science: 'Exercises orbicularis oris muscle ring around the mouth, naturally enhancing lip volume',
    tip: 'Apply a vitamin E oil to lips afterward to maximize the plumping effect'
  },
  {
    id: 6, name: 'Neck Column Stretch', emoji: '🦢', duration: 60, reps: '5 each direction',
    target: 'Tech neck & horizontal neck lines',
    instructions: 'Sit tall, slowly tilt ear to shoulder and hold 10 seconds. Return to center. Look up diagonally to right, hold 10 seconds. Then left. Finish with gentle neck rolls.',
    benefit: 'Releases sternocleidomastoid tension, smooths neck lines',
    science: 'Counteracts forward head posture (text neck) that creates permanent horizontal neck creases',
    tip: 'The chin should never jut forward — keep it slightly tucked throughout'
  },
  {
    id: 7, name: 'Temple Circulation Boost', emoji: '✨', duration: 30, reps: 'Continuous',
    target: 'Overall skin circulation & glow',
    instructions: 'Using three middle fingers, make small circular motions on your temples. Gradually expand outward through cheeks, jawline, and forehead. Apply light-medium pressure.',
    benefit: 'Stimulates microcirculation, delivers oxygen to skin cells',
    science: 'Increases dermal blood flow by up to 22%, delivering nutrients and flushing toxins — the instant glow technique',
    tip: 'Do this with face oil — your skin absorbs nutrients 40% better during massage'
  },
  {
    id: 8, name: 'Brow Lift', emoji: '🤨', duration: 45, reps: '10 reps',
    target: 'Drooping brows & hooded eyes',
    instructions: 'Place index fingers just above eyebrows. Using your brow muscles, try to lift your brows while resisting with your fingers. Hold 5 seconds, release.',
    benefit: 'Strengthens frontalis muscle to lift brow position',
    science: 'Isometric resistance training for the brow elevators creates lasting lift comparable to 3 months of subtle results',
    tip: 'This is best done in the morning — avoid it at night as it can cause tension headaches'
  },
];

const PROGRAMS = [
  { name: '5-Minute Morning Glow', exercises: [7, 4, 2], description: 'Quick circulation boost' },
  { name: '10-Minute Lift & Define', exercises: [8, 2, 3, 1], description: 'Anti-aging full routine' },
  { name: '15-Minute Full Face Workout', exercises: [7, 1, 8, 2, 4, 5, 3, 6], description: 'Complete transformation' },
];

export default function FaceYoga() {
  const [activeEx, setActiveEx] = useState(null);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);
  const [programStep, setProgramStep] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('faceyoga-completed-' + new Date().toDateString());
    if (saved) setCompleted(new Set(JSON.parse(saved)));
  }, []);

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
  }, [running, activeEx]);

  const startExercise = (ex) => {
    setActiveEx(ex);
    setTimer(0);
    setRunning(true);
    setExpanded(ex.id);
  };

  const startProgram = (prog) => {
    setActiveProgram(prog);
    setProgramStep(0);
    const firstEx = EXERCISES.find(e => e.id === prog.exercises[0]);
    if (firstEx) startExercise(firstEx);
  };

  const progress = activeEx ? Math.round((timer / activeEx.duration) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">🧘 Face Yoga</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Natural face lifting & anti-aging exercises</p>
      </div>

      {/* Active Timer */}
      {activeEx && (
        <GlassCard className="bg-gradient-to-r from-pink-50 to-violet-50 dark:from-pink-900/20 dark:to-violet-900/20">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
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
              <p className="font-bold text-lg">{activeEx.name}</p>
              <p className="text-sm text-gray-500">{activeEx.reps}</p>
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" onClick={() => setRunning(!running)} className={running ? 'bg-amber-500' : 'bg-emerald-500'}>
                  {running ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  {running ? 'Pause' : 'Resume'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setTimer(0); setRunning(false); }}>
                  <RotateCcw className="w-3 h-3" />
                </Button>
                <span className="text-sm font-mono">{activeEx.duration - timer}s left</span>
              </div>
            </div>
            {activeProgram && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Program</p>
                <p className="font-semibold text-pink-500">{programStep + 1}/{activeProgram.exercises.length}</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Programs */}
      <GlassCard>
        <h3 className="font-bold mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Quick Programs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROGRAMS.map((prog) => (
            <button key={prog.name} onClick={() => startProgram(prog)}
              className="p-4 bg-gradient-to-br from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 rounded-2xl text-left hover:scale-105 transition-transform">
              <p className="font-bold text-sm">{prog.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{prog.description}</p>
              <p className="text-xs text-pink-500 mt-2">{prog.exercises.length} exercises</p>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Progress */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold">Today's Progress</p>
          <p className="text-pink-500 font-bold">{completed.size}/{EXERCISES.length}</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div className="bg-gradient-to-r from-pink-500 to-amber-500 h-2 rounded-full"
            animate={{ width: `${(completed.size / EXERCISES.length) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>
      </GlassCard>

      {/* Exercise List */}
      <div className="space-y-3">
        {EXERCISES.map((ex) => {
          const isDone = completed.has(ex.id);
          const isExpanded = expanded === ex.id;
          return (
            <GlassCard key={ex.id} animate={false} className={isDone ? 'opacity-75' : ''}>
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : ex.id)}>
                <span className="text-3xl">{ex.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${isDone ? 'line-through text-gray-400' : ''}`}>{ex.name}</p>
                    {isDone && <Badge className="bg-emerald-500 text-xs">Done ✓</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{ex.target} • {ex.reps} • {ex.duration}s</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); startExercise(ex); }}
                    className="bg-gradient-to-r from-pink-500 to-amber-500 h-8 px-3">
                    <Play className="w-3 h-3 mr-1" /> Start
                  </Button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3 border-t border-white/20 pt-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 mb-1">📋 Instructions</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{ex.instructions}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <p className="text-xs font-bold text-emerald-600 mb-1">✅ Benefit</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{ex.benefit}</p>
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <p className="text-xs font-bold text-amber-600 mb-1">💡 Pro Tip</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{ex.tip}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <p className="text-xs font-bold text-purple-600 mb-1">🔬 The Science</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{ex.science}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}