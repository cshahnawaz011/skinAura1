import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const JOURNEY_STEPS = [
  {
    day: 'Day 1 · Step 1',
    emoji: '🤳',
    gradient: 'from-pink-400 to-rose-500',
    bg: 'linear-gradient(135deg,#fdf2f8,#fff1f2)',
    accent: '#f472b6',
    title: 'Start with a Skin Scan',
    desc: 'Upload 3 face photos (front, left, right) to get a clinical-grade skin health report. This is the foundation of everything — acne levels, dark spots, oiliness, dryness & more.',
    cta: 'Go to Skin Analysis',
    page: '/SkinAnalysis',
    tip: '💡 Use natural light and no makeup for best results',
  },
  {
    day: 'Day 1 · Step 2',
    emoji: '✨',
    gradient: 'from-violet-400 to-purple-500',
    bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
    accent: '#a78bfa',
    title: 'Build Your Routine',
    desc: 'Once your scan is done, your personalized Morning & Night routine is auto-generated with exact concentrations for each active ingredient. No guesswork.',
    cta: 'See My Routine',
    page: '/SkinRoutine',
    tip: '💡 Submit daily feedback to let the routine auto-adapt',
  },
  {
    day: 'Day 2 · Morning',
    emoji: '📊',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)',
    accent: '#34d399',
    title: 'Track Your Progress',
    desc: 'Upload weekly progress photos and watch your glow score improve. Compare skin scores over time and celebrate visible improvements.',
    cta: 'View Progress',
    page: '/Progress',
    tip: '💡 Best results when you scan every 3–4 days',
  },
  {
    day: 'Day 2 · Evening',
    emoji: '🥗',
    gradient: 'from-lime-400 to-green-500',
    bg: 'linear-gradient(135deg,#f7fee7,#f0fdf4)',
    accent: '#84cc16',
    title: 'Log Your Diet & Lifestyle',
    desc: 'What you eat, how you sleep, and stress levels directly affect your skin. Log your habits daily to uncover your personal skin triggers.',
    cta: 'Open Diet Log',
    page: '/Diet',
    tip: '💡 Even 3 days of logs reveal surprising skin patterns',
  },
  {
    day: 'Day 3 · Morning',
    emoji: '🤖',
    gradient: 'from-blue-400 to-cyan-500',
    bg: 'linear-gradient(135deg,#eff6ff,#ecfeff)',
    accent: '#38bdf8',
    title: 'Ask Your AI Skin Coach',
    desc: 'Chat with Dr. Glow — your personal AI dermatologist. Ask about ingredients, products, reactions, or anything skin-related. Available 24/7.',
    cta: 'Chat with AI Coach',
    page: '/SkinChat',
    tip: '💡 Ask "What ingredients suit my skin?" for instant advice',
  },
  {
    day: 'Day 3 · Evening',
    emoji: '🧴',
    gradient: 'from-orange-400 to-amber-500',
    bg: 'linear-gradient(135deg,#fff7ed,#fffbeb)',
    accent: '#f59e0b',
    title: 'Explore Products & Ingredients',
    desc: 'Discover products matched to your skin. Check ingredient safety, compare formulas, identify conflicts and build your personal product shelf.',
    cta: 'Explore Products',
    page: '/Products',
    tip: '💡 Save products to your shelf for instant routine matching',
  },
  {
    day: 'Day 4 · Morning',
    emoji: '🌿',
    gradient: 'from-pink-400 to-fuchsia-500',
    bg: 'linear-gradient(135deg,#fdf4ff,#fae8ff)',
    accent: '#e879f9',
    title: 'Hormone & Cycle Tracker',
    desc: 'Your skin changes with your cycle. Track your menstrual phase to get skin and wellness advice tailored to each hormonal stage — follicular, ovulation, luteal & menstrual.',
    cta: 'Track My Cycle',
    page: '/HormoneTracker',
    tip: '💡 Skin often breaks out before your period — now you can predict it',
  },
  {
    day: 'Day 4 · Evening',
    emoji: '🏆',
    gradient: 'from-yellow-400 to-orange-500',
    bg: 'linear-gradient(135deg,#fefce8,#fff7ed)',
    accent: '#f97316',
    title: 'Join a Glow Challenge',
    desc: 'Complete 21-day skincare challenges, earn badges, build streaks and climb the community leaderboard. Gamify your glow journey.',
    cta: 'Start a Challenge',
    page: '/GlowChallenge',
    tip: '💡 Completing challenges earns real badges on your profile',
  },
  {
    day: 'Day 5 · Morning',
    emoji: '💡',
    gradient: 'from-indigo-400 to-violet-500',
    bg: 'linear-gradient(135deg,#eef2ff,#f5f3ff)',
    accent: '#818cf8',
    title: 'Deep Lifestyle Insights',
    desc: 'See 30-day correlations between water intake, sleep, stress, exercise and your skin score. Discover what\'s actually causing your breakouts or dryness.',
    cta: 'See Insights',
    page: '/LifestyleInsights',
    tip: '💡 The AI finds your top 3 personal skin triggers automatically',
  },
  {
    day: 'Day 5 · Evening',
    emoji: '🗺️',
    gradient: 'from-rose-400 to-pink-500',
    bg: 'linear-gradient(135deg,#fff1f2,#fdf2f8)',
    accent: '#fb7185',
    title: 'Explore Your Adaptive Skin Map',
    desc: 'View a dynamic facial heatmap showing where your skin signals are strongest — oiliness, dryness, redness, sensitivity — all mapped to specific face zones.',
    cta: 'Open Skin Map',
    page: '/AdaptiveSkinMap',
    tip: '💡 Great for understanding your T-zone vs cheek patterns',
  },
];

