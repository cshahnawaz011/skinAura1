import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sun, Moon, Star, Clock, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MORNING_ORDER = ['cleanser', 'toner', 'serum', 'eye_cream', 'moisturizer', 'sunscreen'];
const NIGHT_ORDER = ['cleanser', 'toner', 'serum', 'treatment', 'eye_cream', 'moisturizer', 'face_mask', 'retinol'];

const CAT_EMOJI = {
  cleanser: '🧴', toner: '💧', serum: '✨', moisturizer: '🧈',
  sunscreen: '☀️', eye_cream: '👁️', face_mask: '🎭', treatment: '💊',
  exfoliant: '🔬', retinol: '🌙', other: '📦',
};

// Map routine step names to category emojis where possible
function getStepEmoji(name = '', productType = '') {
  const n = (name + ' ' + productType).toLowerCase();
  if (n.includes('cleanser') || n.includes('wash') || n.includes('foam')) return '🧴';
  if (n.includes('toner') || n.includes('mist')) return '💧';
  if (n.includes('serum') || n.includes('vitamin c') || n.includes('niacinamide')) return '✨';
  if (n.includes('moisturizer') || n.includes('moisturis') || n.includes('cream') || n.includes('gel')) return '🧈';
  if (n.includes('sunscreen') || n.includes('spf') || n.includes('sun')) return '☀️';
  if (n.includes('eye')) return '👁️';
  if (n.includes('mask')) return '🎭';
  if (n.includes('retinol') || n.includes('retinoid')) return '🌙';
  if (n.includes('exfol') || n.includes('aha') || n.includes('bha') || n.includes('acid')) return '🔬';
  if (n.includes('spot') || n.includes('treatment') || n.includes('acne')) return '💊';
  return '📦';
}

