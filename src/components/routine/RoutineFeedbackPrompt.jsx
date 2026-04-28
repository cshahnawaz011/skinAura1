import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles } from 'lucide-react';

const MESSAGES = [
  {
    emoji: '🌟',
    title: 'How\'s Your Skin Today?',
    subtitle: 'Your feedback makes your routine smarter',
    desc: 'Each time you tell us how your skin feels, our AI adjusts your treatment frequency — protecting your barrier and maximizing results.',
    color: '#f472b6',
    bg: 'linear-gradient(135deg,#fdf2f8,#fce7f3)',
  },
  {
    emoji: '💧',
    title: 'Skin Feeling Different?',
    subtitle: 'Tell us — we\'ll adapt your routine instantly',
    desc: 'Notice dryness, irritation, or extra glow? Your feedback is the most powerful data point we have. It auto-adjusts tonight\'s actives.',
    color: '#38bdf8',
    bg: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
  },
  {
    emoji: '✨',
    title: 'Daily Check-In Time',
    subtitle: 'Consistency builds the best skin',
    desc: 'Logging how your skin feels every day helps identify patterns — what\'s working, what to adjust, and when to push forward or recover.',
    color: '#a78bfa',
    bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
  },
  {
    emoji: '🛡️',
    title: 'Barrier Health Check',
    subtitle: 'Protect your skin — log your daily reaction',
    desc: 'Your skin barrier is everything. If you\'re feeling tight, flaky, or irritated, one tap pauses your actives and switches to barrier repair mode.',
    color: '#34d399',
    bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
  },
];

const PROMPT_KEY = 'skinaura-routine-feedback-prompt';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function shouldShowPrompt() {
  const raw = localStorage.getItem(PROMPT_KEY);
  if (!raw) return true;
  const { lastSeen } = JSON.parse(raw);
  return Date.now() - lastSeen > SIX_HOURS_MS;
}

function markPromptSeen() {
  localStorage.setItem(PROMPT_KEY, JSON.stringify({ lastSeen: Date.now() }));
}

export default function RoutineFeedbackPrompt({ onScrollToFeedback }) {
  const [show, setShow] = useState(false);
  const [msg] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  useEffect(() => {
    if (shouldShowPrompt()) {
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    markPromptSeen();
    setShow(false);
  };

  const handleFeedback = () => {
    markPromptSeen();
    setShow(false);
    if (onScrollToFeedback) onScrollToFeedback();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150]"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed inset-x-4 bottom-24 z-[151] max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Gradient top bar */}
            <div className="h-1.5" style={{ background: `linear-gradient(90deg,${msg.color},#a78bfa,#60a5fa)` }} />

            {/* Body */}
            <div className="p-5" style={{ background: msg.bg }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${msg.color}20`, border: `1.5px solid ${msg.color}30` }}>
                    {msg.emoji}
                  </div>
                  <div>
                    <p className="font-black text-base text-gray-900 leading-tight">{msg.title}</p>
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color: msg.color }}>{msg.subtitle}</p>
                  </div>
                </div>
                <button onClick={dismiss}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-4">{msg.desc}</p>

              {/* Stats row */}
              <div className="flex gap-2 mb-4">
                {[
                  { icon: '⚡', label: 'Auto-adjusts frequency' },
                  { icon: '🛡️', label: 'Protects barrier' },
                  { icon: '📈', label: 'Improves results' },
                ].map(s => (
                  <div key={s.label} className="flex-1 text-center py-2 px-1 rounded-xl"
                    style={{ background: `${msg.color}12`, border: `1px solid ${msg.color}20` }}>
                    <p className="text-base">{s.icon}</p>
                    <p className="text-[9px] font-black leading-tight mt-0.5" style={{ color: msg.color }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button onClick={handleFeedback}
                className="w-full py-3 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 ios-button-3d"
                style={{ background: `linear-gradient(135deg,${msg.color},#a78bfa)` }}>
                <Heart className="w-4 h-4" /> Log Today's Skin Feeling
              </button>
              <button onClick={dismiss}
                className="w-full mt-2 py-2 text-xs font-semibold text-gray-400 text-center">
                Maybe later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}