const STORAGE_KEY = 'skinaura-journey';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const MAX_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

function shouldShowJourney() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { show: true, stepIndex: 0 };
  const data = JSON.parse(raw);
  const now = Date.now();
  // Stop after 5 days
  if (now - data.firstSeen > MAX_DAYS_MS) return { show: false };
  // Show every 6 hours
  if (now - data.lastSeen < SIX_HOURS_MS) return { show: false };
  const nextStep = Math.min((data.stepIndex || 0) + 1, JOURNEY_STEPS.length - 1);
  return { show: true, stepIndex: nextStep };
}

function markJourneySeen(stepIndex) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const now = Date.now();
  const existing = raw ? JSON.parse(raw) : { firstSeen: now };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, lastSeen: now, stepIndex }));
}

export default function SmartJourneyPopup() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const { show, stepIndex: idx } = shouldShowJourney();
    if (show) {
      setStepIndex(idx || 0);
      // Small delay so app loads first
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const slide = JOURNEY_STEPS[stepIndex];

  const dismiss = () => {
    markJourneySeen(stepIndex);
    setVisible(false);
  };

  const next = () => {
    if (stepIndex < JOURNEY_STEPS.length - 1) {
      setStepIndex(s => s + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (stepIndex > 0) setStepIndex(s => s - 1);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed inset-x-4 bottom-24 z-[201] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'white' }}
          >
            {/* Top accent bar */}
            <div className="h-1.5" style={{ background: `linear-gradient(90deg,${slide.accent},#a78bfa,#60a5fa)` }} />

            {/* Hero section */}
            <div className="p-6 pb-4" style={{ background: slide.bg }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center text-3xl shadow-lg flex-shrink-0`}>
                    {slide.emoji}
                  </div>
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${slide.accent}20`, color: slide.accent }}>
                      {slide.day}
                    </span>
                    <h2 className="text-lg font-black text-gray-900 mt-1 leading-tight">{slide.title}</h2>
                  </div>
                </div>
                <button onClick={dismiss}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-2"
                  style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-3">{slide.desc}</p>

              {/* Tip */}
              <div className="px-3 py-2 rounded-xl text-xs font-medium text-gray-600"
                style={{ background: `${slide.accent}12`, border: `1px solid ${slide.accent}25` }}>
                {slide.tip}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 space-y-3 bg-white">
              {/* Progress dots */}
              <div className="flex justify-center gap-1.5">
                {JOURNEY_STEPS.map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300"
                    style={{
                      width: i === stepIndex ? 18 : 6,
                      height: 6,
                      background: i === stepIndex ? slide.accent : i < stepIndex ? `${slide.accent}60` : 'rgba(0,0,0,0.1)',
                    }} />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <button onClick={prev}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all"
                    style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#6b7280' }}>
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <Link to={slide.page} onClick={dismiss} className="flex-1">
                  <button className="w-full py-2.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 ios-button-3d"
                    style={{ background: `linear-gradient(135deg,${slide.accent},#a78bfa)` }}>
                    <Sparkles className="w-4 h-4" /> {slide.cta}
                  </button>
                </Link>
                {stepIndex < JOURNEY_STEPS.length - 1 && (
                  <button onClick={next}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: 'rgba(0,0,0,0.08)', color: '#6b7280' }}>
                    Skip <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-center text-[10px] text-gray-400">
                Step {stepIndex + 1} of {JOURNEY_STEPS.length} · Shows every 6 hours for 5 days
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}