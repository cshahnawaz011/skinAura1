import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Camera, Sparkles, TrendingUp, MessageCircle,
  BookOpen, Palette, Sun, Users, Menu, X, Moon, Droplets,
  Zap, FlaskConical, LogIn, LogOut, Apple, ChevronDown, Salad, Star, Trophy
} from 'lucide-react';
import LanguageSelector from '@/components/i18n/LanguageSelector';
import t from '@/components/i18n/translations';
import { useTranslation } from '@/components/i18n/translations';
import { base44 } from '@/api/base44Client';

const NAV_SECTIONS = [
  {
    label: 'Skin',
    emoji: '🔬',
    color: 'from-rose-500 to-pink-500',
    items: [
      { key: 'home', icon: Home, page: 'Home', label: 'Home' },
      { key: 'analyze', icon: Camera, page: 'SkinAnalysis', label: 'Analyze' },
      { key: 'routine', icon: Sparkles, page: 'SkinRoutine', label: 'Routine' },
      { key: 'progressDash', icon: TrendingUp, page: 'RoutineProgressDashboard', label: 'Progress Dashboard' },
      { key: 'chat', icon: MessageCircle, page: 'SkinChat', label: 'Chat' },
      { key: 'progress', icon: TrendingUp, page: 'Progress', label: 'Progress' },
    ]
  },
  {
    label: 'AI Tools',
    emoji: '⚡',
    color: 'from-violet-500 to-purple-500',
    items: [
      { key: 'aiInsights', icon: Zap, page: 'AiInsights', label: 'AI Insights' },
      { key: 'makeup', icon: Palette, page: 'MakeupTryOn', label: 'Makeup Try-On' },
    ]
  },
  {
    label: 'Wellness',
    emoji: '✨',
    color: 'from-amber-400 to-orange-500',
    items: [
      { key: 'lifestyle', icon: Sun, page: 'Lifestyle', label: 'Lifestyle' },
      { key: 'glowDashboard', icon: Star, page: 'GlowDashboard', label: 'Glow Dashboard' },
      { key: 'glowChallenge', icon: Sparkles, page: 'GlowChallenge', label: 'Challenges' },
      { key: 'skinGoalChallenge', icon: Trophy, page: 'SkinGoalChallenge', label: '21-Day Challenge' },
      { key: 'faceYoga', icon: Zap, page: 'FaceYoga', label: 'Face Yoga' },
    ]
  },
  {
    label: 'Diet',
    emoji: '🥗',
    color: 'from-emerald-500 to-teal-500',
    items: [
      { key: 'diet', icon: Salad, page: 'Diet', label: 'Diet & Glow Hub' },
      { key: 'nutritionScanner', icon: Apple, page: 'NutritionScanner', label: 'Food Scanner' },
    ]
  },
  {
    label: 'Products',
    emoji: '💧',
    color: 'from-blue-500 to-cyan-500',
    items: [
      { key: 'products', icon: Droplets, page: 'Products', label: 'Products' },
      { key: 'ingredients', icon: FlaskConical, page: 'IngredientLibrary', label: 'Ingredient Library' },
    ]
  },
  {
    label: 'Explore',
    emoji: '🌐',
    color: 'from-indigo-500 to-blue-500',
    items: [
      { key: 'community', icon: Users, page: 'Community', label: 'Community' },
      { key: 'learn', icon: BookOpen, page: 'Education', label: 'Learn' },
    ]
  },
];

function createPageUrl(page) {
  return `/${page}`;
}

