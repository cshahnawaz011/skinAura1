import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * When SkinRoutine is created/updated, sync it to daily metrics and goals.
 * Updates: DailyGlowMetrics (routine_active), GlowGoals (progress if routine-related)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const routineData = body.data;

    if (!routineData) {
      return Response.json({ error: 'Missing routine data' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Update today's metric to mark routine as active
    const existingMetric = await base44.entities.DailyGlowMetrics.filter({
      user_email: user.email,
      date: today,
    }).then(r => r[0] || null);

    if (existingMetric) {
      await base44.entities.DailyGlowMetrics.update(existingMetric.id, {
        tasks_done: Array.from(new Set([...(existingMetric.tasks_done || []), 'routine_active'])),
      });
    } else {
      await base44.entities.DailyGlowMetrics.create({
        user_email: user.email,
        date: today,
        glow_score: 50,
        tasks_done: ['routine_active'],
      });
    }

    // Find routine-related goals and update progress
    const goals = await base44.entities.GlowGoals.filter({ user_email: user.email });
    const routineGoals = goals.filter(g => 
      (g.goal || '').toLowerCase().includes('routine') || 
      (g.title || '').toLowerCase().includes('routine')
    );

    for (const goal of routineGoals) {
      if (goal.status === 'active') {
        const newProgress = Math.min(100, (goal.progress || 0) + 10);
        await base44.entities.GlowGoals.update(goal.id, {
          progress: newProgress,
          status: newProgress >= 100 ? 'completed' : 'active',
        });
      }
    }

    return Response.json({
      routine_synced: true,
      metric_updated: !!existingMetric,
      goals_updated: routineGoals.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});