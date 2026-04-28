/**
 * Adaptive Routine Engine
 * Minimum-Effective-Dose philosophy: fixed low concentrations, only frequency adapts.
 * Phases: 1-Initialization, 2-Active Intro, 3-Frequency Progression, 4-Maintenance, 5-Recovery Override
 */

// Fixed concentrations — never increase
export const INGREDIENT_REGISTRY = {
  niacinamide:     { name: 'Niacinamide',      conc: '5%',   layer: 'support',  timing: 'AM+PM', category: 'support' },
  ceramides:       { name: 'Ceramides',         conc: '1%',   layer: 'support',  timing: 'AM+PM', category: 'support' },
  peptides:        { name: 'Peptides',          conc: '3%',   layer: 'support',  timing: 'PM',    category: 'support' },
  salicylic:       { name: 'Salicylic Acid',    conc: '1%',   layer: 'problem',  timing: 'PM',    category: 'acne' },
  retinol:         { name: 'Retinol',           conc: '0.3%', layer: 'problem',  timing: 'PM',    category: 'renewal' },
  azelaic:         { name: 'Azelaic Acid',      conc: '10%',  layer: 'problem',  timing: 'PM',    category: 'pigmentation' },
  tranexamic:      { name: 'Tranexamic Acid',   conc: '3%',   layer: 'problem',  timing: 'AM+PM', category: 'pigmentation' },
  vitaminC:        { name: 'Vitamin C',         conc: '10%',  layer: 'problem',  timing: 'AM',    category: 'antioxidant' },
};

// Frequency ladder — only moves one step at a time
export const FREQUENCY_LADDER = [
  { id: 'paused',   label: 'Paused',           nights: 0, description: 'Recovery mode — actives paused' },
  { id: '1x',       label: '1× / week',        nights: 1, description: 'Very gentle introduction' },
  { id: '2x',       label: '2× / week',        nights: 2, description: 'Building tolerance' },
  { id: '3x',       label: '3× / week',        nights: 3, description: 'Progressing well' },
  { id: 'alt',      label: 'Alternate nights',  nights: 3.5, description: 'Strong tolerance established' },
  { id: '5x',       label: '5–6× / week',      nights: 5, description: 'Maintenance phase' },
];

export const PHASES = {
  1: { name: 'Initialization',         label: 'Phase 1', color: '#34d399', desc: 'Barrier build — universal base only' },
  2: { name: 'Active Introduction',    label: 'Phase 2', color: '#38bdf8', desc: '1 primary active at 1×/week' },
  3: { name: 'Frequency Progression',  label: 'Phase 3', color: '#a78bfa', desc: 'Gradual frequency increase' },
  4: { name: 'Maintenance',            label: 'Phase 4', color: '#f472b6', desc: 'Stable routine, hold frequency' },
  5: { name: 'Recovery Override',      label: 'Phase 5', color: '#fb923c', desc: 'Barrier stress detected — recovery mode' },
};

/**
 * Select minimum required modules based on skin analysis data
 */
export function selectModules(analysis) {
  if (!analysis) return { support: [], actives: [] };

  const support = [];
  const actives = [];

  const { acne_level = 0, oiliness = 0, dryness = 0, sensitivity = 0,
    dark_spots = 0, redness = 0, wrinkles = 0, pores = 0 } = analysis;

  // Support layer — auto-select if indicated
  if (sensitivity >= 4 || dryness >= 4 || redness >= 4) support.push('ceramides');
  if (redness >= 3 || oiliness >= 4 || acne_level >= 3) support.push('niacinamide');
  if (wrinkles >= 4 || dryness >= 5) support.push('peptides');

  // Problem modules — triggered by analysis thresholds
  if (acne_level >= 4 || (oiliness >= 5 && pores >= 4)) actives.push('salicylic');
  if (dark_spots >= 4 || redness >= 5) {
    if (dark_spots >= 6) actives.push('azelaic');
    else actives.push('tranexamic');
  }
  if (wrinkles >= 4 || (dryness >= 4 && sensitivity < 6)) actives.push('retinol');
  if (dark_spots >= 3 || acne_level >= 3 || oiliness >= 5) actives.push('vitaminC');

  // Smart minimalism: max 1 primary active initially
  const primaryActive = actives.slice(0, 1);

  return {
    support: [...new Set(support)].slice(0, 3),
    actives: primaryActive,
    allDetectedActives: actives,
  };
}

/**
 * Build universal base routine (always present)
 */
export function buildBaseRoutine(skinType = 'normal') {
  const isOily = skinType?.toLowerCase().includes('oily');
  const isDry = skinType?.toLowerCase().includes('dry');

  return {
    am: [
      { id: 'cleanser_am', name: 'Gentle Cleanser', type: isOily ? 'Foaming gel cleanser' : 'Cream/hydrating cleanser', timing: '30s', tip: 'Lukewarm water only. Pat dry gently.', ingredients: ['Sodium PCA', 'Panthenol'], required: true },
      { id: 'moisturizer_am', name: 'Lightweight Moisturizer', type: isDry ? 'Rich cream moisturizer' : 'Gel-cream moisturizer', timing: '1min', tip: 'Apply on slightly damp skin to lock in hydration.', ingredients: ['Hyaluronic Acid', 'Glycerin', 'Squalane'], required: true },
      { id: 'spf_am', name: 'Broad Spectrum SPF 50+', type: 'Mineral or hybrid sunscreen', timing: '2min', tip: 'Last step. Reapply every 2 hours if outdoors. Non-negotiable.', ingredients: ['Zinc Oxide', 'Titanium Dioxide'], required: true },
    ],
    pm: [
      { id: 'cleanser_pm', name: 'Evening Cleanser', type: isOily ? 'Foaming gel cleanser' : 'Gentle micellar cleanser', timing: '60s', tip: 'Double cleanse if wearing SPF or makeup.', ingredients: ['Panthenol', 'Allantoin'], required: true },
      { id: 'moisturizer_pm', name: 'Night Moisturizer', type: isDry ? 'Rich barrier cream' : 'Medium-weight night cream', timing: '1min', tip: 'Final barrier seal. Include ceramides for recovery nights.', ingredients: ['Ceramides', 'Fatty Acids', 'Cholesterol'], required: true },
    ],
  };
}

