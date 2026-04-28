import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  Zap, Shield, Sun, Moon, Timer, MapPin, Play, Pause, RotateCcw, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  selectModules, buildBaseRoutine, calcSkinResponseScore, calcIrritationRisk,
  shouldTriggerRecovery, getFrequencyRecommendation, generateWeekSchedule,
  checkConflicts, getPhaseFromAnalysis, INGREDIENT_REGISTRY, FREQUENCY_LADDER, PHASES,
} from '@/lib/adaptiveRoutineEngine';
import { saveRoutineStore } from '@/lib/routineStore';
import PageIntroPopup from '@/components/PageIntroPopup';
import StepProductSelector from '@/components/routine/StepProductSelector';
import ActiveModulesPanel from '@/components/routine/ActiveModulesPanel';

// ─── Constants ────────────────────────────────────────────────────

const FEEDBACK_OPTIONS = [
  { code: 1, emoji: '😊', label: 'Comfortable', signal: 'good', color: '#34d399' },
  { code: 2, emoji: '✨', label: 'More glowing', signal: 'good', color: '#34d399' },
  { code: 3, emoji: '😐', label: 'Slight dryness', signal: 'mild', color: '#facc15' },
  { code: 4, emoji: '🏜️', label: 'Very dry/flaky', signal: 'bad', color: '#fb923c' },
  { code: 5, emoji: '🔥', label: 'Mild irritation', signal: 'bad', color: '#f97316' },
  { code: 6, emoji: '⚡', label: 'Burning/stinging', signal: 'bad', color: '#ef4444' },
  { code: 7, emoji: '💧', label: 'More oily', signal: 'neutral', color: '#38bdf8' },
  { code: 8, emoji: '➖', label: 'No change', signal: 'neutral', color: '#9ca3af' },
  { code: 9, emoji: '🔴', label: 'New pimples', signal: 'bad', color: '#f43f5e' },
  { code: 10, emoji: '😰', label: 'Acne worsening', signal: 'bad', color: '#dc2626' },
];

const REGIONS = ['India', 'USA', 'UK', 'Europe', 'Southeast Asia', 'Middle East', 'Australia'];

// Step-specific durations in seconds
const STEP_DURATIONS = {
  cleanser: 60, toner: 20, serum: 30, moisturizer: 60, sunscreen: 90,
  eye: 20, mask: 600, exfoliant: 90, retinol: 30, treatment: 45, default: 30,
};

function getStepDuration(name = '') {
  const n = name.toLowerCase();
  if (n.includes('cleanser') || n.includes('wash')) return STEP_DURATIONS.cleanser;
  if (n.includes('sunscreen') || n.includes('spf')) return STEP_DURATIONS.sunscreen;
  if (n.includes('moisturizer') || n.includes('cream')) return STEP_DURATIONS.moisturizer;
  if (n.includes('serum')) return STEP_DURATIONS.serum;
  if (n.includes('toner')) return STEP_DURATIONS.toner;
  if (n.includes('retinol') || n.includes('acid') || n.includes('treatment')) return STEP_DURATIONS.treatment;
  return STEP_DURATIONS.default;
};

// ─── Step Timer ───────────────────────────────────────────────────

