import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered by SkinAnalysis updates (skin score improved).
 * Automatically increments progress on skin score goals.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const analysisData = body.data;

    if (!analysisData?.overall_score) {
      return Response.json({ error: 'Missing skin score' }, { status: 400 });
    }

    // Fetch all previous analyses to calculate improvement
    const analyses = await base44.entities.SkinAnalysis.filter({
      user_email: user.email,
      id: { $ne: body.event?.entity_id },
    }, '-created_date', 5);

    const previousScore = analyses.length > 0 ? analyses[0].overall_score : analysisData.overall_score;
    const improvement = analysisData.overall_score - previousScore;

    // Fetch active goals
    const goals = await base44.entities.GlowGoals.filter({
      user_email: user.email,
      status: 'active',
    });

    const updates = [];

    for (const goal of goals) {
      let progressIncrement = 0;

      // Score-based goals
      if ((goal.goal || '').includes('80') || (goal.title || '').includes('80')) {
        progressIncrement = analysisData.overall_score >= 80 ? 50 : improvement > 0 ? 10 : 0;
      } else if ((goal.goal || '').includes('90') || (goal.title || '').includes('90')) {
        progressIncrement = analysisData.overall_score >= 90 ? 50 : improvement > 0 ? 10 : 0;
      } else if ((goal.goal || '').includes('clear') || (goal.title || '').includes('clear')) {
        // Acne-related goal
        progressIncrement = analysisData.acne_level <= 3 ? 20 : improvement > 0 ? 5 : 0;
      } else {
        // General improvement
        progressIncrement = improvement > 0 ? 5 : 0;
      }

      const newProgress = Math.min(100, (goal.progress || 0) + progressIncrement);
      const newStatus = newProgress >= 100 ? 'completed' : 'active';

      if (progressIncrement > 0 || newStatus !== goal.status) {
        await base44.entities.GlowGoals.update(goal.id, {
          progress: newProgress,
          status: newStatus,
        });

        updates.push({
          goal_id: goal.id,
          title: goal.title,
          progress: newProgress,
          status: newStatus,
          increment: progressIncrement,
        });
      }
    }

    return Response.json({
      skin_score: analysisData.overall_score,
      improvement: improvement,
      goals_updated: updates.length,
      updates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});