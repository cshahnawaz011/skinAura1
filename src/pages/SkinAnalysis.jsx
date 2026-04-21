import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Loader2, Sparkles, Check, History,
  AlertCircle, ChevronDown, ChevronUp, Info, Zap, Target, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';
import Confetti from '@/components/ui/Confetti';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import NextStepsAfterAnalysis from '@/components/analysis/NextStepsAfterAnalysis';
import GlowShareCard from '@/components/share/GlowShareCard';
import DermatologyReport from '@/components/analysis/DermatologyReport';
import ThreePhotoUploader from '../components/analysis/ThreePhotoUploader';
import { Stethoscope } from 'lucide-react';

const skinConcerns = [
  { key: 'acne_level', label: 'Acne & Breakouts', icon: '🔴', gradient: 'from-red-400 to-pink-400', lowMsg: 'Your pores are clear and breakout-free.', midMsg: 'Mild congestion or occasional spots present.', highMsg: 'Active inflammation or frequent breakouts detected.' },
  { key: 'dark_spots', label: 'Dark Spots', icon: '🎯', gradient: 'from-amber-400 to-orange-400', lowMsg: 'Even, uniform tone with minimal pigmentation.', midMsg: 'Some post-inflammatory marks or sun spots visible.', highMsg: 'Significant hyperpigmentation affecting large areas.' },
  { key: 'wrinkles', label: 'Fine Lines & Wrinkles', icon: '⏳', gradient: 'from-purple-400 to-indigo-400', lowMsg: 'Skin appears youthful with minimal aging signs.', midMsg: 'Early fine lines visible, especially around expression areas.', highMsg: 'Pronounced lines and loss of elasticity detected.' },
  { key: 'pores', label: 'Pore Visibility', icon: '🔍', gradient: 'from-blue-400 to-cyan-400', lowMsg: 'Pores are tight and barely visible.', midMsg: 'Moderately enlarged pores, mainly in T-zone.', highMsg: 'Visibly enlarged or clogged pores across the face.' },
  { key: 'redness', label: 'Redness & Inflammation', icon: '🌡️', gradient: 'from-rose-400 to-red-400', lowMsg: 'Calm, even-toned complexion with no irritation.', midMsg: 'Localized flushing or mild rosacea-like redness.', highMsg: 'Persistent diffuse redness indicating possible rosacea or irritation.' },
  { key: 'oiliness', label: 'Oiliness & Shine', icon: '✨', gradient: 'from-yellow-400 to-amber-400', lowMsg: 'Balanced sebum production — matte finish.', midMsg: 'Moderate shine, especially in the T-zone.', highMsg: 'Excessive sebum leading to constant shine and congestion risk.' },
  { key: 'dryness', label: 'Dryness & Dehydration', icon: '🏜️', gradient: 'from-orange-400 to-amber-500', lowMsg: 'Well-hydrated and plump with good moisture retention.', midMsg: 'Mild tightness or flaking in certain areas.', highMsg: 'Severe dehydration with visible flaking, tightness, or cracking.' },
  { key: 'sensitivity', label: 'Skin Sensitivity', icon: '⚡', gradient: 'from-pink-400 to-fuchsia-400', lowMsg: 'Robust barrier — tolerates most products well.', midMsg: 'Reacts occasionally to certain ingredients or weather.', highMsg: 'Compromised barrier — easily triggered by products, temperature, or stress.' },
];

const ANALYSIS_STEPS = [
  'Uploading 3 face photos...',
  'Analyzing front face — overall skin health...',
  'Analyzing left profile — pores & texture...',
  'Analyzing right profile — symmetry & tone...',
  'Combining all 3 views into unified report...',
  'Generating personalized recommendations...',
  'Running clinic-grade dermatology check...',
];

