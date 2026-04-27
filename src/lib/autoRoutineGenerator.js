/**
 * Auto-generates a skin routine after analysis completes.
 * Stores the auto-generation timestamp in localStorage.
 */

const AUTO_ROUTINE_KEY = 'skinaura-auto-routine-ts';

export function getLastAutoRoutineTime() {
  return parseInt(localStorage.getItem(AUTO_ROUTINE_KEY) || '0', 10);
}

export function setLastAutoRoutineTime() {
  localStorage.setItem(AUTO_ROUTINE_KEY, Date.now().toString());
}

export function shouldAutoGenerateRoutine() {
  const last = getLastAutoRoutineTime();
  if (!last) return true;
  // Re-generate if last auto-gen was > 3 days ago
  const diffMs = Date.now() - last;
  return diffMs > 3 * 24 * 60 * 60 * 1000;
}

export function buildRoutinePromptFromAnalysis(analysis, feedbackHistory = [], userLevel = {}) {
  const today = new Date().toISOString().split('T')[0];
  const computedLevel = userLevel.currentLevel || 'Level 1';
  const frequencyLabel = userLevel.frequencyLabel || '1–2x / week';

  const skinProfile = analysis
    ? `Skin type: ${analysis.skin_type}, Overall score: ${analysis.overall_score}/100,
Acne: ${analysis.acne_level}/10, Dryness: ${analysis.dryness}/10, Oiliness: ${analysis.oiliness}/10,
Sensitivity: ${analysis.sensitivity}/10, Dark spots: ${analysis.dark_spots}/10,
Redness: ${analysis.redness}/10, Wrinkles: ${analysis.wrinkles}/10.
Priority concerns: ${(analysis.priority_concerns || []).join(', ') || 'none'}.`
    : 'No skin analysis — assume balanced/normal skin, use gentle defaults.';

  return `You are an advanced AI dermatologist. Generate a minimal, safe, barrier-first skincare routine.

TODAY: ${today}
USER LEVEL: ${computedLevel} → ${frequencyLabel}
AUTO-GENERATED after fresh skin analysis.

=== SKIN PROFILE ===
${skinProfile}

=== RULES ===
- Max 5 steps morning, max 3 steps night
- Rotate ONE active per night
- Start at Level 1 frequency if no feedback history
- Prioritize barrier health

Return JSON:
{
  "skin_summary": { "skin_type": "string", "concerns": ["string"], "sensitivity_level": "low|medium|high", "current_barrier_status": "string" },
  "morning_routine": [{ "step": 1, "name": "string", "product_type": "string", "tip": "string", "key_ingredients": ["string"] }],
  "night_week_plan": [{ "day_label": "Monday", "day_type": "treatment|recovery|hydration", "active_name": "string or null", "concentration_level": "Level 1 or null", "steps": [{ "name": "string", "active": true, "tip": "string" }] }],
  "weekly_addons": [{ "name": "string", "frequency": "string", "tip": "string" }],
  "todays_adjustment": { "changed": false, "summary": "Fresh routine generated from new skin analysis", "reason": "string" },
  "safety_notes": ["string"],
  "adaptive_guidance": { "if_improves": "string", "if_worsens": "string" },
  "recovery_mode_active": false
}`;
}