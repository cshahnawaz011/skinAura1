import { differenceInDays } from 'date-fns';

/**
 * Calculate current cycle phase based on start date
 * @param {string} startDate - Cycle start date (YYYY-MM-DD)
 * @param {number} cycleLength - Total cycle length in days (default 28)
 * @returns {string} - Current phase: 'menstrual', 'follicular', 'ovulation', 'luteal'
 */
export function getCurrentCyclePhase(startDate, cycleLength = 28) {
  if (!startDate) return 'follicular';
  
  const daysInCycle = differenceInDays(new Date(), new Date(startDate)) % cycleLength;
  
  if (daysInCycle <= 5) return 'menstrual';
  if (daysInCycle <= 12) return 'follicular';
  if (daysInCycle <= 15) return 'ovulation';
  return 'luteal';
}

/**
 * Get current cycle day
 * @param {string} startDate - Cycle start date (YYYY-MM-DD)
 * @param {number} cycleLength - Total cycle length in days (default 28)
 * @returns {number} - Day of cycle (1-28)
 */
export function getCycleDay(startDate, cycleLength = 28) {
  if (!startDate) return 1;
  const daysInCycle = differenceInDays(new Date(), new Date(startDate)) % cycleLength;
  return daysInCycle + 1;
}

/**
 * Get skincare recommendations by phase
 * @param {string} phase - Cycle phase
 * @returns {object} - Skincare recommendations
 */
export function getPhaseSkincareRecommendations(phase) {
  const recommendations = {
    menstrual: {
      focus: 'Barrier Repair',
      avoid: ['Retinol', 'Strong Actives', 'Exfoliants'],
      recommend: ['Rich Moisturizer', 'Gentle Cleanser', 'Hydrating Mask'],
    },
    follicular: {
      focus: 'Active Treatments',
      avoid: [],
      recommend: ['Vitamin C', 'BHA', 'Treatment Serums'],
    },
    ovulation: {
      focus: 'Peak Clarity',
      avoid: [],
      recommend: ['Retinol', 'AHA', 'SPF 50+'],
    },
    luteal: {
      focus: 'Calming Care',
      avoid: ['Strong Actives', 'Irritating Ingredients'],
      recommend: ['Calming Serum', 'Hydrating Cream', 'Soothing Mask'],
    },
  };
  return recommendations[phase] || recommendations.follicular;
}

/**
 * Get wellness tips by phase
 * @param {string} phase - Cycle phase
 * @returns {array} - Wellness tips
 */
export function getPhaseWellnessTips(phase) {
  const tips = {
    menstrual: [
      'Prioritize rest and recovery',
      'Lower intensity workouts',
      'Increase iron intake',
      'Stay extra hydrated',
    ],
    follicular: [
      'Challenge workouts beneficial',
      'Great for new projects',
      'Introduce actives safely',
      'Leverage energy boost',
    ],
    ovulation: [
      'Peak energy and confidence',
      'Schedule important meetings',
      'Intense workouts feel easy',
      'Best for professional photos',
    ],
    luteal: [
      'Prioritize self-care',
      'Gentle yoga or walks',
      'Plan nourishing meals',
      'Honor your needs',
    ],
  };
  return tips[phase] || tips.follicular;
}