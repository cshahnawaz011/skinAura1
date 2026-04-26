import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered by DailyGlowMetrics updates.
 * Tracks 21-day challenge progress: increments completed_days, awards badges, updates points.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const metricsData = body.data;
    const logDate = metricsData.date;

    if (!logDate) {
      return Response.json({ error: 'Missing date' }, { status: 400 });
    }

    // Fetch active challenges
    const challenges = await base44.entities.SkinChallenge.filter({
      user_email: user.email,
      status: 'active',
    });

    if (challenges.length === 0) {
      return Response.json({ message: 'No active challenges' });
    }

    const glowScore = metricsData.glow_score || 0;
    const updates = [];

    for (const challenge of challenges) {
      const completedDays = challenge.completed_days || [];
      const dayNumber = Math.ceil((Date.now() - new Date(challenge.start_date).getTime()) / (1000 * 60 * 60 * 24));

      // Mark day as completed if glow score >= 50
      if (glowScore >= 50 && !completedDays.includes(dayNumber)) {
        completedDays.push(dayNumber);
      }

      // Award badges based on milestones
      const badges = challenge.badges || [];
      if (completedDays.length === 7 && !badges.includes('Week Warrior')) badges.push('Week Warrior');
      if (completedDays.length === 14 && !badges.includes('Halfway Hero')) badges.push('Halfway Hero');
      if (completedDays.length === 21 && !badges.includes('Challenge Master')) badges.push('Challenge Master');

      // Calculate points (10 per completed day, 50 per badge)
      const totalPoints = (completedDays.length * 10) + (badges.length * 50);

      const status = completedDays.length >= 21 ? 'completed' : 'active';

      await base44.entities.SkinChallenge.update(challenge.id, {
        completed_days: completedDays,
        total_points: totalPoints,
        badges,
        status,
      });

      updates.push({
        challenge_id: challenge.id,
        days_completed: completedDays.length,
        badges,
        points: totalPoints,
        status,
      });
    }

    return Response.json({
      challenges_updated: updates.length,
      updates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});