import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, X, Loader2, Sparkles, ChevronRight,
  AlertCircle, Check, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';
import Confetti from '@/components/ui/Confetti';
import { format } from 'date-fns';

const skinConcerns = [
  { key: 'acne_level', label: 'Acne', color: 'pink' },
  { key: 'dark_spots', label: 'Dark Spots', color: 'gold' },
  { key: 'wrinkles', label: 'Wrinkles', color: 'mint' },
  { key: 'pores', label: 'Pores', color: 'blue' },
  { key: 'redness', label: 'Redness', color: 'red' },
  { key: 'oiliness', label: 'Oiliness', color: 'gold' },
  { key: 'dryness', label: 'Dryness', color: 'blue' },
  { key: 'sensitivity', label: 'Sensitivity', color: 'pink' },
];

export default function SkinAnalysis() {
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pastAnalyses = [] } = useQuery({
    queryKey: ['skinAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter(
      { user_email: user.email },
      '-created_date',
      10
    ),
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
    
    setAnalyzing(true);
    
    // Upload image
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: selectedImage
    });

    // Analyze with AI
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this selfie photo for skin health assessment. Provide a detailed analysis including:
      
1. Overall skin health score (0-100)
2. Skin type (oily, dry, combination, normal, or sensitive)
3. Skin tone description
4. Rate each concern from 0-10 (0 being no issue, 10 being severe):
   - Acne level
   - Dark spots/hyperpigmentation
   - Wrinkles/fine lines
   - Pore visibility
   - Redness/inflammation
   - Oiliness
   - Dryness
   - Sensitivity indicators

5. Top 3-5 personalized recommendations

Be realistic and accurate. If the image is not a clear face photo, indicate that in your response.`,
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
          recommendations: { type: "array", items: { type: "string" } },
          is_valid_face_photo: { type: "boolean" }
        }
      }
    });

    setAnalysisResult({ ...result, photo_url: file_url });
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

  const getConcernLevel = (value) => {
    if (value <= 3) return { label: 'Low', color: 'text-emerald-500' };
    if (value <= 6) return { label: 'Moderate', color: 'text-amber-500' };
    return { label: 'High', color: 'text-red-500' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Confetti trigger={showConfetti} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Skin Analysis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Upload a clear selfie for detailed skin assessment
          </p>
        </div>
        {user && pastAnalyses.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            History
          </Button>
        )}
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard>
              <h3 className="font-semibold mb-4">Past Analyses</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {pastAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={analysis.photo_url}
                        alt="Analysis"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">Score: {analysis.overall_score}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(analysis.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-full text-sm capitalize">
                      {analysis.skin_type}
                    </span>
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
              previewUrl
                ? 'border-pink-300 bg-pink-50/50 dark:bg-pink-900/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-pink-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 rounded-xl shadow-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(null);
                    setSelectedImage(null);
                  }}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Take a clear, well-lit photo of your face
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" /> Good lighting
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" /> No makeup
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" /> Front facing
                  </span>
                </div>
              </div>
            )}
          </div>

          {previewUrl && (
            <Button
              onClick={analyzeImage}
              disabled={analyzing}
              className="w-full mt-4 bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 py-6"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Your Skin...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze My Skin
                </>
              )}
            </Button>
          )}
        </GlassCard>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <GlassCard>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img
                  src={previewUrl}
                  alt="Analyzed"
                  className="w-32 h-32 rounded-2xl object-cover shadow-lg"
                />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">Your Skin Score</h2>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <CircularProgress
                      value={analysisResult.overall_score}
                      size={100}
                      strokeWidth={10}
                      color={analysisResult.overall_score >= 70 ? 'mint' : analysisResult.overall_score >= 50 ? 'gold' : 'pink'}
                    />
                    <div>
                      <p className="text-lg">
                        Skin Type: <span className="font-semibold capitalize">{analysisResult.skin_type}</span>
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Tone: {analysisResult.skin_tone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Detailed Analysis */}
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4">Detailed Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {skinConcerns.map((concern) => {
                  const value = analysisResult[concern.key] || 0;
                  const level = getConcernLevel(value);
                  return (
                    <div key={concern.key} className="p-4 bg-white/50 dark:bg-white/5 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{concern.label}</span>
                        <span className={`text-sm font-semibold ${level.color}`}>
                          {value}/10
                        </span>
                      </div>
                      <Progress value={value * 10} className="h-2" />
                      <p className={`text-xs mt-1 ${level.color}`}>{level.label}</p>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Recommendations */}
            <GlassCard>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Personalized Recommendations
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
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysisResult(null);
                  setPreviewUrl(null);
                  setSelectedImage(null);
                }}
                className="flex-1"
              >
                New Analysis
              </Button>
              {user && (
                <Button
                  onClick={saveAnalysis}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveMutation.isSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    'Save Analysis'
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Prompt */}
      {!user && (
        <GlassCard className="text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sign in to save your analysis and track progress over time
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-pink-500 to-amber-500"
          >
            Sign In
          </Button>
        </GlassCard>
      )}
    </div>
  );
}