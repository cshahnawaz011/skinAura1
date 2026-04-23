import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Camera, Sparkles, TrendingUp, MessageCircle,
  Palette, Sun, Users, Droplets, ArrowRight,
  Zap, BookOpen, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import WeatherAdvisor from '@/components/home/WeatherAdvisor';
import ProactiveHealthInsights from '@/components/home/ProactiveHealthInsights';
import CrossFeatureInsights from '@/components/home/CrossFeatureInsights';
import ProductRecommender from '@/components/home/ProductRecommender';
import UserJourney from '@/components/home/UserJourney';
import FeaturesIntroPopup from '@/components/home/FeaturesIntroPopup';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/components/i18n/translations';

const card = "rounded-2xl border p-5";
const cardStyle = { background: 'rgba(255,250,246,0.85)', border: '1px solid #ede8e3' };
const cardDark = { background: 'rgba(30,22,40,0.85)', border: '1px solid rgba(255,255,255,0.08)' };

const FEATURES = [
  { icon: Camera, title: 'AI Skin Analysis', desc: 'Get detailed insights about your skin', page: 'SkinAnalysis', from: '#f8d7da', to: '#f3c6d8', iconColor: '#c0607a' },
  { icon: Sparkles, title: 'Personalized Routine', desc: 'Morning & night skincare routines', page: 'SkinRoutine', from: '#fde8cc', to: '#f9d5a7', iconColor: '#c07030' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'See your skin transformation', page: 'Progress', from: '#ccf0e4', to: '#b5e8d5', iconColor: '#307a60' },
  { icon: Droplets, title: 'Product Finder', desc: 'Find perfect products for you', page: 'Products', from: '#cce4f8', to: '#b5d5f0', iconColor: '#306090' },
  { icon: MessageCircle, title: 'AI Skin Coach', desc: 'Ask anything about skincare', page: 'SkinChat', from: '#ddd5f5', to: '#ccc0ec', iconColor: '#6050a0' },
  { icon: Palette, title: 'Virtual Makeup', desc: 'Try on makeup looks', page: 'MakeupTryOn', from: '#f5d5ee', to: '#ecc0e0', iconColor: '#905080' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(localStorage.getItem('glowai-dark') === 'true');
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('glowai-intro-seen'));
  const { tr } = useTranslation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
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

  const routineData = savedRoutine?.steps || null;
  const todayDayIndex = (new Date().getDay() + 6) % 7; // Mon=0
  const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const todayName = DAY_NAMES[todayDayIndex];
  const todayNightPlan = routineData?.night_week_plan?.find(d => d.day_label === todayName) || routineData?.night_week_plan?.[todayDayIndex] || null;

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 30),
    enabled: !!user?.email,
  });

  const cs = dark ? cardDark : cardStyle;
  const textMuted = dark ? '#a09090' : '#9a7e78';
  const textBase = dark ? '#f0e8e0' : '#3d2a2a';

  const scoreColor = latestAnalysis?.overall_score >= 70 ? '#4a9070' : latestAnalysis?.overall_score >= 50 ? '#c07030' : '#c05060';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <AnimatePresence>
        {showIntro && <FeaturesIntroPopup onClose={() => { localStorage.setItem('glowai-intro-seen', '1'); setShowIntro(false); }} />}
      </AnimatePresence>

      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="text-center pt-4 pb-2">
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: textBase, letterSpacing: '-0.02em' }}>
          GlowAI: <span style={{ color: '#c07080' }}>Your skin, elevated</span>
        </h1>
        <p className="text-sm" style={{ color: textMuted }}>Analyze, track and improve your skin with personalized AI</p>
      </motion.div>

      {/* WEATHER ADVISOR */}
      <WeatherAdvisor skinAnalysis={latestAnalysis} />

      {/* 3-COL SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Glow Score */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={card} style={cs}>
          <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: textMuted }}>
            <Star className="w-3.5 h-3.5" style={{ color: '#c8a860' }} /> Your Skin Score
          </p>
          {analysisLoading ? (
            <div className="h-16 rounded-xl animate-pulse" style={{ background: '#f0ebe6' }} />
          ) : latestAnalysis ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-black"
                style={{ background: 'linear-gradient(135deg,#f8d7da,#fde8cc)', color: scoreColor }}>
                {latestAnalysis.overall_score}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: textBase }}>
                  {latestAnalysis.overall_score >= 70 ? 'Looking great!' : latestAnalysis.overall_score >= 50 ? 'Improving' : 'Needs care'}
                </p>
                <p className="text-xs capitalize mt-0.5" style={{ color: textMuted }}>{latestAnalysis.skin_type} skin</p>
                <Link to={createPageUrl('Progress')}>
                  <span className="text-xs font-medium mt-1 block" style={{ color: '#c07080' }}>View Progress →</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2 gap-2">
              <p className="text-sm" style={{ color: textMuted }}>No analysis yet</p>
              <Link to={createPageUrl('SkinAnalysis')}>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
                  <Camera className="w-3.5 h-3.5" /> Analyze Now
                </button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Today's Wellness */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={card} style={cs}>
          <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: textMuted }}>
            <Sun className="w-3.5 h-3.5" style={{ color: '#c8a060' }} /> Today's Wellness
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: textMuted }}>Water Intake</span>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="text-xs" style={{ opacity: i < (todayLog?.water_glasses || 0) ? 1 : 0.2 }}>💧</span>
                  ))}
                </div>
                <span className="text-xs font-medium" style={{ color: textBase }}>{todayLog?.water_glasses || 0}/8</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: textMuted }}>Sleep Hours</span>
              <span className="font-medium text-xs" style={{ color: textBase }}>{todayLog?.sleep_hours || '--'} hrs</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: textMuted }}>Exercise</span>
              <span className="font-medium text-xs" style={{ color: textBase }}>{todayLog?.exercise_minutes || 0} min</span>
            </div>
          </div>
          <Link to={createPageUrl('Lifestyle')} className="block mt-3">
            <button className="w-full py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={{ border: '1px solid #ede8e3', color: textMuted, background: 'transparent' }}>
              Log Today's Activity
            </button>
          </Link>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={card} style={cs}>
          <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: textMuted }}>
            <Zap className="w-3.5 h-3.5" style={{ color: '#a0a0c8' }} /> Quick Actions
          </p>
          <div className="space-y-2">
            {[
              { to: 'SkinAnalysis', icon: Camera, label: 'New Skin Analysis', color: '#c07080' },
              { to: 'SkinRoutine', icon: Sparkles, label: 'View My Routine', color: '#c07030' },
              { to: 'SkinChat', icon: MessageCircle, label: 'Ask AI Coach', color: '#6050a0' },
            ].map(({ to, icon: Icon, label, color }) => (
              <Link key={to} to={createPageUrl(to)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group"
                style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#faf6f2', border: '1px solid transparent' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#ede8e3'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <span className="text-sm" style={{ color: textBase }}>{label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* TODAY'S ROUTINE */}
      {routineData && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className={card} style={cs}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: textMuted }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#c07030' }} /> Today's Routine — {todayName}
            </p>
            <Link to="/SkinRoutine">
              <span className="text-xs font-medium" style={{ color: '#c07080' }}>Full Routine →</span>
            </Link>
          </div>

          {/* Morning Steps */}
          {routineData.morning_routine?.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#c8a060' }}>☀️ Morning</p>
              <div className="flex flex-wrap gap-1.5">
                {routineData.morning_routine.map((step, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: dark ? 'rgba(255,200,100,0.12)' : '#fef3e2', color: dark ? '#f5d090' : '#8a5a20', border: '1px solid rgba(200,160,60,0.2)' }}>
                    {i + 1}. {step.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tonight's Plan */}
          {todayNightPlan && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#a080c8' }}>
                🌙 Tonight — {todayNightPlan.day_type === 'treatment' ? '💊 Treatment' : todayNightPlan.day_type === 'recovery' ? '🌿 Recovery' : '💧 Hydration'}
                {todayNightPlan.active_name && <span style={{ color: '#8060b0', marginLeft: 6 }}>· {todayNightPlan.active_name}</span>}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(todayNightPlan.steps || []).map((step, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: dark ? 'rgba(160,120,220,0.12)' : '#f3eeff', color: dark ? '#c8a8f0' : '#5a3a90', border: '1px solid rgba(160,120,220,0.2)' }}>
                    {i + 1}. {step.name}{step.active ? ' ✦' : ''}
                  </span>
                ))}
              </div>
              {todayNightPlan.frequency_note && (
                <p className="text-[10px] mt-1.5" style={{ color: textMuted }}>📅 {todayNightPlan.frequency_note}</p>
              )}
            </div>
          )}

          {/* Recovery mode override */}
          {routineData.recovery_mode_active && (
            <p className="text-xs px-3 py-2 rounded-xl mt-2 font-medium"
              style={{ background: dark ? 'rgba(220,60,60,0.12)' : '#fff0f0', color: '#c04040', border: '1px solid rgba(200,60,60,0.2)' }}>
              🚨 Recovery Mode — No actives today. Gentle cleanse + moisturizer only.
            </p>
          )}
        </motion.div>
      )}

      {/* PROACTIVE INSIGHTS */}
      <ProactiveHealthInsights skinAnalysis={latestAnalysis} dietLog={todayLog} />

      {/* SMART CONNECTIONS */}
      <CrossFeatureInsights
        skinAnalysis={latestAnalysis}
        dietLog={todayLog}
        routines={routines}
        logs={allLogs}
      />

      {/* EXPLORE FEATURES */}
      <div>
        <p className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: textBase }}>
          <Zap className="w-4 h-4" style={{ color: '#c8a060' }} /> Explore Features
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Link key={f.page} to={createPageUrl(f.page)}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="rounded-2xl p-4 cursor-pointer transition-all"
                  style={{
                    background: dark
                      ? `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`
                      : `linear-gradient(135deg, ${f.from}, ${f.to})`,
                    border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.6)'
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(255,255,255,0.5)' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: f.iconColor }} />
                  </div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: dark ? '#f0e8e0' : '#3d2a2a' }}>{f.title}</p>
                  <p className="text-xs" style={{ color: dark ? '#a09090' : '#7a6060' }}>{f.desc}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* USER JOURNEY */}
      <UserJourney latestAnalysis={latestAnalysis} />

      {/* PRODUCT RECOMMENDER */}
      <ProductRecommender skinAnalysis={latestAnalysis} />
    </div>
  );
}