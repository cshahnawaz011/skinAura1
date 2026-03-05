import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText, Download, Loader2, Sparkles, Star, TrendingUp,
  Calendar, User, Activity, Droplets, Moon, Sun, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import CircularProgress from '@/components/ui/CircularProgress';

const SKIN_METRICS = [
  { key: 'acne_level', label: 'Acne', color: '#ef4444' },
  { key: 'dark_spots', label: 'Dark Spots', color: '#f97316' },
  { key: 'wrinkles', label: 'Wrinkles', color: '#a855f7' },
  { key: 'pores', label: 'Pores', color: '#3b82f6' },
  { key: 'redness', label: 'Redness', color: '#ec4899' },
  { key: 'oiliness', label: 'Oiliness', color: '#eab308' },
  { key: 'dryness', label: 'Dryness', color: '#06b6d4' },
  { key: 'sensitivity', label: 'Sensitivity', color: '#8b5cf6' },
];

export default function SkinReport() {
  const [user, setUser] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 10),
    enabled: !!user?.email,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['recentLogs', user?.email],
    queryFn: () => base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 30),
    enabled: !!user?.email,
  });

  const { data: routines = [] } = useQuery({
    queryKey: ['routines', user?.email],
    queryFn: () => base44.entities.SkinRoutine.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const latestAnalysis = analyses[0];
  const firstAnalysis = analyses[analyses.length - 1];
  const improvement = latestAnalysis && firstAnalysis && analyses.length > 1
    ? (latestAnalysis.overall_score - firstAnalysis.overall_score).toFixed(1)
    : null;

  const avgWater = logs.length > 0 ? (logs.reduce((s, l) => s + (l.water_glasses || 0), 0) / logs.length).toFixed(1) : 0;
  const avgSleep = logs.length > 0 ? (logs.reduce((s, l) => s + (l.sleep_hours || 0), 0) / logs.length).toFixed(1) : 0;
  const avgExercise = logs.length > 0 ? (logs.reduce((s, l) => s + (l.exercise_minutes || 0), 0) / logs.length).toFixed(0) : 0;

  const generateInsights = async () => {
    if (!latestAnalysis) return;
    setGenerating(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `As a dermatologist, write a comprehensive skin health report summary for:
- Overall score: ${latestAnalysis.overall_score}/100
- Skin type: ${latestAnalysis.skin_type}
- Skin tone: ${latestAnalysis.skin_tone}
- Acne: ${latestAnalysis.acne_level}/10
- Dark spots: ${latestAnalysis.dark_spots}/10
- Wrinkles: ${latestAnalysis.wrinkles}/10
- Oiliness: ${latestAnalysis.oiliness}/10
- Dryness: ${latestAnalysis.dryness}/10
- Sensitivity: ${latestAnalysis.sensitivity}/10
- Progress: ${improvement !== null ? `${improvement > 0 ? '+' : ''}${improvement} points vs first analysis` : 'First analysis'}
- Avg daily water: ${avgWater} glasses
- Avg sleep: ${avgSleep} hours
- Avg exercise: ${avgExercise} min/day
- Active routines: ${routines.length}

Write a professional clinical summary, key findings, 90-day action plan, and dietary recommendations.`,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          key_strengths: { type: "array", items: { type: "string" } },
          priority_concerns: { type: "array", items: { type: "string" } },
          action_plan_30: { type: "string" },
          action_plan_60: { type: "string" },
          action_plan_90: { type: "string" },
          dietary_recommendations: { type: "array", items: { type: "string" } },
          lifestyle_recommendations: { type: "array", items: { type: "string" } },
          product_categories_needed: { type: "array", items: { type: "string" } },
          expected_improvement: { type: "string" },
          doctor_note: { type: "string" },
        }
      }
    });

    setAiInsights(result);
    setGenerating(false);
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');

    const element = reportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`GlowAI_Skin_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const scoreColor = (score) => {
    if (score >= 75) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const metricColor = (val) => {
    if (val <= 3) return 'bg-emerald-500';
    if (val <= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-pink-500" />
            Skin Health Report
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Comprehensive analysis & PDF export</p>
        </div>
        <div className="flex gap-2">
          {!aiInsights && (
            <Button
              onClick={generateInsights}
              disabled={generating || !latestAnalysis}
              className="bg-gradient-to-r from-pink-500 to-amber-500"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate Report</>
              )}
            </Button>
          )}
          {aiInsights && (
            <Button onClick={downloadPDF} className="bg-gradient-to-r from-emerald-500 to-teal-500">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {!latestAnalysis ? (
        <GlassCard className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Analysis Found</h3>
          <p className="text-gray-500">Complete a skin analysis first to generate your report</p>
        </GlassCard>
      ) : (
        <div ref={reportRef} className="space-y-6 bg-white dark:bg-gray-900 p-4 rounded-2xl">
          {/* Report Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-500 to-amber-500 rounded-2xl text-white">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80">GlowAI</p>
              <h2 className="text-2xl font-bold">Skin Health Report</h2>
              <p className="text-sm opacity-80">{user?.full_name || user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Generated</p>
              <p className="font-semibold">{new Date().toLocaleDateString()}</p>
              <p className="text-xs opacity-80 mt-1">{analyses.length} analyses • {logs.length} lifestyle logs</p>
            </div>
          </div>

          {/* Overall Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="text-center">
              <CircularProgress
                value={latestAnalysis.overall_score}
                size={120}
                strokeWidth={10}
                label="Overall"
                color="pink"
              />
              <p className="text-sm font-medium mt-2 capitalize">{latestAnalysis.skin_type} Skin</p>
            </GlassCard>
            <GlassCard className="col-span-2">
              <h3 className="font-semibold mb-3">Skin Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                {SKIN_METRICS.map(m => (
                  <div key={m.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{m.label}</span>
                      <span className="font-medium">{latestAnalysis[m.key] ?? 0}/10</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${metricColor(latestAnalysis[m.key] ?? 0)}`}
                        style={{ width: `${(latestAnalysis[m.key] ?? 0) * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Progress */}
          {improvement !== null && (
            <GlassCard>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Progress Over Time
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-400">{firstAnalysis.overall_score}</p>
                  <p className="text-xs text-gray-400">Starting Score</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${Number(improvement) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {improvement > 0 ? '+' : ''}{improvement}
                  </p>
                  <p className="text-xs text-gray-400">Improvement</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${scoreColor(latestAnalysis.overall_score)}`}>{latestAnalysis.overall_score}</p>
                  <p className="text-xs text-gray-400">Current Score</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Lifestyle Stats */}
          <div className="grid grid-cols-3 gap-4">
            <GlassCard className="text-center">
              <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{avgWater}</p>
              <p className="text-xs text-gray-400">Avg Water/day</p>
            </GlassCard>
            <GlassCard className="text-center">
              <Moon className="w-6 h-6 text-violet-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{avgSleep}</p>
              <p className="text-xs text-gray-400">Avg Sleep (hrs)</p>
            </GlassCard>
            <GlassCard className="text-center">
              <Activity className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{avgExercise}</p>
              <p className="text-xs text-gray-400">Avg Exercise (min)</p>
            </GlassCard>
          </div>

          {/* AI Insights */}
          {aiInsights && (
            <div className="space-y-4">
              <GlassCard>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Executive Summary
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{aiInsights.executive_summary}</p>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard>
                  <h3 className="font-semibold mb-3 text-emerald-600">✅ Key Strengths</h3>
                  <ul className="space-y-2">
                    {aiInsights.key_strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
                <GlassCard>
                  <h3 className="font-semibold mb-3 text-red-500">⚠️ Priority Concerns</h3>
                  <ul className="space-y-2">
                    {aiInsights.priority_concerns?.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-400 flex-shrink-0">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>

              <GlassCard>
                <h3 className="font-semibold mb-4">📅 90-Day Action Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Days 1–30', content: aiInsights.action_plan_30, color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200' },
                    { label: 'Days 31–60', content: aiInsights.action_plan_60, color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200' },
                    { label: 'Days 61–90', content: aiInsights.action_plan_90, color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' },
                  ].map(({ label, content, color }) => (
                    <div key={label} className={`p-4 rounded-xl border ${color}`}>
                      <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{content}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard>
                  <h3 className="font-semibold mb-3">🥗 Dietary Recommendations</h3>
                  <ul className="space-y-2">
                    {aiInsights.dietary_recommendations?.map((r, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-amber-400">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
                <GlassCard>
                  <h3 className="font-semibold mb-3">🧘 Lifestyle Recommendations</h3>
                  <ul className="space-y-2">
                    {aiInsights.lifestyle_recommendations?.map((r, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-blue-400">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>

              <GlassCard className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Dermatologist Note
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">{aiInsights.doctor_note}</p>
                <p className="text-xs text-gray-400 mt-2">Expected: {aiInsights.expected_improvement}</p>
              </GlassCard>

              <div className="text-center text-xs text-gray-400 pt-2">
                Generated by GlowAI on {new Date().toLocaleDateString()} • For reference only, not medical advice
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}