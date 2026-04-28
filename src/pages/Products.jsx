import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Layers, FlaskConical, TrendingUp, AlertTriangle, GitCompare } from 'lucide-react';
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
  { key: 'adjustments', label: 'Smart Adjustments', icon: TrendingUp, emoji: '📈' },
  { key: 'impact', label: 'Impact Tracker', icon: TrendingUp, emoji: '📊' },
  { key: 'avoid', label: 'Avoid List', icon: AlertTriangle, emoji: '🚫' },
  { key: 'compare', label: 'Compare', icon: GitCompare, emoji: '⚖️' },
];

export default function Products() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('routine');
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // Clear stale cached data so pages reflect only live DB data
    localStorage.removeItem('skinRoutineCache');
    localStorage.removeItem('skinaura-routine-store');
    localStorage.removeItem('newAnalysisForRoutine');
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

  const { data: savedRoutines = [] } = useQuery({
    queryKey: ['savedRoutines', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 5),
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>🧴</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Products</h1>
            <p className="text-sm text-gray-500">Personalized · Smart-matched · Skin-first</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white ios-button-3d" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

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
            <RoutineStack savedProducts={savedProducts} latestAnalysis={latestAnalysis} savedRoutines={savedRoutines} onRemove={(id) => removeMutation.mutate(id)} onAdd={() => setShowAddModal(true)} />
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