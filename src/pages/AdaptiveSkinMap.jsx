import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Layers, Map, Activity, AlertTriangle, TrendingUp,
  ChevronDown, ChevronUp, Zap, Shield, Droplets, Eye,
  BarChart2, RefreshCw, Info, Star, ArrowRight, Camera
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SkinFaceMap from '@/components/skinmap/SkinFaceMap';
import SignalLayerToggles from '@/components/skinmap/SignalLayerToggles';
import ZoneDetailPanel from '@/components/skinmap/ZoneDetailPanel';
import SignalHeatmapLegend from '@/components/skinmap/SignalHeatmapLegend';
import BarrierRiskPanel from '@/components/skinmap/BarrierRiskPanel';
import TrendSignalsPanel from '@/components/skinmap/TrendSignalsPanel';
import MapInsightsPanel from '@/components/skinmap/MapInsightsPanel';

export const SIGNAL_LAYERS = [
  { key: 'oiliness', label: 'Oiliness', emoji: '💦', color: '#facc15', dataKey: 'oiliness' },
  { key: 'dryness', label: 'Dryness', emoji: '🏜️', color: '#fb923c', dataKey: 'dryness' },
  { key: 'acne', label: 'Acne', emoji: '🔴', color: '#f43f5e', dataKey: 'acne_level' },
  { key: 'sensitivity', label: 'Sensitivity', emoji: '⚡', color: '#e879f9', dataKey: 'sensitivity' },
  { key: 'pigmentation', label: 'Pigmentation', emoji: '🎯', color: '#f97316', dataKey: 'dark_spots' },
  { key: 'texture', label: 'Texture/Pores', emoji: '🔍', color: '#38bdf8', dataKey: 'pores' },
  { key: 'redness', label: 'Redness', emoji: '🌡️', color: '#ef4444', dataKey: 'redness' },
  { key: 'hydration', label: 'Hydration', emoji: '💧', color: '#34d399', dataKey: 'dryness', invert: true },
];

export const FACE_ZONES = [
  { id: 'forehead', label: 'Forehead', emoji: '⬆️', cx: 50, cy: 33, signals: ['oiliness', 'acne', 'texture'], modifiers: { oiliness: 1.35, acne: 1.15, texture: 1.2 } },
  { id: 'left_brow_temple', label: 'Left Temple', emoji: '◀', cx: 22, cy: 43, signals: ['redness', 'sensitivity'], modifiers: { redness: 1.1, sensitivity: 1.1 } },
  { id: 'right_brow_temple', label: 'Right Temple', emoji: '▶', cx: 78, cy: 43, signals: ['redness', 'sensitivity'], modifiers: { redness: 1.1, sensitivity: 1.1 } },
  { id: 'nose', label: 'T-Zone / Nose', emoji: '👃', cx: 50, cy: 62, signals: ['oiliness', 'texture', 'acne'], modifiers: { oiliness: 1.6, texture: 1.4, acne: 1.25 } },
  { id: 'left_cheek', label: 'Left Cheek', emoji: '◀️', cx: 25, cy: 65, signals: ['dryness', 'sensitivity', 'redness'], modifiers: { dryness: 1.3, sensitivity: 1.2, redness: 1.15 } },
  { id: 'right_cheek', label: 'Right Cheek', emoji: '▶️', cx: 75, cy: 65, signals: ['dryness', 'sensitivity', 'redness'], modifiers: { dryness: 1.3, sensitivity: 1.2, redness: 1.15 } },
  { id: 'undereye', label: 'Under Eye', emoji: '👁️', cx: 50, cy: 61, signals: ['dryness', 'hydration', 'pigmentation'], modifiers: { dryness: 1.45, hydration: 1.4, pigmentation: 1.3 } },
  { id: 'chin', label: 'Chin & Jaw', emoji: '⬇️', cx: 50, cy: 97, signals: ['acne', 'oiliness'], modifiers: { acne: 1.35, oiliness: 1.15 } },
  { id: 'lips_perioral', label: 'Perioral Zone', emoji: '💋', cx: 50, cy: 83, signals: ['dryness', 'sensitivity'], modifiers: { dryness: 1.2, sensitivity: 1.1 } },
];

