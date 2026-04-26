import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { differenceInDays } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { user_email, cycle_id } = body;
    
    if (!user_email) {
      return Response.json({ error: 'user_email required' }, { status: 400 });
    }

    // Fetch the cycle data
    const cycles = await base44.asServiceRole.entities.CycleData.filter(
      { user_email },
      '-created_date',
      1
    );
    
    if (cycles.length === 0) {
      return Response.json({ error: 'No cycle data found' }, { status: 404 });
    }

    const cycle = cycles[0];
    const today = new Date().toISOString().split('T')[0];
    const daysInCycle = differenceInDays(new Date(), new Date(cycle.start_date)) % (cycle.cycle_length || 28);

    // Calculate current phase
    let currentPhase = 'follicular';
    if (daysInCycle <= 5) currentPhase = 'menstrual';
    else if (daysInCycle <= 12) currentPhase = 'follicular';
    else if (daysInCycle <= 15) currentPhase = 'ovulation';
    else currentPhase = 'luteal';

    // Auto-update cycle phase
    await base44.asServiceRole.entities.CycleData.update(cycle.id, {
      current_phase: currentPhase,
    });

    // Sync with today's diet log
    const dietLogs = await base44.asServiceRole.entities.DietLog.filter(
      { user_email, log_date: today },
      '-created_date',
      1
    );

    if (dietLogs.length > 0) {
      await base44.asServiceRole.entities.DietLog.update(dietLogs[0].id, {
        cycle_phase: currentPhase,
        cycle_notes: cycle.notes || '',
      });
    }

    // Sync with skin routines
    const routines = await base44.asServiceRole.entities.SkinRoutine.filter(
      { user_email },
      '-created_date',
      1
    );

    if (routines.length > 0) {
      // Mark routine as needing phase-aware adjustments
      const routineSteps = routines[0].steps || {};
      routineSteps.current_cycle_phase = currentPhase;
      routineSteps.cycle_day = daysInCycle + 1;

      await base44.asServiceRole.entities.SkinRoutine.update(routines[0].id, {
        steps: routineSteps,
      });
    }

    return Response.json({
      success: true,
      synced: {
        cyclePhase: currentPhase,
        cycleDay: daysInCycle + 1,
        user: user_email,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});