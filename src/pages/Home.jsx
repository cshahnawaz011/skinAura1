import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Home as HomeIcon, Camera, Sparkles, TrendingUp, MessageCircle, User, ArrowRight, Zap, Target, Calendar, Flame, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

const BOTTOM_NAV = [
  { icon: HomeIcon, label: 'Home', page: '/', key: 'home' },
  { icon: Camera, label: 'Scan', page: '/SkinAnalysis', key: 'scan' },
  { icon: Sparkles, label: 'Routine', page: '/SkinRoutine', key: 'routine' },
  { icon: TrendingUp, label: 'Insights', page: '/Progress', key: 'insights' },
  { icon: User, label: 'Profile', page: '/Profile', key: 'profile' },
];

const FEATURE_GRID = [
  { icon: Camera, label: 'Scan Skin', desc: "AI-powered facial analysis to detect acne, hydration, and more.", page: '/SkinAnalysis', color: '#f472b6', bgColor: 'rgba(244,114,182,0.1)' },
  { icon: Sparkles, label: 'Routine', desc: "Your personalized daily skincare routine and product tracking.", page: '/SkinRoutine', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.1)' },
  { icon: MessageCircle, label: 'AI Chat', desc: "Ask any skincare question to your intelligent dermatologist AI.", page: '/SkinChat', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)' },
  { icon: Calendar, label: 'Scheduler', desc: "Plan your treatments and track consistency over time.", page: '/SmartScheduler', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)' },
  { icon: Zap, label: 'Insights', desc: "Deep dive into what's working for your skin and what's not.", page: '/AiInsights', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)' },
  { icon: Target, label: 'Goals', desc: "Set specific targets like 'Clear Acne' and track progress.", page: '/SkinGoals', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [showJourney, setShowJourney] = useState(false);
  const currentPath = window.location.pathname;

  useEffect(() => {
    const hasSeen = localStorage.getItem('journey_seen');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowJourney(true);
        localStorage.setItem('journey_seen', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Data queries
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

  const { data: glowMetrics } = useQuery({
    queryKey: ['glowMetrics', user?.email],
    queryFn: async () => {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Calcutta' });
      const metrics = await base44.entities.DailyGlowMetrics.filter({ user_email: user.email, date: today });
      return metrics[0] || null;
    },
    enabled: !!user?.email,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5f3f0 0%, #faf8f6 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm mx-4 px-8 py-12"
          style={{
            background: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(244,114,182,0.15)',
            borderRadius: '28px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}>
          <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-24 h-24 mx-auto rounded-3xl object-cover shadow-lg mb-6" alt="SkinAura" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">SkinAura</h2>
          <p className="text-gray-600 text-sm mb-8 leading-relaxed">Your personal AI skin companion</p>
          <button onClick={() => base44.auth.redirectToLogin()}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:shadow-lg active:scale-95 ios-button"
            style={{
              background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)'
            }}>
            Get Started
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(180deg, #f9f7f4 0%, #fef9f6 50%, #faf8f5 100%)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-1">Welcome</p>
            <h1 className="text-2xl font-black text-gray-900">{user.full_name?.split(' ')[0] || 'You'}</h1>
          </div>
          <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)' }}>
            {user.full_name?.[0]?.toUpperCase() || '✦'}
          </motion.div>
        </motion.div>

        {/* SKIN SCORE HERO */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl mb-8 text-white"
          style={{
            background: `linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)`,
            boxShadow: '0 8px 32px rgba(244,114,182,0.25)'
          }}>
          <p className="text-xs font-semibold opacity-90 mb-2">Skin Health Score</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black">{latestAnalysis?.overall_score || '—'}</p>
              <p className="text-xs opacity-80 mt-1">{latestAnalysis ? `${latestAnalysis.skin_type} skin` : 'Scan to get started'}</p>
            </div>
            <Link to="/SkinAnalysis">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition font-semibold text-sm">
                <Camera className="w-4 h-4" /> Scan
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* DAILY STATUS */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-4 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(244,114,182,0.1)' }}>
            <p className="text-2xl mb-1">{glowMetrics?.glow_score || 0}</p>
            <p className="text-xs font-semibold text-gray-600">Glow Score</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-4 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(244,114,182,0.1)' }}>
            <p className="text-2xl mb-1">{todayLog?.water_glasses || 0}</p>
            <p className="text-xs font-semibold text-gray-600">Water</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="p-4 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(244,114,182,0.1)' }}>
            <p className="text-2xl mb-1">{todayLog?.sleep_hours || 0}h</p>
            <p className="text-xs font-semibold text-gray-600">Sleep</p>
          </motion.div>
        </div>

        {/* QUICK FEATURES GRID */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Features</p>
          <div className="grid grid-cols-3 gap-2.5 mb-8">
            {FEATURE_GRID.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="relative group">
                  <Link to={feature.page} className="block h-full">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="p-4 rounded-xl text-center transition-all cursor-pointer h-full ios-button-3d"
                      style={{ background: feature.bgColor, border: `1.5px solid ${feature.color}30` }}>
                      <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: feature.color }} />
                      <p className="text-[11px] font-bold text-gray-900">{feature.label}</p>
                    </motion.div>
                  </Link>
                  <div className="absolute -top-2 -right-2 z-10">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-6 h-6 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-pink-500 transition-colors">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-3 text-sm rounded-xl shadow-xl" side="top">
                        <p className="font-bold text-gray-900 mb-1">{feature.label}</p>
                        <p className="text-gray-600 text-xs">{feature.desc}</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* QUICK INSIGHTS */}
        {latestAnalysis && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="p-5 rounded-xl mb-8"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(244,114,182,0.1)' }}>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Today's Focus</p>
            <div className="space-y-2">
              {latestAnalysis.acne_level > 5 && (
                <p className="text-sm text-gray-800 flex items-center gap-2"><span>🔴</span> Manage acne activity</p>
              )}
              {latestAnalysis.dryness > 5 && (
                <p className="text-sm text-gray-800 flex items-center gap-2"><span>💧</span> Boost hydration</p>
              )}
              {latestAnalysis.oiliness > 5 && (
                <p className="text-sm text-gray-800 flex items-center gap-2"><span>🛢️</span> Balance oil production</p>
              )}
              {latestAnalysis.acne_level <= 5 && latestAnalysis.dryness <= 5 && latestAnalysis.oiliness <= 5 && (
                <p className="text-sm text-gray-800 flex items-center gap-2"><span>✨</span> Your skin is balanced—maintain routine</p>
              )}
            </div>
          </motion.div>
        )}

        {/* CTA SECTION */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="flex gap-3"
          >
          <Link to="/SkinChat" className="flex-1">
            <div className="p-4 rounded-xl text-center text-white font-bold text-sm transition-all hover:shadow-md ios-button-3d"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
              Ask AI Coach
            </div>
          </Link>
          <Link to="/Progress" className="flex-1">
            <div className="p-4 rounded-xl text-center font-bold text-sm transition-all ios-button-3d"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)', color: 'rgb(23,23,23)' }}>
              View Progress
            </div>
          </Link>
        </motion.div>

      </div>

      {/* SKIN JOURNEY MODAL */}
      <Dialog open={showJourney} onOpenChange={setShowJourney}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 overflow-hidden p-0" style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #f0f6ff 100%)' }}>
          <div className="p-8 text-center relative">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            
            <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-20 h-20 mx-auto rounded-2xl shadow-xl mb-6 relative z-10 object-cover" alt="SkinAura Journey" />
            
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-gray-900 mb-2 relative z-10">Your Skin Journey</DialogTitle>
              <DialogDescription className="text-gray-600 text-sm leading-relaxed relative z-10">
                Welcome to SkinAura! Follow these steps to achieve your glow:
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 space-y-4 text-left relative z-10">
              {[
                { icon: '📸', title: '1. Skin Analysis', desc: 'Scan your face to detect concerns.' },
                { icon: '✨', title: '2. Routine', desc: 'Get a personalized daily regimen.' },
                { icon: '📈', title: '3. Progress', desc: 'Track improvements over time.' },
                { icon: '💡', title: '4. Insights', desc: 'Learn what works best for you.' }
              ].map((step, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  key={idx} className="flex items-start gap-3 bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white/40 shadow-sm"
                >
                  <span className="text-2xl">{step.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{step.title}</h4>
                    <p className="text-xs text-gray-600">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button 
              onClick={() => setShowJourney(false)}
              className="mt-8 w-full py-3 rounded-xl font-bold text-white transition-all hover:shadow-lg active:scale-95 relative z-10 ios-button-3d"
              style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)' }}
            >
              Start My Journey
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}