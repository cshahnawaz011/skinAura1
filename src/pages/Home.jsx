import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Camera, Sparkles, TrendingUp, MessageCircle,
  Droplets, Zap, Star, Sun, Bell, Search,
  ChevronRight, Heart, Shield, Leaf, Moon
} from 'lucide-react';
import WeatherAdvisor from '@/components/home/WeatherAdvisor';
import ProactiveHealthInsights from '@/components/home/ProactiveHealthInsights';
import CrossFeatureInsights from '@/components/home/CrossFeatureInsights';
import ProductRecommender from '@/components/home/ProductRecommender';
import UserJourney from '@/components/home/UserJourney';
import FeaturesIntroPopup from '@/components/home/FeaturesIntroPopup';
import { AnimatePresence } from 'framer-motion';

// ── Quick Action Feature Cards ──────────────────────────────────────────────
const FEATURES = [
  { icon: Camera,       title: 'Skin Analysis',   desc: 'Smart scan',      page: 'SkinAnalysis',  gradient: 'from-rose-400 to-pink-500',    bg: 'from-rose-50 to-pink-50',    iconBg: 'from-rose-400 to-pink-500' },
  { icon: Sparkles,     title: 'My Routine',      desc: 'Daily care plan',  page: 'SkinRoutine',   gradient: 'from-amber-400 to-orange-400', bg: 'from-amber-50 to-orange-50', iconBg: 'from-amber-400 to-orange-400' },
  { icon: TrendingUp,   title: 'Progress',        desc: 'Track glow',       page: 'Progress',      gradient: 'from-emerald-400 to-teal-400', bg: 'from-emerald-50 to-teal-50', iconBg: 'from-emerald-400 to-teal-400' },
  { icon: MessageCircle,title: 'Skin Coach',       desc: 'Ask anything',     page: 'SkinChat',      gradient: 'from-violet-400 to-purple-500',bg: 'from-violet-50 to-purple-50',iconBg: 'from-violet-400 to-purple-500' },
  { icon: Droplets,     title: 'Products',        desc: 'Find your match',  page: 'Products',      gradient: 'from-sky-400 to-blue-400',     bg: 'from-sky-50 to-blue-50',     iconBg: 'from-sky-400 to-blue-400' },
  { icon: Heart,        title: 'Glow Goals',      desc: '21-day challenge', page: 'SkinGoalChallenge', gradient: 'from-pink-400 to-rose-400', bg: 'from-pink-50 to-rose-50',    iconBg: 'from-pink-400 to-rose-400' },
];

