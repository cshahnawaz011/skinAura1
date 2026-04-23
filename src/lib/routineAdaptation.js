/**
 * Frequency-based level system (NOT concentration).
 * Level = how OFTEN you use actives per week:
 *   Level 1 = 1–2x/week  (beginner frequency)
 *   Level 2 = 3–4x/week  (moderate frequency)
 *   Level 3 = 5–7x/week  (daily/advanced frequency)
 *
 * Concentration stays fixed at the safest effective range for each active.
 * Frequency increases with positive streak; drops on damage signals.
 */

const SIGNAL_MAP = {
  1: 'positive', 2: 'positive',
  8: 'neutral',
  3: 'mild_damage', 5: 'mild_damage',
  4: 'high_damage', 6: 'high_damage',
  7: 'oil',
  9: 'breakout', 10: 'breakout',
};

/**
 * @param {Array} feedbackHistory - sorted newest first, each has { date, feedback_codes }
 * @returns {{ currentLevel, frequencyLabel, daysAtLevel, nextAction, recoveryMode, progressPercent, statusEmoji }}
 */
export function computeUserLevel(feedbackHistory = []) {
  if (!feedbackHistory.length) {
    return {
      currentLevel: 'Level 1',
      frequencyLabel: '1–2x / week',
      daysAtLevel: 0,
      nextAction: 'Just starting out — use actives 1–2x this week and give daily feedback to progress to Level 2.',
      recoveryMode: false,
      progressPercent: 0,
      statusEmoji: '🌱',
    };
  }

  // Map codes → signals for last 5 days
  const recent = feedbackHistory.slice(0, 5);
  const signals = recent.flatMap(f => (f.feedback_codes || []).map(c => SIGNAL_MAP[c])).filter(Boolean);

  const hasHighDamage   = signals.includes('high_damage');
  const mildDamageCount = signals.filter(s => s === 'mild_damage').length;
  const positiveCount   = signals.filter(s => s === 'positive').length;
  const negativeCount   = signals.filter(s => ['mild_damage', 'high_damage', 'breakout'].includes(s)).length;

  // Safety Override → recovery mode (pause ALL actives regardless of frequency)
  if (hasHighDamage) {
    return {
      currentLevel: 'Level 1',
      frequencyLabel: '0x — PAUSED',
      daysAtLevel: 0,
      nextAction: '🚨 Recovery mode: All actives paused 2–3 days. Restart at 1x/week (Level 1) after skin calms.',
      recoveryMode: true,
      progressPercent: 0,
      statusEmoji: '🚨',
    };
  }

  // 3+ negatives → drop back to Level 1 frequency
  if (negativeCount >= 3) {
    return {
      currentLevel: 'Level 1',
      frequencyLabel: '1x / week',
      daysAtLevel: 0,
      nextAction: '⚠️ Multiple negative signals. Dropping to 1x/week until skin stabilises.',
      recoveryMode: false,
      progressPercent: 10,
      statusEmoji: '⚠️',
    };
  }

  // Continuous positive/neutral streak (oldest → newest)
  const sorted = [...feedbackHistory].sort((a, b) => a.date.localeCompare(b.date));
  let posStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const daySigs = (sorted[i].feedback_codes || []).map(c => SIGNAL_MAP[c]);
    const hasNeg = daySigs.some(s => ['mild_damage', 'high_damage', 'breakout'].includes(s));
    if (hasNeg) break;
    posStreak++;
  }

  // Level thresholds based on frequency progression:
  // Level 1 → Level 2: 7 positive days at 1–2x/week
  // Level 2 → Level 3: 14 more positive days at 3–4x/week (21 total)
  let currentLevel = 'Level 1';
  let frequencyLabel = '1–2x / week';
  let progressPercent = 0;
  let nextAction = '';
  let statusEmoji = '🌱';

  if (posStreak >= 21) {
    currentLevel = 'Level 3';
    frequencyLabel = '5–7x / week';
    progressPercent = 100;
    nextAction = '🏆 Advanced frequency reached! Use actives almost daily. Monitor barrier health weekly.';
    statusEmoji = '🏆';
  } else if (posStreak >= 8) {
    currentLevel = 'Level 2';
    frequencyLabel = '3–4x / week';
    const daysInL2 = posStreak - 7;
    progressPercent = Math.min(99, Math.round((daysInL2 / 13) * 100));
    const toL3 = Math.max(0, 13 - daysInL2);
    nextAction = toL3 > 0
      ? `⚡ Using actives 3–4x/week. ${toL3} more positive days to reach daily-use Level 3.`
      : '🚀 Ready for Level 3 — AI will confirm before upgrading to daily use.';
    statusEmoji = '⚡';
  } else {
    frequencyLabel = '1–2x / week';
    const toL2 = Math.max(0, 7 - posStreak);
    progressPercent = Math.round((posStreak / 7) * 100);

    if (mildDamageCount > 0) {
      nextAction = `⚠️ Mild sensitivity — reduce to 1x/week. ${toL2 + 2} stable days before increasing frequency.`;
      statusEmoji = '⚠️';
    } else if (positiveCount >= 5) {
      nextAction = `✨ Skin responding well at 1–2x/week! ${toL2 === 0 ? 'Ready to move to 3–4x (Level 2)!' : `${toL2} more positive days.`}`;
      statusEmoji = '✨';
    } else {
      nextAction = toL2 > 0
        ? `🌱 Building frequency tolerance. ${toL2} more stable days to reach 3–4x/week (Level 2).`
        : '✅ Eligible for Level 2 — give feedback today to confirm!';
      statusEmoji = '🌱';
    }
  }

  return {
    currentLevel,
    frequencyLabel,
    daysAtLevel: posStreak,
    nextAction,
    recoveryMode: false,
    progressPercent,
    statusEmoji,
  };
}