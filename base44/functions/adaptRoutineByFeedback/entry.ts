import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Closed-loop routine adaptation based on daily feedback.
 * Triggered by SkinFeedback creation → analyzes signals → adapts SkinRoutine.
 * Feedback codes: 1=Comfortable, 2=Glowing, 3=Slight dryness, 4=Very dry/flaky,
 *                 5=Mild irritation, 6=Burning/stinging, 7=Oily, 8=No change,
 *                 9=New pimples, 10=Acne worsening
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const feedbackId = body.event?.entity_id;
    const feedbackData = body.data;

    if (!feedbackId || !feedbackData) {
      return Response.json({ error: 'Missing feedback data' }, { status: 400 });
    }

    // Fetch latest routine and feedback history
    const [routine, feedbackHistory] = await Promise.all([
      base44.entities.SkinRoutine.filter({ user_email: user.email }, '-created_date', 1)
        .then(r => r[0] || null),
      base44.entities.SkinFeedback.filter({ user_email: user.email }, '-date', 7),
    ]);

    if (!routine) {
      return Response.json({ message: 'No routine to adapt yet' });
    }

    // Analyze feedback signals
    const currentCodes = feedbackData.feedback_codes || [];
    const allCodes = [
      ...currentCodes,
      ...feedbackHistory.flatMap(f => f.feedback_codes || []),
    ];

    const positiveCount = allCodes.filter(c => [1, 2].includes(c)).length;
    const damageCount = allCodes.filter(c => [4, 6].includes(c)).length;
    const breakoutCount = allCodes.filter(c => [9, 10].includes(c)).length;
    const oilCount = allCodes.filter(c => c === 7).length;

    // Determine adaptation action
    let adaptation = null;
    if (damageCount >= 2) {
      adaptation = {
        type: 'EMERGENCY_RECOVERY',
        action: 'Pause all actives, focus on barrier repair (cleanser + moisturizer only)',
        reason: 'Damage signals detected - skin needs recovery',
      };
    } else if (breakoutCount >= 2) {
      adaptation = {
        type: 'INCREASE_BHA',
        action: 'Add BHA treatment 1-2x/week',
        reason: 'Breakout signals detected - acne-fighting mode',
      };
    } else if (oilCount >= 2) {
      adaptation = {
        type: 'INCREASE_OIL_CONTROL',
        action: 'Add oil-control (BHA or salicylic) 2x/week',
        reason: 'Excess oil detected',
      };
    } else if (positiveCount >= 3) {
      adaptation = {
        type: 'MAINTAIN_PROGRESSIVE',
        action: 'Continue current routine, consider graduated active increase',
        reason: 'Consistent positive feedback - routine is working',
      };
    }

    // Update routine with adaptation note
    if (adaptation) {
      await base44.entities.SkinRoutine.update(routine.id, {
        notes: `[${new Date().toLocaleDateString()}] Adapted: ${adaptation.reason}. Action: ${adaptation.action}`,
        priority_note: adaptation.action,
      });
    }

    return Response.json({
      feedback_id: feedbackId,
      adaptation: adaptation,
      feedback_metrics: {
        positive_days: positiveCount,
        damage_signals: damageCount,
        breakout_signals: breakoutCount,
        oil_signals: oilCount,
      },
      routine_updated: !!adaptation,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});