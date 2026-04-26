import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered by SkinFeedback or SkinAnalysis updates.
 * Recalculates 8-week skin score forecast and updates Progress tracking.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all analyses to calculate trend
    const analyses = await base44.entities.SkinAnalysis.filter({
      user_email: user.email,
    }, '-created_date', 12);

    if (analyses.length < 1) {
      return Response.json({ message: 'Not enough data for forecast' });
    }

    // Calculate trend
    const scores = analyses.map(a => a.overall_score);
    const trend = analyses.length > 1
      ? (scores[0] - scores[scores.length - 1]) / (analyses.length - 1)
      : 1.5;

    const currentScore = scores[0];
    const startScore = scores[scores.length - 1];

    // Forecast 8 weeks (56 days, ~8 analyses)
    const forecastScore = Math.min(100, Math.max(0, Math.round(currentScore + (trend * 8))));
    const weeksToGoal = trend > 0 
      ? Math.ceil((100 - currentScore) / trend)
      : trend < 0 
      ? Math.ceil((0 - currentScore) / trend)
      : 999;

    return Response.json({
      current_score: currentScore,
      start_score: startScore,
      trend: trend.toFixed(2),
      forecast_8w: forecastScore,
      weeks_to_100: Math.max(0, weeksToGoal),
      analyses_count: analyses.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});