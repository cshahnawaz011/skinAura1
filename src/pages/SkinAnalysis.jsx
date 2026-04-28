import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { backgroundOps } from '@/lib/BackgroundOperations';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { setLastAutoRoutineTime, shouldAutoGenerateRoutine } from '@/lib/autoRoutineGenerator';
import { mergeSkinData } from '@/lib/skinDataOrchestration';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Sparkles, Check, History, Camera,
  ChevronDown, ChevronUp, RotateCcw, Layers, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOperationRecovery } from '@/hooks/useOperationRecovery';

import CameraCapture from '@/components/analysis/CameraCapture';
import SkinScoreHero from '@/components/analysis/SkinScoreHero';
import SkinParameterGrid from '@/components/analysis/SkinParameterGrid';
import ZoneHeatmapPanel from '@/components/analysis/ZoneHeatmapPanel';
import ConfidenceRiskPanel from '@/components/analysis/ConfidenceRiskPanel';
import NextStepsAfterAnalysis from '@/components/analysis/NextStepsAfterAnalysis';
import PageIntroPopup from '@/components/PageIntroPopup';



let sharedAnalysisState = {
  photos: { front: null, left: null, right: null },
  analyzing: false,
  step: 0,
  result: null,
  cooldownLeft: 0,
};
let analysisCooldownTimer = null;
const analysisListeners = new Set();
const updateAnalysisState = (updates) => {
  sharedAnalysisState = { ...sharedAnalysisState, ...updates };
  analysisListeners.forEach(l => l(sharedAnalysisState));
};

const startAnalysisCooldown = (seconds) => {
  if (analysisCooldownTimer) clearInterval(analysisCooldownTimer);
  updateAnalysisState({ cooldownLeft: seconds });
  analysisCooldownTimer = setInterval(() => {
    const next = sharedAnalysisState.cooldownLeft - 1;
    updateAnalysisState({ cooldownLeft: next });
    if (next <= 0) clearInterval(analysisCooldownTimer);
  }, 1000);
};

const ANALYSIS_STEPS = [
  'Uploading 3 face photos…',
  'Analyzing front view — skin health & tone…',
  'Analyzing left profile — texture & congestion…',
  'Analyzing right profile — symmetry & pigmentation…',
  'Combining 360° data into unified report…',
  'Deriving signal parameters & risk scores…',
];

const FULL_SCHEMA = {
  type: 'object',
  properties: {
    overall_score: { type: 'number' },
    skin_type: { type: 'string' },
    skin_tone: { type: 'string' },
    acne_level: { type: 'number' },
    dark_spots: { type: 'number' },
    wrinkles: { type: 'number' },
    pores: { type: 'number' },
    redness: { type: 'number' },
    oiliness: { type: 'number' },
    dryness: { type: 'number' },
    sensitivity: { type: 'number' },
    concern_insights: {
      type: 'object',
      properties: {
        acne_level: { type: 'object', properties: { cause: { type: 'string' }, fix: { type: 'string' }, ingredient: { type: 'string' }, timeline: { type: 'string' } } },
        dark_spots: { type: 'object', properties: { cause: { type: 'string' }, fix: { type: 'string' }, ingredient: { type: 'string' }, timeline: { type: 'string' } } },
        wrinkles: { type: 'object', properties: { cause: { type: 'string' }, fix: { type: 'string' }, ingredient: { type: 'string' }, timeline: { type: 'string' } } },
        pores: { type: 'object', properties: { cause: { type: 'string' }, fix: { type: 'string' }, ingredient: { type: 'string' }, timeline: { type: 'string' } } },
        redness: { type: 'object', properties: { cause: { type: 'string' }, fix: { type: 'string' }, ingredient: { type: 'string' }, timeline: { type: 'string' } } },
        oiliness: { type: 'object', properties: { cause: { type: 'string' }, fix: { type: 'string' }, ingredient: { type: 'string' }, timeline: { type: 'string' } } },
        dryness: { type: 'object', properties: { cause: { type: 'string' }, fix: { type: 'string' }, ingredient: { type: 'string' }, timeline: { type: 'string' } } },
        sensitivity: { type: 'object', properties: { cause: { type: 'string' }, fix: { type: 'string' }, ingredient: { type: 'string' }, timeline: { type: 'string' } } },
      }
    },
    zone_notes: {
      type: 'object',
      properties: {
        front: { type: 'string' },
        left: { type: 'string' },
        right: { type: 'string' },
      }
    },
    recommendations: { type: 'array', items: { type: 'string' } },
    skin_strengths: { type: 'array', items: { type: 'string' } },
    priority_concerns: { type: 'array', items: { type: 'string' } },
  }
};

