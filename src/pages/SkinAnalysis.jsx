import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Sparkles, Check, History, Camera,
  ChevronDown, ChevronUp, RotateCcw, Layers, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

import CameraCapture from '@/components/analysis/CameraCapture';
import SkinScoreHero from '@/components/analysis/SkinScoreHero';
import SkinParameterGrid from '@/components/analysis/SkinParameterGrid';
import ZoneHeatmapPanel from '@/components/analysis/ZoneHeatmapPanel';
import ConfidenceRiskPanel from '@/components/analysis/ConfidenceRiskPanel';
import NextStepsAfterAnalysis from '@/components/analysis/NextStepsAfterAnalysis';

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
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState({ front: null, left: null, right: null });
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showHistory, setShowHistory] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [routineMsg] = useState(() => ROUTINE_MESSAGES[Math.floor(Math.random() * ROUTINE_MESSAGES.length)]);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => {
      setCooldownLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

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
    setPhotos(prev => ({ ...prev, [slotId]: value }));
    setResult(null);
  };

  const allReady = photos.front && photos.left && photos.right;

  const runAnalysis = async () => {
    if (!allReady) return;
    setAnalyzing(true);
    setStep(0);

    const [f, l, r] = await Promise.all([
      base44.integrations.Core.UploadFile({ file: photos.front.file }),
      base44.integrations.Core.UploadFile({ file: photos.left.file }),
      base44.integrations.Core.UploadFile({ file: photos.right.file }),
    ]);

    setStep(4);

    const geminiRes = await base44.functions.invoke('gemini', {
      use_model: 'flash2',
      image_urls: [f.file_url, l.file_url, r.file_url],
      response_json: true,
      prompt: `You are an expert dermatologist AI. Analyze these THREE face photos (front, left profile, right profile) for a comprehensive 360° skin assessment.

Return a JSON object with EXACTLY these fields:
- overall_score: number 0-100 (holistic skin health)
- skin_type: one of "oily"|"dry"|"combination"|"normal"|"sensitive"
- skin_tone: string e.g. "warm medium with yellow undertones"
- acne_level: number 0-10
- dark_spots: number 0-10
- wrinkles: number 0-10
- pores: number 0-10
- redness: number 0-10
- oiliness: number 0-10
- dryness: number 0-10
- sensitivity: number 0-10
- recommendations: array of 3-5 short strings
- skin_strengths: array of 2-4 short strings
- priority_concerns: array of 2-4 short strings
- concern_insights: object with keys acne_level, dark_spots, wrinkles, pores, redness, oiliness, dryness, sensitivity — each having: cause, fix, ingredient, timeline
- zone_notes: object with keys front, left, right — each a 1-2 sentence simple English observation

Scoring: 0=none, 1-3=mild, 4-6=moderate, 7-10=severe. Be honest and concise.`,
    });

    const res = geminiRes.data?.result;
    if (!res) throw new Error('Analysis failed — no result from Gemini');

    setStep(5);
    setResult({ ...res, photo_url: f.file_url, photo_left_url: l.file_url, photo_right_url: r.file_url });
    setAnalyzing(false);

    // Auto-save
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
      });
    }

    // Start cooldown
    setCooldownLeft(COOLDOWN_SECONDS);
  };

  const reset = () => {
    setResult(null);
    setPhotos({ front: null, left: null, right: null });
    setStep(0); setActiveTab('overview');
  };

  const previousScore = pastAnalyses.length > 0 ? pastAnalyses[0]?.overall_score : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">AI Skin Analysis</h1>
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
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>📸</div>
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
            className="w-full py-5 text-base font-black" style={{ background: cooldownLeft > 0 ? 'rgba(0,0,0,0.1)' : 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
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
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">Sign In</Button>
        </div>
      )}
    </div>
  );
}