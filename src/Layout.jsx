import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageStateProvider } from '@/lib/pageStateContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsFetching } from '@tanstack/react-query';
import BackgroundOperationBar from '@/components/BackgroundOperationBar';
import {
  Home, Camera, Sparkles, TrendingUp, MessageCircle,
  BookOpen, Sun, Users, X, Moon, Droplets,
  Zap, FlaskConical, LogIn, LogOut, Apple, Salad, Star,
  MoreHorizontal, Map, HeartPulse, Grid3x3, Calendar
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BOTTOM_NAV = [
  { key: 'home',    icon: Home,          page: 'Home',        label: 'Home' },
  { key: 'analyze', icon: Camera,         page: 'SkinAnalysis', label: 'Scan' },
  { key: 'routine', icon: Sparkles,       page: 'SkinRoutine', label: 'Routine' },
  { key: 'more',    icon: MoreHorizontal, page: null,          label: 'More' },
];

const MORE_CATEGORIES = [
  {
    label: '✨ Skin Care',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.08)',
    items: [
      { key: 'progress',    icon: TrendingUp,  page: 'Progress',       label: 'Progress' },
      { key: 'skinMap',     icon: Map,          page: 'AdaptiveSkinMap', label: 'Skin Map' },
      { key: 'chat',        icon: MessageCircle,page: 'SkinChat',       label: 'AI Coach' },
      { key: 'insights',    icon: Zap,          page: 'AiInsights',     label: 'Insights' },
      { key: 'schedule',    icon: Calendar,     page: 'RoutineSchedule', label: 'Schedule' },
    ],
  },
  {
    label: '🌿 Wellness',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    items: [
      { key: 'lifestyle',  icon: Sun,       page: 'Lifestyle',       label: 'Lifestyle' },
      { key: 'health',     icon: TrendingUp, page: 'LifestyleInsights',label: 'Health' },
      { key: 'hormones',   icon: HeartPulse, page: 'HormoneTracker',  label: 'Cycle' },
      { key: 'yoga',       icon: Zap,        page: 'FaceYoga',        label: 'Face Yoga' },
      { key: 'diet',       icon: Salad,      page: 'Diet',            label: 'Diet' },
      { key: 'scanner',    icon: Apple,      page: 'NutritionScanner',label: 'Food Scan' },
    ],
  },
  {
  label: '🚀 Growth',
  color: '#a78bfa',
  bg: 'rgba(167,139,250,0.08)',
  items: [
    { key: 'dashboard',  icon: Star,         page: 'GlowDashboard',    label: 'Dashboard' },
    { key: 'products',   icon: Droplets,      page: 'Products',         label: 'Products' },
    { key: 'ingredients',icon: FlaskConical,  page: 'IngredientLibrary',label: 'Ingredients' },
  ],
  },
  {
    label: '📚 Community',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    items: [
      { key: 'community',  icon: Users,    page: 'Community', label: 'Community' },
      { key: 'learn',      icon: BookOpen, page: 'Education', label: 'Learn' },
    ],
  },
];

function createPageUrl(page) {
  return `/${page}`;
}

const VISIT_KEY = 'skinaura-last-visit';
const STALE_MS = 18 * 60 * 60 * 1000; // 18 hours

