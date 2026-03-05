import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Camera, Sparkles, TrendingUp, MessageCircle,
  BookOpen, Palette, Sun, Users, Menu, X, Moon, Droplets
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/i18n/LanguageSelector';
import { useTranslation } from '@/components/i18n/translations';

const NAV_KEYS = [
  { key: 'home', icon: Home, page: 'Home' },
  { key: 'analyze', icon: Camera, page: 'SkinAnalysis' },
  { key: 'routine', icon: Sparkles, page: 'SkinRoutine' },
  { key: 'progress', icon: TrendingUp, page: 'Progress' },
  { key: 'products', icon: Droplets, page: 'Products' },
  { key: 'lifestyle', icon: Sun, page: 'Lifestyle' },
  { key: 'chat', icon: MessageCircle, page: 'SkinChat' },
  { key: 'learn', icon: BookOpen, page: 'Education' },
  { key: 'makeup', icon: Palette, page: 'MakeupTryOn' },
  { key: 'community', icon: Users, page: 'Community' },
];

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { tr } = useTranslation();
  const navItems = NAV_KEYS.map(item => ({ ...item, name: tr(item.key) }));

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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <li key={item.page}>
                  <Link
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-200/50 to-amber-200/50 dark:from-pink-900/30 dark:to-amber-900/30 text-pink-600 dark:text-pink-300 shadow-sm'
                        : 'hover:bg-white/50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="w-full justify-start gap-3"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 glass z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-amber-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gold-shimmer">GlowAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
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
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 pt-20 overflow-y-auto h-full">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPageName === item.page;
                    return (
                      <li key={item.page}>
                        <Link
                          to={createPageUrl(item.page)}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-pink-200/50 to-amber-200/50 text-pink-600'
                              : 'hover:bg-white/50 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 z-50 px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)] border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around items-center">
          {[navItems[0], navItems[1], navItems[2], navItems[3], navItems[9]].map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{item.name}</span>
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