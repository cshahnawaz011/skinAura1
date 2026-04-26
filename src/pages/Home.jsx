import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, Camera, Sparkles, TrendingUp, MessageCircle, User } from 'lucide-react';
import { Link } from 'react-router-dom';

import SkinIdentitySnapshot from '@/components/home/SkinIdentitySnapshot';
import AIInsightStrip from '@/components/home/AIInsightStrip';
import FaceHeatmapPreview from '@/components/home/FaceHeatmapPreview';
import TodayRoutineCard from '@/components/home/TodayRoutineCard';
import ProductAlerts from '@/components/home/ProductAlerts';
import ProgressTrackingCard from '@/components/home/ProgressTrackingCard';
import AICoachEntry from '@/components/home/AICoachEntry';
import LifestyleImpactPanel from '@/components/home/LifestyleImpactPanel';
import GamificationStrip from '@/components/home/GamificationStrip';

const BOTTOM_NAV = [
  { icon: HomeIcon, label: 'Home', page: '/', key: 'home' },
  { icon: Camera, label: 'Scan', page: '/SkinAnalysis', key: 'scan' },
  { icon: Sparkles, label: 'Routine', page: '/SkinRoutine', key: 'routine' },
  { icon: TrendingUp, label: 'Insights', page: '/Progress', key: 'insights' },
  { icon: User, label: 'Profile', page: '/Profile', key: 'profile' },
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

  const { data: savedRoutine } = useQuery({
    queryKey: ['savedRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const routineData = savedRoutine?.steps || null;
  const todayDayIndex = (new Date().getDay() + 6) % 7;
  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayName = DAY_NAMES[todayDayIndex];

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(180deg, #faf8f6 0%, #fef5f2 50%, #faf8f6 100%)' }}>
      {!user && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(255,255,255,0.9)' }}>
          <div className="p-12 text-center max-w-sm mx-4" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(250,248,246,0.9) 100%)',
            border: '1px solid rgba(255,200,220,0.3)',
            borderRadius: '28px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 12px 40px rgba(200,100,150,0.08)'
          }}>
            <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(196,181,253,0.15))', border: '1px solid rgba(244,114,182,0.2)' }}>
              ✨
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">SkinAura</h2>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">Your personal AI skin companion. Analyze, track, and glow.</p>
            <button onClick={() => base44.auth.redirectToLogin()}
              className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:shadow-lg active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)',
                boxShadow: '0 8px 24px rgba(244,114,182,0.3)'
              }}>
              Begin Your Journey
            </button>
          </div>
        </motion.div>
      )}

      {user && (
        <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-pink-500 uppercase tracking-widest mb-1">Dashboard</p>
              <h1 className="text-3xl font-black text-gray-900">Welcome back</h1>
            </div>
            <motion.div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg"
              style={{
                background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)',
                boxShadow: '0 8px 20px rgba(244,114,182,0.25)'
              }}>
              {user.full_name?.[0]?.toUpperCase() || '✦'}
            </motion.div>
          </motion.div>

          {/* Core Sections */}
          <SkinIdentitySnapshot skinAnalysis={latestAnalysis} loading={analysisLoading} />
          <AIInsightStrip skinAnalysis={latestAnalysis} dietLog={todayLog} />
          <FaceHeatmapPreview skinAnalysis={latestAnalysis} />
          <TodayRoutineCard routineData={routineData} todayName={todayName} />
          <ProductAlerts skinAnalysis={latestAnalysis} />
          <ProgressTrackingCard skinAnalysis={latestAnalysis} />
          <AICoachEntry />
          <LifestyleImpactPanel dietLog={todayLog} />
          <GamificationStrip />
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 safe-area-pb"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(250,248,246,0.95) 15%, rgba(250,248,246,0.98) 100%)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(244, 114, 182, 0.08)'
        }}>
        <div className="max-w-lg mx-auto flex items-center justify-around">
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
  );
}