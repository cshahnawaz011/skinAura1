import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Camera, Sparkles, TrendingUp, MessageCircle,
  BookOpen, Palette, Sun, Users, Menu, X, Moon, Droplets,
  Zap, FlaskConical, LogIn, LogOut, Activity, Apple, ChevronDown, Salad
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/i18n/LanguageSelector';
import t from '@/components/i18n/translations';
import { useTranslation } from '@/components/i18n/translations';
import { base44 } from '@/api/base44Client';

const NAV_SECTIONS = [
  {
    label: 'Skin',
    items: [
      { key: 'home', icon: Home, page: 'Home', label: 'Home' },
      { key: 'analyze', icon: Camera, page: 'SkinAnalysis', label: 'Analyze' },
      { key: 'routine', icon: Sparkles, page: 'SkinRoutine', label: 'Routine' },
      { key: 'chat', icon: MessageCircle, page: 'SkinChat', label: 'Chat' },
      { key: 'progress', icon: TrendingUp, page: 'Progress', label: 'Progress' },
    ]
  },
  {
    label: 'AI Tools',
    items: [
      { key: 'aiInsights', icon: Zap, page: 'AiInsights', label: 'AI Insights' },
      { key: 'makeup', icon: Palette, page: 'MakeupTryOn', label: 'Makeup Try-On' },
    ]
  },
  {
    label: 'Wellness',
    items: [
      { key: 'lifestyle', icon: Sun, page: 'Lifestyle', label: 'Lifestyle' },
      { key: 'glowChallenge', icon: Sparkles, page: 'GlowChallenge', label: 'Challenges' },
      { key: 'faceYoga', icon: Zap, page: 'FaceYoga', label: 'Face Yoga' },
    ]
  },
  {
    label: 'Diet',
    items: [
      { key: 'diet', icon: Salad, page: 'Diet', label: 'Diet & Glow Hub' },
      { key: 'nutritionScanner', icon: Apple, page: 'NutritionScanner', label: 'Food Scanner' },
    ]
  },
  {
    label: 'Products',
    items: [
      { key: 'products', icon: Droplets, page: 'Products', label: 'Products' },
      { key: 'ingredients', icon: FlaskConical, page: 'IngredientLibrary', label: 'Ingredient Library' },
    ]
  },
  {
    label: 'Explore',
    items: [
      { key: 'community', icon: Users, page: 'Community', label: 'Community' },
      { key: 'learn', icon: BookOpen, page: 'Education', label: 'Learn' },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [user, setUser] = useState(null);
  const { tr, lang } = useTranslation();

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

  const currentSection = NAV_SECTIONS.find(s => s.items.some(i => i.page === currentPageName));

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}
      style={{ background: darkMode ? '#0e0a1a' : '#faf6f2' }}>

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full"
        style={{
          background: darkMode ? 'rgba(14,10,26,0.95)' : 'rgba(255,252,249,0.96)',
          borderBottom: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid #ede8e3',
          backdropFilter: 'blur(20px)',
        }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: darkMode ? '#f5e8e0' : '#3d2a2a' }}>GlowAI</span>
            <span className="hidden sm:block text-xs" style={{ color: '#b89b8a' }}>Your skin, elevated</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="relative"
                onMouseEnter={() => setOpenSection(section.label)}
                onMouseLeave={() => setOpenSection(null)}>
                <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentSection?.label === section.label
                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
                }`}>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60 mr-0.5">{section.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                <AnimatePresence>
                  {openSection === section.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full pt-1 z-50"
                    >
                      <div className="rounded-xl shadow-lg border py-1.5 min-w-[160px]"
                        style={{
                          background: darkMode ? '#1a1428' : '#fff',
                          borderColor: darkMode ? 'rgba(255,255,255,0.08)' : '#ede8e3',
                        }}>
                        {section.items.map(item => {
                          const Icon = item.icon;
                          const isActive = currentPageName === item.page;
                          return (
                            <Link key={item.page} to={createPageUrl(item.page)}
                              onClick={() => setOpenSection(null)}
                              className={`flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                                isActive
                                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/15'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                              }`}>
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{(t[lang] && t[lang][item.key]) || item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Active page pill */}
            {currentSection && (
              <div className="ml-2 flex items-center gap-1">
                {currentSection.items.filter(i => i.page === currentPageName).map(item => (
                  <span key={item.page} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: '#f3e8e8', color: '#c07080' }}>
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </nav>

          {/* Right Controls */}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleDarkMode}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: darkMode ? 'rgba(255,255,255,0.08)' : '#f0ebe6',
                color: darkMode ? '#d0c0b8' : '#7a6560'
              }}>
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{darkMode ? 'Light' : 'Dark'}</span>
            </button>
            <LanguageSelector compact />
            {user ? (
              <button onClick={() => base44.auth.logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#f0ebe6', color: darkMode ? '#d0c0b8' : '#7a6560' }}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline max-w-[80px] truncate">{user.full_name?.split(' ')[0] || 'Me'}</span>
              </button>
            ) : (
              <button onClick={() => base44.auth.redirectToLogin()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)', color: '#fff' }}>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
            {/* Mobile menu toggle */}
            <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => setMobileMenuOpen(p => !p)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileMenuOpen(false)}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute left-0 top-0 h-full w-[80vw] max-w-xs overflow-y-auto shadow-xl z-50"
              style={{ background: darkMode ? '#0e0a1a' : '#faf6f2', borderRight: '1px solid #ede8e3' }}
              onClick={e => e.stopPropagation()}>
              <div className="px-4 py-5 pt-6 space-y-1">
                <div className="flex items-center gap-2 px-2 pb-4 border-b border-gray-100 dark:border-gray-800 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold" style={{ color: darkMode ? '#f5e8e0' : '#3d2a2a' }}>GlowAI</span>
                </div>
                {NAV_SECTIONS.map(section => (
                  <div key={section.label} className="mb-2">
                    <p className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">{section.label}</p>
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = currentPageName === item.page;
                      return (
                        <Link key={item.page} to={createPageUrl(item.page)}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all ${
                            isActive ? 'text-rose-500' : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          style={isActive ? { background: '#fdf0f2' } : {}}>
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span>{(t[lang] && t[lang][item.key]) || item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                  <button onClick={toggleDarkMode}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500">
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  {user ? (
                    <button onClick={() => base44.auth.logout()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-500">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  ) : (
                    <button onClick={() => base44.auth.redirectToLogin()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-rose-500">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}