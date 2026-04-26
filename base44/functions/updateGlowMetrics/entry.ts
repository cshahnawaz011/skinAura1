import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered by DietLog creation/update.
 * Calculates glow score based on lifestyle inputs and updates DailyGlowMetrics.
 * Glow Score = water (0-20) + sleep (0-20) + skincare (0-20) + exercise (0-15) + diet (0-15) + mood (0-10)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const dietLogData = body.data;
    const logDate = dietLogData.log_date;

    if (!logDate) {
      return Response.json({ error: 'Missing log_date' }, { status: 400 });
    }

    // Calculate glow score
    let glowScore = 0;
    let tasksCompleted = [];

    // Water (target: 8+ glasses = 20 pts)
    const waterGlasses = dietLogData.water_glasses || 0;
    const waterScore = Math.min(20, Math.floor((waterGlasses / 8) * 20));
    glowScore += waterScore;
    if (waterGlasses >= 8) tasksCompleted.push('water');

    // Sleep (target: 7+ hours = 20 pts)
    const sleepHours = dietLogData.sleep_hours || 0;
    const sleepScore = Math.min(20, Math.floor((sleepHours / 7) * 20));
    glowScore += sleepScore;
    if (sleepHours >= 7) tasksCompleted.push('sleep');

    // Skincare adherence (morning + night = 20 pts)
    const morningDone = dietLogData.skincare_done_morning ? 10 : 0;
    const nightDone = dietLogData.skincare_done_night ? 10 : 0;
    glowScore += morningDone + nightDone;
    if (dietLogData.skincare_done_morning) tasksCompleted.push('morning_skincare');
    if (dietLogData.skincare_done_night) tasksCompleted.push('night_skincare');

    // Exercise (target: 30+ mins = 15 pts)
    const exerciseMins = dietLogData.exercise_minutes || 0;
    const exerciseScore = Math.min(15, Math.floor((exerciseMins / 30) * 15));
    glowScore += exerciseScore;
    if (exerciseMins >= 30) tasksCompleted.push('exercise');

    // Diet quality (good foods = 15 pts, bad foods = -5 pts)
    const goodFoods = (dietLogData.foods_good || []).length;
    const badFoods = (dietLogData.foods_bad || []).length;
    const dietScore = Math.min(15, Math.max(-5, (goodFoods * 3) - (badFoods * 5)));
    glowScore += dietScore;
    if (goodFoods >= 2) tasksCompleted.push('good_foods');

    // Mood/Stress (stress < 3 = positive, sunscreen = +5)
    const stress = dietLogData.stress_level || 3;
    const stressScore = stress <= 2 ? 5 : stress <= 3 ? 2 : 0;
    const sunscreenScore = dietLogData.sunscreen_applied ? 5 : 0;
    glowScore += stressScore + sunscreenScore;

    glowScore = Math.max(0, Math.min(100, glowScore));

    // Update or create DailyGlowMetrics
    const existingMetric = await base44.entities.DailyGlowMetrics.filter({
      user_email: user.email,
      date: logDate,
    }).then(r => r[0] || null);

    if (existingMetric) {
      await base44.entities.DailyGlowMetrics.update(existingMetric.id, {
        glow_score: glowScore,
        tasks_done: tasksCompleted,
      });
    } else {
      await base44.entities.DailyGlowMetrics.create({
        user_email: user.email,
        date: logDate,
        glow_score: glowScore,
        tasks_done: tasksCompleted,
        mood: dietLogData.mood || 'neutral',
      });
    }

    return Response.json({
      log_date: logDate,
      glow_score: glowScore,
      tasks_completed: tasksCompleted,
      breakdown: {
        water: waterScore,
        sleep: sleepScore,
        skincare: morningDone + nightDone,
        exercise: exerciseScore,
        diet: dietScore,
        stress_sunscreen: stressScore + sunscreenScore,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});