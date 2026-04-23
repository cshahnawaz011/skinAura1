/**
 * Auto-adapts concentration level and frequency based on user feedback history.
 * Returns the computed current level, days at level, and next action suggestion.
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
 * @returns {{ currentLevel, daysAtLevel, nextAction, recoveryMode, progressPercent }}
 */
export function computeUserLevel(feedbackHistory = []) {
  if (!feedbackHistory.length) {
    return {
      currentLevel: 'Level 1',
      daysAtLevel: 0,
      nextAction: 'Just starting out — complete 5–7 days and give daily feedback to unlock Level 2.',
      recoveryMode: false,
      progressPercent: 0,
      statusEmoji: '🌱',
    };
  }

  // Map codes → signals for last 5 days
  const recent = feedbackHistory.slice(0, 5);
  const signals = recent.flatMap(f => (f.feedback_codes || []).map(c => SIGNAL_MAP[c])).filter(Boolean);

  const hasHighDamage  = signals.includes('high_damage');
  const mildDamageCount = signals.filter(s => s === 'mild_damage').length;
  const positiveCount  = signals.filter(s => s === 'positive').length;
  const negativeCount  = signals.filter(s => ['mild_damage', 'high_damage', 'breakout'].includes(s)).length;

  // Safety Override → recovery mode
  if (hasHighDamage) {
    return {
      currentLevel: 'Level 1',
      daysAtLevel: 0,
      nextAction: '🚨 Recovery mode: All actives paused for 2–3 days. Restart at Level 1 after skin calms.',
      recoveryMode: true,
      progressPercent: 0,
      statusEmoji: '🚨',
    };
  }

  // 3+ negatives → simplify (stay/drop to Level 1)
  if (negativeCount >= 3) {
    return {
      currentLevel: 'Level 1',
      daysAtLevel: 0,
      nextAction: '⚠️ Multiple negative signals detected. Routine simplified — recovery day added. Stay at Level 1 until skin stabilizes.',
      recoveryMode: false,
      progressPercent: 10,
      statusEmoji: '⚠️',
    };
  }

  // Compute days of continuous positive/neutral streak from oldest to newest
  const sorted = [...feedbackHistory].sort((a, b) => a.date.localeCompare(b.date));
  let posStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const daySigs = (sorted[i].feedback_codes || []).map(c => SIGNAL_MAP[c]);
    const hasNeg = daySigs.some(s => ['mild_damage', 'high_damage', 'breakout'].includes(s));
    if (hasNeg) break;
    posStreak++;
  }

  // Determine level based on streak
  let currentLevel = 'Level 1';
  let progressPercent = 0;
  let nextAction = '';
  let statusEmoji = '🌱';

  if (posStreak >= 21) {
    currentLevel = 'Level 3';
    progressPercent = 100;
    nextAction = '🏆 Advanced level reached! Maintain consistency and monitor barrier health weekly.';
    statusEmoji = '🏆';
  } else if (posStreak >= 8) {
    currentLevel = 'Level 2';
    const daysInL2 = posStreak - 7;
    const toL3 = Math.max(0, 13 - daysInL2);
    progressPercent = Math.min(99, Math.round(((posStreak - 7) / 13) * 100));
    nextAction = toL3 > 0
      ? `✅ Great progress at Level 2! ${toL3} more positive days to unlock Level 3.`
      : '🚀 Ready to try Level 3 — AI will assess before upgrading.';
    statusEmoji = '⚡';
  } else {
    // Level 1
    const daysInL1 = posStreak;
    const toL2 = Math.max(0, 7 - daysInL1);
    progressPercent = Math.round((daysInL1 / 7) * 100);

    if (mildDamageCount > 0) {
      nextAction = `⚠️ Mild sensitivity detected. Reduced frequency & concentration. ${toL2 + 2} stable days needed before progressing.`;
      statusEmoji = '⚠️';
    } else if (positiveCount >= 5) {
      nextAction = `✨ Skin responding well! ${toL2 === 0 ? 'Ready to upgrade to Level 2!' : `${toL2} more positive days to Level 2.`}`;
      statusEmoji = '✨';
    } else {
      nextAction = toL2 > 0
        ? `🌱 Building tolerance. ${toL2} more stable days to reach Level 2.`
        : '✅ Eligible for Level 2 — give feedback today to confirm!';
      statusEmoji = '🌱';
    }
  }

  return {
    currentLevel,
    daysAtLevel: posStreak,
    nextAction,
    recoveryMode: false,
    progressPercent,
    statusEmoji,
  };
}