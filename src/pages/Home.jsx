import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Camera, Sparkles, TrendingUp, MessageCircle,
  Palette, Sun, Users, ArrowRight, Star, Droplets, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';
import SkeletonCard from '@/components/ui/SkeletonCard';
import WeatherAdvisor from '@/components/home/WeatherAdvisor';
import ProactiveHealthInsights from '@/components/home/ProactiveHealthInsights';

const features = [
  { icon: Camera, title: 'AI Skin Analysis', desc: 'Get detailed insights about your skin', page: 'SkinAnalysis', color: 'from-pink-400 to-rose-400' },
  { icon: Sparkles, title: 'Personalized Routine', desc: 'Morning & night skincare routines', page: 'SkinRoutine', color: 'from-amber-400 to-orange-400' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'See your skin transformation', page: 'Progress', color: 'from-emerald-400 to-teal-400' },
  { icon: Droplets, title: 'Product Finder', desc: 'Find perfect products for you', page: 'Products', color: 'from-blue-400 to-cyan-400' },
  { icon: MessageCircle, title: 'AI Skin Coach', desc: 'Ask anything about skincare', page: 'SkinChat', color: 'from-violet-400 to-purple-400' },
  { icon: Palette, title: 'Virtual Makeup', desc: 'Try on makeup looks', page: 'MakeupTryOn', color: 'from-pink-400 to-fuchsia-400' },
];

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
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
          Welcome to <span className="gold-shimmer">GlowAI</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your personal AI-powered skincare companion. Analyze, track, and transform your skin with science-backed recommendations.
        </p>
        
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Button
              size="lg"
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* User Dashboard */}
      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Weather Skin Advisor — full width */}
          <div className="lg:col-span-3">
            <WeatherAdvisor skinAnalysis={latestAnalysis} />
          </div>
          {/* Skin Score Card */}
          <GlassCard className="lg:col-span-1" delay={0.1}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Your Skin Score
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
                  label="out of 100"
                  color="pink"
                />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Skin Type: <span className="font-medium capitalize">{latestAnalysis.skin_type}</span>
                </p>
                <Link to={createPageUrl('Progress')}>
                  <Button variant="ghost" size="sm" className="mt-2 text-pink-500">
                    View Progress <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No analysis yet</p>
                <Link to={createPageUrl('SkinAnalysis')}>
                  <Button className="bg-gradient-to-r from-pink-500 to-amber-500">
                    <Camera className="w-4 h-4 mr-2" />
                    Analyze Now
                  </Button>
                </Link>
              </div>
            )}
          </GlassCard>

          {/* Today's Wellness */}
          <GlassCard className="lg:col-span-1" delay={0.2}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              Today's Wellness
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Water Intake</span>
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
                <span className="text-gray-600 dark:text-gray-300">Sleep Hours</span>
                <span className="font-medium">{todayLog?.sleep_hours || '--'} hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Exercise</span>
                <span className="font-medium">{todayLog?.exercise_minutes || 0} min</span>
              </div>
            </div>
            <Link to={createPageUrl('Lifestyle')}>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Log Today's Activity
              </Button>
            </Link>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="lg:col-span-1" delay={0.3}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link to={createPageUrl('SkinAnalysis')} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="w-4 h-4 mr-2 text-pink-500" />
                  New Skin Analysis
                </Button>
              </Link>
              <Link to={createPageUrl('SkinRoutine')} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                  View My Routine
                </Button>
              </Link>
              <Link to={createPageUrl('SkinChat')} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2 text-violet-500" />
                  Ask AI Coach
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
      )}

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