// Premium Collapsible Section
function NavSection({ section, currentPageName, onNavigate, darkMode }) {
  const isActive = section.items.some(i => i.page === currentPageName);
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [currentPageName]);

  return (
    <div className="mb-1">
      {/* Section Header — collapsible card */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-200 group ${
          isActive
            ? 'bg-white/90 dark:bg-white/10 shadow-sm'
            : 'hover:bg-white/50 dark:hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-sm shadow-sm`}>
            {section.emoji}
          </div>
          <span className={`text-sm font-bold tracking-wide ${isActive ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {section.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${section.color}`} />
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className={`w-4 h-4 ${isActive ? 'text-gray-500' : 'text-gray-400'}`} />
          </motion.div>
        </div>
      </button>

      {/* Sub-items */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="ml-3 mt-1 mb-1 pl-3 border-l-2 border-gray-100 dark:border-gray-800 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isItemActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                      isItemActive
                        ? `bg-gradient-to-r ${section.color} text-white shadow-sm`
                        : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/8 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                    {isItemActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      style={{ background: darkMode ? '#0a0814' : '#f8f4f0' }}>

      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full"
        style={{
          background: darkMode ? 'rgba(10,8,20,0.96)' : 'rgba(255,252,249,0.97)',
          borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #ede8e3',
          backdropFilter: 'blur(24px)',
        }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-base" style={{ color: darkMode ? '#f5e8e0' : '#2d1f1f' }}>GlowAI</span>
          </Link>

          {/* Active section pill */}
          {currentSection && (
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${currentSection.color} text-white shadow-sm`}>
              <span>{currentSection.emoji}</span>
              <span>{currentSection.label}</span>
              {currentSection.items.find(i => i.page === currentPageName) && (
                <>
                  <span className="opacity-60">›</span>
                  <span className="opacity-90">{currentSection.items.find(i => i.page === currentPageName)?.label}</span>
                </>
              )}
            </div>
          )}

          {/* Right Controls */}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleDarkMode}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#f0ebe6', color: darkMode ? '#d0c0b8' : '#7a6560' }}>
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <LanguageSelector compact />
            {user ? (
              <button onClick={() => base44.auth.logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#f0ebe6', color: darkMode ? '#d0c0b8' : '#7a6560' }}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline max-w-[70px] truncate">{user.full_name?.split(' ')[0] || 'Me'}</span>
              </button>
            ) : (
              <button onClick={() => base44.auth.redirectToLogin()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)', color: '#fff' }}>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
            {/* Mobile toggle */}
            <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#f0ebe6' }}
              onClick={() => setMobileMenuOpen(p => !p)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto"
          style={{
            background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
            borderRight: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #ede8e3',
            backdropFilter: 'blur(20px)',
          }}>
          <div className="p-3 space-y-0.5">
            {/* User card */}
            {user && (
              <div className="mb-4 p-3 rounded-2xl"
                style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0ebe6' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: darkMode ? '#f5e8e0' : '#2d1f1f' }}>
                      {user.full_name || 'Glow User'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {NAV_SECTIONS.map((section) => (
              <NavSection
                key={section.label}
                section={section}
                currentPageName={currentPageName}
                onNavigate={() => {}}
                darkMode={darkMode}
              />
            ))}

            {/* Bottom Controls */}
            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
              <button onClick={toggleDarkMode}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-white/60 dark:hover:bg-white/5 transition-all">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              {user ? (
                <button onClick={() => base44.auth.logout()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-all">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button onClick={() => base44.auth.redirectToLogin()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all">
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── MOBILE DRAWER ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}>
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="absolute left-0 top-0 h-full w-[82vw] max-w-xs overflow-y-auto shadow-2xl"
                style={{
                  background: darkMode ? '#0e0a1a' : '#faf6f2',
                  borderRight: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #ede8e3',
                }}
                onClick={e => e.stopPropagation()}>
                <div className="p-4 pt-5">
                  <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black text-base" style={{ color: darkMode ? '#f5e8e0' : '#2d1f1f' }}>GlowAI</span>
                  </div>

                  {user && (
                    <div className="mb-4 p-3 rounded-2xl"
                      style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0ebe6' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                          style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
                          {user.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{user.full_name || 'Glow User'}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {NAV_SECTIONS.map((section) => (
                      <NavSection
                        key={section.label}
                        section={section}
                        currentPageName={currentPageName}
                        onNavigate={() => setMobileMenuOpen(false)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>

                  <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
                    {user ? (
                      <button onClick={() => base44.auth.logout()}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-500">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    ) : (
                      <button onClick={() => base44.auth.redirectToLogin()}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-rose-500">
                        <LogIn className="w-4 h-4" /> Sign In
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="px-4 py-6 md:px-6 lg:px-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}