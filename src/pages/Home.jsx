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
    <div className="hero-bg pb-28 min-h-screen">
      {!user && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="ios-card p-12 text-center max-w-sm mx-4">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ✨
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome to SkinAura</h2>
            <p className="text-gray-600 mb-8">Your AI-powered skin control tower. Scan, analyze, and transform.</p>
            <button onClick={() => base44.auth.redirectToLogin()}
              className="w-full py-3 rounded-lg font-bold text-white transition-all hover:shadow-lg active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
              }}>
              Sign In to Begin
            </button>
          </div>
        </motion.div>
      )}

      {user && (
        <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Skin Control Tower</p>
              <h1 className="text-2xl font-black text-gray-900">Good to see you</h1>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)' }}>
              {user.full_name?.[0]?.toUpperCase() || '✦'}
            </div>
          </motion.div>

          {/* 1. SKIN IDENTITY SNAPSHOT */}
          <SkinIdentitySnapshot skinAnalysis={latestAnalysis} loading={analysisLoading} />

          {/* 2. AI INSIGHT STRIP */}
          <AIInsightStrip skinAnalysis={latestAnalysis} dietLog={todayLog} />

          {/* 3. FACE HEATMAP PREVIEW */}
          <FaceHeatmapPreview skinAnalysis={latestAnalysis} />

          {/* 4. TODAY'S ROUTINE CARD */}
          <TodayRoutineCard routineData={routineData} todayName={todayName} />

          {/* 5. PRODUCT & INGREDIENT ALERTS */}
          <ProductAlerts skinAnalysis={latestAnalysis} />

          {/* 6. PROGRESS TRACKING CARD */}
          <ProgressTrackingCard skinAnalysis={latestAnalysis} />

          {/* 7. AI SKIN COACH ACCESS */}
          <AICoachEntry />

          {/* 8. LIFESTYLE IMPACT MINI PANEL */}
          <LifestyleImpactPanel dietLog={todayLog} />

          {/* 9. GAMIFICATION STRIP */}
          <GamificationStrip />
        </div>
      )}

      {/* 10. BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 safe-area-pb"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.page;
            return (
              <Link key={item.key} to={item.page} className="flex flex-col items-center gap-1.5 group">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'scale-110' : 'hover:scale-105'
                  }`}
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)' : 'rgba(100, 200, 200, 0.1)',
                    boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                  }}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                </motion.div>
                <span className={`text-[10px] font-bold tracking-wide transition-colors ${
                  isActive ? 'text-teal-600' : 'text-gray-500'
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