function ConcernCard({ concern, value, insight }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((value / 10) * 100);
  const getLevel = (v) => {
    if (v <= 3) return { label: 'Healthy', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-400' };
    if (v <= 6) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-400' };
    return { label: 'Needs Care', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-400' };
  };
  const level = getLevel(value);
  const contextMsg = value <= 3 ? concern.lowMsg : value <= 6 ? concern.midMsg : concern.highMsg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 border ${level.bg} border-white/50 dark:border-white/10 cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{concern.icon}</span>
          <span className="font-semibold text-sm">{concern.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${level.color}`}>{value}<span className="text-xs text-gray-400">/10</span></span>
          <Badge className={`text-xs ${level.color} border-0 bg-transparent font-semibold`}>{level.label}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
        <motion.div className={`h-full rounded-full ${level.bar}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{contextMsg}</p>
      <AnimatePresence>
        {expanded && insight && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 pt-3 border-t border-white/30 dark:border-white/10">
            <div className="space-y-2">
              {insight.cause && <div className="flex items-start gap-2"><Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /><div><p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Root Cause</p><p className="text-xs text-gray-600 dark:text-gray-300">{insight.cause}</p></div></div>}
              {insight.fix && <div className="flex items-start gap-2"><Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /><div><p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Quick Fix</p><p className="text-xs text-gray-600 dark:text-gray-300">{insight.fix}</p></div></div>}
              {insight.ingredient && <div className="flex items-start gap-2"><Target className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" /><div><p className="text-xs font-semibold text-pink-600 dark:text-pink-400">Key Ingredient</p><p className="text-xs text-gray-600 dark:text-gray-300">{insight.ingredient}</p></div></div>}
              {insight.timeline && <div className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /><div><p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Expected Timeline</p><p className="text-xs text-gray-600 dark:text-gray-300">{insight.timeline}</p></div></div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const CONCERN_SCHEMA = {
  type: 'object',
  properties: {
    cause: { type: 'string' }, fix: { type: 'string' },
    ingredient: { type: 'string' }, timeline: { type: 'string' }
  }
};

const FULL_ANALYSIS_SCHEMA = {
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
        acne_level: CONCERN_SCHEMA, dark_spots: CONCERN_SCHEMA,
        wrinkles: CONCERN_SCHEMA, pores: CONCERN_SCHEMA,
        redness: CONCERN_SCHEMA, oiliness: CONCERN_SCHEMA,
        dryness: CONCERN_SCHEMA, sensitivity: CONCERN_SCHEMA,
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
    is_valid_face_photo: { type: 'boolean' }
  }
};

export default function SkinAnalysis() {
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState({ front: null, left: null, right: null });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dermResult, setDermResult] = useState(null);
  const [dermAnalyzing, setDermAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: pastAnalyses = [] } = useQuery({
    queryKey: ['skinAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 10),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SkinAnalysis.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['skinAnalyses']);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    },
  });

  const handlePhotoChange = (slotId, value) => {
    setPhotos(prev => ({ ...prev, [slotId]: value }));
    setAnalysisResult(null);
  };

  const getUserLang = () => {
    const langMap = { en: 'English', hi: 'Hindi', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', pt: 'Portuguese', ru: 'Russian', tr: 'Turkish' };
    return langMap[localStorage.getItem('glowai-lang') || 'en'] || 'English';
  };

  const allPhotosReady = photos.front && photos.left && photos.right;

  const analyzeImages = async () => {
    if (!allPhotosReady) return;
    setAnalyzing(true);
    setAnalysisStep(0);

    // Upload all 3 photos in parallel
    setAnalysisStep(0);
    const [frontUpload, leftUpload, rightUpload] = await Promise.all([
      base44.integrations.Core.UploadFile({ file: photos.front.file }),
      base44.integrations.Core.UploadFile({ file: photos.left.file }),
      base44.integrations.Core.UploadFile({ file: photos.right.file }),
    ]);

    setAnalysisStep(4);

    const lang = getUserLang();

    // Combined 3-photo analysis
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert dermatologist AI. You have been given THREE photos of the same person's face:
1. FRONT FACE (straight on view)
2. LEFT PROFILE (side view, left side of face)  
3. RIGHT PROFILE (side view, right side of face)

Perform a comprehensive, 360-degree clinical skin assessment by analyzing ALL THREE views together. Combine observations from all angles for a holistic, accurate diagnosis. Respond in ${lang}.

SCORING GUIDE (be realistic, precise, granular):
- overall_score (0-100): holistic skin health index. 85-100=excellent, 70-84=good, 50-69=moderate, below 50=needs significant attention.
- Each concern (0-10): 0=none, 1-3=minimal, 4-6=moderate, 7-10=severe.

IMPORTANT: Use ALL THREE angles. For example:
- Left/right profiles reveal: jaw acne, cheek pore size, side wrinkles, neck skin  
- Front reveals: forehead, nose, undereye, lip area, overall symmetry
- Combine all for accurate scores

REQUIRED OUTPUT:
1. overall_score (number) — weighted average across all 3 views
2. skin_type: one of [oily, dry, combination, normal, sensitive]
3. skin_tone: descriptive (e.g. "warm medium with yellow undertones")
4. Scores 0-10 for: acne_level, dark_spots, wrinkles, pores, redness, oiliness, dryness, sensitivity
5. concern_insights: for EACH concern:
   - cause: specific root cause
   - fix: precise, actionable fix to start today
   - ingredient: single most effective skincare ingredient
   - timeline: realistic improvement timeline
6. zone_notes: 
   - front: what was specifically observed in the front view
   - left: what was specifically observed in the left profile  
   - right: what was specifically observed in the right profile
7. recommendations: 5 highly specific, science-backed recommendations based on all 3 views
8. skin_strengths: 2-3 positive things observed
9. priority_concerns: top 2 concerns needing immediate attention
10. is_valid_face_photo: true/false

Be honest, clinical, and deeply personalized using all 3 views.`,
      file_urls: [frontUpload.file_url, leftUpload.file_url, rightUpload.file_url],
      response_json_schema: FULL_ANALYSIS_SCHEMA,
    });

    setAnalysisStep(5);
    setAnalysisResult({
      ...result,
      photo_url: frontUpload.file_url,
      photo_left_url: leftUpload.file_url,
      photo_right_url: rightUpload.file_url,
    });
    setAnalyzing(false);

    // Auto-run dermatology analysis on front photo
    setDermAnalyzing(true);
    setAnalysisStep(6);
    const dermRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a board-certified clinical dermatologist. You have THREE photos of the same person: front face, left profile, right profile. Perform a comprehensive clinic-grade dermatological assessment using all 3 views.

Provide:
1. skin_health_grade: A letter grade (A, B, C, D, F)
2. summary: 1-sentence clinical summary
3. overall_assessment: 2-3 sentence clinical paragraph
4. conditions: array of dermatological conditions detected (include even mild ones). For each:
   - name, emoji, severity (none/mild/moderate/severe), description, triggers, skincare_dos, skincare_donts, key_ingredients, rx_options, routine_modification, expected_improvement, requires_dermatologist
5. routine_changes_required: overall summary of routine changes needed

Analyze ALL THREE angles for complete assessment. Left/right profiles may reveal conditions not visible from the front.`,
      file_urls: [frontUpload.file_url, leftUpload.file_url, rightUpload.file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          skin_health_grade: { type: 'string' },
          summary: { type: 'string' },
          overall_assessment: { type: 'string' },
          routine_changes_required: { type: 'string' },
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' }, emoji: { type: 'string' }, severity: { type: 'string' },
                description: { type: 'string' }, triggers: { type: 'array', items: { type: 'string' } },
                skincare_dos: { type: 'array', items: { type: 'string' } },
                skincare_donts: { type: 'array', items: { type: 'string' } },
                key_ingredients: { type: 'array', items: { type: 'string' } },
                rx_options: { type: 'string' }, routine_modification: { type: 'string' },
                expected_improvement: { type: 'string' }, requires_dermatologist: { type: 'boolean' },
              }
            }
          }
        }
      }
    });
    setDermResult(dermRes);
    setDermAnalyzing(false);
    try { sessionStorage.setItem('glowai-derm-result', JSON.stringify(dermRes)); } catch (e) {}
  };

  const saveAnalysis = async () => {
    if (!analysisResult || !user) return;
    await saveMutation.mutateAsync({
      user_email: user.email,
      photo_url: analysisResult.photo_url,
      photo_left_url: analysisResult.photo_left_url,
      photo_right_url: analysisResult.photo_right_url,
      analysis_type: 'triple',
      overall_score: analysisResult.overall_score,
      skin_type: analysisResult.skin_type,
      skin_tone: analysisResult.skin_tone,
      acne_level: analysisResult.acne_level,
      dark_spots: analysisResult.dark_spots,
      wrinkles: analysisResult.wrinkles,
      pores: analysisResult.pores,
      redness: analysisResult.redness,
      oiliness: analysisResult.oiliness,
      dryness: analysisResult.dryness,
      sensitivity: analysisResult.sensitivity,
      recommendations: analysisResult.recommendations,
      skin_strengths: analysisResult.skin_strengths,
      priority_concerns: analysisResult.priority_concerns,
      concern_insights: analysisResult.concern_insights,
      zone_notes: analysisResult.zone_notes,
      analysis_date: new Date().toISOString(),
    });
  };

  const getScoreGrade = (score) => {
    if (score >= 85) return { label: 'Excellent', color: 'text-emerald-500', desc: 'Your skin is in great health!' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-500', desc: 'Minor improvements can be made.' };
    if (score >= 50) return { label: 'Moderate', color: 'text-amber-500', desc: 'A consistent routine will help.' };
    return { label: 'Needs Attention', color: 'text-red-500', desc: 'Start a targeted treatment plan.' };
  };

  const resetAll = () => {
    setAnalysisResult(null);
    setDermResult(null);
    setPhotos({ front: null, left: null, right: null });
    setAnalysisStep(0);
    setActiveTab('standard');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Confetti trigger={showConfetti} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">AI Skin Analysis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">360° clinical analysis — Front, Left & Right face</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {user && pastAnalyses.length > 0 && (
            <GlowShareCard analysis={pastAnalyses[0]} userName={user?.full_name || user?.email} />
          )}
          {user && pastAnalyses.length > 0 && (
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="gap-2 flex-shrink-0">
              <History className="w-4 h-4" /> <span className="hidden sm:inline">History</span> ({pastAnalyses.length})
            </Button>
          )}
        </div>
      </div>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard>
              <h3 className="font-semibold mb-4">Past Analyses</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {pastAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      {/* Show 3 photo thumbnails if available */}
                      <div className="flex gap-1">
                        {[analysis.photo_url, analysis.photo_left_url, analysis.photo_right_url].filter(Boolean).map((url, i) => (
                          <img key={i} src={url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ))}
                      </div>
                      <div>
                        <p className="font-medium">Score: <span className="text-pink-500">{analysis.overall_score}</span>/100</p>
                        <p className="text-sm text-gray-500">{format(new Date(analysis.created_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {analysis.analysis_type === 'triple' && <Badge className="bg-violet-100 text-violet-700 text-xs">360°</Badge>}
                      <Badge className="capitalize">{analysis.skin_type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Section */}
      {!analysisResult && (
        <GlassCard>
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-amber-400 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Upload 3 Face Photos</h3>
                <p className="text-xs text-gray-500">Front + Left + Right for a complete 360° analysis</p>
              </div>
            </div>

            {/* 360° badge */}
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 border border-violet-100 dark:border-violet-800">
              <span className="text-xl">🔬</span>
              <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                3-angle analysis gives <strong>3x more accurate</strong> results — catches side acne, jaw concerns, and profile texture invisible in a single selfie.
              </p>
            </div>
          </div>

          <ThreePhotoUploader photos={photos} onPhotoChange={handlePhotoChange} disabled={analyzing} />

          {/* Progress indicator */}
          <div className="mt-4 flex gap-2 justify-center">
            {['front', 'left', 'right'].map(slot => (
              <div key={slot} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${photos[slot] ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                {photos[slot] ? <Check className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                {slot.charAt(0).toUpperCase() + slot.slice(1)}
              </div>
            ))}
          </div>

          <Button
            onClick={analyzeImages}
            disabled={analyzing || !allPhotosReady}
            className="w-full mt-5 bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 py-6 text-lg"
          >
            {analyzing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing All 3 Views...</>
            ) : !allPhotosReady ? (
              <><Camera className="w-5 h-5 mr-2" /> Add All 3 Photos to Start ({Object.values(photos).filter(Boolean).length}/3)</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" /> Run 360° Combined Analysis</>
            )}
          </Button>

          {analyzing && (
            <div className="mt-4 space-y-2">
              {ANALYSIS_STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: i <= analysisStep ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  {i < analysisStep ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : i === analysisStep ? (
                    <Loader2 className="w-3 h-3 animate-spin text-pink-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                  )}
                  {step}
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Results */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* 3 photo thumbnails */}
            <div className="flex gap-3 justify-center">
              {[
                { url: analysisResult.photo_url, label: 'Front' },
                { url: analysisResult.photo_left_url, label: 'Left' },
                { url: analysisResult.photo_right_url, label: 'Right' },
              ].map((p) => (
                <div key={p.label} className="text-center">
                  <img src={p.url} alt={p.label} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md border-2 border-white dark:border-gray-700" />
                  <p className="text-xs text-gray-400 mt-1 font-medium">{p.label}</p>
                </div>
              ))}
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 rounded-2xl" style={{ background: '#f0ebe6' }}>
              <button
                onClick={() => setActiveTab('standard')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'standard' ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}>
                <Sparkles className="w-4 h-4" /> Standard Analysis
              </button>
              <button
                onClick={() => setActiveTab('dermatology')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'dermatology' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>
                <Stethoscope className="w-4 h-4" /> Clinic-Grade Derm
                {dermAnalyzing && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
              </button>
            </div>

            {activeTab === 'standard' && (
              <>
                {/* Score Hero */}
                <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <CircularProgress
                      value={analysisResult.overall_score}
                      size={120}
                      strokeWidth={12}
                      label="/100"
                      color={analysisResult.overall_score >= 70 ? 'mint' : analysisResult.overall_score >= 50 ? 'gold' : 'pink'}
                    />
                    <div className="flex-1 text-center md:text-left">
                      {(() => {
                        const grade = getScoreGrade(analysisResult.overall_score);
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                              <Badge className={`text-base px-4 py-1 ${grade.color} border-0 bg-white/60 dark:bg-black/20`}>{grade.label} Skin</Badge>
                              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">360° Analysis</Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">{grade.desc}</p>
                          </>
                        );
                      })()}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl"><p className="text-xs text-gray-500">Skin Type</p><p className="font-bold capitalize">{analysisResult.skin_type}</p></div>
                        <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl"><p className="text-xs text-gray-500">Skin Tone</p><p className="font-bold text-sm">{analysisResult.skin_tone}</p></div>
                      </div>

                      {analysisResult.skin_strengths?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-emerald-600 mb-2">✨ Skin Strengths</p>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.skin_strengths.map((s, i) => (
                              <span key={i} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisResult.priority_concerns?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-red-500 mb-2">⚠️ Priority Focus Areas</p>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.priority_concerns.map((c, i) => (
                              <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full text-sm capitalize">{c.replace('_', ' ')}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>

                {/* Zone Notes */}
                {analysisResult.zone_notes && (
                  <GlassCard>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">🗺️ Per-View Observations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'front', label: 'Front View', emoji: '😊', color: 'bg-pink-50 dark:bg-pink-900/20' },
                        { key: 'left',  label: 'Left Profile', emoji: '👈', color: 'bg-violet-50 dark:bg-violet-900/20' },
                        { key: 'right', label: 'Right Profile', emoji: '👉', color: 'bg-amber-50 dark:bg-amber-900/20' },
                      ].map(zone => (
                        <div key={zone.key} className={`p-3 rounded-xl ${zone.color}`}>
                          <p className="text-xs font-bold mb-1">{zone.emoji} {zone.label}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{analysisResult.zone_notes[zone.key] || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Deep Concern Analysis */}
                <GlassCard>
                  <h3 className="text-xl font-semibold mb-2">Deep Concern Analysis</h3>
                  <p className="text-sm text-gray-500 mb-4">Combined from all 3 views — tap any concern for details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skinConcerns.map((concern) => (
                      <ConcernCard key={concern.key} concern={concern} value={analysisResult[concern.key] || 0} insight={analysisResult.concern_insights?.[concern.key]} />
                    ))}
                  </div>
                </GlassCard>

                {/* Recommendations */}
                <GlassCard>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Clinical Recommendations
                  </h3>
                  <div className="space-y-3">
                    {analysisResult.recommendations?.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-4 bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 rounded-xl"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{rec}</p>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </>
            )}

            {activeTab === 'dermatology' && (
              <GlassCard>
                {dermAnalyzing ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                      <Stethoscope className="w-7 h-7 text-purple-500 animate-pulse" />
                    </div>
                    <p className="font-semibold text-purple-700">Running 360° Dermatology Analysis...</p>
                    {['Identifying conditions from all 3 views...', 'Assessing severity levels...', 'Generating treatment protocols...', 'Preparing routine modifications...'].map((s, i) => (
                      <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 1.2 }} className="text-xs text-gray-500">{s}</motion.p>
                    ))}
                  </div>
                ) : (
                  <DermatologyReport dermData={dermResult} />
                )}
              </GlassCard>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={resetAll} className="flex-1">New Analysis</Button>
              {user && (
                <Button onClick={saveAnalysis} disabled={saveMutation.isPending} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" />
                    : saveMutation.isSuccess ? <><Check className="w-4 h-4 mr-2" />Saved!</>
                    : 'Save Analysis'}
                </Button>
              )}
            </div>

            {saveMutation.isSuccess && <NextStepsAfterAnalysis />}
          </motion.div>
        )}
      </AnimatePresence>

      {!user && (
        <GlassCard className="text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">Sign in to save your analysis and track progress over time</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">Sign In</Button>
        </GlassCard>
      )}
    </div>
  );
}