/**
 * Calculate skin response score from feedback history (0–100)
 */
export function calcSkinResponseScore(feedbackHistory = []) {
  if (!feedbackHistory.length) return 75; // default neutral

  const recent = feedbackHistory.slice(-7);
  const goodSignals = [1, 2]; // comfortable, more glowing
  const badSignals = [3, 4, 5, 6]; // dryness/irritation variants
  const breakoutSignals = [9, 10];

  let score = 75;
  recent.forEach(fb => {
    const codes = fb.feedback_codes || [];
    const good = codes.filter(c => goodSignals.includes(c)).length;
    const bad = codes.filter(c => badSignals.includes(c)).length;
    const breakout = codes.filter(c => breakoutSignals.includes(c)).length;
    score += good * 3 - bad * 5 - breakout * 8;
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate irritation risk (0–10)
 */
export function calcIrritationRisk(analysis, feedbackHistory = []) {
  let risk = 0;
  if (analysis) {
    risk += (analysis.sensitivity || 0) * 0.4;
    risk += (analysis.dryness || 0) * 0.3;
    risk += (analysis.redness || 0) * 0.3;
  }

  const recent = feedbackHistory.slice(-3);
  recent.forEach(fb => {
    const codes = fb.feedback_codes || [];
    if (codes.some(c => [5, 6].includes(c))) risk += 2;
    if (codes.some(c => [3, 4].includes(c))) risk += 1;
  });

  return Math.min(10, Math.round(risk * 10) / 10);
}

/**
 * Determine recovery mode based on feedback
 */
export function shouldTriggerRecovery(feedbackHistory = []) {
  const recent = feedbackHistory.slice(-3);
  let stressSignals = 0;
  recent.forEach(fb => {
    const codes = fb.feedback_codes || [];
    if (codes.some(c => [5, 6].includes(c))) stressSignals += 2;
    if (codes.some(c => [3, 4].includes(c))) stressSignals += 1;
    if (codes.some(c => [9, 10].includes(c))) stressSignals += 1.5;
  });
  return stressSignals >= 3;
}

/**
 * Recommend frequency change: 'increase' | 'hold' | 'reduce' | 'recovery'
 */
export function getFrequencyRecommendation(responseScore, irritationRisk, currentFreqId) {
  if (irritationRisk >= 7) return 'recovery';
  if (responseScore < 50 || irritationRisk >= 5) return 'reduce';
  if (responseScore >= 80 && irritationRisk < 3) return 'increase';
  return 'hold';
}

/**
 * Move frequency one step on the ladder
 */
export function stepFrequency(currentId, direction) {
  const idx = FREQUENCY_LADDER.findIndex(f => f.id === currentId);
  if (direction === 'increase' && idx < FREQUENCY_LADDER.length - 1) return FREQUENCY_LADDER[idx + 1].id;
  if (direction === 'reduce' && idx > 0) return FREQUENCY_LADDER[idx - 1].id;
  if (direction === 'recovery') return 'paused';
  return currentId;
}

/**
 * Generate weekly adaptive schedule
 */
export function generateWeekSchedule(activeModules, frequencyId) {
  const freq = FREQUENCY_LADDER.find(f => f.id === frequencyId) || FREQUENCY_LADDER[1];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const nights = Math.round(freq.nights);

  // Spread active nights evenly
  const activeNightIndices = new Set();
  if (nights > 0) {
    const step = Math.floor(7 / nights);
    for (let i = 0; i < nights; i++) {
      activeNightIndices.add(Math.min(6, i * step));
    }
  }

  return days.map((day, i) => ({
    day,
    isTreatment: activeNightIndices.has(i),
    modules: activeNightIndices.has(i) ? activeModules : [],
    type: activeNightIndices.has(i) ? 'treatment' : 'recovery',
  }));
}

/**
 * Check product compatibility conflicts
 */
export function checkConflicts(activeIds) {
  const conflicts = [];
  if (activeIds.includes('retinol') && activeIds.includes('salicylic')) {
    conflicts.push({ a: 'Retinol', b: 'Salicylic Acid', reason: 'Both actives on same night = high irritation risk. Use on alternate nights.' });
  }
  if (activeIds.includes('vitaminC') && activeIds.includes('retinol')) {
    conflicts.push({ a: 'Vitamin C', b: 'Retinol', reason: 'Vitamin C is AM-only. Retinol is PM-only. No conflict if timed correctly.' });
  }
  return conflicts;
}

export function getPhaseFromAnalysis(analysis, feedbackHistory = [], weeksSinceStart = 0) {
  if (shouldTriggerRecovery(feedbackHistory)) return 5;
  if (weeksSinceStart === 0) return 1;
  if (weeksSinceStart <= 1) return 1;
  if (weeksSinceStart <= 3) return 2;
  if (weeksSinceStart <= 8) return 3;
  return 4;
}