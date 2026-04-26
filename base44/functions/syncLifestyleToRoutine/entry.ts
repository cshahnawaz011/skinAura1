import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered by DietLog updates.
 * Detects lifestyle patterns (low sleep, high stress, poor diet) and suggests routine adjustments.
 * Adds notes to SkinRoutine about lifestyle-driven modifications.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const dietLogData = body.data;

    // Fetch routine
    const routine = await base44.entities.SkinRoutine.filter({
      user_email: user.email,
    }, '-created_date', 1).then(r => r[0] || null);

    if (!routine) {
      return Response.json({ message: 'No routine to sync' });
    }

    // Analyze lifestyle patterns
    const sleepHours = dietLogData.sleep_hours || 0;
    const stressLevel = dietLogData.stress_level || 3;
    const badFoods = (dietLogData.foods_bad || []).length;
    const coffee = dietLogData.coffee_cups || 0;

    let adaptations = [];

    if (sleepHours < 6) {
      adaptations.push('Low sleep detected - increase moisturizer, skip actives today');
    }
    if (stressLevel >= 4) {
      adaptations.push('High stress - focus on calming ingredients (chamomile, niacinamide)');
    }
    if (badFoods >= 3) {
      adaptations.push('Poor diet day - increase antioxidant serum, double-hydrate');
    }
    if (coffee >= 3) {
      adaptations.push('High caffeine - increase hydration, use hydrating serum');
    }

    if (adaptations.length > 0) {
      const existingNotes = routine.notes || '';
      const newNotes = `${existingNotes}\n[Lifestyle Sync ${new Date().toLocaleDateString()}]: ${adaptations.join(' | ')}`;

      await base44.entities.SkinRoutine.update(routine.id, {
        notes: newNotes.trim(),
      });
    }

    return Response.json({
      routine_id: routine.id,
      adaptations_suggested: adaptations.length,
      adaptations,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});