function StepTimer({ seconds }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(false);
    setDone(false);
  }, [seconds]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const reset = () => {
    clearInterval(intervalRef.current);
    setRemaining(seconds);
    setRunning(false);
    setDone(false);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Circular ring */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={done ? '#34d399' : '#f472b6'} strokeWidth="3"
            strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 15}`}
            strokeDashoffset={`${2 * Math.PI * 15 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done ? <span className="text-xs">✅</span> : <Timer className="w-3.5 h-3.5 text-pink-500" />}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1 text-xs font-black text-gray-700">
          {mins > 0 ? `${mins}m ` : ''}{secs.toString().padStart(2, '0')}s
          {done && <span className="text-emerald-500 font-black ml-1">Done!</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <button onClick={() => setRunning(r => !r)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white"
            style={{ background: running ? '#fb923c' : '#f472b6' }}>
            {running ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={reset} className="p-0.5 rounded text-gray-400 hover:text-gray-600">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Picker (per step) ────────────────────────────────────

const HOW_TO_USE = {
  cleanser: 'Apply pea-sized amount to damp skin. Massage in gentle circular motions for 60 seconds. Rinse with lukewarm water. Pat dry — never rub.',
  sunscreen: 'Apply 2 finger-lengths (½ tsp) to face + neck. Spread evenly, do not rub. Wait 2 min before makeup. Reapply every 2 hrs outdoors.',
  moisturizer: 'Apply to slightly damp skin. Use upward strokes from chin to forehead. Include neck. Let absorb 1 min before next step.',
  serum: 'Apply 3–4 drops. Press gently into skin — do not rub. Wait 30s to absorb before next step.',
  toner: 'Apply to cotton pad or hands. Pat gently, never drag. Skip if skin is irritated.',
  retinol: 'Rice-grain amount only. Apply to DRY skin, 20 min after cleansing. Avoid eye area. Moisturize on top.',
  acid: 'Apply evenly to face, avoid eyes. Leave on, do not rinse (unless rinse-off). Avoid mixing with retinol same night.',
  default: 'Apply as directed. Use gentle upward motions. Avoid eye area unless specified.',
};

function getHowToUse(name = '') {
  const n = name.toLowerCase();
  if (n.includes('cleanser') || n.includes('wash')) return HOW_TO_USE.cleanser;
  if (n.includes('sunscreen') || n.includes('spf')) return HOW_TO_USE.sunscreen;
  if (n.includes('moisturizer') || n.includes('cream')) return HOW_TO_USE.moisturizer;
  if (n.includes('serum')) return HOW_TO_USE.serum;
  if (n.includes('toner')) return HOW_TO_USE.toner;
  if (n.includes('retinol')) return HOW_TO_USE.retinol;
  if (n.includes('acid') || n.includes('aha') || n.includes('bha')) return HOW_TO_USE.acid;
  return HOW_TO_USE.default;
}

function ProductLocationPicker({ stepName, concentration, chemicals, region, onRegionChange, products, loadingProducts, onLoadProducts }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
        <p className="text-[11px] font-black text-gray-700">Find Products in Your Region</p>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {REGIONS.map(r => (
          <button key={r} onClick={() => onRegionChange(r)}
            className="text-[9px] font-bold px-2 py-0.5 rounded-full transition-all"
            style={{
              background: region === r ? '#a78bfa' : 'rgba(0,0,0,0.05)',
              color: region === r ? 'white' : '#6b7280',
            }}>
            {r}
          </button>
        ))}
      </div>
      <button onClick={onLoadProducts} disabled={loadingProducts}
        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl text-white"
        style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)' }}>
        {loadingProducts ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        {loadingProducts ? 'Finding…' : `Find ${region} Products`}
      </button>
      <AnimatePresence>
        {products?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-1.5">
            {products.map((p, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl"
                style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)' }}>
                <span className="text-base flex-shrink-0">{p.emoji || '🧴'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-800">{p.name}</p>
                  {p.concentration && (
                    <span className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 mb-0.5">{p.concentration}</span>
                  )}
                  <p className="text-[10px] text-gray-500">{p.brand} · {p.price}</p>
                  {p.where && <p className="text-[10px] text-violet-500 font-semibold">📍 {p.where}</p>}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Routine Step Card ────────────────────────────────────────────

function RoutineStep({ step, isActive, stepIndex, userEmail, onProductSaved }) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState('India');
  const [products, setProducts] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const duration = getStepDuration(step.name);
  const howTo = getHowToUse(step.name);

  const loadProducts = async () => {
    setLoadingProducts(true);
    const concText = step.concentration ? ` at concentration ${step.concentration}` : '';
    const chemText = step.ingredients?.length > 0 ? ` containing ${step.ingredients.slice(0, 3).join(', ')}` : '';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a skincare product expert. Recommend 3 specific, real, affordable products for: "${step.name}"${concText}${chemText} (${step.type || ''}) available in ${region}. 
IMPORTANT: Products must have the correct concentration if specified (e.g. if Niacinamide 5% is needed, recommend products with ~5% Niacinamide).
Return JSON with products array, exactly 3 items, each: { name, brand, concentration (e.g. "Niacinamide 10%"), price (local currency), where (pharmacy/online/store name), emoji }`,
      response_json_schema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, brand: { type: 'string' }, concentration: { type: 'string' }, price: { type: 'string' }, where: { type: 'string' }, emoji: { type: 'string' } }
            }
          }
        }
      }
    });
    setProducts(result?.products || []);
    setLoadingProducts(false);
  };

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{
        border: `1.5px solid ${isActive ? '#f472b6' : open ? 'rgba(167,139,250,0.4)' : 'rgba(0,0,0,0.07)'}`,
        background: isActive ? 'rgba(244,114,182,0.04)' : 'rgba(255,255,255,0.95)',
        boxShadow: open ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
      }}>

      {/* Header row */}
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left" onClick={() => setOpen(o => !o)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: isActive ? 'rgba(244,114,182,0.15)' : 'rgba(167,139,250,0.1)' }}>
          {isActive ? '⚡' : ['🧴', '💧', '☀️', '🌙', '🌿', '✨'][stepIndex % 6]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-gray-800">{step.name}</p>
          {/* Concentration + chemicals — always visible */}
          {step.concentration && (
            <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-0.5 mr-1"
              style={{ background: isActive ? 'rgba(244,114,182,0.18)' : 'rgba(167,139,250,0.15)', color: isActive ? '#db2777' : '#7c3aed' }}>
              {step.concentration}
            </span>
          )}
          {step.ingredients?.slice(0, 2).map(ing => (
            <span key={ing} className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 mr-1 bg-gray-100 text-gray-500">{ing}</span>
          ))}
          {!step.concentration && step.type && (
            <p className="text-[11px] text-gray-400 mt-0.5">{step.type}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActive && <Badge className="text-[10px] bg-pink-100 text-pink-600 border-none px-1.5">Active</Badge>}
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
            <Timer className="w-3 h-3" />{Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}m` : `${duration}s`}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {/* Expanded */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">

              {/* Timer */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.15)' }}>
                <p className="text-[10px] font-black text-pink-600 mb-1">⏱️ Application Timer</p>
                <StepTimer seconds={duration} />
              </div>

              {/* How to use */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <p className="text-[10px] font-black text-emerald-600 mb-1">📖 How to Apply</p>
                <p className="text-xs text-gray-600 leading-relaxed">{howTo}</p>
              </div>

              {/* Tip */}
              {step.tip && (
                <div className="flex items-start gap-2 rounded-xl p-3"
                  style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <span className="text-sm flex-shrink-0">💡</span>
                  <p className="text-xs text-gray-700">{step.tip}</p>
                </div>
              )}

              {/* Key ingredients */}
              {step.ingredients?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {step.ingredients.map(ing => (
                    <span key={ing} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{ing}</span>
                  ))}
                </div>
              )}

              {/* Product picker */}
              <ProductLocationPicker
                stepName={step.name}
                concentration={step.concentration}
                chemicals={step.ingredients}
                region={region}
                onRegionChange={setRegion}
                products={products}
                loadingProducts={loadingProducts}
                onLoadProducts={loadProducts}
              />

              {/* Save product to shelf */}
              <StepProductSelector
                step={{ name: step.name, type: step.type }}
                userEmail={userEmail}
                onSaved={onProductSaved}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Phase Bar ────────────────────────────────────────────────────

function PhaseBar({ phase }) {
  const p = PHASES[phase] || PHASES[1];
  return (
    <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: `${p.color}18`, border: `1.5px solid ${p.color}40` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
        style={{ background: p.color }}>{phase}</div>
      <div>
        <p className="font-black text-sm" style={{ color: p.color }}>{p.label}: {p.name}</p>
        <p className="text-xs text-gray-500">{p.desc}</p>
      </div>
    </div>
  );
}

// ─── Frequency Ladder ─────────────────────────────────────────────

function FrequencyLadder({ currentId }) {
  const currentIdx = FREQUENCY_LADDER.findIndex(f => f.id === currentId);
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
      <p className="font-black text-xs text-gray-500 mb-3 uppercase tracking-wider">Frequency Ladder</p>
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1">
        {FREQUENCY_LADDER.map((f, i) => {
          const active = i === currentIdx;
          const passed = i < currentIdx;
          return (
            <div key={f.id} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${active ? 'scale-110' : ''}`}
                  style={{
                    background: active ? '#f472b6' : passed ? '#34d399' : 'rgba(0,0,0,0.04)',
                    borderColor: active ? '#f472b6' : passed ? '#34d399' : 'rgba(0,0,0,0.1)',
                    color: active || passed ? 'white' : '#9ca3af',
                  }}>
                  {i + 1}
                </div>
                <span className="text-[9px] text-center font-bold" style={{ color: active ? '#f472b6' : '#9ca3af', maxWidth: 48 }}>
                  {f.label}
                </span>
              </div>
              {i < FREQUENCY_LADDER.length - 1 && (
                <div className="w-4 h-0.5 mb-4 rounded-full" style={{ background: passed ? '#34d399' : 'rgba(0,0,0,0.1)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week Schedule ────────────────────────────────────────────────

function WeekSchedule({ schedule }) {
  const today = new Date().getDay();
  const dayMap = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  const todayIdx = dayMap[today];
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
      <p className="font-black text-sm mb-3">📅 Weekly Schedule</p>
      <div className="grid grid-cols-7 gap-1">
        {schedule.map((d, i) => (
          <div key={d.day} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400">{d.day}</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
              style={{
                background: i === todayIdx ? '#f472b6' : d.isTreatment ? 'rgba(167,139,250,0.2)' : 'rgba(52,211,153,0.15)',
                border: i === todayIdx ? '2px solid #f472b6' : '1.5px solid transparent',
                color: i === todayIdx ? 'white' : d.isTreatment ? '#7c3aed' : '#059669',
              }}>
              {i === todayIdx ? '📍' : d.isTreatment ? '⚡' : '💧'}
            </div>
            <span className="text-[8px] font-bold" style={{ color: d.isTreatment ? '#7c3aed' : '#059669' }}>
              {d.isTreatment ? 'Treat' : 'Rest'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feedback Change Toast ────────────────────────────────────────

function RoutineChangeToast({ change, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, []);

  const Icon = change.direction === 'increase' ? TrendingUp : change.direction === 'decrease' ? TrendingDown : Minus;
  const color = change.direction === 'increase' ? '#34d399' : change.direction === 'decrease' ? '#fb923c' : '#a78bfa';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto rounded-2xl p-4 shadow-2xl"
      style={{ background: 'white', border: `2px solid ${color}40`, boxShadow: `0 8px 32px ${color}30` }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="font-black text-sm text-gray-800">🔄 Routine Auto-Updated!</p>
          <p className="text-xs text-gray-600 mt-0.5">{change.message}</p>
          <p className="text-[10px] font-bold mt-1" style={{ color }}>New frequency: {change.newFreq}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 text-lg leading-none">×</button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function SkinRoutine() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState([]);
  const [saving, setSaving] = useState(false);
  const [routineData, setRoutineData] = useState(null);
  const [tab, setTab] = useState('morning');
  const [currentFreqId, setCurrentFreqId] = useState(() => localStorage.getItem('skinaura-freq') || '1x');
  const [routineChange, setRoutineChange] = useState(null); // toast state
  const [generating, setGenerating] = useState(false);
  const [weeksSinceStart] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: analyses = [] } = useQuery({
    queryKey: ['skinAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [], refetch: refetchFeedback } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, '-created_date', 14),
    enabled: !!user?.email,
  });

  const { data: savedRoutines = [], refetch: refetchRoutine } = useQuery({
    queryKey: ['skinRoutine', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });

  const latestAnalysis = analyses[0] || null;
  const savedRoutine = savedRoutines[0] || null;

  useEffect(() => {
    if (savedRoutine?.steps && typeof savedRoutine.steps === 'object') {
      setRoutineData(savedRoutine.steps);
    } else {
      const cached = localStorage.getItem('skinRoutineCache');
      if (cached) { try { setRoutineData(JSON.parse(cached)); } catch {} }
    }
  }, [savedRoutine]);

  const modules = selectModules(latestAnalysis);
  const baseRoutine = buildBaseRoutine(latestAnalysis?.skin_type);
  const responseScore = calcSkinResponseScore(feedbackHistory);
  const irritationRisk = calcIrritationRisk(latestAnalysis, feedbackHistory);
  const isRecovery = shouldTriggerRecovery(feedbackHistory);
  const phase = getPhaseFromAnalysis(latestAnalysis, feedbackHistory, weeksSinceStart);
  const weekSchedule = generateWeekSchedule(modules.actives, isRecovery ? 'paused' : currentFreqId);
  const conflicts = checkConflicts([...modules.support, ...modules.actives]);

  useEffect(() => {
    if (latestAnalysis) {
      saveRoutineStore({ modules, analysis: latestAnalysis, frequencyId: currentFreqId, phase });
    }
  }, [latestAnalysis, currentFreqId, phase]);

  // ── Submit feedback + auto-adjust frequency ──
  const submitFeedback = async () => {
    if (!selectedFeedback.length || !user) return;
    setSaving(true);

    await base44.entities.SkinFeedback.create({
      user_email: user.email,
      date: new Date().toISOString().slice(0, 10),
      feedback_codes: selectedFeedback,
      routine_day_type: weekSchedule[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.type || 'recovery',
      concentration_level: 'Level 1',
    });

    await refetchFeedback();
    const newFeedbackHistory = [...feedbackHistory, { feedback_codes: selectedFeedback }];
    const newResponseScore = calcSkinResponseScore(newFeedbackHistory);
    const newIrritationRisk = calcIrritationRisk(latestAnalysis, newFeedbackHistory);
    const rec = getFrequencyRecommendation(newResponseScore, newIrritationRisk, currentFreqId);
    const ladder = FREQUENCY_LADDER;
    const idx = ladder.findIndex(f => f.id === currentFreqId);

    let newFreqId = currentFreqId;
    let changeMsg = null;

    if (rec === 'increase' && idx < ladder.length - 1) {
      newFreqId = ladder[idx + 1].id;
      changeMsg = { direction: 'increase', message: 'Great skin response! Increasing treatment frequency.', newFreq: ladder[idx + 1].label };
    } else if (rec === 'recovery') {
      newFreqId = 'paused';
      changeMsg = { direction: 'decrease', message: 'Irritation detected — actives paused for barrier recovery.', newFreq: 'Paused' };
    } else if (rec === 'reduce' && idx > 0) {
      newFreqId = ladder[Math.max(0, idx - 1)].id;
      changeMsg = { direction: 'decrease', message: 'Skin needs more rest. Reducing treatment frequency.', newFreq: ladder[Math.max(0, idx - 1)].label };
    } else {
      changeMsg = { direction: 'hold', message: 'Routine is working well. Holding current frequency.', newFreq: ladder[idx].label };
    }

    setCurrentFreqId(newFreqId);
    localStorage.setItem('skinaura-freq', newFreqId);
    setRoutineChange(changeMsg);
    setSaving(false);
    setSelectedFeedback([]);
  };

  // ── Generate AI Routine ──
  const generateRoutine = async () => {
    if (!latestAnalysis) return;
    setGenerating(true);
    const a = latestAnalysis;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI dermatologist. Based on this skin analysis, create a safe minimal skincare routine WITH SPECIFIC CONCENTRATIONS for each active ingredient.
Skin: type=${a.skin_type}, score=${a.overall_score}/100, acne=${a.acne_level}/10, dryness=${a.dryness}/10, oiliness=${a.oiliness}/10, sensitivity=${a.sensitivity}/10, redness=${a.redness}/10, dark_spots=${a.dark_spots}/10
Concerns: ${(a.priority_concerns || []).join(', ') || 'none'}
Rules: max 5 AM steps, max 4 PM steps, always include moisturizer+SPF in AM, barrier-first, start actives 1-2x/week.
CRITICAL: For each step with an active ingredient, set concentration field (e.g. "Niacinamide 5%", "Retinol 0.3%", "Salicylic Acid 1%", "Vitamin C 10%"). Base concentration on skin sensitivity — lower if sensitivity > 5.
Return JSON with: morning_routine (array: step, name, product_type, concentration (string, e.g. "Niacinamide 5%" or null for base steps), tip, key_ingredients[]), night_week_plan (7 items: day_label, day_type "treatment"|"recovery", steps[name, concentration (string or null), tip, active bool]), safety_notes (string[]).`,
      response_json_schema: {
        type: 'object',
        properties: {
          morning_routine: { type: 'array', items: { type: 'object', properties: { step: { type: 'number' }, name: { type: 'string' }, product_type: { type: 'string' }, concentration: { type: 'string' }, tip: { type: 'string' }, key_ingredients: { type: 'array', items: { type: 'string' } } } } },
          night_week_plan: { type: 'array', items: { type: 'object', properties: { day_label: { type: 'string' }, day_type: { type: 'string' }, steps: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, concentration: { type: 'string' }, tip: { type: 'string' }, active: { type: 'boolean' } } } } } } },
          safety_notes: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    if (result) {
      setRoutineData(result);
      localStorage.setItem('skinRoutineCache', JSON.stringify(result));
      const payload = { user_email: user.email, routine_type: 'morning', skin_type: a.skin_type || '', steps: result, skin_concerns: a.priority_concerns || [] };
      if (savedRoutine?.id) await base44.entities.SkinRoutine.update(savedRoutine.id, payload);
      else await base44.entities.SkinRoutine.create(payload);
      refetchRoutine();
    }
    setGenerating(false);
  };

  const amSteps = routineData?.morning_routine || baseRoutine.am.map(s => ({ name: s.name, product_type: s.type, tip: s.tip, key_ingredients: s.ingredients }));
  const pmDays = routineData?.night_week_plan || weekSchedule.map(d => ({
    day_label: d.day, day_type: d.type,
    steps: d.isTreatment
      ? [{ name: 'Cleanser', tip: 'Gentle cleanse' }, ...modules.actives.map(a => ({ name: INGREDIENT_REGISTRY[a]?.name, tip: `Apply ${INGREDIENT_REGISTRY[a]?.conc}`, active: true })), { name: 'Moisturizer', tip: 'Seal with barrier cream' }]
      : [{ name: 'Cleanser', tip: 'Gentle cleanse' }, { name: 'Ceramide Moisturizer', tip: 'Barrier recovery night' }],
  }));
  const todayDayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayPM = pmDays[todayDayIdx] || pmDays[0];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      <PageIntroPopup
        storageKey="intro_SkinRoutine"
        emoji="✨"
        title="Adaptive Skin Routine"
        accentColor="#f472b6"
        description="Your routine adapts in real-time based on your skin analysis and daily feedback. Fixed safe concentrations — only frequency changes."
        tips={[
          { icon: '🔬', title: 'Scan first', text: 'Run a Skin Analysis so your routine is fully personalized.' },
          { icon: '📊', title: 'Submit daily feedback', text: 'How your skin feels drives automatic frequency adjustments.' },
          { icon: '⏱️', title: 'Use step timers', text: 'Each step has a timer and region-specific product finder.' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black">Skin Routine</h1>
          <p className="text-xs text-gray-500 mt-0.5">Adaptive · Minimum-Effective-Dose · Barrier-First</p>
        </div>
        {latestAnalysis && (
          <Button onClick={generateRoutine} disabled={generating} className="gap-2 text-white ios-button-3d"
            style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Building…' : routineData ? 'Regenerate' : 'Build Routine'}
          </Button>
        )}
      </div>

      {!latestAnalysis && (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(244,114,182,0.06)', border: '1.5px dashed rgba(244,114,182,0.3)' }}>
          <p className="text-3xl mb-2">🔬</p>
          <p className="font-black text-base mb-1">No Skin Analysis Found</p>
          <p className="text-sm text-gray-500 mb-4">Run a skin analysis first so we can build your personalized routine.</p>
          <Button onClick={() => window.location.href = '/SkinAnalysis'} className="text-white ios-button-3d"
            style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            Go to Skin Analysis
          </Button>
        </div>
      )}

      {latestAnalysis && (
        <>
          <PhaseBar phase={phase} />

          {isRecovery && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(251,146,60,0.12)', border: '1.5px solid rgba(251,146,60,0.4)' }}>
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-xs font-bold text-orange-700">Recovery Mode — Actives paused. Barrier repair priority.</p>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Skin Response', value: `${responseScore}/100`, color: responseScore >= 70 ? '#34d399' : responseScore >= 50 ? '#facc15' : '#ef4444', icon: '💚' },
              { label: 'Irritation Risk', value: `${irritationRisk}/10`, color: irritationRisk <= 3 ? '#34d399' : irritationRisk <= 6 ? '#facc15' : '#ef4444', icon: '🛡️' },
              { label: 'Frequency', value: FREQUENCY_LADDER.find(f => f.id === currentFreqId)?.label || '1×/wk', color: '#a78bfa', icon: '📈' },
            ].map(m => (
              <div key={m.label} className="rounded-2xl p-3 text-center" style={{ background: `${m.color}12`, border: `1px solid ${m.color}30` }}>
                <p className="text-base mb-0.5">{m.icon}</p>
                <p className="font-black text-sm" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          <FrequencyLadder currentId={currentFreqId} />
          <WeekSchedule schedule={weekSchedule} />

          {conflicts.length > 0 && (
            <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-black text-red-600 mb-1">⚠️ Ingredient Conflicts</p>
              {conflicts.map((c, i) => <p key={i} className="text-xs text-red-700">{c.a} + {c.b}: {c.reason}</p>)}
            </div>
          )}

          {/* AM / PM tabs */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="flex">
              {[{ key: 'morning', label: '☀️ Morning' }, { key: 'night', label: '🌙 Tonight' }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex-1 py-3 font-black text-sm transition-all"
                  style={{
                    background: tab === t.key ? 'rgba(244,114,182,0.1)' : 'transparent',
                    color: tab === t.key ? '#f472b6' : '#9ca3af',
                    borderBottom: tab === t.key ? '2px solid #f472b6' : '2px solid transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-4 space-y-3">
              {tab === 'morning' ? (
                amSteps.map((step, i) => (
                  <RoutineStep key={i} stepIndex={i}
                    step={{ name: step.name, type: step.product_type, concentration: step.concentration || null, tip: step.tip, ingredients: step.key_ingredients || [] }}
                    isActive={false} userEmail={user?.email} onProductSaved={() => queryClient.invalidateQueries(['savedProducts'])} />
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${todayPM?.day_type === 'treatment' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {todayPM?.day_type === 'treatment' ? '⚡ Treatment Night' : '💧 Recovery Night'}
                    </span>
                    <span className="text-xs text-gray-400">{todayPM?.day_label}</span>
                  </div>
                  {(todayPM?.steps || []).map((step, i) => {
                    const activeConc = step.concentration || (step.active ? INGREDIENT_REGISTRY[modules.actives[0]]?.conc : null);
                    return (
                      <RoutineStep key={i} stepIndex={i}
                        step={{ name: step.name, type: step.active ? 'Active Ingredient' : 'Base step', concentration: activeConc, tip: step.tip || '', ingredients: [] }}
                        isActive={!!step.active} userEmail={user?.email} onProductSaved={() => queryClient.invalidateQueries(['savedProducts'])} />
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Active modules — detailed cards */}
          {(modules.support.length > 0 || modules.actives.length > 0) && (
            <ActiveModulesPanel
              modules={modules}
              currentFreqId={currentFreqId}
              latestAnalysis={latestAnalysis}
            />
          )}

          {/* Feedback panel */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div>
              <p className="font-black text-sm">📋 Daily Skin Feedback</p>
              <p className="text-[11px] text-gray-400 mt-0.5">How does your skin feel? Submitting auto-adjusts your routine frequency.</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {FEEDBACK_OPTIONS.map(opt => {
                const selected = selectedFeedback.includes(opt.code);
                return (
                  <button key={opt.code}
                    onClick={() => setSelectedFeedback(prev => selected ? prev.filter(c => c !== opt.code) : [...prev, opt.code])}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
                    style={{ background: selected ? `${opt.color}18` : 'rgba(0,0,0,0.03)', border: `1.5px solid ${selected ? opt.color : 'transparent'}` }}>
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="text-[9px] font-bold text-center leading-tight" style={{ color: selected ? opt.color : '#9ca3af' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <Button onClick={submitFeedback} disabled={!selectedFeedback.length || saving || !user}
              className="w-full gap-2 text-white"
              style={{ background: selectedFeedback.length ? 'linear-gradient(135deg,#f472b6,#a78bfa)' : undefined }}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving & Adjusting Routine…' : 'Submit Feedback'}
            </Button>
            {!user && <p className="text-xs text-center text-gray-400">Sign in to save feedback</p>}
          </div>

          {/* Safety notes */}
          {routineData?.safety_notes?.length > 0 && (
            <div className="rounded-xl p-4 space-y-1" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <p className="text-xs font-black text-violet-700 mb-2">🛡️ Safety Notes</p>
              {routineData.safety_notes.map((note, i) => (
                <p key={i} className="text-xs text-violet-600 flex items-start gap-1.5"><span>•</span>{note}</p>
              ))}
            </div>
          )}
        </>
      )}

      {/* Routine change toast */}
      <AnimatePresence>
        {routineChange && (
          <RoutineChangeToast change={routineChange} onClose={() => setRoutineChange(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}