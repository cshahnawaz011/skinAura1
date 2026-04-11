import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Camera, Sparkles, TrendingUp, MessageCircle,
  BookOpen, Palette, Sun, Users, Menu, X, Moon, Droplets,
  GitCompare, Trophy, FileText, Clock, Globe, Zap, FlaskConical, LogIn, LogOut, BarChart2,
  Target, Apple, Activity, Calendar, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/i18n/LanguageSelector';
import t from '@/components/i18n/translations';
import { useTranslation } from '@/components/i18n/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const NAV_SECTIONS = [
  {
    label: 'Skin',
    color: 'text-rose-400',
    items: [
      { key: 'home', icon: Home, page: 'Home', label: 'Home' },
      { key: 'analyze', icon: Camera, page: 'SkinAnalysis', label: 'Skin Analysis' },
      { key: 'routine', icon: Sparkles, page: 'SkinRoutine', label: 'My Routine' },
      { key: 'progress', icon: TrendingUp, page: 'Progress', label: 'Progress' },
    ]
  },
  {
    label: 'AI Tools',
    color: 'text-violet-400',
    items: [
      { key: 'chat', icon: MessageCircle, page: 'SkinChat', label: 'AI Skin Coach' },
      { key: 'aiInsights', icon: Zap, page: 'AiInsights', label: 'AI Insights' },
      { key: 'facialHeatmap', icon: Activity, page: 'FacialHeatmap', label: 'Facial Heatmap' },
      { key: 'makeup', icon: Palette, page: 'MakeupTryOn', label: 'Makeup Try-On' },
    ]
  },
  {
    label: 'Wellness',
    color: 'text-emerald-400',
    items: [
      { key: 'lifestyle', icon: Sun, page: 'Lifestyle', label: 'Daily Log' },
      { key: 'glowChallenge', icon: Trophy, page: 'GlowChallenge', label: 'Challenges' },
      { key: 'faceYoga', icon: Zap, page: 'FaceYoga', label: 'Face Yoga' },
      { key: 'hormoneTracker', icon: Activity, page: 'HormoneTracker', label: 'Cycle Tracker' },
    ]
  },
  {
    label: 'Products',
    color: 'text-sky-400',
    items: [
      { key: 'products', icon: Droplets, page: 'Products', label: 'Products' },
      { key: 'ingredients', icon: FlaskConical, page: 'IngredientChecker', label: 'Ingredient Check' },
      { key: 'nutritionScanner', icon: Apple, page: 'NutritionScanner', label: 'Food Scanner' },
    ]
  },
  {
    label: 'Explore',
    color: 'text-amber-400',
    items: [
      { key: 'community', icon: Users, page: 'Community', label: 'Community' },
      { key: 'learn', icon: BookOpen, page: 'Education', label: 'Learn' },
    ]
  },
];