// ── Routine Step Card (from SkinRoutine entity) ──────────────────────────────
function RoutineStepCard({ step, index, color }) {
  const [expanded, setExpanded] = useState(false);
  const emoji = getStepEmoji(step.name, step.product_type);
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(16px)' }}>
      <button className="w-full flex items-start gap-3 p-3.5 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5"
          style={{ background: color }}>{index + 1}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base">{emoji}</span>
            <p className="font-bold text-sm leading-tight">{step.name}</p>
          </div>
          {step.product_type && (
            <p className="text-[11px] text-gray-400">{step.product_type}</p>
          )}
          {step.time_needed && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
              <Clock className="w-3 h-3" />{step.time_needed}
            </div>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-3.5 pb-3.5 space-y-2 border-t border-gray-100 pt-2">
              {step.key_ingredients?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 mb-1">KEY INGREDIENTS</p>
                  <div className="flex flex-wrap gap-1">
                    {step.key_ingredients.map((ing, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-100">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              {step.application_tip && (
                <div className="flex gap-2">
                  <span className="text-base flex-shrink-0">💡</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.application_tip}</p>
                </div>
              )}
              {step.why_important && (
                <div className="flex gap-2">
                  <span className="text-base flex-shrink-0">🔬</span>
                  <p className="text-xs text-gray-500 leading-relaxed italic">{step.why_important}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Saved Product Card (from SavedProduct entity) ────────────────────────────
function SavedProductCard({ product, analysis, onRemove }) {
  const score = getMatchScore(product, analysis);
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-3.5 relative group"
      style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{CAT_EMOJI[product.category] || '📦'}</span>
          <div>
            <p className="font-bold text-sm leading-tight">{product.product_name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{product.category?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <ScorePill score={score} />
          <button onClick={() => onRemove(product.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50">
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {(product.key_ingredients || []).slice(0, 4).map((ing, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-100">{ing}</span>
        ))}
      </div>
    </motion.div>
  );
}

function ScorePill({ score }) {
  const color = score >= 85 ? '#34d399' : score >= 70 ? '#facc15' : '#f43f5e';
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${color}18`, border: `1px solid ${color}44` }}>
      <Star className="w-3 h-3" style={{ color }} />
      <span className="text-[11px] font-black" style={{ color }}>{score}%</span>
    </div>
  );
}

function getMatchScore(product, analysis) {
  if (!analysis) return 75;
  let score = 70;
  const cats = product.category;
  if (cats === 'sunscreen') score += 15;
  if (cats === 'moisturizer' && analysis.dryness > 4) score += 12;
  if (cats === 'serum' && analysis.acne_level > 4) score += 10;
  if (cats === 'cleanser') score += 8;
  const ings = (product.key_ingredients || []).join(' ').toLowerCase();
  if (ings.includes('niacinamide') && analysis.dark_spots > 3) score += 5;
  if (ings.includes('hyaluronic') && analysis.dryness > 3) score += 5;
  if (ings.includes('retinol') && analysis.wrinkles > 3) score += 5;
  if (ings.includes('salicylic') && analysis.acne_level > 4) score += 8;
  if (analysis.sensitivity > 6 && (ings.includes('fragrance') || ings.includes('alcohol'))) score -= 15;
  return Math.min(99, Math.max(45, score));
}

// ── Routine Section ──────────────────────────────────────────────────────────
function RoutineSection({ title, icon: Icon, routineData, fallbackProducts, fallbackOrder, analysis, onRemove, color }) {
  const steps = routineData?.steps || [];
  const hasRoutineSteps = steps.length > 0;

  // Fallback: filter savedProducts by category order
  const fallbackSorted = [...fallbackProducts].sort((a, b) => {
    const ai = fallbackOrder.indexOf(a.category);
    const bi = fallbackOrder.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-black text-sm">{title}</h3>
        {hasRoutineSteps && (
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700">{steps.length} steps · {routineData.total_time || 'Saved routine'}</Badge>
        )}
        {!hasRoutineSteps && <span className="text-xs text-gray-400">{fallbackSorted.length} products</span>}
      </div>

      {/* Show saved routine steps */}
      {hasRoutineSteps ? (
        <div className="space-y-2">
          {routineData.routine_summary && (
            <p className="text-xs text-gray-500 italic px-1">📋 {routineData.routine_summary}</p>
          )}
          {steps.map((step, i) => (
            <RoutineStepCard key={i} step={step} index={i} color={color} />
          ))}
          {routineData.priority_note && (
            <div className="px-3 py-2 rounded-xl text-xs text-amber-700 font-medium" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              ⚠️ {routineData.priority_note}
            </div>
          )}
        </div>
      ) : fallbackSorted.length > 0 ? (
        /* Fallback: show saved products from shelf */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fallbackSorted.map((p, i) => (
            <div key={p.id} className="relative">
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white z-10"
                style={{ background: color }}>{i + 1}</div>
              <div className="pl-5">
                <SavedProductCard product={p} analysis={analysis} onRemove={onRemove} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-6 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200">
          No routine saved yet — go to <strong>Skin Routine</strong> page to build one
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function RoutineStack({ savedProducts, latestAnalysis, savedRoutines = [], onRemove, onAdd }) {
  // Find morning/night/weekly routines from savedRoutines
  const morningRoutine = savedRoutines.find(r => r.routine_type === 'morning') || null;
  const nightRoutine = savedRoutines.find(r => r.routine_type === 'night') || null;
  const weeklyRoutine = savedRoutines.find(r => r.routine_type === 'weekly') || null;

  // Fallback savedProducts by category
  const morningProducts = savedProducts.filter(p => MORNING_ORDER.includes(p.category));
  const nightProducts = savedProducts.filter(p => p.category === 'retinol' || NIGHT_ORDER.includes(p.category));



  return (
    <div className="space-y-5">

      {/* Source banner */}
      {savedRoutines.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-700"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
          ✅ Showing your <strong>{savedRoutines.length} saved routine{savedRoutines.length > 1 ? 's' : ''}</strong> from the Routine Tracker
        </div>
      )}



      {/* Morning Routine */}
      <RoutineSection
        title="Morning Routine"
        icon={Sun}
        routineData={morningRoutine}
        fallbackProducts={morningProducts}
        fallbackOrder={MORNING_ORDER}
        analysis={latestAnalysis}
        onRemove={onRemove}
        color="linear-gradient(135deg,#f59e0b,#f97316)"
      />

      {/* Night Routine */}
      <RoutineSection
        title="Night Routine"
        icon={Moon}
        routineData={nightRoutine}
        fallbackProducts={nightProducts}
        fallbackOrder={NIGHT_ORDER}
        analysis={latestAnalysis}
        onRemove={onRemove}
        color="linear-gradient(135deg,#7c3aed,#a78bfa)"
      />

      {/* Weekly Routine */}
      {weeklyRoutine && weeklyRoutine.steps?.length > 0 && (
        <RoutineSection
          title="Weekly Treatments"
          icon={Calendar}
          routineData={weeklyRoutine}
          fallbackProducts={[]}
          fallbackOrder={[]}
          analysis={latestAnalysis}
          onRemove={onRemove}
          color="linear-gradient(135deg,#0ea5e9,#38bdf8)"
        />
      )}

      <Button onClick={onAdd} variant="outline" className="w-full gap-2">
        <Plus className="w-4 h-4" /> Add Product to Shelf
      </Button>
    </div>
  );
}