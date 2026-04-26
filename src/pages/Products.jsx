import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Package, Layers, FlaskConical, TrendingUp, AlertTriangle, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AddProductModal from '@/components/products/AddProductModal';
import RoutineStack from '@/components/products/RoutineStack';
import IngredientIntelligence from '@/components/products/IngredientIntelligence';
import ProgressAdjustments from '@/components/products/ProgressAdjustments';
import ProductImpactTracker from '@/components/products/ProductImpactTracker';
import AvoidList from '@/components/products/AvoidList';
import ProductCompareTool from '@/components/products/ProductCompareTool';

const TABS = [
  { key: 'routine', label: 'Routine Stack', icon: Layers, emoji: '🧴' },
  { key: 'ingredients', label: 'Ingredient Intel', icon: FlaskConical, emoji: '🔬' },
  { key: 'adjustments', label: 'Adjustments', icon: TrendingUp, emoji: '📈' },
  { key: 'impact', label: 'Impact Tracker', icon: TrendingUp, emoji: '📊' },
  { key: 'avoid', label: 'Avoid List', icon: AlertTriangle, emoji: '🚫' },
  { key: 'compare', label: 'Compare', icon: GitCompare, emoji: '⚖️' },
];

const QUOTES = [
  '"Your skin is a diary — write it well."',
  '"Great skin doesn\'t happen by chance, it happens by routine."',
  '"Glow is not a product. It\'s a practice."',
  '"Every ingredient tells a story. Make yours count."',
];

export default function Products() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('routine');
  const [showAddModal, setShowAddModal] = useState(false);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: savedProducts = [] } = useQuery({
    queryKey: ['savedProducts', user?.email],
    queryFn: () => base44.entities.SavedProduct.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: async () => {
      const analyses = await base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1);
      return analyses[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: pastAnalyses = [] } = useQuery({
    queryKey: ['pastAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 6),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (product) => base44.entities.SavedProduct.create({ user_email: user.email, ...product }),
    onSuccess: () => queryClient.invalidateQueries(['savedProducts']),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedProduct.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['savedProducts']),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(p) => saveMutation.mutate(p)}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🧴</div>
            <div>
              <h1 className="text-2xl font-black">Product Engine</h1>
              <p className="text-xs text-gray-500">Personalized · AI-matched · Skin-first</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latestAnalysis && (
            <Badge className="bg-violet-100 text-violet-700 capitalize">{latestAnalysis.skin_type} skin</Badge>
          )}
          <Button onClick={() => setShowAddModal(true)}
            className="gap-2 text-white" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Quote pill */}
      <div className="rounded-2xl px-5 py-3 text-sm font-medium italic text-center"
        style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.10))', border: '1px solid rgba(244,114,182,0.2)' }}>
        <span className="text-gray-500">{quote}</span>
      </div>

      {/* Skin snapshot chips */}
      {latestAnalysis && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Acne', val: latestAnalysis.acne_level, emoji: '🔴' },
            { label: 'Oiliness', val: latestAnalysis.oiliness, emoji: '💦' },
            { label: 'Dryness', val: latestAnalysis.dryness, emoji: '🏜️' },
            { label: 'Sensitivity', val: latestAnalysis.sensitivity, emoji: '⚡' },
            { label: 'Dark Spots', val: latestAnalysis.dark_spots, emoji: '🎯' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.07)' }}>
              {m.emoji} {m.label}: <span className={`ml-1 font-black ${m.val >= 7 ? 'text-red-500' : m.val >= 4 ? 'text-amber-500' : 'text-emerald-500'}`}>{m.val}/10</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 p-1.5 rounded-2xl overflow-x-auto hide-scrollbar" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? '#db2777' : '#9ca3af',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            <span>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* No analysis banner */}
      {!latestAnalysis && (
        <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="font-bold text-sm mb-1">Run a Skin Analysis first</p>
          <p className="text-xs text-gray-500">All modules become personalized once you have an analysis on file.</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'routine' && (
          <motion.div key="routine" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <RoutineStack savedProducts={savedProducts} latestAnalysis={latestAnalysis} onRemove={(id) => removeMutation.mutate(id)} onAdd={() => setShowAddModal(true)} />
          </motion.div>
        )}
        {activeTab === 'ingredients' && (
          <motion.div key="ingredients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <IngredientIntelligence savedProducts={savedProducts} latestAnalysis={latestAnalysis} />
          </motion.div>
        )}
        {activeTab === 'adjustments' && (
          <motion.div key="adjustments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ProgressAdjustments savedProducts={savedProducts} latestAnalysis={latestAnalysis} pastAnalyses={pastAnalyses} />
          </motion.div>
        )}
        {activeTab === 'impact' && (
          <motion.div key="impact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ProductImpactTracker savedProducts={savedProducts} pastAnalyses={pastAnalyses} />
          </motion.div>
        )}
        {activeTab === 'avoid' && (
          <motion.div key="avoid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AvoidList savedProducts={savedProducts} latestAnalysis={latestAnalysis} />
          </motion.div>
        )}
        {activeTab === 'compare' && (
          <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ProductCompareTool savedProducts={savedProducts} latestAnalysis={latestAnalysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}