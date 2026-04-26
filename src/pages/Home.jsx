import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Home as HomeIcon, Camera, Sparkles, TrendingUp, MessageCircle, User, ArrowRight, Zap, Target, Calendar, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const BOTTOM_NAV = [
  { icon: HomeIcon, label: 'Home', page: '/', key: 'home' },
  { icon: Camera, label: 'Scan', page: '/SkinAnalysis', key: 'scan' },
  { icon: Sparkles, label: 'Routine', page: '/SkinRoutine', key: 'routine' },
  { icon: TrendingUp, label: 'Insights', page: '/Progress', key: 'insights' },
  { icon: User, label: 'Profile', page: '/Profile', key: 'profile' },
];

const FEATURE_GRID = [
  { icon: Camera, label: 'Scan Skin', page: '/SkinAnalysis', color: '#f472b6', bgColor: 'rgba(244,114,182,0.1)' },
  { icon: Sparkles, label: 'Routine', page: '/SkinRoutine', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.1)' },
  { icon: MessageCircle, label: 'AI Chat', page: '/SkinChat', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)' },
  { icon: Calendar, label: 'Scheduler', page: '/SmartScheduler', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)' },
  { icon: Zap, label: 'Insights', page: '/AiInsights', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)' },
  { icon: Target, label: 'Goals', page: '/SkinGoals', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const currentPath = window.location.pathname;

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
          <div className="text-5xl mb-6">✨</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">SkinAura</h2>
          <p className="text-gray-600 text-sm mb-8 leading-relaxed">Your personal AI skin companion</p>
          <button onClick={() => base44.auth.redirectToLogin()}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:shadow-lg active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)',
              boxShadow: '0 6px 20px rgba(244,114,182,0.25)'
            }}>
            Get Started
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(180deg, #f9f7f4 0%, #fef9f6 50%, #faf8f5 100%)' }}>
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
                <Link key={i} to={feature.page}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="p-4 rounded-xl text-center transition-all cursor-pointer"
                    style={{ background: feature.bgColor, border: `1.5px solid ${feature.color}30` }}>
                    <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: feature.color }} />
                    <p className="text-xs font-bold text-gray-900">{feature.label}</p>
                  </motion.div>
                </Link>
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
            <div className="p-4 rounded-xl text-center text-white font-bold text-sm transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
              Ask AI Coach
            </div>
          </Link>
          <Link to="/Progress" className="flex-1">
            <div className="p-4 rounded-xl text-center font-bold text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)', color: 'rgb(23,23,23)' }}>
              View Progress
            </div>
          </Link>
        </motion.div>

        {/* BOTTOM NAVIGATION */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 safe-area-pb"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(250,248,246,0.95) 15%, rgba(250,248,246,0.98) 100%)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(244, 114, 182, 0.08)'
        }}>
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.page;
            return (
              <Link key={item.key} to={item.page} className="flex flex-col items-center gap-1.5">
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)' : 'transparent',
                    boxShadow: isActive ? '0 6px 16px rgba(244,114,182,0.25)' : 'none'
                  }}>
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`} />
                </motion.div>
                <span className={`text-[10px] font-bold transition-colors ${
                  isActive ? 'text-pink-600' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}