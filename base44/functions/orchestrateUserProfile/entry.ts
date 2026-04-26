import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Aggregates ALL user data into a unified context object.
 * Used by other orchestration functions to provide complete context to AI.
 * Returns: { skinAnalysis, routine, feedback, diet, glowMetrics, progress, goals, cycle }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch latest data from all sources
    const [
      latestAnalysis,
      savedRoutine,
      recentFeedback,
      dietLogs,
      todayMetric,
      allAnalyses,
      glowGoals,
      cycleData
    ] = await Promise.all([
      // Latest skin analysis
      base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1)
        .then(r => r[0] || null),
      // Latest routine
      base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1)
        .then(r => r[0] || null),
      // Last 14 days feedback
      base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 14),
      // Last 7 days diet logs
      base44.entities.DietLog.filter({ user_email: user.email }, '-log_date', 7),
      // Today's glow metric
      base44.entities.DailyGlowMetrics.filter(
        { user_email: user.email, date: new Date().toISOString().split('T')[0] }
      ).then(r => r[0] || null),
      // All analyses for trend
      base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 10),
      // Active glow goals
      base44.entities.GlowGoals.filter({ user_email: user.email }, '-created_date'),
      // Current cycle data
      base44.entities.CycleData.filter({ user_email: user.email }, '-created_date', 1)
        .then(r => r[0] || null)
    ]);

    // Calculate averages and trends
    const avgDiet = dietLogs.length > 0 ? {
      water: (dietLogs.reduce((s, d) => s + (d.water_glasses || 0), 0) / dietLogs.length).toFixed(1),
      sleep: (dietLogs.reduce((s, d) => s + (d.sleep_hours || 0), 0) / dietLogs.length).toFixed(1),
      stress: (dietLogs.reduce((s, d) => s + (d.stress_level || 3), 0) / dietLogs.length).toFixed(1),
      foods_good: [...new Set(dietLogs.flatMap(d => d.foods_good || []))],
      foods_bad: [...new Set(dietLogs.flatMap(d => d.foods_bad || []))],
    } : null;

    const feedbackSignals = recentFeedback.flatMap(f => f.feedback_codes || []);
    const positiveCount = recentFeedback.filter(f => 
      (f.feedback_codes || []).some(c => [1, 2].includes(c))
    ).length;

    const skinTrend = allAnalyses.length >= 2 
      ? allAnalyses[allAnalyses.length - 1].overall_score - allAnalyses[0].overall_score
      : 0;

    return Response.json({
      user_email: user.email,
      user_name: user.full_name,
      timestamp: new Date().toISOString(),
      skin: {
        latest: latestAnalysis,
        trend_pts: skinTrend,
        analyses_count: allAnalyses.length,
      },
      routine: savedRoutine,
      feedback: {
        recent_14d: recentFeedback,
        positive_days: positiveCount,
        signals: feedbackSignals,
      },
      diet: {
        logs_7d: dietLogs,
        averages: avgDiet,
      },
      glow: {
        today: todayMetric,
        goals: glowGoals.filter(g => g.status === 'active' || !g.status),
      },
      cycle: cycleData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});