export default function AdaptiveSkinMap() {
  const [user, setUser] = useState(null);
  const [activeLayer, setActiveLayer] = useState('acne');
  const [selectedZone, setSelectedZone] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['skinMapAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: pastAnalyses = [] } = useQuery({
    queryKey: ['allAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 6),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['feedbackForMap', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 14),
    enabled: !!user?.email,
  });

  const { data: savedRoutine } = useQuery({
    queryKey: ['routineForMap', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const activeLayerConfig = SIGNAL_LAYERS.find(l => l.key === activeLayer);

  const getSignalScore = (layer, analysis) => {
    if (!analysis) return 0;
    const cfg = SIGNAL_LAYERS.find(l => l.key === layer);
    if (!cfg) return 0;
    const raw = analysis[cfg.dataKey] || 0;
    return cfg.invert ? Math.max(0, 10 - raw) : raw;
  };

  const overallScore = latestAnalysis?.overall_score || 0;
  const scoreGrade = overallScore >= 85 ? { label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
    : overallScore >= 70 ? { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
    : overallScore >= 50 ? { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
    : { label: 'Needs Care', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };

  const TABS = [
    { key: 'map', label: 'Skin Map', icon: Map },
    { key: 'signals', label: 'Signals', icon: Activity },
    { key: 'risk', label: 'Risk Zones', icon: AlertTriangle },
    { key: 'trends', label: 'Trends', icon: TrendingUp },
  ];

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl p-12 text-center" style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.08))', border: '1px solid rgba(244,114,182,0.2)' }}>
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🗺️</div>
          <h2 className="text-2xl font-black mb-2">Adaptive Skin Map</h2>
          <p className="text-gray-500 mb-6">Sign in to view your personalized interactive skin diagnostic map</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8">Sign In to View Map</Button>
        </div>
      </div>
    );
  }

  if (!latestAnalysis) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl p-12 text-center" style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.08))', border: '1px solid rgba(244,114,182,0.2)' }}>
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🔬</div>
          <h2 className="text-2xl font-black mb-2">No Skin Analysis Yet</h2>
          <p className="text-gray-500 mb-6">Run a skin analysis first to unlock your Adaptive Skin Map</p>
          <Link to="/SkinAnalysis">
            <Button className="bg-gradient-to-r from-pink-500 to-amber-500 text-white gap-2">
              <Camera className="w-4 h-4" /> Run Skin Analysis
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🗺️</div>
            <div>
              <h1 className="text-2xl font-black">Adaptive Skin Map</h1>
              <p className="text-xs text-gray-500">Interactive diagnostic intelligence</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-2xl text-sm font-bold ${scoreGrade.bg} ${scoreGrade.color}`}>
            Skin Score: {overallScore}/100 · {scoreGrade.label}
          </div>
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 capitalize">
            {latestAnalysis.skin_type}
          </Badge>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl overflow-x-auto" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-800 shadow text-pink-600 dark:text-pink-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'map' && (
          <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Main Map + Layer Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Face Map */}
              <div className="lg:col-span-2">
                <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.9),rgba(245,230,255,0.7))', border: '1px solid rgba(244,114,182,0.15)', backdropFilter: 'blur(20px)' }}>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: activeLayerConfig?.color || '#f472b6' }} />
                      <span className="font-bold text-sm">{activeLayerConfig?.emoji} {activeLayerConfig?.label} Signal Layer</span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">Live Map</span>
                  </div>
                  <div className="p-4">
                    <SkinFaceMap
                      analysis={latestAnalysis}
                      activeLayer={activeLayer}
                      selectedZone={selectedZone}
                      onZoneSelect={setSelectedZone}
                      layerConfig={activeLayerConfig}
                    />
                    <SignalHeatmapLegend activeLayer={activeLayer} score={getSignalScore(activeLayer, latestAnalysis)} layerConfig={activeLayerConfig} />
                  </div>
                </div>
              </div>

              {/* Layer Toggles + Zone Detail */}
              <div className="space-y-3">
                <SignalLayerToggles
                  layers={SIGNAL_LAYERS}
                  activeLayer={activeLayer}
                  onSelect={setActiveLayer}
                  analysis={latestAnalysis}
                />
                <AnimatePresence>
                  {selectedZone && (
                    <ZoneDetailPanel
                      zone={selectedZone}
                      analysis={latestAnalysis}
                      activeLayer={activeLayer}
                      onClose={() => setSelectedZone(null)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Map Insights */}
            <MapInsightsPanel analysis={latestAnalysis} feedbackHistory={feedbackHistory} routine={savedRoutine} />
          </motion.div>
        )}

        {activeTab === 'signals' && (
          <motion.div key="signals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <SignalsDashboard analysis={latestAnalysis} />
          </motion.div>
        )}

        {activeTab === 'risk' && (
          <motion.div key="risk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BarrierRiskPanel analysis={latestAnalysis} feedbackHistory={feedbackHistory} routine={savedRoutine} />
          </motion.div>
        )}

        {activeTab === 'trends' && (
          <motion.div key="trends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TrendSignalsPanel pastAnalyses={pastAnalyses} feedbackHistory={feedbackHistory} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Internal Signals Dashboard ──────────────────────────────────────────────
function SignalsDashboard({ analysis }) {
  const [expandedSignal, setExpandedSignal] = useState(null);

  const ALL_SIGNALS = [
    { key: 'oiliness', label: 'Oiliness', emoji: '💦', color: '#facc15', darkColor: '#b45309', desc: 'Sebum overproduction signal', action: 'Use niacinamide + BHA cleanser', ingredient: 'Niacinamide 10%' },
    { key: 'dryness', label: 'Dryness', emoji: '🏜️', color: '#fb923c', darkColor: '#c2410c', desc: 'Moisture deficit signal', action: 'Layer humectants + occlusive at night', ingredient: 'Hyaluronic Acid + Ceramides' },
    { key: 'acne_level', label: 'Acne & Breakouts', emoji: '🔴', color: '#f43f5e', darkColor: '#be123c', desc: 'Active breakout + congestion signal', action: 'Spot-treat with benzoyl peroxide 2.5%', ingredient: 'Salicylic Acid + Benzoyl Peroxide' },
    { key: 'sensitivity', label: 'Sensitivity', emoji: '⚡', color: '#e879f9', darkColor: '#a21caf', desc: 'Barrier reactivity signal', action: 'Pause actives, use ceramide barrier repair', ingredient: 'Centella Asiatica + Ceramides' },
    { key: 'dark_spots', label: 'Pigmentation', emoji: '🎯', color: '#f97316', darkColor: '#c2410c', desc: 'Hyperpigmentation + tone unevenness', action: 'Daily SPF50+ + Vitamin C serum AM', ingredient: 'Vitamin C 15% + Alpha Arbutin' },
    { key: 'pores', label: 'Texture & Pores', emoji: '🔍', color: '#38bdf8', darkColor: '#0369a1', desc: 'Surface texture irregularity signal', action: 'Exfoliate 2x/week with AHA', ingredient: 'Glycolic Acid 7% + Retinol' },
    { key: 'redness', label: 'Redness', emoji: '🌡️', color: '#ef4444', darkColor: '#b91c1c', desc: 'Inflammation & vascular signal', action: 'Use green tea + azelaic acid to calm', ingredient: 'Azelaic Acid + Green Tea Extract' },
    { key: 'wrinkles', label: 'Fine Lines', emoji: '⏳', color: '#a78bfa', darkColor: '#6d28d9', desc: 'Aging & elasticity signal', action: 'Start retinol 0.025% + peptide serum', ingredient: 'Retinol 0.1% + Peptides' },
  ];

  const getSeverity = (v) => {
    if (v <= 2) return { label: 'Optimal', dot: 'bg-emerald-400', text: 'text-emerald-600' };
    if (v <= 4) return { label: 'Mild', dot: 'bg-lime-400', text: 'text-lime-600' };
    if (v <= 6) return { label: 'Moderate', dot: 'bg-amber-400', text: 'text-amber-600' };
    if (v <= 8) return { label: 'Elevated', dot: 'bg-orange-400', text: 'text-orange-600' };
    return { label: 'Severe', dot: 'bg-red-500', text: 'text-red-600' };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-pink-500" />All Signal Layers</h2>
        <span className="text-xs text-gray-400">Tap any signal for details</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_SIGNALS.map((sig) => {
          const val = analysis?.[sig.key] || 0;
          const sev = getSeverity(val);
          const pct = Math.round((val / 10) * 100);
          const isOpen = expandedSignal === sig.key;
          return (
            <motion.div key={sig.key} layout
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.85)', border: `1.5px solid ${isOpen ? sig.color : 'rgba(0,0,0,0.06)'}`, backdropFilter: 'blur(12px)' }}
              onClick={() => setExpandedSignal(isOpen ? null : sig.key)}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sig.emoji}</span>
                    <div>
                      <p className="font-bold text-sm">{sig.label}</p>
                      <p className="text-[10px] text-gray-400">{sig.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${sev.dot}`} />
                    <span className={`text-xs font-bold ${sev.text}`}>{sev.label}</span>
                    <span className="text-sm font-black text-gray-700 ml-1">{val}<span className="text-xs text-gray-400 font-normal">/10</span></span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: sig.color }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-600">Suggested Action</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{sig.action}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-pink-600">Key Ingredient</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{sig.ingredient}</p>
                        </div>
                      </div>
                      {analysis?.concern_insights?.[sig.key]?.cause && (
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-blue-600">Root Cause</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{analysis.concern_insights[sig.key].cause}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}