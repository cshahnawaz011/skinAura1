import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Camera, Sparkles, TrendingUp, MessageCircle,
  Palette, Sun, Users, Star, Droplets, Shield, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';
import SkeletonCard from '@/components/ui/SkeletonCard';
import WeatherAdvisor from '@/components/home/WeatherAdvisor';
import ProactiveHealthInsights from '@/components/home/ProactiveHealthInsights';
import { useTranslation } from '@/components/i18n/translations';

export default function Home() {
  const [user, setUser] = useState(null);
  const [showDnsPopup, setShowDnsPopup] = useState(false);
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
    setShowDnsPopup(true);
    base44.auth.me().then(setUser).catch(() => {});
  }, []);


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
      const today = new Date().toISOString().split('T')[0];
      const logs = await base44.entities.DietLog.filter({ user_email: user.email, log_date: today });
      return logs[0] || null;
    },
    enabled: !!user?.email,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* DNS Popup */}
      {showDnsPopup && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tr('enableSecureDNS')}</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {tr('dnsDescription')}
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm space-y-2 mb-5">
              <p className="font-semibold text-gray-700 dark:text-gray-200">{tr('goTo')}</p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{tr('settings')}</span> → <span className="font-medium">{tr('networkInternet')}</span> → <span className="font-medium">{tr('privateDNS')}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-300">{tr('enter')}</p>
              <p className="font-mono bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-blue-600 dark:text-blue-400 font-semibold tracking-wide select-all">
                dns.google
              </p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              onClick={() => setShowDnsPopup(false)}
            >
              {tr('gotIt')}
            </Button>
          </motion.div>
        </div>
      )}
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8 lg:py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-400 via-amber-300 to-emerald-300 flex items-center justify-center shadow-lg"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
          {tr('welcomeTo')} <span className="gold-shimmer">GlowAI</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {tr('homeSubtitle')}
        </p>
        

      </motion.div>

      {/* User Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Weather Skin Advisor — full width */}
          <div className="lg:col-span-3">
            <WeatherAdvisor skinAnalysis={latestAnalysis} />
          </div>
          {/* Skin Score Card */}
          <GlassCard className="lg:col-span-1" delay={0.1}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {tr('yourSkinScore')}
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
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="w-4 h-4 mr-2 text-pink-500" />
                  {tr('newSkinAnalysis')}
                </Button>
              </Link>
              <Link to={createPageUrl('SkinRoutine')} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                  {tr('viewMyRoutine')}
                </Button>
              </Link>
              <Link to={createPageUrl('SkinChat')} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2 text-violet-500" />
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
        </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Explore Features
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.page} to={createPageUrl(feature.page)}>
                <GlassCard
                  delay={0.1 * index}
                  className="h-full cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Banner */}
      <GlassCard className="mt-8">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold gold-shimmer">10+</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI Features</p>
          </div>
          <div>
            <p className="text-3xl font-bold gold-shimmer">98%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
          </div>
          <div>
            <p className="text-3xl font-bold gold-shimmer">24/7</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI Support</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}