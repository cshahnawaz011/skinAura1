import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Camera, Sparkles, TrendingUp, MessageCircle, 
  Zap, HeartPulse
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import SeasonalSynthesisCard from '@/components/routine/SeasonalSynthesisCard';

const EXPLORE_GRID = [
  { icon: Camera, label: 'Analyse', page: '/SkinAnalysis', color: '#f472b6', bgColor: 'rgba(244,114,182,0.1)' },
  { icon: Sparkles, label: 'Routine', page: '/SkinRoutine', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.1)' },
  { icon: TrendingUp, label: 'Progress', page: '/Progress', color: '#38bdf8', bgColor: 'rgba(56,189,248,0.1)' },
  { icon: Zap, label: 'AI Insights', page: '/AiInsights', color: '#10b981', bgColor: 'rgba(16,185,129,0.1)' },
  { icon: MessageCircle, label: 'AI Coach', page: '/SkinChat', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)' },
  { icon: HeartPulse, label: 'Hormones', page: '/HormoneTracker', color: '#ec4899', bgColor: 'rgba(236,72,153,0.1)' },
];

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const { data: todayMetric } = useQuery({
    queryKey: ['glowMetric', user?.email, todayDate],
    queryFn: () => base44.entities.DailyGlowMetrics.filter({ user_email: user.email, date: todayDate }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const glowScore = todayMetric?.glow_score || 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen pb-10" style={{ background: '#fafafa' }}>
      {/* Top Banner CTA */}
      <div className="w-full bg-white border-b border-gray-100 p-4 pt-6">
        <Link to="/SkinAnalysis">
          <div className="max-w-2xl mx-auto flex items-center justify-between bg-pink-50/50 rounded-[20px] p-4 border border-pink-100/50 cursor-pointer hover:bg-pink-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🤳</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">AI Skin Analysis</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 pr-2 leading-relaxed">
                  Upload a selfie and get a clinical-grade skin health report in seconds — acne, dark spots, oiliness & more.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-full px-3 py-1.5 shadow-sm text-gray-600 text-xs font-bold border border-gray-100 whitespace-nowrap">
              Next
            </div>
          </div>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8">
        
        {/* Date & Greeting */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-bold text-gray-400 mb-1">{today}</p>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight">{greeting} 👋</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Your personalised skin briefing.</p>
        </motion.div>

        {/* Weather Briefing */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <SeasonalSynthesisCard />
        </motion.div>

        {/* Glow Score & Latest Analysis */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Glow Score Circle */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-between ios-card"
            >
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> Today's Glow</h3>
                <p className="text-xs text-gray-500 mb-3">Your daily habit score</p>
                <Link to="/GlowDashboard">
                  <button className="text-[11px] font-bold px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors">
                    Log Habits
                  </button>
                </Link>
              </div>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90 absolute inset-0" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="url(#glowGradHome)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - glowScore / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                  <defs>
                    <linearGradient id="glowGradHome" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-lg font-black text-gray-800">{glowScore}</span>
              </div>
            </motion.div>

            {/* Latest Analysis */}
            {latestAnalysis ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm ios-card"
              >
                <Link to="/SkinAnalysis" className="block">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0.5 flex items-center gap-1.5"><Camera className="w-4 h-4 text-pink-500" /> Latest Scan</h3>
                      <p className="text-[10px] text-gray-500 capitalize">{latestAnalysis.skin_type} Skin</p>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-pink-100 bg-pink-50">
                      <span className="text-sm font-black text-pink-600">{latestAnalysis.overall_score}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-gray-400 mb-0.5">Acne</p>
                      <p className={`text-xs font-bold ${latestAnalysis.acne_level > 5 ? 'text-red-500' : 'text-emerald-500'}`}>{latestAnalysis.acne_level}/10</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-gray-400 mb-0.5">Dryness</p>
                      <p className={`text-xs font-bold ${latestAnalysis.dryness > 5 ? 'text-amber-500' : 'text-emerald-500'}`}>{latestAnalysis.dryness}/10</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-gray-400 mb-0.5">Oiliness</p>
                      <p className={`text-xs font-bold ${latestAnalysis.oiliness > 5 ? 'text-blue-500' : 'text-emerald-500'}`}>{latestAnalysis.oiliness}/10</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-5 rounded-3xl relative overflow-hidden ios-card h-full flex flex-col justify-center"
                style={{
                  background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 100%)',
                }}>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <h2 className="text-xl font-black text-white mb-1 tracking-tight">Discover Your Skin</h2>
                  <p className="text-[11px] text-gray-300 mb-4 max-w-[200px] leading-relaxed">
                    Get a clinical AI skin analysis — learn your skin type & concerns.
                  </p>
                  <Link to="/SkinAnalysis">
                    <button className="bg-white text-gray-900 text-[11px] font-bold py-2.5 px-5 rounded-xl shadow-lg hover:scale-105 transition-transform">
                      Analyse My Skin
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {!user && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl mb-10 relative overflow-hidden ios-card"
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 100%)',
            }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-xl font-black text-white mb-2 tracking-tight">Discover Your Skin</h2>
              <p className="text-[13px] text-gray-300 mb-6 max-w-[220px] leading-relaxed">
                Get a clinical AI skin analysis — learn your skin type, top concerns, and exactly what to do.
              </p>
              <Link to="/SkinAnalysis">
                <button className="bg-white text-gray-900 text-[13px] font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform">
                  Analyse My Skin Now
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Explore Grid */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-lg font-black text-gray-900 mb-4 tracking-tight">Explore</h3>
          <div className="grid grid-cols-4 gap-3 mb-10">
            {EXPLORE_GRID.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Link key={i} to={feature.page} className="block">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-gray-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-full"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: feature.bgColor }}>
                      <Icon className="w-5 h-5" style={{ color: feature.color }} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-700 text-center leading-tight">{feature.label}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Auth CTA */}
        {!user && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="p-6 rounded-3xl bg-pink-50/50 border border-pink-100/50 text-center"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-pink-100/30">
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-[15px] mb-2 tracking-tight">Your personal AI skin coach awaits</h3>
            <p className="text-[13px] text-gray-500 mb-6 px-4 leading-relaxed">
              Sign in to save analyses, track progress, and get a routine built just for your skin.
            </p>
            <button onClick={() => base44.auth.redirectToLogin()}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 text-sm"
              style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)' }}
            >
              Sign In to Get Started
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}