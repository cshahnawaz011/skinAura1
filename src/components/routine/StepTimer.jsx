import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StepTimer({ applySeconds = 30, waitSeconds = 60, stepName, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | applying | waiting | done
  const [timeLeft, setTimeLeft] = useState(applySeconds);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const total = phase === 'applying' ? applySeconds : waitSeconds;
  const progress = phase === 'idle' ? 0 : phase === 'done' ? 100 : Math.round(((total - timeLeft) / total) * 100);

  useEffect(() => {
    if ((phase === 'applying' || phase === 'waiting') && !paused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            if (phase === 'applying') {
              setPhase('waiting');
              setTimeLeft(waitSeconds);
            } else {
              setPhase('done');
              onComplete?.();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase, paused]);

  const start = () => { setPhase('applying'); setTimeLeft(applySeconds); setPaused(false); };
  const reset = () => { setPhase('idle'); setTimeLeft(applySeconds); setPaused(false); clearInterval(intervalRef.current); };
  const toggle = () => setPaused(p => !p);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const colors = {
    idle: 'from-gray-400 to-gray-500',
    applying: 'from-pink-400 to-rose-500',
    waiting: 'from-amber-400 to-orange-500',
    done: 'from-emerald-400 to-teal-500',
  };

  const labels = { idle: 'Start Timer', applying: 'Applying...', waiting: 'Waiting...', done: '✓ Done!' };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/30">
      {/* Circular progress */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
          <circle
            cx="24" cy="24" r="20" fill="none" strokeWidth="4"
            className={`transition-all duration-1000 ${phase === 'applying' ? 'stroke-pink-500' : phase === 'waiting' ? 'stroke-amber-500' : phase === 'done' ? 'stroke-emerald-500' : 'stroke-gray-300'}`}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold">{phase === 'idle' ? <Clock className="w-3.5 h-3.5 text-gray-400" /> : fmt(timeLeft)}</span>
        </div>
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
          {phase === 'waiting' ? `Wait before next step` : phase === 'done' ? 'Step complete!' : `Apply: ${fmt(applySeconds)} · Wait: ${fmt(waitSeconds)}`}
        </p>
        <p className="text-[10px] text-gray-400">{labels[phase]}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {phase === 'idle' && (
          <Button size="sm" onClick={start} className={`bg-gradient-to-r ${colors.applying} text-white px-3 h-7 text-xs`}>
            <Play className="w-3 h-3 mr-1" /> Start
          </Button>
        )}
        {(phase === 'applying' || phase === 'waiting') && (
          <>
            <Button size="sm" variant="ghost" onClick={toggle} className="h-7 w-7 p-0">
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} className="h-7 w-7 p-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
        {phase === 'done' && (
          <Button size="sm" variant="ghost" onClick={reset} className="h-7 w-7 p-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}