// ── Wellness Pill ─────────────────────────────────────────────────────────
function WellnessPill({ icon: Icon, label, value, color }) {
  return (
    <div className="pill-tag rounded-full flex items-center gap-1.5 px-3 py-1.5">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const pct = score / 100;
  return (
    <svg width="88" height="88" className="rotate-[-90deg]">
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(220,180,230,0.2)" strokeWidth="7" />
      <circle cx="44" cy="44" r={r} fill="none"
        stroke="url(#scoreGrad)" strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('skinaura-intro-seen'));
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: latestAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: async () => {
      const analyses = await base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1);
      return analyses[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: todayLog } = useQuery({
    queryKey: ['todayLog', user?.email],
    queryFn: async () => {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Calcutta' });
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: today });
      return logs[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: routines = [] } = useQuery({
    queryKey: ['routines', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: savedRoutine } = useQuery({
    queryKey: ['savedRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 30),
    enabled: !!user?.email,
  });

  const routineData = savedRoutine?.steps || null;
  const todayDayIndex = (new Date().getDay() + 6) % 7;
  const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const todayName = DAY_NAMES[todayDayIndex];
  const todayNightPlan = routineData?.night_week_plan?.find(d => d.day_label === todayName) || routineData?.night_week_plan?.[todayDayIndex] || null;

  const score = latestAnalysis?.overall_score || 0;
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="hero-bg pb-24">
      <AnimatePresence>
        {showIntro && <FeaturesIntroPopup onClose={() => { localStorage.setItem('skinaura-intro-seen', '1'); setShowIntro(false); }} />}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">

        {/* ── TOP HEADER ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold text-pink-500 tracking-wide uppercase">{greeting}</p>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              {user ? firstName : 'Welcome'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full ios-card flex items-center justify-center hover:scale-110 transition">
              <Search className="w-4 h-4 text-gray-600" />
            </button>
            <button className="w-10 h-10 rounded-full ios-card flex items-center justify-center relative hover:scale-110 transition">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500" />
            </button>
          </div>
        </motion.div>

        {/* ── HERO SKIN SCORE CARD ────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="ios-card p-6" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,245,250,0.8) 100%)'
          }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">Health Score</p>
                {analysisLoading ? (
                  <div className="h-10 w-24 rounded-xl animate-pulse bg-pink-100" />
                ) : latestAnalysis ? (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-black text-gray-800">{score}</span>
                      <span className="text-lg font-bold text-gray-400 mb-1">/100</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
                        style={{ background: score >= 70 ? 'linear-gradient(135deg,#34d399,#10b981)' : score >= 50 ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,#f87171,#ef4444)' }}>
                        {score >= 70 ? '✦ Great' : score >= 50 ? '↑ Improving' : '♡ Needs Care'}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{latestAnalysis.skin_type} skin</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black text-gray-400">--</p>
                    <Link to={createPageUrl('SkinAnalysis')}>
                      <span className="text-xs font-bold text-pink-500 mt-1 block">Analyze now →</span>
                    </Link>
                  </>
                )}

                {/* Wellness Pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <WellnessPill icon={Droplets} label="Water" value={`${todayLog?.water_glasses || 0}/8`} color="text-sky-500" />
                  <WellnessPill icon={Moon} label="Sleep" value={`${todayLog?.sleep_hours || '--'}h`} color="text-violet-500" />
                  <WellnessPill icon={Zap} label="Energy" value={`${todayLog?.exercise_minutes || 0}m`} color="text-amber-500" />
                </div>
              </div>

              {/* Score Ring */}
              <div className="flex-shrink-0 relative">
                <ScoreRing score={score} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {latestAnalysis && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Glow Progress</span>
                  <span className="font-bold text-pink-400">{score}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(200,150,220,0.15)' }}>
                  <motion.div
                    className="h-full rounded-full progress-glow"
                    style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── QUICK STATS ROW ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="grid grid-cols-3 gap-3">
          {[
            { label: 'Streak', value: '7 days', color: 'text-orange-500' },
            { label: 'Products', value: latestAnalysis ? '12' : '0', color: 'text-pink-500' },
            { label: 'Goals', value: '3', color: 'text-violet-500' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.16 + i * 0.05 }}
              className="ios-card p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-600 font-semibold mt-1">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── WEATHER ADVISOR ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <WeatherAdvisor skinAnalysis={latestAnalysis} />
        </motion.div>

        {/* ── TODAY'S ROUTINE ─────────────────────────────────────────── */}
        {routineData && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="ios-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">Today's Routine</p>
                  <p className="text-xs text-gray-500">{todayName}</p>
                </div>
                <Link to="/SkinRoutine">
                  <span className="text-xs font-semibold text-pink-500 flex items-center gap-0.5 hover:gap-1 transition">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>

              {/* Morning steps */}
              {routineData.morning_routine?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">☀️ Morning</p>
                  <div className="flex flex-wrap gap-1.5">
                    {routineData.morning_routine.map((step, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.15),rgba(249,115,22,0.10))', color: '#b45309', border: '1px solid rgba(251,191,36,0.25)' }}>
                        {i + 1}. {step.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Night plan */}
              {todayNightPlan && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-2">
                    🌙 Tonight — {todayNightPlan.day_type === 'treatment' ? '💊 Treatment' : todayNightPlan.day_type === 'recovery' ? '🌿 Recovery' : '💧 Hydration'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(todayNightPlan.steps || []).map((step, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(139,92,246,0.10))', color: '#6d28d9', border: '1px solid rgba(167,139,250,0.25)' }}>
                        {i + 1}. {step.name}{step.active ? ' ✦' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {routineData.recovery_mode_active && (
                <p className="text-xs px-3 py-2 rounded-xl mt-2 font-medium"
                  style={{ background: 'rgba(254,226,226,0.6)', color: '#dc2626', border: '1px solid rgba(252,165,165,0.4)' }}>
                  🚨 Recovery Mode — Gentle cleanse + moisturizer only.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FEATURE GRID ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <p className="text-sm font-bold text-gray-900 mb-4">Features</p>
          <div className="grid grid-cols-3 gap-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link key={f.page} to={createPageUrl(f.page)}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 + i * 0.04 }}
                    whileTap={{ scale: 0.95 }}
                    className="ios-card p-4 flex flex-col items-center text-center gap-2 hover:scale-105 transition"
                  >
                    <div className="icon-badge">
                      <Icon className="w-5 h-5 text-pink-500" />
                    </div>
                    <p className="text-xs font-semibold text-gray-900">{f.title}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* ── PROACTIVE INSIGHTS ───────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <ProactiveHealthInsights skinAnalysis={latestAnalysis} dietLog={todayLog} />
        </motion.div>

        {/* ── CROSS FEATURE INSIGHTS ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <CrossFeatureInsights
            skinAnalysis={latestAnalysis}
            dietLog={todayLog}
            routines={routines}
            logs={allLogs}
          />
        </motion.div>

        {/* ── USER JOURNEY ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <UserJourney latestAnalysis={latestAnalysis} />
        </motion.div>

        {/* ── PRODUCT RECOMMENDER ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <ProductRecommender skinAnalysis={latestAnalysis} />
        </motion.div>

        {/* ── SIGN IN NUDGE ────────────────────────────────────────────── */}
        {!user && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
            <div className="ios-card p-8 text-center">
              <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: 'linear-gradient(135deg, rgba(255, 107, 170, 0.2), rgba(200, 150, 255, 0.2))', border: '1px solid rgba(255, 255, 255, 0.5)' }}>✨</div>
              <p className="font-bold text-gray-900 mb-1">Begin Your Skin Journey</p>
              <p className="text-sm text-gray-600 mb-6">AI-powered insights for your skin</p>
              <button onClick={() => base44.auth.redirectToLogin()}
                className="ios-button w-full">
                Sign In
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* ── BOTTOM NAV ───────────────────────────────────────────────────── */}
      <div className="bottom-nav fixed bottom-0 left-0 right-0 z-50 px-6 py-3 safe-area-pb">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {[
            { icon: '🏠', label: 'Home',    page: '/',              active: true },
            { icon: '📸', label: 'Analyze', page: '/SkinAnalysis',  active: false },
            { icon: '✨', label: 'Routine',  page: '/SkinRoutine',   active: false },
            { icon: '📈', label: 'Progress', page: '/Progress',      active: false },
            { icon: '💬', label: 'Coach',    page: '/SkinChat',      active: false },
          ].map((item) => (
            <Link key={item.page} to={item.page} className="flex flex-col items-center gap-1 group">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all ${
                item.active
                  ? 'icon-bubble scale-110 shadow-lg'
                  : 'hover:bg-pink-50'
              }`} style={item.active ? { background: 'linear-gradient(135deg,rgba(244,114,182,0.15),rgba(167,139,250,0.15))', border: '1px solid rgba(244,114,182,0.3)' } : {}}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-bold tracking-wide ${item.active ? 'text-pink-500' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}