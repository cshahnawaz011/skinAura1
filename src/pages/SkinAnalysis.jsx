import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { checkAICooldown, recordAIUsage, getCooldownSeconds, checkUploadCooldown, recordUploadUsage, getUploadCooldownSeconds } from '@/components/utils/aiRateLimit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, Loader2, Sparkles, Check, History,
  AlertCircle, ChevronDown, ChevronUp, Info, Zap, Target, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';
import Confetti from '@/components/ui/Confetti';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const skinConcerns = [
  {
    key: 'acne_level', label: 'Acne & Breakouts', icon: '🔴',
    gradient: 'from-red-400 to-pink-400',
    lowMsg: 'Your pores are clear and breakout-free.',
    midMsg: 'Mild congestion or occasional spots present.',
    highMsg: 'Active inflammation or frequent breakouts detected.'
  },
  {
    key: 'dark_spots', label: 'Dark Spots', icon: '🎯',
    gradient: 'from-amber-400 to-orange-400',
    lowMsg: 'Even, uniform tone with minimal pigmentation.',
    midMsg: 'Some post-inflammatory marks or sun spots visible.',
    highMsg: 'Significant hyperpigmentation affecting large areas.'
  },
  {
    key: 'wrinkles', label: 'Fine Lines & Wrinkles', icon: '⏳',
    gradient: 'from-purple-400 to-indigo-400',
    lowMsg: 'Skin appears youthful with minimal aging signs.',
    midMsg: 'Early fine lines visible, especially around expression areas.',
    highMsg: 'Pronounced lines and loss of elasticity detected.'
  },
  {
    key: 'pores', label: 'Pore Visibility', icon: '🔍',
    gradient: 'from-blue-400 to-cyan-400',
    lowMsg: 'Pores are tight and barely visible.',
    midMsg: 'Moderately enlarged pores, mainly in T-zone.',
    highMsg: 'Visibly enlarged or clogged pores across the face.'
  },
  {
    key: 'redness', label: 'Redness & Inflammation', icon: '🌡️',
    gradient: 'from-rose-400 to-red-400',
    lowMsg: 'Calm, even-toned complexion with no irritation.',
    midMsg: 'Localized flushing or mild rosacea-like redness.',
    highMsg: 'Persistent diffuse redness indicating possible rosacea or irritation.'
  },
  {
    key: 'oiliness', label: 'Oiliness & Shine', icon: '✨',
    gradient: 'from-yellow-400 to-amber-400',
    lowMsg: 'Balanced sebum production — matte finish.',
    midMsg: 'Moderate shine, especially in the T-zone.',
    highMsg: 'Excessive sebum leading to constant shine and congestion risk.'
  },
  {
    key: 'dryness', label: 'Dryness & Dehydration', icon: '🏜️',
    gradient: 'from-orange-400 to-amber-500',
    lowMsg: 'Well-hydrated and plump with good moisture retention.',
    midMsg: 'Mild tightness or flaking in certain areas.',
    highMsg: 'Severe dehydration with visible flaking, tightness, or cracking.'
  },
  {
    key: 'sensitivity', label: 'Skin Sensitivity', icon: '⚡',
    gradient: 'from-pink-400 to-fuchsia-400',
    lowMsg: 'Robust barrier — tolerates most products well.',
    midMsg: 'Reacts occasionally to certain ingredients or weather.',
    highMsg: 'Compromised barrier — easily triggered by products, temperature, or stress.'
  },
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

      {/* Custom Progress Bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
        <motion.div
          className={`h-full rounded-full ${level.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{contextMsg}</p>

      <AnimatePresence>
        {expanded && insight && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-white/30 dark:border-white/10"
          >
            <div className="space-y-2">
              {insight.cause && (
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Root Cause</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{insight.cause}</p>
                  </div>
                </div>
              )}
              {insight.fix && (
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Quick Fix</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{insight.fix}</p>
                  </div>
                </div>
              )}
              {insight.ingredient && (
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">Key Ingredient</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{insight.ingredient}</p>
                  </div>
                </div>
              )}
              {insight.timeline && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Expected Timeline</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{insight.timeline}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SkinAnalysis() {
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(getCooldownSeconds('skin_analysis'));
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

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
    onSuccess: () => {
      queryClient.invalidateQueries(['skinAnalyses']);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    const { allowed } = checkAICooldown('skin_analysis');
    if (!allowed) return;
    setAnalyzing(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedImage });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert dermatologist AI. Perform a deep, clinical-grade skin health assessment of this face photo.

SCORING GUIDE (be realistic, precise, and granular):
- Overall score (0-100): a holistic skin health index. 85-100 = excellent, 70-84 = good, 50-69 = moderate, below 50 = needs significant attention.
- Each concern (0-10): 0 = none, 1-3 = minimal, 4-6 = moderate, 7-10 = severe.

REQUIRED OUTPUT:
1. overall_score (number)
2. skin_type: one of [oily, dry, combination, normal, sensitive]
3. skin_tone: descriptive (e.g. "warm medium with yellow undertones", "fair with cool pink undertones")
4. Scores 0-10 for: acne_level, dark_spots, wrinkles, pores, redness, oiliness, dryness, sensitivity

5. For EACH concern, provide deep clinical insights:
   - cause: specific root cause (e.g. "excess androgens driving sebum production" not just "oily")
   - fix: a precise, actionable fix the user can start today
   - ingredient: the single most effective skincare ingredient for this concern with brief reason
   - timeline: realistic improvement timeline with consistent treatment

6. recommendations: 5 highly specific, science-backed recommendations tailored to their exact skin profile. Each must be 2-3 sentences long and reference actual mechanisms.

7. skin_strengths: 2-3 positive things observed about their skin
8. priority_concerns: top 2 concerns that need immediate attention (array of strings matching concern keys)
9. is_valid_face_photo: true/false

Be honest, clinical, and deeply personalized. Do not give generic advice.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          skin_type: { type: "string" },
          skin_tone: { type: "string" },
          acne_level: { type: "number" },
          dark_spots: { type: "number" },
          wrinkles: { type: "number" },
          pores: { type: "number" },
          redness: { type: "number" },
          oiliness: { type: "number" },
          dryness: { type: "number" },
          sensitivity: { type: "number" },
          concern_insights: {
            type: "object",
            properties: {
              acne_level: { type: "object", properties: { cause: {type:"string"}, fix: {type:"string"}, ingredient: {type:"string"}, timeline: {type:"string"} } },
              dark_spots: { type: "object", properties: { cause: {type:"string"}, fix: {type:"string"}, ingredient: {type:"string"}, timeline: {type:"string"} } },
              wrinkles: { type: "object", properties: { cause: {type:"string"}, fix: {type:"string"}, ingredient: {type:"string"}, timeline: {type:"string"} } },
              pores: { type: "object", properties: { cause: {type:"string"}, fix: {type:"string"}, ingredient: {type:"string"}, timeline: {type:"string"} } },
              redness: { type: "object", properties: { cause: {type:"string"}, fix: {type:"string"}, ingredient: {type:"string"}, timeline: {type:"string"} } },
              oiliness: { type: "object", properties: { cause: {type:"string"}, fix: {type:"string"}, ingredient: {type:"string"}, timeline: {type:"string"} } },
              dryness: { type: "object", properties: { cause: {type:"string"}, fix: {type:"string"}, ingredient: {type:"string"}, timeline: {type:"string"} } },
              sensitivity: { type: "object", properties: { cause: {type:"string"}, fix: {type:"string"}, ingredient: {type:"string"}, timeline: {type:"string"} } },
            }
          },
          recommendations: { type: "array", items: { type: "string" } },
          skin_strengths: { type: "array", items: { type: "string" } },
          priority_concerns: { type: "array", items: { type: "string" } },
          is_valid_face_photo: { type: "boolean" }
        }
      }
    });

    setAnalysisResult({ ...result, photo_url: file_url });
    recordAIUsage('skin_analysis');
    setCooldownLeft(5 * 60);
    setAnalyzing(false);
  };

  const saveAnalysis = async () => {
    if (!analysisResult || !user) return;
    await saveMutation.mutateAsync({
      user_email: user.email,
      photo_url: analysisResult.photo_url,
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
      analysis_date: new Date().toISOString(),
    });
  };

  const getScoreGrade = (score) => {
    if (score >= 85) return { label: 'Excellent', color: 'text-emerald-500', desc: 'Your skin is in great health!' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-500', desc: 'Minor improvements can be made.' };
    if (score >= 50) return { label: 'Moderate', color: 'text-amber-500', desc: 'A consistent routine will help.' };
    return { label: 'Needs Attention', color: 'text-red-500', desc: 'Start a targeted treatment plan.' };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Confetti trigger={showConfetti} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Skin Analysis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Clinical-grade skin assessment with deep insights</p>
        </div>
        {user && pastAnalyses.length > 0 && (
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="gap-2">
            <History className="w-4 h-4" /> History ({pastAnalyses.length})
          </Button>
        )}
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
                      {analysis.photo_url && <img src={analysis.photo_url} alt="Analysis" className="w-12 h-12 rounded-lg object-cover" />}
                      <div>
                        <p className="font-medium">Score: <span className="text-pink-500">{analysis.overall_score}</span>/100</p>
                        <p className="text-sm text-gray-500">{format(new Date(analysis.created_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <Badge className="capitalize">{analysis.skin_type}</Badge>
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
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              previewUrl ? 'border-pink-300 bg-pink-50/50 dark:bg-pink-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-pink-400'
            }`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="max-h-64 rounded-xl shadow-lg" />
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setSelectedImage(null); }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-medium text-lg">Upload Your Selfie</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Take a clear, well-lit photo without makeup</p>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400 flex-wrap">
                  {['Good lighting', 'No makeup', 'Front facing', 'Clean skin'].map(tip => (
                    <span key={tip} className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-500" /> {tip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {previewUrl && (
            <Button
              onClick={analyzeImage}
              disabled={analyzing || cooldownLeft > 0}
              className="w-full mt-4 bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 py-6 text-lg"
            >
              {analyzing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Deep Analyzing Your Skin...</>
              ) : cooldownLeft > 0 ? (
                <>⏳ Available in {Math.floor(cooldownLeft / 60)}:{String(cooldownLeft % 60).padStart(2, '0')}</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Run Clinical AI Analysis</>
              )}
            </Button>
          )}

          {analyzing && (
            <div className="mt-4 space-y-2">
              {['Detecting skin type & tone...', 'Analyzing 8 skin concerns...', 'Generating deep clinical insights...', 'Crafting personalized recommendations...'].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.8 }}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <Loader2 className="w-3 h-3 animate-spin text-pink-500" />
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

            {/* Score Hero */}
            <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img src={previewUrl} alt="Analyzed" className="w-32 h-32 rounded-2xl object-cover shadow-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
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
                            <Badge className={`mb-2 text-base px-4 py-1 ${grade.color} border-0 bg-white/60 dark:bg-black/20`}>
                              {grade.label} Skin
                            </Badge>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">{grade.desc}</p>
                          </>
                        );
                      })()}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                          <p className="text-xs text-gray-500">Skin Type</p>
                          <p className="font-bold capitalize">{analysisResult.skin_type}</p>
                        </div>
                        <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                          <p className="text-xs text-gray-500">Skin Tone</p>
                          <p className="font-bold text-sm">{analysisResult.skin_tone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  {analysisResult.skin_strengths?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-emerald-600 mb-2">✨ Skin Strengths</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.skin_strengths.map((s, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority Concerns */}
                  {analysisResult.priority_concerns?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-red-500 mb-2">⚠️ Priority Focus Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.priority_concerns.map((c, i) => (
                          <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full text-sm capitalize">
                            {c.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Deep Concern Analysis */}
            <GlassCard>
              <h3 className="text-xl font-semibold mb-2">Deep Concern Analysis</h3>
              <p className="text-sm text-gray-500 mb-4">Tap any concern to reveal root cause, fix, key ingredient & timeline</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skinConcerns.map((concern) => (
                  <ConcernCard
                    key={concern.key}
                    concern={concern}
                    value={analysisResult[concern.key] || 0}
                    insight={analysisResult.concern_insights?.[concern.key]}
                  />
                ))}
              </div>
            </GlassCard>

            {/* Deep Recommendations */}
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Clinical Recommendations
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

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => { setAnalysisResult(null); setPreviewUrl(null); setSelectedImage(null); }} className="flex-1">
                New Analysis
              </Button>
              {user && (
                <Button onClick={saveAnalysis} disabled={saveMutation.isPending} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" />
                    : saveMutation.isSuccess ? <><Check className="w-4 h-4 mr-2" />Saved!</>
                    : 'Save Analysis'}
                </Button>
              )}
            </div>
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