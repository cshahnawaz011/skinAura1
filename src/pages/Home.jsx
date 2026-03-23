import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Sparkles, TrendingUp, MessageCircle,
  Palette, Sun, Users, Star, Droplets, Shield, ArrowRight,
  Bot, Clock, Zap, BookOpen, FlaskConical, GitCompare, Trophy, Globe, FileText, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';
import SkeletonCard from '@/components/ui/SkeletonCard';
import WeatherAdvisor from '@/components/home/WeatherAdvisor';
import ProactiveHealthInsights from '@/components/home/ProactiveHealthInsights';
import FeaturesIntroPopup from '@/components/home/FeaturesIntroPopup';
import CrossFeatureInsights from '@/components/home/CrossFeatureInsights';
import ProductRecommender from '@/components/home/ProductRecommender';
import UserJourney from '@/components/home/UserJourney';
import { useTranslation } from '@/components/i18n/translations';

export default function Home() {
  const [user, setUser] = useState(null);
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('glowai-intro-seen'));
  const { tr } = useTranslation();

  const features = [
    { icon: Camera, title: tr('aiSkinAnalysis'), desc: tr('aiSkinAnalysisDesc'), page: 'SkinAnalysis', color: 'from-pink-400 to-rose-400' },
    { icon: Sparkles, title: tr('personalizedRoutine'), desc: tr('personalizedRoutineDesc'), page: 'SkinRoutine', color: 'from-amber-400 to-orange-400' },
    { icon: TrendingUp, title: tr('trackProgressFeature'), desc: tr('trackProgressDesc'), page: 'Progress', color: 'from-emerald-400 to-teal-400' },
    { icon: Droplets, title: tr('productFinder'), desc: tr('productFinderDesc'), page: 'Products', color: 'from-blue-400 to-cyan-400' },
    { icon: MessageCircle, title: tr('aiSkinCoach'), desc: tr('aiSkinCoachDesc'), page: 'SkinChat', color: 'from-violet-400 to-purple-400' },
    { icon: Palette, title: tr('virtualMakeup'), desc: tr('virtualMakeupDesc'), page: 'MakeupTryOn', color: 'from-pink-400 to-fuchsia-400' },
  ];

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleCloseIntro = () => {
    localStorage.setItem('glowai-intro-seen', '1');
    setShowIntro(false);
  };


  const { data: latestAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const analyses = await base44.entities.SkinAnalysis.filter(
        { user_email: user.email },
        '-created_date',
        1
      );
      return analyses[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: todayLog } = useQuery({
    queryKey: ['todayLog', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
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

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 30),
    enabled: !!user?.email,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Features Intro Popup */}
      <AnimatePresence>
        {showIntro && <FeaturesIntroPopup onClose={handleCloseIntro} />}
      </AnimatePresence>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 lg:py-12 relative"
      >
        {/* Floating sparks background */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 6 + (i % 3) * 4,
              height: 6 + (i % 3) * 4,
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 4) * 20}%`,
              background: ['#f472b6','#fbbf24','#a78bfa','#34d399','#60a5fa','#fb7185','#facc15','#c084fc'][i],
              boxShadow: `0 0 8px 3px ${['#f472b6','#fbbf24','#a78bfa','#34d399','#60a5fa','#fb7185','#facc15','#c084fc'][i]}80`,
            }}
            animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-400 via-amber-300 to-emerald-300 flex items-center justify-center shadow-2xl"
          style={{ boxShadow: '0 0 32px 8px rgba(236,72,153,0.4), 0 0 64px 16px rgba(251,191,36,0.2)' }}
        >
          <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
        </motion.div>
        <h1 className="text-4xl lg:text-6xl font-black mb-3 gold-shimmer neon-gold">
          ✨ GlowAI ✨
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
          {tr('homeSubtitle')}
        </p>
        {/* Glowing divider */}
        <div className="mt-5 mx-auto w-32 h-1 rounded-full" style={{ background: 'linear-gradient(90deg,#f472b6,#fbbf24,#a78bfa)', boxShadow: '0 0 12px 4px rgba(244,114,182,0.5)' }} />
      </motion.div>

      {/* User Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Weather Skin Advisor — full width */}
          <div className="lg:col-span-3">
            <WeatherAdvisor skinAnalysis={latestAnalysis} />
          </div>
          {/* Skin Score Card */}
          <GlassCard className="lg:col-span-1" delay={0.1}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 drop-shadow" style={{ filter: 'drop-shadow(0 0 6px #fbbf24)' }} />
              <span className="neon-gold">{tr('yourSkinScore')}</span>
            </h3>
            {analysisLoading ? (
              <div className="flex justify-center py-4">
                <SkeletonCard hasCircle lines={1} />
              </div>
            ) : latestAnalysis ? (
              <div className="flex flex-col items-center">
                <CircularProgress
                  value={latestAnalysis.overall_score || 0}
                  size={140}
                  strokeWidth={12}
                  label={tr('outOf')}
                  color="pink"
                />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {tr('skinType')}: <span className="font-medium capitalize">{latestAnalysis.skin_type}</span>
                </p>
                <Link to={createPageUrl('Progress')}>
                  <Button variant="ghost" size="sm" className="mt-2 text-pink-500">
                    {tr('viewProgress')} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400 mb-4">{tr('noAnalysisYet')}</p>
                <Link to={createPageUrl('SkinAnalysis')}>
                  <Button className="bg-gradient-to-r from-pink-500 to-amber-500">
                    <Camera className="w-4 h-4 mr-2" />
                    {tr('analyzeNow')}
                  </Button>
                </Link>
              </div>
            )}
          </GlassCard>

          {/* Today's Wellness */}
          <GlassCard className="lg:col-span-1" delay={0.2}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              {tr('todaysWellness')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{tr('waterIntake')}</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Droplets
                        key={i}
                        className={`w-4 h-4 ${
                          i < (todayLog?.water_glasses || 0)
                            ? 'text-blue-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{todayLog?.water_glasses || 0}/8</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{tr('sleepHours')}</span>
                <span className="font-medium">{todayLog?.sleep_hours || '--'} hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{tr('exercise')}</span>
                <span className="font-medium">{todayLog?.exercise_minutes || 0} min</span>
              </div>
            </div>
            <Link to={createPageUrl('Lifestyle')}>
              <Button variant="outline" size="sm" className="w-full mt-4">
                {tr('logTodaysActivity')}
              </Button>
            </Link>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="lg:col-span-1" delay={0.3}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              {tr('quickActions')}
            </h3>
            <div className="space-y-3">
              <Link to={createPageUrl('SkinAnalysis')} className="block">
                <Button variant="outline" className="w-full justify-start h-12 text-base">
                  <Camera className="w-5 h-5 mr-2 text-pink-500" />
                  {tr('newSkinAnalysis')}
                </Button>
              </Link>
              <Link to={createPageUrl('SkinRoutine')} className="block">
                <Button variant="outline" className="w-full justify-start h-12 text-base">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                  {tr('viewMyRoutine')}
                </Button>
              </Link>
              <Link to={createPageUrl('SkinChat')} className="block">
                <Button variant="outline" className="w-full justify-start h-12 text-base">
                  <MessageCircle className="w-5 h-5 mr-2 text-violet-500" />
                  {tr('askAICoach')}
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Proactive Health Insights — full width */}
          <div className="lg:col-span-3">
            <ProactiveHealthInsights
              skinAnalysis={latestAnalysis}
              dietLog={todayLog}
            />
          </div>

          {/* Cross-Feature Smart Connections — full width */}
          <div className="lg:col-span-3">
            <CrossFeatureInsights
              skinAnalysis={latestAnalysis}
              dietLog={todayLog}
              routines={routines}
              logs={allLogs}
            />
          </div>
        </div>

      {/* User Journey — clear flow guide */}
      <UserJourney latestAnalysis={latestAnalysis} />

      {/* Product Recommender */}
      <ProductRecommender skinAnalysis={latestAnalysis} />
    </div>
  );
}