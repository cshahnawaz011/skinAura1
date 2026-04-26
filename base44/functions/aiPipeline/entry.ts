import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Central AI Pipeline Orchestrator
 * Manages: state consistency, conflict resolution, chained AI outputs
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { trigger_type, trigger_data } = payload;

    // ── Fetch Current User State (SSOT) ──────────────────────────────────
    const [latestAnalysis, dietLogs, routines, feedbacks, cycleData] = await Promise.all([
      base44.asServiceRole.entities.SkinAnalysis.filter(
        { user_email: user.email },
        '-created_date',
        1
      ),
      base44.asServiceRole.entities.DietLog.filter(
        { user_email: user.email },
        '-log_date',
        30
      ),
      base44.asServiceRole.entities.SkinRoutine.filter(
        { user_email: user.email },
        '-created_date',
        1
      ),
      base44.asServiceRole.entities.SkinFeedback.filter(
        { user_email: user.email },
        '-date',
        7
      ),
      base44.asServiceRole.entities.CycleData.filter(
        { user_email: user.email },
        '-created_date',
        1
      ),
    ]);

    const state = {
      user_email: user.email,
      skin_analysis: latestAnalysis?.[0] || null,
      diet_logs: dietLogs || [],
      routines: routines || [],
      feedbacks: feedbacks || [],
      cycle_data: cycleData?.[0] || null,
      trigger_type,
      trigger_data,
    };

    // ── Route to appropriate pipeline based on trigger ──────────────────
    let result = null;

    if (trigger_type === 'skin_analysis_complete') {
      result = await handleSkinAnalysisPipeline(base44, state);
    } else if (trigger_type === 'feedback_submitted') {
      result = await handleFeedbackPipeline(base44, state);
    } else if (trigger_type === 'diet_log_created') {
      result = await handleDietLogPipeline(base44, state);
    } else if (trigger_type === 'routine_adaptation') {
      result = await handleRoutineAdaptationPipeline(base44, state);
    } else {
      result = { error: 'Unknown trigger type' };
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Pipeline Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── PIPELINE 1: Skin Analysis Complete → Generate Routine ──────────────
async function handleSkinAnalysisPipeline(base44, state) {
  const { user_email, skin_analysis, feedbacks } = state;

  if (!skin_analysis) {
    return { error: 'No skin analysis found' };
  }

  // Build context from SSOT
  const context = buildSkinContext(skin_analysis, feedbacks);

  // Call AI to generate routine
  const routinePrompt = `You are a dermatologist AI. Based on this skin analysis, generate a personalized skincare routine.

SKIN PROFILE:
${JSON.stringify(context, null, 2)}

Return strict JSON:
{
  "routine_type": "morning|night|full",
  "steps": [...],
  "concerns_addressed": [...],
  "warnings": [...]
}`;

  const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: routinePrompt,
    response_json_schema: {
      type: 'object',
      properties: {
        routine_type: { type: 'string' },
        steps: { type: 'array' },
        concerns_addressed: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  // Conflict Resolution: Check against recent feedback
  const resolvedRoutine = resolveRoutineConflicts(aiResult, state);

  // Save to database
  await base44.asServiceRole.entities.SkinRoutine.create({
    user_email,
    routine_type: resolvedRoutine.routine_type,
    steps: resolvedRoutine.steps,
    skin_type: skin_analysis.skin_type,
    routine_summary: resolvedRoutine.concerns_addressed.join(', '),
    skin_concerns: resolvedRoutine.concerns_addressed,
  });

  return {
    pipeline: 'skin_analysis_routine',
    status: 'completed',
    routine: resolvedRoutine,
  };
}

// ── PIPELINE 2: Feedback Submitted → Adapt Routine ────────────────────
async function handleFeedbackPipeline(base44, state) {
  const { user_email, feedbacks, routines, skin_analysis } = state;

  if (!feedbacks.length || !routines.length) {
    return { error: 'Insufficient data for adaptation' };
  }

  // Analyze feedback trends
  const trends = analyzeFeedbackTrends(feedbacks);

  // Build adaptation prompt with context
  const adaptPrompt = `Based on skin feedback trends and current routine, suggest adaptations.

CURRENT STATE:
- Feedback Trend: ${trends.trend}
- Severity: ${trends.avg_severity}/10
- Current Routine Steps: ${routines[0]?.steps?.length || 0}

${skin_analysis ? `- Skin Type: ${skin_analysis.skin_type}` : ''}

Return JSON:
{
  "should_adapt": boolean,
  "reason": "string",
  "recommendations": [...]
}`;

  const adaptation = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: adaptPrompt,
    response_json_schema: {
      type: 'object',
      properties: {
        should_adapt: { type: 'boolean' },
        reason: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  if (adaptation.should_adapt && routines[0]?.id) {
    await base44.asServiceRole.entities.SkinRoutine.update(routines[0].id, {
      notes: `Adapted: ${adaptation.reason}. Recommendations: ${adaptation.recommendations.join(', ')}`,
    });
  }

  return {
    pipeline: 'feedback_adaptation',
    status: 'completed',
    adapted: adaptation.should_adapt,
  };
}

// ── PIPELINE 3: Diet Log Created → Update Lifestyle Insights ──────────
async function handleDietLogPipeline(base44, state) {
  const { user_email, diet_logs, cycle_data } = state;

  if (!diet_logs.length) return { error: 'No diet logs' };

  // Calculate nutrition trends
  const trends = {
    avg_water: diet_logs.reduce((s, l) => s + (l.water_glasses || 0), 0) / diet_logs.length,
    avg_sleep: diet_logs.reduce((s, l) => s + (l.sleep_hours || 0), 0) / diet_logs.length,
    avg_stress: diet_logs.reduce((s, l) => s + (l.stress_level || 0), 0) / diet_logs.length,
  };

  const insight = `User averages: ${trends.avg_water.toFixed(1)}g water, ${trends.avg_sleep.toFixed(1)}h sleep, ${trends.avg_stress.toFixed(1)}/10 stress.
${cycle_data ? `Cycle phase: ${cycle_data.current_phase}` : ''}

Generate skincare + lifestyle recommendations.`;

  const insights = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: insight,
    response_json_schema: {
      type: 'object',
      properties: {
        recommendations: { type: 'array', items: { type: 'string' } },
        priority_actions: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  return {
    pipeline: 'diet_lifestyle_insights',
    status: 'completed',
    insights,
  };
}

// ── PIPELINE 4: Routine Adaptation (Complex) ──────────────────────────
async function handleRoutineAdaptationPipeline(base44, state) {
  const { user_email, feedbacks, routines, skin_analysis } = state;

  // Multi-step: feedback → analysis → decision → update
  const feedback_summary = feedbacks.slice(0, 5).map(f => ({
    date: f.date,
    codes: f.feedback_codes,
  }));

  const decision_prompt = `
Feedback history: ${JSON.stringify(feedback_summary)}
Current routine quality: ${routines[0]?.routine_summary || 'unknown'}

Should routine be intensified, reduced, or maintained?
Return: { decision: 'intensify'|'reduce'|'maintain', reason: 'string' }`;

  const decision = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: decision_prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        decision: { type: 'string' },
        reason: { type: 'string' },
      },
    },
  });

  return {
    pipeline: 'routine_adaptation_complex',
    status: 'completed',
    decision,
  };
}

// ── HELPER: Build Skin Context (SSOT) ──────────────────────────────────
function buildSkinContext(analysis, feedbacks) {
  const recentFeedback = feedbacks.slice(0, 3);
  return {
    skin_type: analysis.skin_type,
    overall_score: analysis.overall_score,
    acne_level: analysis.acne_level,
    sensitivity: analysis.sensitivity,
    dryness: analysis.dryness,
    oiliness: analysis.oiliness,
    recent_feedback_count: recentFeedback.length,
    feedback_trend: recentFeedback.length > 0 ? 'improving' : 'unknown',
  };
}

// ── HELPER: Analyze Feedback Trends ────────────────────────────────────
function analyzeFeedbackTrends(feedbacks) {
  if (!feedbacks.length) return { trend: 'neutral', avg_severity: 0 };

  const codes = feedbacks.flatMap(f => f.feedback_codes || []);
  const severities = codes.map(c => {
    if ([4, 6].includes(c)) return 'high';
    if ([3, 5].includes(c)) return 'medium';
    return 'low';
  });

  const high_count = severities.filter(s => s === 'high').length;
  const trend = high_count > severities.length / 2 ? 'worsening' : 'stable';

  return {
    trend,
    avg_severity: (codes.reduce((a, b) => a + (b > 5 ? 1 : 0.5), 0) / codes.length) || 0,
  };
}

// ── HELPER: Conflict Resolution ────────────────────────────────────────
function resolveRoutineConflicts(aiRoutine, state) {
  const { feedbacks } = state;

  // If recent high damage feedback, override with recovery routine
  const hasHighDamage = feedbacks.some(f =>
    (f.feedback_codes || []).some(c => [4, 6].includes(c))
  );

  if (hasHighDamage) {
    return {
      ...aiRoutine,
      routine_type: 'recovery',
      warnings: [
        ...aiRoutine.warnings,
        'OVERRIDE: Recovery mode active due to recent skin damage feedback',
      ],
    };
  }

  return aiRoutine;
}