// ── Zone Observations Collapsible Glowing Cards ───────────────────────────────
const ZONE_CONFIG = [
  {
    key: 'front',
    emoji: '😊',
    label: 'Front View',
    hint: 'Overall face — center zone',
    gradient: 'linear-gradient(135deg,rgba(244,114,182,0.18),rgba(251,207,232,0.25))',
    glow: 'rgba(244,114,182,0.25)',
    border: 'rgba(244,114,182,0.35)',
    color: '#db2777',
  },
  {
    key: 'left',
    emoji: '👈',
    label: 'Left Side',
    hint: 'Left cheek & jaw',
    gradient: 'linear-gradient(135deg,rgba(167,139,250,0.18),rgba(221,214,254,0.25))',
    glow: 'rgba(167,139,250,0.25)',
    border: 'rgba(167,139,250,0.35)',
    color: '#7c3aed',
  },
  {
    key: 'right',
    emoji: '👉',
    label: 'Right Side',
    hint: 'Right cheek & jaw',
    gradient: 'linear-gradient(135deg,rgba(251,191,36,0.18),rgba(253,230,138,0.25))',
    glow: 'rgba(251,191,36,0.25)',
    border: 'rgba(251,191,36,0.35)',
    color: '#d97706',
  },
];

function simplifyNote(text) {
  if (!text) return null;
  // Shorten long clinical sentences to max ~120 chars
  return text.length > 130 ? text.slice(0, 127) + '…' : text;
}

