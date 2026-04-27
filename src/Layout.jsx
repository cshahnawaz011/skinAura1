import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsFetching } from '@tanstack/react-query';
import BackgroundOperationBar from '@/components/BackgroundOperationBar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Home, Camera, Sparkles, TrendingUp, MessageCircle,
  BookOpen, Palette, Sun, Users, Menu, X, Moon, Droplets,
  Zap, FlaskConical, LogIn, LogOut, Apple, ChevronDown, Salad, Star, MoreHorizontal, Map, Heart
} from 'lucide-react';
import { useTranslation } from '@/components/i18n/translations';
import { base44 } from '@/api/base44Client';

// Bottom nav: 3 most-used + More
const BOTTOM_NAV = [
  { key: 'home', icon: Home, page: 'Home', label: 'Home' },
  { key: 'analyze', icon: Camera, page: 'SkinAnalysis', label: 'Scan' },
  { key: 'routine', icon: Sparkles, page: 'SkinRoutine', label: 'Routine' },
  { key: 'more', icon: MoreHorizontal, page: null, label: 'More' },
];

const ALL_FEATURES = [
  { key: 'home', icon: Home, page: 'Home', label: 'Home' },
  { key: 'analyze', icon: Camera, page: 'SkinAnalysis', label: 'Skin Analysis' },
  { key: 'routine', icon: Sparkles, page: 'SkinRoutine', label: 'Routine' },
  { key: 'skinMap', icon: Map, page: 'AdaptiveSkinMap', label: 'Skin Map' },
  { key: 'chat', icon: MessageCircle, page: 'SkinChat', label: 'Chat' },
  { key: 'progress', icon: TrendingUp, page: 'Progress', label: 'Progress' },
  { key: 'insights', icon: Zap, page: 'AiInsights', label: 'Insights' },

  { key: 'lifestyle', icon: Sun, page: 'Lifestyle', label: 'Lifestyle' },
  { key: 'health', icon: TrendingUp, page: 'LifestyleInsights', label: 'Health' },
  { key: 'dashboard', icon: Star, page: 'GlowDashboard', label: 'Dashboard' },

  { key: 'yoga', icon: Zap, page: 'FaceYoga', label: 'Face Yoga' },
  { key: 'diet', icon: Salad, page: 'Diet', label: 'Diet' },
  { key: 'scanner', icon: Apple, page: 'NutritionScanner', label: 'Food Scanner' },
  { key: 'products', icon: Droplets, page: 'Products', label: 'Products' },
  { key: 'ingredients', icon: FlaskConical, page: 'IngredientLibrary', label: 'Ingredients' },
  { key: 'community', icon: Users, page: 'Community', label: 'Community' },
  { key: 'learn', icon: BookOpen, page: 'Education', label: 'Learn' },
];

function createPageUrl(page) {
  return `/${page}`;
}

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { tr, lang } = useTranslation();
  const isFetching = useIsFetching();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, [currentPageName]);

  useEffect(() => {
    const isDark = localStorage.getItem('skinaura-dark') === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('skinaura-dark', next.toString());
  };

  const getBottomNavLabel = (page) => {
    const item = BOTTOM_NAV.find(i => i.page === page);
    return item ? item.label : null;
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}
      style={{ background: darkMode ? '#0a0814' : '#fafafa' }}>

      {/* GLOBAL LOADING INDICATOR */}
      {isFetching > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-pink-100">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-400 to-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-40 w-full"
        style={{
          background: darkMode ? 'rgba(10,8,20,0.96)' : 'rgba(255,252,249,0.97)',
          borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #ede8e3',
          backdropFilter: 'blur(24px)',
        }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-4">
          {/* Hamburger Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-white/10 active:opacity-50 active:scale-95">
                <Menu className="w-5 h-5" style={{ color: darkMode ? '#f5e8e0' : '#2d1f1f' }} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0" style={{ background: darkMode ? '#0a0814' : '#f8f4f0', borderColor: darkMode ? 'rgba(255,255,255,0.06)' : '#ede8e3' }}>
              <SheetHeader className="p-6 text-left border-b" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.06)' : '#ede8e3' }}>
                <SheetTitle className="flex items-center gap-3">
                  <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="SkinAura" />
                  <span className="font-black text-xl" style={{ color: darkMode ? '#f5e8e0' : '#2d1f1f' }}>SkinAura</span>
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 flex flex-col gap-4 overflow-y-auto h-[calc(100vh-100px)]">
                {/* Skin Care Category */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Skin Care</p>
                  {ALL_FEATURES.filter(f => ['home', 'analyze', 'routine', 'skinMap', 'progress'].includes(f.key)).map((feature) => {
                    const FeatureIcon = feature.icon;
                    const isActive = currentPageName === feature.page;
                    return (
                      <Link key={feature.key} to={createPageUrl(feature.page)} onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}>
                        <FeatureIcon className="w-5 h-5" /><span>{feature.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Lifestyle & Wellness Category */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Wellness</p>
                  {ALL_FEATURES.filter(f => ['health', 'lifestyle', 'yoga', 'diet', 'scanner'].includes(f.key)).map((feature) => {
                    const FeatureIcon = feature.icon;
                    const isActive = currentPageName === feature.page;
                    return (
                      <Link key={feature.key} to={createPageUrl(feature.page)} onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}>
                        <FeatureIcon className="w-5 h-5" /><span>{feature.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Growth Category */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Growth</p>
                  {ALL_FEATURES.filter(f => ['dashboard', 'insights', 'chat'].includes(f.key)).map((feature) => {
                    const FeatureIcon = feature.icon;
                    const isActive = currentPageName === feature.page;
                    return (
                      <Link key={feature.key} to={createPageUrl(feature.page)} onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}>
                        <FeatureIcon className="w-5 h-5" /><span>{feature.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Resources Category */}
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Resources</p>
                  {ALL_FEATURES.filter(f => ['ingredients', 'products', 'learn', 'community'].includes(f.key)).map((feature) => {
                    const FeatureIcon = feature.icon;
                    const isActive = currentPageName === feature.page;
                    return (
                      <Link key={feature.key} to={createPageUrl(feature.page)} onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}>
                        <FeatureIcon className="w-5 h-5" /><span>{feature.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-8 h-8 rounded-xl object-cover shadow-sm" alt="SkinAura" />
            <span className="font-black text-base" style={{ color: darkMode ? '#f5e8e0' : '#2d1f1f' }}>SkinAura</span>
          </Link>

          {/* Right Controls */}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleDarkMode}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#f0ebe6', color: darkMode ? '#d0c0b8' : '#7a6560' }}>
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            {user ? (
              <button onClick={() => base44.auth.logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#f0ebe6', color: darkMode ? '#d0c0b8' : '#7a6560' }}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline max-w-[70px] truncate">{user.full_name?.split(' ')[0] || 'Me'}</span>
              </button>
            ) : (
              <button onClick={() => base44.auth.redirectToLogin()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ios-button-3d"
                style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)', color: '#fff' }}>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Background Operations Bar */}
      <BackgroundOperationBar />

    </div>
  );
}