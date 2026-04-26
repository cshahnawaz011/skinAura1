import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, TrendingUp, TrendingDown, Minus, Calendar,
  ChevronLeft, ChevronRight, Loader2, Plus, Sparkles, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';
import Confetti from '@/components/ui/Confetti';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { checkAICooldown, recordAIUsage, getCooldownSeconds, checkUploadCooldown, recordUploadUsage, getUploadCooldownSeconds } from '@/components/utils/aiRateLimit';
import GlowShareCard from '@/components/share/GlowShareCard';
import HeroProgressCard from '@/components/progress/HeroProgressCard';
import SkinChangesSnapshot from '@/components/progress/SkinChangesSnapshot';
import ProgressTimeline from '@/components/progress/ProgressTimeline';
import RoutineImpactCard from '@/components/progress/RoutineImpactCard';

export default function Progress() {
  const [user, setUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ photo: null, notes: '' });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [compareIndex, setCompareIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [analyzingProgress, setAnalyzingProgress] = useState(false);
  const [uploadCooldown, setUploadCooldown] = useState(getUploadCooldownSeconds('progress_photo'));
  const [aiCooldown, setAiCooldown] = useState(getCooldownSeconds('progress_ai'));
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Upload cooldown timer
  useEffect(() => {
    if (uploadCooldown <= 0) return;
    const t = setInterval(() => setUploadCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [uploadCooldown]);

  // AI cooldown timer
  useEffect(() => {
    if (aiCooldown <= 0) return;
    const t = setInterval(() => setAiCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [aiCooldown]);

  const { data: progressPhotos = [], isLoading } = useQuery({
    queryKey: ['progressPhotos', user?.email],
    queryFn: () => base44.entities.ProgressPhoto.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, 'created_date'),
    enabled: !!user?.email,
  });

  const { data: feedbackHistory = [] } = useQuery({
    queryKey: ['skinFeedback', user?.email],
    queryFn: () => base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 14),
    enabled: !!user?.email,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: data.photo });
      const latestScore = analyses.length > 0 ? analyses[analyses.length - 1].overall_score : 50;
      const weekNumber = Math.max(1, progressPhotos.length + 1);
      return base44.entities.ProgressPhoto.create({
        user_email: user.email,
        photo_url: file_url,
        skin_score: latestScore,
        week_number: weekNumber,
        notes: data.notes,
        photo_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progressPhotos']);
      setShowUpload(false);
      setUploadData({ photo: null, notes: '' });
      setPreviewUrl(null);
      recordUploadUsage('progress_photo');
      setUploadCooldown(3 * 60);
      if (progressPhotos.length > 0) {
        const firstScore = progressPhotos[progressPhotos.length - 1]?.skin_score || 0;
        const latestScore = analyses[analyses.length - 1]?.overall_score || 0;
        if (latestScore > firstScore) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({ ...uploadData, photo: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const generateAIInsight = async () => {
    const { allowed } = checkAICooldown('progress_ai');
    if (!allowed || analyses.length === 0) return;
    setAnalyzingProgress(true);

    const latestAnalysis = analyses[analyses.length - 1];
    const firstAnalysis = analyses[0];
    const photoCount = progressPhotos.length;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dermatology AI coach. Analyze this user's skin progress journey and give a personalized, motivating report.

User Journey Data:
- Total progress photos: ${photoCount}
- Skin analyses done: ${analyses.length}
- First skin score: ${firstAnalysis?.overall_score ?? 'N/A'}/100 (${format(new Date(firstAnalysis?.created_date || Date.now()), 'MMM d, yyyy')})
- Latest skin score: ${latestAnalysis?.overall_score ?? 'N/A'}/100 (${format(new Date(latestAnalysis?.created_date || Date.now()), 'MMM d, yyyy')})
- Current skin type: ${latestAnalysis?.skin_type ?? 'unknown'}
- Acne level now: ${latestAnalysis?.acne_level ?? 'N/A'}/10
- Dark spots now: ${latestAnalysis?.dark_spots ?? 'N/A'}/10
- Oiliness now: ${latestAnalysis?.oiliness ?? 'N/A'}/10
- Dryness now: ${latestAnalysis?.dryness ?? 'N/A'}/10

Give a structured, personalized progress analysis.`,
      response_json_schema: {
        type: "object",
        properties: {
          headline: { type: "string" },
          progress_summary: { type: "string" },
          biggest_win: { type: "string" },
          focus_area: { type: "string" },
          next_30_days: { type: "string" },
          motivation_message: { type: "string" },
          progress_score: { type: "number" },
          trend: { type: "string", enum: ["improving", "stable", "needs_attention"] }
        }
      }
    });

    setAiInsight(result);
    recordAIUsage('progress_ai');
    setAiCooldown(3 * 60);
    setAnalyzingProgress(false);
  };

  const chartData = analyses.map((a, i) => ({
    week: `W${i + 1}`,
    score: a.overall_score,
    date: format(new Date(a.created_date), 'MMM d'),
  }));

  const getImprovement = () => {
    if (analyses.length < 2) return null;
    const first = analyses[0].overall_score;
    const last = analyses[analyses.length - 1].overall_score;
    const diff = last - first;
    return {
      value: Math.abs(diff).toFixed(1),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
      percentage: ((Math.abs(diff) / first) * 100).toFixed(1),
    };
  };

  const improvement = getImprovement();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Track Your Progress</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in to track your skin transformation over time</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">
            Sign In to Start Tracking
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Confetti trigger={showConfetti} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Progress Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Watch your skin transform over time</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {analyses.length > 0 && (
            <GlowShareCard analysis={analyses[analyses.length - 1]} userName={user?.full_name || user?.email} />
          )}
          <Button
            onClick={() => setShowUpload(true)}
          disabled={uploadCooldown > 0}
          className="bg-gradient-to-r from-pink-500 to-amber-500 disabled:opacity-60"
        >
          <Plus className="w-4 h-4 mr-2" />
          {uploadCooldown > 0
            ? `Wait ${Math.floor(uploadCooldown / 60)}:${String(uploadCooldown % 60).padStart(2, '0')}`
            : 'Add Progress Photo'}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard delay={0.1}>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Current Score</p>
            <CircularProgress value={analyses[analyses.length - 1]?.overall_score || 0} size={80} strokeWidth={8} color="pink" />
          </div>
        </GlassCard>
        <GlassCard delay={0.2}>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Journey Progress</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{progressPhotos.length}</p>
            <p className="text-sm text-gray-500">weeks tracked</p>
          </div>
        </GlassCard>
        <GlassCard delay={0.3}>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Improvement</p>
            {improvement ? (
              <div className="flex items-center justify-center gap-2">
                {improvement.direction === 'up' ? <TrendingUp className="w-6 h-6 text-emerald-500" /> :
                  improvement.direction === 'down' ? <TrendingDown className="w-6 h-6 text-red-500" /> :
                    <Minus className="w-6 h-6 text-gray-400" />}
                <span className={`text-3xl font-bold ${improvement.direction === 'up' ? 'text-emerald-500' : improvement.direction === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                  {improvement.percentage}%
                </span>
              </div>
            ) : (
              <p className="text-gray-400">Need more data</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── NEW PREMIUM CARDS ── */}
      {analyses.length > 0 && (
        <HeroProgressCard analyses={analyses} />
      )}

      {analyses.length >= 2 && (
        <SkinChangesSnapshot firstAnalysis={analyses[0]} latestAnalysis={analyses[analyses.length - 1]} />
      )}

      <ProgressTimeline analyses={analyses} progressPhotos={progressPhotos} />

      <RoutineImpactCard analyses={analyses} feedbackHistory={feedbackHistory} />

      {/* AI Progress Insight */}
      <GlassCard className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">AI Progress Analysis</h3>
          </div>
          <Button
            onClick={generateAIInsight}
            disabled={analyzingProgress || aiCooldown > 0 || analyses.length === 0}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {analyzingProgress ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Analyzing...</>
            ) : aiCooldown > 0 ? (
              <>⏳ {Math.floor(aiCooldown / 60)}:{String(aiCooldown % 60).padStart(2, '0')}</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-1" /> {aiInsight ? 'Refresh' : 'Analyze My Journey'}</>
            )}
          </Button>
        </div>

        {analyses.length === 0 && (
          <p className="text-gray-500 text-sm">Complete at least one skin analysis to unlock AI progress insights.</p>
        )}

        {aiInsight && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  aiInsight.trend === 'improving' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                  aiInsight.trend === 'stable' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                }`}>
                  {aiInsight.trend === 'improving' ? '📈 Improving' : aiInsight.trend === 'stable' ? '📊 Stable' : '⚠️ Needs Attention'}
                </div>
                <span className="font-bold text-xl">{aiInsight.headline}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{aiInsight.progress_summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-600 mb-1">🏆 Biggest Win</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{aiInsight.biggest_win}</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-xs font-semibold text-amber-600 mb-1">🎯 Focus Area</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{aiInsight.focus_area}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs font-semibold text-blue-600 mb-1">📅 Next 30 Days</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{aiInsight.next_30_days}</p>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                  <p className="text-xs font-semibold text-pink-600 mb-1">💪 Motivation</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{aiInsight.motivation_message}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </GlassCard>

      {/* Progress Chart */}
      {chartData.length > 1 && (
        <GlassCard>
          <h3 className="text-xl font-semibold mb-4">Skin Score Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#f472b6" strokeWidth={3} dot={{ fill: '#f472b6', strokeWidth: 2, r: 5 }} activeDot={{ r: 8, fill: '#ec4899' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Before/After Comparison */}
      {progressPhotos.length >= 2 && (
        <GlassCard>
          <h3 className="text-xl font-semibold mb-4">Before & After</h3>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCompareIndex(Math.max(0, compareIndex - 1))} disabled={compareIndex === 0}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm text-gray-500">Comparing Week 1 to Week {compareIndex + 2}</span>
            <Button variant="ghost" size="icon" onClick={() => setCompareIndex(Math.min(progressPhotos.length - 2, compareIndex + 1))} disabled={compareIndex >= progressPhotos.length - 2}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Before (Week 1)</p>
              <img src={progressPhotos[progressPhotos.length - 1]?.photo_url} alt="Before" className="w-full h-48 md:h-64 object-cover rounded-xl" />
              <p className="mt-2 font-medium">Score: {progressPhotos[progressPhotos.length - 1]?.skin_score}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">After (Week {compareIndex + 2})</p>
              <img src={progressPhotos[progressPhotos.length - 2 - compareIndex]?.photo_url} alt="After" className="w-full h-48 md:h-64 object-cover rounded-xl" />
              <p className="mt-2 font-medium">Score: {progressPhotos[progressPhotos.length - 2 - compareIndex]?.skin_score}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setShowUpload(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4">Add Progress Photo</h3>
              <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={handleFileSelect} className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-pink-400 transition-colors mb-4"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Tap to take photo or upload</p>
                  </>
                )}
              </div>
              <Textarea
                placeholder="Add notes about your skin this week..."
                value={uploadData.notes}
                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowUpload(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={() => uploadMutation.mutate(uploadData)}
                  disabled={!uploadData.photo || uploadMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500"
                >
                  {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Progress'}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Progress Photos Grid */}
      {progressPhotos.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">All Progress Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {progressPhotos.map((photo, i) => (
              <motion.div key={photo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="p-3">
                  <img src={photo.photo_url} alt={`Week ${photo.week_number}`} className="w-full h-32 object-cover rounded-lg mb-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Week {photo.week_number}</span>
                    <span className="text-sm text-pink-500 font-semibold">{photo.skin_score}</span>
                  </div>
                  <p className="text-xs text-gray-500">{format(new Date(photo.created_date), 'MMM d, yyyy')}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {progressPhotos.length === 0 && !isLoading && (
        <GlassCard className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start Your Journey</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Take weekly photos to track your skin transformation</p>
          <Button onClick={() => setShowUpload(true)} className="bg-gradient-to-r from-pink-500 to-amber-500">
            <Camera className="w-4 h-4 mr-2" />Add First Photo
          </Button>
        </GlassCard>
      )}
    </div>
  );
}