function ZoneCard({ zone, note }) {
  const [open, setOpen] = React.useState(false);
  const short = simplifyNote(note);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: zone.gradient,
        border: `1.5px solid ${zone.border}`,
        boxShadow: `0 4px 20px ${zone.glow}, 0 1px 4px rgba(0,0,0,0.06)`,
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xl flex-shrink-0">{zone.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm" style={{ color: zone.color }}>{zone.label}</p>
          <p className="text-[10px] text-gray-400">{zone.hint}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" style={{ color: zone.color }} />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-xs text-gray-700 leading-relaxed border-t border-white/40 pt-2">
              {short || '—'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ZoneObservationsCard({ zoneNotes }) {
  return (
    <div className="rounded-2xl p-4 space-y-2"
      style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(244,114,182,0.15)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(244,114,182,0.08)' }}>
      <p className="font-black text-sm mb-1">👁️ What We Saw — Tap to Read</p>
      <p className="text-[10px] text-gray-400 mb-3">Quick notes from each face angle</p>
      {ZONE_CONFIG.map(z => (
        <ZoneCard key={z.key} zone={z} note={zoneNotes[z.key]} />
      ))}
    </div>
  );
}

const TABS = [
  { key: 'overview',     label: 'Overview',     emoji: '⭐' },
  { key: 'parameters',  label: 'Parameters',   emoji: '🧬' },
  { key: 'heatmap',     label: 'Zone Map',     emoji: '🗺️' },
  { key: 'risk',        label: 'Risk & AI',    emoji: '🛡️' },
];

const ROUTINE_MESSAGES = [
  "🌿 Your skin has been heard. Now let your routine do the talking — cleanse gently, hydrate deeply, and protect always.",
  "✨ Every great complexion is built one routine at a time. Follow your personalized steps today and let your skin heal.",
  "💧 Consistency is the most powerful ingredient. Stick to your morning & night routine — your future skin will thank you.",
  "🌸 Your analysis is complete. Now is the perfect time to apply your serum, lock in moisture, and never skip SPF.",
  "🧴 Science has spoken. Now let your skin breathe — follow your routine, sleep well, and drink your water.",
];

const COOLDOWN_SECONDS = 10;

export default function SkinAnalysis() {
  useOperationRecovery();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showHistory, setShowHistory] = useState(false);
  const [routineMsg] = useState(() => ROUTINE_MESSAGES[Math.floor(Math.random() * ROUTINE_MESSAGES.length)]);

  const queryClient = useQueryClient();

  const [localState, setLocalState] = useState(sharedAnalysisState);
  useEffect(() => {
    analysisListeners.add(setLocalState);
    return () => analysisListeners.delete(setLocalState);
  }, []);

  const { photos, analyzing, step, result, cooldownLeft } = localState;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pastAnalyses = [] } = useQuery({
    queryKey: ['skinAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 10),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SkinAnalysis.create(data),
    onSuccess: () => queryClient.invalidateQueries(['skinAnalyses']),
  });

  const handlePhotoChange = (slotId, value) => {
    updateAnalysisState({ photos: { ...photos, [slotId]: value }, result: null });
  };

  const allReady = photos.front && photos.left && photos.right;

  const runAnalysis = async () => {
    if (!allReady) return;
    updateAnalysisState({ analyzing: true, step: 0 });
    backgroundOps.start('skinAnalysis', '🔬 Skin Analysis', { photos });

    const [f, l, r] = await Promise.all([
      base44.integrations.Core.UploadFile({ file: photos.front.file }),
      base44.integrations.Core.UploadFile({ file: photos.left.file }),
      base44.integrations.Core.UploadFile({ file: photos.right.file }),
    ]);

    updateAnalysisState({ step: 1 });
    backgroundOps.updateProgress('skinAnalysis', 20);

    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert AI dermatologist. Analyze these 3 face photos (front, left profile, right profile) and provide a clinical-grade skin health assessment.

SCORING RULES:
- Score each parameter on a 0-10 scale (0=excellent/healthy, 10=severe/problematic)
- Overall score (0-100): Calculate as 100 - (average of all 8 parameters × 10). This ensures a direct relationship where better parameters = higher overall score.
- Priority concerns: Must be derived from parameters with scores ≥ 5 (moderate to severe)
- Recommendations & strengths: Must align with the parameter scores you assigned

PARAMETERS TO EVALUATE (0-10 scale):
1. Acne level (0=clear, 10=severe breakouts)
2. Dark spots (0=none, 10=extensive pigmentation)
3. Wrinkles (0=none, 10=deep lines)
4. Pores (0=small, 10=enlarged)
5. Redness (0=clear, 10=inflamed)
6. Oiliness (0=perfectly balanced, 10=very oily)
7. Dryness (0=well hydrated, 10=very dry/flaky)
8. Sensitivity (0=none, 10=highly reactive)

REQUIRED OUTPUTS:
- Skin type: Based on oiliness & dryness balance
- Skin tone: Descriptive assessment
- Zone notes: Observations for front, left, right regions
- Priority concerns: Top 3 issues derived from parameters ≥ 5
- Skin strengths: Positive observations from parameters ≤ 3
- Recommendations: 3-5 specific, parameter-driven actions
- Concern insights: Detailed analysis (cause, fix, ingredient, timeline) for each priority concern

All results must be internally consistent and based on the parameter scores.`,
      file_urls: [f.file_url, l.file_url, r.file_url],
      response_json_schema: FULL_SCHEMA,
    });

    updateAnalysisState({ step: 5 });
    backgroundOps.updateProgress('skinAnalysis', 90);
    const res = llmRes;
    console.log('✅ Analysis Complete:', res);

    if (!res || typeof res.overall_score !== 'number') {
      throw new Error(`Invalid response structure: ${JSON.stringify(res)}`);
    }
    const analysisResult = { ...res, photo_url: f.file_url, photo_left_url: l.file_url, photo_right_url: r.file_url };
    // Merge with historical data for richer context
    const mergedAnalysis = await mergeSkinData(analysisResult, pastAnalyses);
    const finalAnalysisData = mergedAnalysis || analysisResult;

    updateAnalysisState({ result: finalAnalysisData, analyzing: false });
    localStorage.setItem('skinAnalysisCache', JSON.stringify(finalAnalysisData));
    backgroundOps.updateProgress('skinAnalysis', 100);
    backgroundOps.complete('skinAnalysis', { analysisResult: finalAnalysisData });

    // Auto-save merged data
    if (user) {
      saveMutation.mutate({
        user_email: user.email,
        photo_url: f.file_url, photo_left_url: l.file_url, photo_right_url: r.file_url,
        analysis_type: 'triple',
        overall_score: res.overall_score, skin_type: res.skin_type, skin_tone: res.skin_tone,
        acne_level: res.acne_level, dark_spots: res.dark_spots, wrinkles: res.wrinkles,
        pores: res.pores, redness: res.redness, oiliness: res.oiliness,
        dryness: res.dryness, sensitivity: res.sensitivity,
        recommendations: res.recommendations, skin_strengths: res.skin_strengths,
        priority_concerns: res.priority_concerns, concern_insights: res.concern_insights,
        zone_notes: res.zone_notes, analysis_date: new Date().toISOString(),
        skin_trends: finalAnalysisData.skin_trends,
        merged_insights: finalAnalysisData.merged_insights,
      });
    }



    // Start cooldown
    startAnalysisCooldown(COOLDOWN_SECONDS);

    // ── Signal routine page to prompt regeneration ──────────────────────────────
    localStorage.setItem('newAnalysisForRoutine', JSON.stringify({ timestamp: Date.now(), analysis: res }));

    // ── Auto-generate routine after analysis ──────────────────────────────
    if (user && shouldAutoGenerateRoutine()) {
      autoGenerateRoutine(res, user);
    }
  };

  const autoGenerateRoutine = async (analysisRes, currentUser) => {
    backgroundOps.start('autoRoutine', '✨ Auto-building Routine');
    const today = format(new Date(), 'yyyy-MM-dd');
    const prompt = `You are an AI dermatologist. Based on a fresh skin analysis, generate a minimal, safe, barrier-first skincare routine.

TODAY: ${today}
SKIN: type=${analysisRes.skin_type}, score=${analysisRes.overall_score}/100, acne=${analysisRes.acne_level}/10, dryness=${analysisRes.dryness}/10, oiliness=${analysisRes.oiliness}/10, sensitivity=${analysisRes.sensitivity}/10, redness=${analysisRes.redness}/10, dark_spots=${analysisRes.dark_spots}/10.
CONCERNS: ${(analysisRes.priority_concerns || []).join(', ') || 'none'}.

RULES: max 5 morning steps, 1 active per night, start Level 1 frequency (1-2x/week), always include moisturizer+SPF.

Return JSON:
{
  "skin_summary": { "skin_type": "string", "concerns": ["string"], "sensitivity_level": "low|medium|high", "current_barrier_status": "string" },
  "morning_routine": [{ "step": 1, "name": "string", "product_type": "string", "tip": "string", "key_ingredients": ["string"] }],
  "night_week_plan": [{ "day_label": "Monday", "day_type": "treatment|recovery|hydration", "active_name": "string or null", "concentration_level": "Level 1 or null", "steps": [{ "name": "string", "active": true, "tip": "string" }] }],
  "weekly_addons": [{ "name": "string", "frequency": "string", "tip": "string" }],
  "todays_adjustment": { "changed": true, "summary": "Auto-generated from fresh skin analysis on ${today}", "reason": "New skin scan completed" },
  "safety_notes": ["string"],
  "adaptive_guidance": { "if_improves": "string", "if_worsens": "string" },
  "recovery_mode_active": false
}`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          skin_summary: { type: 'object', properties: { skin_type: { type: 'string' }, concerns: { type: 'array', items: { type: 'string' } }, sensitivity_level: { type: 'string' }, current_barrier_status: { type: 'string' } } },
          morning_routine: { type: 'array', items: { type: 'object', properties: { step: { type: 'number' }, name: { type: 'string' }, product_type: { type: 'string' }, tip: { type: 'string' }, key_ingredients: { type: 'array', items: { type: 'string' } } } } },
          night_week_plan: { type: 'array', items: { type: 'object', properties: { day_label: { type: 'string' }, day_type: { type: 'string' }, active_name: { type: 'string' }, concentration_level: { type: 'string' }, steps: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, active: { type: 'boolean' }, tip: { type: 'string' } } } } } } },
          weekly_addons: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, frequency: { type: 'string' }, tip: { type: 'string' } } } },
          todays_adjustment: { type: 'object', properties: { changed: { type: 'boolean' }, summary: { type: 'string' }, reason: { type: 'string' } } },
          safety_notes: { type: 'array', items: { type: 'string' } },
          adaptive_guidance: { type: 'object', properties: { if_improves: { type: 'string' }, if_worsens: { type: 'string' } } },
          recovery_mode_active: { type: 'boolean' },
        }
      }
    });

    if (result) {
      // Save routine with timestamp
      const existingRoutines = await base44.entities.SkinRoutine.filter({ user_email: currentUser.email }, '-created_date', 1);
      const existingRoutine = existingRoutines[0] || null;
      const routinePayload = {
        user_email: currentUser.email,
        routine_type: 'morning',
        skin_type: result.skin_summary?.skin_type || analysisRes.skin_type || '',
        steps: result,
        routine_summary: result.skin_summary?.current_barrier_status || '',
        skin_concerns: result.skin_summary?.concerns || [],
      };
      if (existingRoutine?.id) {
        await base44.entities.SkinRoutine.update(existingRoutine.id, routinePayload);
      } else {
        await base44.entities.SkinRoutine.create(routinePayload);
      }
      // Update localStorage cache for routine page
      localStorage.setItem('skinRoutineCache', JSON.stringify(result));
      setLastAutoRoutineTime();
      queryClient.invalidateQueries(['skinRoutine']);
    }
    backgroundOps.complete('autoRoutine');
  };

  const reset = () => {
    updateAnalysisState({ result: null, photos: { front: null, left: null, right: null }, step: 0 });
    setActiveTab('overview');
  };

  const previousScore = pastAnalyses.length > 0 ? pastAnalyses[0]?.overall_score : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">

      <PageIntroPopup
        storageKey="intro_SkinAnalysis"
        emoji="🔬"
        title="360° AI Skin Analysis"
        accentColor="#f472b6"
        description="Upload three face angles — front, left, and right — to receive a clinical-grade skin health report powered by AI. Your analysis evaluates acne, dark spots, oiliness, dryness, sensitivity, and more across all facial zones."
        tips={[
          { icon: '📸', title: 'Capture quality photos', text: 'Use natural lighting, remove makeup, and face the camera straight on for accurate readings.' },
          { icon: '🗓️', title: 'Scan every 3 days', text: 'Skin changes gradually. Re-scanning every 3 days lets you track meaningful progress without over-analysis.' },
          { icon: '📊', title: 'Review your history', text: 'Compare past scans to measure real improvement in your skin health score over weeks.' },
        ]}
      />



      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">Skin Analysis</h1>
          <p className="text-xs text-gray-500 mt-0.5">360° · Front + Left + Right · Clinic-grade diagnostic</p>
        </div>
        {user && pastAnalyses.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowHistory(h => !h)} className="gap-1.5">
            <History className="w-3.5 h-3.5" /> History ({pastAnalyses.length})
          </Button>
        )}
      </div>

      {/* History drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="font-black text-sm mb-2">Past Analyses</p>
              {pastAnalyses.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                  <div className="flex gap-1">
                    {[a.photo_url, a.photo_left_url, a.photo_right_url].filter(Boolean).slice(0, 3).map((u, i) => (
                      <img key={i} src={u} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{format(new Date(a.created_date), 'MMM d, yyyy')}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{a.skin_type}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {a.analysis_type === 'triple' && <Badge className="bg-violet-100 text-violet-700 text-[10px]">360°</Badge>}
                    <span className="font-black text-pink-500 text-sm">{a.overall_score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COOLDOWN BANNER ── */}
      <AnimatePresence>
        {cooldownLeft > 0 && !result && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.12),rgba(167,139,250,0.14))', border: '1.5px solid rgba(244,114,182,0.3)', backdropFilter: 'blur(20px)' }}
          >
            {/* Shimmer top bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#f472b6)', backgroundSize: '200% 100%', animation: 'shimmer-card 2s linear infinite' }} />

            <div className="p-5 flex flex-col items-center text-center gap-4">
              {/* Countdown ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(244,114,182,0.12)" strokeWidth="6" />
                  <motion.circle
                    cx="40" cy="40" r="34"
                    fill="none"
                    stroke="url(#coolGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - cooldownLeft / COOLDOWN_SECONDS)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                  <defs>
                    <linearGradient id="coolGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{cooldownLeft}</span>
                  <span className="text-[9px] text-gray-400 font-semibold">sec</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2 max-w-sm">
                <p className="font-black text-base" style={{ background: 'linear-gradient(135deg,#be185d,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Analysis Complete ✨
                </p>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{routineMsg}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa)' }}
                  animate={{ width: `${((COOLDOWN_SECONDS - cooldownLeft) / COOLDOWN_SECONDS) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
              <p className="text-[11px] text-gray-400">Next scan unlocks in <span className="font-black text-pink-500">{cooldownLeft}s</span></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CAPTURE phase */}
      {!result && (
        <div className="rounded-3xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(244,114,182,0.2)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3 mb-1">
            <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-10 h-10 rounded-2xl object-cover shadow-sm" alt="Camera" />
            <div>
              <h3 className="font-black">Capture 3 Face Angles</h3>
              <p className="text-[11px] text-gray-500">Front · Left · Right — for full 360° diagnostics</p>
            </div>
          </div>

          <CameraCapture photos={photos} onPhotoChange={handlePhotoChange} disabled={analyzing} />

          {/* Progress chips */}
          <div className="flex gap-2 justify-center">
            {['front', 'left', 'right'].map(slot => (
              <div key={slot} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${photos[slot] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                {photos[slot] ? <Check className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                {slot.charAt(0).toUpperCase() + slot.slice(1)}
              </div>
            ))}
          </div>

          <Button onClick={runAnalysis} disabled={analyzing || !allReady || cooldownLeft > 0}
            className={`w-full py-5 text-base font-black text-white ${cooldownLeft > 0 ? '' : 'ios-button-3d'}`} style={{ background: cooldownLeft > 0 ? 'rgba(0,0,0,0.1)' : 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            {analyzing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing…</>
            ) : cooldownLeft > 0 ? (
              <>⏳ Available in {cooldownLeft}s</>
            ) : !allReady ? (
              <><Camera className="w-5 h-5 mr-2" />Add {3 - Object.values(photos).filter(Boolean).length} more photo(s)</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />Run 360° Analysis</>
            )}
          </Button>

          {analyzing && (
            <div className="space-y-1.5 pt-1">
              {ANALYSIS_STEPS.map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0.3 }} animate={{ opacity: i <= step ? 1 : 0.3 }}
                  className="flex items-center gap-2 text-xs text-gray-500">
                  {i < step ? <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    : i === step ? <Loader2 className="w-3 h-3 animate-spin text-pink-500 flex-shrink-0" />
                    : <div className="w-3 h-3 rounded-full bg-gray-200 flex-shrink-0" />}
                  {s}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESULTS phase */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* 3 photo thumbs */}
            <div className="flex gap-2 justify-center">
              {[
                { url: result.photo_url, label: 'Front' },
                { url: result.photo_left_url, label: 'Left' },
                { url: result.photo_right_url, label: 'Right' },
              ].map(p => (
                <div key={p.label} className="text-center">
                  <img src={p.url} alt={p.label} className="w-20 h-24 rounded-2xl object-cover shadow-md border-2 border-white" />
                  <p className="text-[10px] text-gray-400 mt-1 font-semibold">{p.label}</p>
                </div>
              ))}
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

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <SkinScoreHero analysis={result} previousScore={previousScore} />

                  {/* Zone per-view notes */}
                  {result.zone_notes && <ZoneObservationsCard zoneNotes={result.zone_notes} />}

                  <NextStepsAfterAnalysis />
                </motion.div>
              )}

              {activeTab === 'parameters' && (
                <motion.div key="params" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SkinParameterGrid analysis={result} insights={result.concern_insights} />
                </motion.div>
              )}

              {activeTab === 'heatmap' && (
                <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ZoneHeatmapPanel analysis={result} />
                </motion.div>
              )}

              {activeTab === 'risk' && (
                <motion.div key="risk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ConfidenceRiskPanel analysis={result} />
                </motion.div>
              )}


            </AnimatePresence>

            {/* Action bar */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={reset} className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" /> New Scan
              </Button>
              {saveMutation.isSuccess && (
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-bold">
                  <Check className="w-4 h-4" /> Saved
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!user && (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
          <AlertCircle className="w-7 h-7 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">Sign in to save analyses and track your skin progress</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="ios-button-3d text-white" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>Sign In</Button>
        </div>
      )}
    </div>
  );
}