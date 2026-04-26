import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

function getMilestones(analyses, progressPhotos) {
  const milestones = [];

  if (analyses.length > 0) {
    milestones.push({
      id: 'start',
      emoji: '🌱',
      color: '#34d399',
      bg: 'rgba(52,211,153,0.1)',
      border: 'rgba(52,211,153,0.25)',
      title: 'Started Barrier-Safe Routine',
      desc: `First skin analysis done — Score: ${analyses[0].overall_score}/100`,
      date: analyses[0].created_date,
      done: true,
    });
  }

  if (progressPhotos.length > 0) {
    milestones.push({
      id: 'photos',
      emoji: '📸',
      color: '#f472b6',
      bg: 'rgba(244,114,182,0.1)',
      border: 'rgba(244,114,182,0.25)',
      title: 'Tracking Consistently',
      desc: `${progressPhotos.length} progress photo${progressPhotos.length > 1 ? 's' : ''} logged`,
      date: progressPhotos[progressPhotos.length - 1]?.created_date,
      done: true,
    });
  }

  if (analyses.length >= 2) {
    const first = analyses[0].overall_score;
    const last = analyses[analyses.length - 1].overall_score;
    const delta = last - first;
    if (delta > 0) {
      milestones.push({
        id: 'improved',
        emoji: '✨',
        color: '#a78bfa',
        bg: 'rgba(167,139,250,0.1)',
        border: 'rgba(167,139,250,0.25)',
        title: `Reached Level Up — +${delta.toFixed(1)} pts`,
        desc: `Skin improved from ${first} → ${last}/100. Barrier is strengthening!`,
        date: analyses[analyses.length - 1].created_date,
        done: true,
      });
    }
    // Specific concern reduction
    const acneDelta = analyses[0].acne_level - analyses[analyses.length - 1].acne_level;
    if (acneDelta > 1) {
      milestones.push({
        id: 'acne',
        emoji: '🎯',
        color: '#fb923c',
        bg: 'rgba(251,146,60,0.1)',
        border: 'rgba(251,146,60,0.25)',
        title: 'Acne Reduced',
        desc: `Acne level dropped by ${acneDelta} points — routine is working!`,
        date: analyses[analyses.length - 1].created_date,
        done: true,
      });
    }
  }

  // Future milestones
  const currentScore = analyses.length > 0 ? analyses[analyses.length - 1].overall_score : 0;
  const nextTarget = currentScore < 80 ? 80 : currentScore < 90 ? 90 : 100;
  const forecastScore = Math.min(100, Math.round(currentScore + (analyses.length > 1 ? ((currentScore - analyses[0]?.overall_score) / analyses.length) * 4 : 4)));

  milestones.push({
    id: 'goal',
    emoji: '🏆',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    title: `Next Goal — Score ${nextTarget}`,
    desc: `8-week forecast: ${forecastScore}/100. Keep up your routine!`,
    date: null,
    done: false,
  });

  return milestones;
}

export default function ProgressTimeline({ analyses = [], progressPhotos = [] }) {
  const milestones = getMilestones(analyses, progressPhotos);

  return (
    <div className="rounded-3xl p-5" style={{
      background: 'linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,245,255,0.9))',
      border: '1.5px solid rgba(244,114,182,0.12)',
      boxShadow: '0 4px 24px rgba(244,114,182,0.07)',
    }}>
      <p className="font-black text-base mb-4">Progress Timeline</p>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: 'linear-gradient(180deg,#f472b6,#a78bfa,rgba(245,158,11,0.3))' }} />

        <div className="space-y-5 pl-12">
          {milestones.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Dot on line */}
              <div className="absolute -left-12 top-2 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm"
                style={{ background: m.bg, border: `2px solid ${m.border}`, opacity: m.done ? 1 : 0.6 }}>
                {m.emoji}
              </div>

              <div className="rounded-2xl p-3.5" style={{ background: m.bg, border: `1.5px solid ${m.border}` }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-sm" style={{ color: m.color }}>{m.title}</p>
                  {!m.done && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">Upcoming</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{m.desc}</p>
                {m.date && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {format(new Date(m.date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}