// Flat nav for mobile
const ALL_NAV = NAV_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, sectionColor: s.color })));

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { tr, lang } = useTranslation();

  const { data: latestAnalysis } = useQuery({
    queryKey: ['layoutSkinScore', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, [currentPageName]);

  useEffect(() => {
    const isDark = localStorage.getItem('glowai-dark') === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('glowai-dark', next.toString());
  };

  return (
    <div className={`min-h-screen gradient-bg ${darkMode ? 'dark' : ''}`}>
      {/* Background orbs */}
      <div className="orb w-[500px] h-[500px] bg-pink-400 fixed -top-20 -left-20 pointer-events-none" style={{ opacity: 0.09 }} />
      <div className="orb w-[400px] h-[400px] bg-amber-300 fixed bottom-10 right-0 pointer-events-none" style={{ animationDelay: '4s', opacity: 0.08 }} />
      <div className="orb w-[350px] h-[350px] bg-violet-500 fixed top-1/2 right-1/3 pointer-events-none" style={{ animationDelay: '7s', opacity: 0.06 }} />

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 xl:w-64 flex-col z-50"
        style={{
          background: darkMode
            ? 'rgba(10,8,20,0.88)'
            : 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(36px) saturate(1.8)',
          borderRight: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(220,60,130,0.10)',
          boxShadow: darkMode
            ? '4px 0 40px rgba(0,0,0,0.35)'
            : '4px 0 40px rgba(220,60,130,0.07)'
        }}>

        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-white/10">
          <motion.div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#e8527a,#c94bc1,#f5a623)' }}
            animate={{ boxShadow: ['0 0 10px 3px rgba(233,82,122,0.5)', '0 0 24px 8px rgba(201,75,193,0.5)', '0 0 10px 3px rgba(233,82,122,0.5)'] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <span className="text-xl font-black gold-shimmer tracking-tight">GlowAI</span>
            <p className="text-[10px] text-gray-400 -mt-0.5 font-medium">Your skin, elevated</p>
          </div>
        </div>

        {/* Score chip */}
        {latestAnalysis && (
          <Link to={createPageUrl('SkinAnalysis')} className="mx-4 mt-4 mb-1 flex items-center gap-3 p-2.5 rounded-xl transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,rgba(233,82,122,0.12),rgba(245,166,35,0.10))' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#e8527a,#f5a623)' }}>
              <span className="text-white text-sm font-black">{latestAnalysis.overall_score}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-rose-500 dark:text-rose-400">Glow Score</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{latestAnalysis.skin_type} skin</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
          </Link>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin space-y-0.5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-1">
              <p className={`px-3 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] ${section.color} opacity-70`}>{section.label}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link key={item.page} to={createPageUrl(item.page)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/6'
                    }`}
                    style={isActive ? {
                      background: 'linear-gradient(135deg,rgba(233,82,122,0.12),rgba(245,166,35,0.08))',
                      boxShadow: '0 2px 12px rgba(233,82,122,0.12)'
                    } : {}}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-all ${isActive ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}
                      style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(233,82,122,0.6))' } : {}} />
                    <span className="truncate">{(t[lang] && t[lang][item.key]) || item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"
                        style={{ boxShadow: '0 0 6px 2px rgba(233,82,122,0.7)' }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          <Button variant="ghost" size="sm" onClick={toggleDarkMode}
            className="w-full justify-start gap-3 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs h-9">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? tr('lightMode') : tr('darkMode')}
          </Button>
          <LanguageSelector />
          {user ? (
            <button onClick={() => base44.auth.logout()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-medium">{user.full_name || user.email}</span>
            </button>
          ) : (
            <button onClick={() => base44.auth.redirectToLogin()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-semibold">
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* ===== MOBILE HEADER ===== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 px-3 py-2"
        style={{
          background: darkMode ? 'rgba(10,8,20,0.88)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(28px)',
          borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(220,60,130,0.10)',
        }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setMobileMenuOpen(p => !p)}
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors hover:bg-black/8 dark:hover:bg-white/8">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button type="button" onClick={toggleDarkMode}
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors hover:bg-black/8 dark:hover:bg-white/8">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#e8527a,#c94bc1,#f5a623)', boxShadow: '0 0 14px 4px rgba(233,82,122,0.45)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black gold-shimmer">GlowAI</span>
          </Link>
          <div className="shrink-0">
            <LanguageSelector compact />
          </div>
        </div>
      </header>

      {/* ===== MOBILE DRAWER ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute left-0 top-0 h-full w-[78vw] max-w-xs shadow-2xl z-50 overflow-y-auto"
              style={{
                background: darkMode ? 'rgba(10,8,20,0.97)' : 'rgba(255,255,255,0.97)',
                borderRight: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(220,60,130,0.10)'
              }}
              onClick={e => e.stopPropagation()}>
              <div className="px-4 py-5 pt-20">
                {NAV_SECTIONS.map(section => (
                  <div key={section.label} className="mb-1">
                    <p className={`px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest ${section.color} opacity-70`}>{section.label}</p>
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.page;
                      return (
                        <Link key={item.page} to={createPageUrl(item.page)}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                            isActive
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/6'
                          }`}
                          style={isActive ? { background: 'linear-gradient(135deg,rgba(233,82,122,0.10),rgba(245,166,35,0.07))' } : {}}>
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-rose-500' : 'text-gray-400'}`} />
                          <span>{(t[lang] && t[lang][item.key]) || item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <main className="lg:ml-60 xl:ml-64 min-h-screen pt-[60px] lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="p-4 md:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}