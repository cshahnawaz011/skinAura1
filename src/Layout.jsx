import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Camera, Sparkles, TrendingUp, MessageCircle,
  BookOpen, Palette, Sun, Users, Menu, X, Moon, Droplets,
  GitCompare, Trophy, FileText, Bot, Clock, Globe, Zap, FlaskConical, LogIn, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/i18n/LanguageSelector';
import { useTranslation } from '@/components/i18n/translations';
import t from '@/components/i18n/translations';
import { base44 } from '@/api/base44Client';

// color groups: pink=core skin, violet=AI tools, emerald=wellness, blue=social/learn
const NAV_KEYS = [
  { key: 'home', icon: Home, page: 'Home', label: 'Home', color: 'text-pink-500' },
  { key: 'publicProfile', icon: Users, page: 'PublicProfile', label: 'Profile', hidden: true },
  // --- Core Skin (Pink) ---
  { key: 'analyze', icon: Camera, page: 'SkinAnalysis', label: 'Skin Analysis', color: 'text-pink-500' },
  { key: 'routine', icon: Sparkles, page: 'SkinRoutine', label: 'Routine', color: 'text-pink-500' },
  { key: 'progress', icon: TrendingUp, page: 'Progress', label: 'Progress', color: 'text-pink-500' },
  { key: 'report', icon: FileText, page: 'SkinReport', label: 'My Report', color: 'text-pink-500' },
  // --- AI Tools (Violet) ---
  { key: 'dermAI', icon: Bot, page: 'DermAI', label: 'Dr. Glow AI', color: 'text-violet-500' },
  { key: 'skinAge', icon: Clock, page: 'SkinAgePrediction', label: 'Skin Age AI', color: 'text-violet-500' },
  { key: 'aiInsights', icon: Zap, page: 'AiInsights', label: 'AI Insights', color: 'text-violet-500' },
  { key: 'chat', icon: MessageCircle, page: 'SkinChat', label: 'Skin Chat', color: 'text-violet-500' },
  // --- Wellness (Emerald) ---
  { key: 'lifestyle', icon: Sun, page: 'Lifestyle', label: 'Lifestyle', color: 'text-emerald-500' },
  { key: 'tracker', icon: Trophy, page: 'GamifiedTracker', label: 'Glow Tracker', color: 'text-emerald-500' },
  { key: 'products', icon: Droplets, page: 'Products', label: 'Products', color: 'text-emerald-500' },
  { key: 'compare', icon: GitCompare, page: 'ProductComparison', label: 'Compare', color: 'text-emerald-500' },
  { key: 'ingredients', icon: FlaskConical, page: 'IngredientChecker', label: 'Ingredient Check', color: 'text-emerald-500' },
  // --- Social / Learn (Blue) ---
  { key: 'community', icon: Users, page: 'Community', label: 'Community', color: 'text-blue-500' },
  { key: 'glowMap', icon: Globe, page: 'GlowMap', label: 'Glow Map', color: 'text-blue-500' },
  { key: 'learn', icon: BookOpen, page: 'Education', label: 'Learn', color: 'text-blue-500' },
  { key: 'makeup', icon: Palette, page: 'MakeupTryOn', label: 'Makeup', color: 'text-blue-500' },
];

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { tr, lang } = useTranslation();
  const navItems = NAV_KEYS.filter(item => !item.hidden).map(item => ({ ...item, name: t[lang]?.[item.key] || item.label }));

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, [currentPageName]);

  useEffect(() => {
    const isDark = localStorage.getItem('glowai-dark') === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('glowai-dark', (!darkMode).toString());
  };

  return (
    <div className={`min-h-screen gradient-bg ${darkMode ? 'dark' : ''}`}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col glass z-50">
        <div className="p-6 border-b border-white/20">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-amber-300 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gold-shimmer">GlowAI</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
          <ul className="space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              // Section dividers
              const sectionBreaks = { 4: '🌸 AI Tools', 8: '🌿 Wellness', 12: '🌐 Explore' };
              return (
                <React.Fragment key={item.page}>
                  {sectionBreaks[idx] && (
                    <li className="pt-3 pb-1 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{sectionBreaks[idx]}</span>
                    </li>
                  )}
                  <li>
                    <Link
                      to={createPageUrl(item.page)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-white/70 dark:bg-white/10 shadow-sm font-semibold'
                          : 'hover:bg-white/50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? item.color || 'text-pink-500' : item.color || 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isActive ? item.color || 'text-pink-600' : ''}`}>{item.name}</span>
                    </Link>
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/20 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="w-full justify-start gap-3"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {darkMode ? tr('lightMode') : tr('darkMode')}
          </Button>
          <LanguageSelector />
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm truncate">{user.full_name || user.email}</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.redirectToLogin()}
              className="w-full justify-start gap-3 text-pink-500 hover:text-pink-600"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 glass z-50 px-4 py-3">
        <div className="flex items-center">
          {/* Left: menu + dark mode */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-11 h-11">
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="w-11 h-11">
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </Button>
          </div>
          {/* Center: logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-400 to-amber-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gold-shimmer">Glow</span>
          </Link>
          {/* Right: language */}
          <div className="ml-auto">
            <LanguageSelector compact />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 pt-20 overflow-y-auto h-full">
                <ul className="space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPageName === item.page;
                    return (
                      <li key={item.page}>
                        <Link
                          to={createPageUrl(item.page)}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-pink-200/50 to-amber-200/50 text-pink-600'
                              : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? item.color || 'text-pink-500' : item.color || 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 z-50 px-1 pt-1 pb-[env(safe-area-inset-bottom,8px)] border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around items-center">
          {[navItems[0], navItems[2], navItems[3], navItems[6], navItems[10]].filter(Boolean).map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 min-w-[56px] min-h-[56px] justify-center px-2 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[9px] font-medium leading-none">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-[72px] lg:pt-0 pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-4 lg:p-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}