function getVisitMap() {
  try { return JSON.parse(localStorage.getItem(VISIT_KEY) || '{}'); } catch { return {}; }
}
function stampVisit(page) {
  const map = getVisitMap();
  map[page] = Date.now();
  localStorage.setItem(VISIT_KEY, JSON.stringify(map));
}
function isStale(page) {
  const map = getVisitMap();
  if (!map[page]) return true; // never visited = stale
  return Date.now() - map[page] > STALE_MS;
}

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [visitMap, setVisitMap] = useState(() => getVisitMap());
  const isFetching = useIsFetching();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    // Stamp current page visit & refresh map
    if (currentPageName) {
      stampVisit(currentPageName);
      setVisitMap(getVisitMap());
    }
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

  const isActive = (page) => currentPageName === page;
  const isMoreActive = MORE_CATEGORIES.flatMap(c => c.items).some(i => i.page === currentPageName);
  const isPageStale = (page) => {
    if (!page) return false;
    const visited = visitMap[page];
    if (!visited) return true;
    return Date.now() - visited > STALE_MS;
  };

  return (
    <PageStateProvider currentPage={currentPageName}>
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}
      style={{ background: darkMode ? '#0a0814' : '#fafafa' }}>

      {/* GLOBAL LOADING INDICATOR */}
      {isFetching > 0 && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }}
            initial={{ width: '0%', x: '-100%' }}
            animate={{ width: '100%', x: '0%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-8 h-8 rounded-xl object-cover shadow-sm" alt="SkinAura" />
            <span className="font-black text-base" style={{ color: darkMode ? '#f5e8e0' : '#2d1f1f' }}>SkinAura</span>
          </Link>

          {/* Right Controls */}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleDarkMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
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
      <main className="flex-1 overflow-y-auto pb-24">
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

      {/* ── MORE DRAWER (slides up from bottom) ── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMoreOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{
                background: darkMode ? 'rgba(15,10,28,0.98)' : 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(32px)',
                boxShadow: '0 -8px 48px rgba(244,114,182,0.18), 0 -2px 16px rgba(0,0,0,0.1)',
                maxHeight: '80vh',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <p className="font-black text-base" style={{ color: darkMode ? '#f5e8e0' : '#1f1f1f' }}>All Features</p>
                <button onClick={() => setMoreOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }}>
                  <X className="w-4 h-4" style={{ color: darkMode ? '#ccc' : '#555' }} />
                </button>
              </div>

              {/* Gradient accent bar */}
              <div className="h-0.5 mx-5 rounded-full mb-4" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />

              {/* Categories */}
              <div className="overflow-y-auto px-4 pb-4 space-y-5" style={{ maxHeight: 'calc(80vh - 120px)' }}>
                {MORE_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <p className="text-xs font-black mb-2.5 px-1" style={{ color: cat.color }}>{cat.label}</p>
                    <div className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(72px, calc((100% - 24px) / 4)), 1fr))` }}>
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.page);
                        const stale = isPageStale(item.page);
                        return (
                          <Link key={item.key} to={createPageUrl(item.page)}
                            onClick={() => setMoreOpen(false)}
                            className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all active:scale-95 relative"
                            style={{
                              background: active ? cat.bg : darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                              border: `1.5px solid ${active ? cat.color + '50' : 'transparent'}`,
                            }}>
                            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: active ? cat.color + '20' : darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
                              <Icon className="w-5 h-5" style={{ color: active ? cat.color : darkMode ? '#aaa' : '#666' }} />
                              {stale && !active && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 border-2 border-white"
                                  style={{ boxShadow: '0 0 0 2px rgba(244,114,182,0.4)', animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-center leading-tight"
                              style={{ color: active ? cat.color : darkMode ? '#aaa' : '#555' }}>
                              {item.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── BOTTOM NAVIGATION BAR ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40" id="bottom-nav"
        style={{
          background: darkMode ? 'rgba(10,8,20,0.96)' : 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
          borderTop: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(244,114,182,0.15)',
          boxShadow: '0 -4px 32px rgba(244,114,182,0.1), 0 -1px 0 rgba(255,255,255,0.5)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 h-16">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = item.page ? isActive(item.page) : isMoreActive || moreOpen;
            const isMore = item.key === 'more';

            return (
              <motion.button
                key={item.key}
                onClick={() => {
                  if (isMore) {
                    setMoreOpen(o => !o);
                  }
                }}
                whileTap={{ scale: 0.88 }}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all"
                style={{ minWidth: 0 }}
              >
                {item.page ? (
                  <Link to={createPageUrl(item.page)}
                    className="flex flex-col items-center gap-0.5 w-full"
                    onClick={() => setMoreOpen(false)}>
                    <NavIcon Icon={Icon} active={active} isMore={false} moreOpen={false} darkMode={darkMode} />
                    <span className="text-[10px] font-bold truncate" style={{ color: active ? '#f472b6' : darkMode ? '#666' : '#9ca3af' }}>
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center gap-0.5 w-full relative">
                    <div className="relative">
                      <NavIcon Icon={Icon} active={active} isMore moreOpen={moreOpen} darkMode={darkMode} />
                      {MORE_CATEGORIES.flatMap(c => c.items).some(i => isPageStale(i.page) && !isActive(i.page)) && !moreOpen && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-pink-500 border-2 border-white"
                          style={{ boxShadow: '0 0 0 2px rgba(244,114,182,0.35)' }} />
                      )}
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: active || moreOpen ? '#a78bfa' : darkMode ? '#666' : '#9ca3af' }}>
                      {item.label}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
    </PageStateProvider>
  );
}

function NavIcon({ Icon, active, isMore, moreOpen, darkMode }) {
  const activeColor = isMore ? '#a78bfa' : '#f472b6';
  const isHighlighted = active || moreOpen;

  return (
    <div className="relative flex items-center justify-center">
      {isHighlighted && (
        <motion.div
          layoutId={isMore ? 'nav-pill-more' : undefined}
          className="absolute inset-0 rounded-xl"
          initial={false}
          animate={{ opacity: 1 }}
          style={{
            background: `${activeColor}18`,
            width: 40, height: 28,
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      {isMore && moreOpen ? (
        <motion.div animate={{ rotate: 45 }} transition={{ duration: 0.2 }}>
          <Icon className="w-5 h-5 relative z-10" style={{ color: activeColor }} />
        </motion.div>
      ) : (
        <Icon className="w-5 h-5 relative z-10"
          style={{ color: isHighlighted ? activeColor : darkMode ? '#555' : '#c4c4c4' }} />
      )}
      {isHighlighted && !isMore && (
        <motion.div
          layoutId="nav-dot"
          className="absolute -bottom-2 w-1 h-1 rounded-full"
          style={{ background: activeColor }}
          initial={false}
          animate={{ scale: 1 }}
        />
      )}
    </div>
  );
}