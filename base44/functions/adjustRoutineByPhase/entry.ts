import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { user_email, current_phase } = body;
    
    if (!user_email || !current_phase) {
      return Response.json({ error: 'user_email and current_phase required' }, { status: 400 });
    }

    // Get current routine
    const routines = await base44.asServiceRole.entities.SkinRoutine.filter(
      { user_email },
      '-created_date',
      1
    );

    if (routines.length === 0) {
      return Response.json({ success: true, message: 'No routine to adjust' });
    }

    const routine = routines[0];
    const steps = routine.steps || {};

    // Phase-specific adjustments
    const phaseAdjustments = {
      menstrual: {
        priority_note: '🛡️ MENSTRUAL PHASE: Barrier repair mode. Skip actives, focus on hydration and gentle cleansing.',
        safety_notes: [
          'Avoid all actives (retinol, AHA, BHA)',
          'Double moisturizer application',
          'Hydrating masks recommended',
          'Gentle cleansing only',
        ],
      },
      follicular: {
        priority_note: '✨ FOLLICULAR PHASE: Actives welcome! Skin can handle Vitamin C, light exfoliants.',
        safety_notes: [
          'Introduce Vitamin C serum',
          'Light BHA 1-2x/week',
          'Treatment serums effective',
          'Skin barrier strong',
        ],
      },
      ovulation: {
        priority_note: '⚡ OVULATION PHASE: Peak skin clarity! Can use stronger actives. Maintain hydration.',
        safety_notes: [
          'Retinol 2-3x/week optimal',
          'AHA/BHA compatible',
          'Strong treatment serums',
          'SPF 50+ essential',
        ],
      },
      luteal: {
        priority_note: '🌙 LUTEAL PHASE: Sensitive skin mode. Calming, hydrating ingredients. Skip strong actives.',
        safety_notes: [
          'Avoid all actives',
          'Calming serums (Niacinamide, Centella)',
          'Rich hydrating cream',
          'Soothing masks',
        ],
      },
    };

    const adjustment = phaseAdjustments[current_phase] || phaseAdjustments.follicular;

    // Update routine with phase information
    await base44.asServiceRole.entities.SkinRoutine.update(routine.id, {
      ...routine,
      steps: {
        ...steps,
        current_cycle_phase: current_phase,
        phase_adjustment: adjustment,
      },
      priority_note: adjustment.priority_note,
      safety_notes: adjustment.safety_notes,
    });

    return Response.json({
      success: true,
      adjusted: true,
      phase: current_phase,
      routineId: routine.id,
      adjustment: adjustment.priority_note,
    });
  } catch (error) {
    console.error('Error adjusting routine:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});