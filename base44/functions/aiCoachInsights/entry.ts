import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * AI Coach with LONG-CHAIN intelligence.
 * Fetches complete user profile context and provides personalized, adaptive advice.
 * Considers: skin data, routine adherence, lifestyle, feedback trends, and goals.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get complete profile via orchestration function
    const profileRes = await base44.asServiceRole.functions.invoke('orchestrateUserProfile', {});
    const profile = profileRes;

    // Build comprehensive context prompt
    const buildCoachContext = () => {
      const parts = [];
      
      if (profile.skin?.latest) {
        const s = profile.skin.latest;
        parts.push(`SKIN PROFILE: Type=${s.skin_type}, Score=${s.overall_score}/100, Acne=${s.acne_level}/10, Dryness=${s.dryness}/10, Oiliness=${s.oiliness}/10, Sensitivity=${s.sensitivity}/10, Dark Spots=${s.dark_spots}/10.`);
        if (profile.skin.trend_pts) parts.push(`PROGRESS: Skin score ${profile.skin.trend_pts > 0 ? '+' : ''}${profile.skin.trend_pts} pts trend from ${profile.skin.analyses_count} analyses.`);
      }

      if (profile.routine) {
        parts.push(`ROUTINE: Has ${profile.routine.routine_type} routine for ${profile.routine.skin_type} skin. ${profile.routine.skin_concerns?.length || 0} concerns addressed.`);
      }

      if (profile.feedback?.recent_14d?.length) {
        parts.push(`FEEDBACK SIGNALS (14d): ${profile.feedback.positive_days} positive days. Signals: ${profile.feedback.signals.join(', ') || 'neutral'}.`);
      }

      if (profile.diet?.averages) {
        const d = profile.diet.averages;
        parts.push(`LIFESTYLE (7d avg): Water=${d.water}g/day, Sleep=${d.sleep}h/night, Stress=${d.stress}/5. Good foods: ${d.foods_good.slice(0,3).join(', ') || 'none'}. Bad foods: ${d.foods_bad.slice(0,3).join(', ') || 'none'}.`);
      }

      if (profile.glow?.goals?.length) {
        parts.push(`ACTIVE GOALS: ${profile.glow.goals.map(g => g.title).join(', ')}.`);
      }

      if (profile.cycle) {
        parts.push(`CYCLE PHASE: ${profile.cycle.current_phase || 'unknown'} phase.`);
      }

      return parts.join(' ');
    };

    const contextString = buildCoachContext();

    // Invoke AI with full context
    const aiResult = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt: `You are SkinAura's AI Coach—a personalized skin wellness advisor with access to this user's complete profile:\n\n${contextString}\n\nProvide 3-4 specific, actionable recommendations that:\n1. Address their TOP skin concern (prioritize)\n2. Align with their current lifestyle (sleep, water, stress)\n3. Respect their routine (don't overwhelm)\n4. Build on positive feedback trends\n5. Connect to their active goals\n\nFormat as JSON with: recommendations (array of {title, why, action, expected_result}), barrier_status (health check), next_milestone (what to track), and adaptive_note (how this changes if X happens).`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                why: { type: 'string' },
                action: { type: 'string' },
                expected_result: { type: 'string' },
              },
            },
          },
          barrier_status: { type: 'string' },
          next_milestone: { type: 'string' },
          adaptive_note: { type: 'string' },
        },
      },
    });

    // Save coach insights to user's data (optional: create a CoachInsights entity if desired)
    return Response.json({
      ai_coach_insights: aiResult,
      context_summary: {
        skin_score: profile.skin?.latest?.overall_score,
        positive_feedback_streak: profile.feedback?.positive_days,
        routine_active: !!profile.routine,
        goals_active: profile.glow?.goals?.length || 0,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});