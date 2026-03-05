const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const UPLOAD_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

export function checkUploadCooldown(key) {
  try {
    const lastUsed = parseInt(localStorage.getItem(`upload_cooldown_${key}`) || '0');
    const elapsed = Date.now() - lastUsed;
    if (elapsed < UPLOAD_COOLDOWN_MS) {
      return { allowed: false, remainingMs: UPLOAD_COOLDOWN_MS - elapsed };
    }
  } catch {}
  return { allowed: true, remainingMs: 0 };
}

export function recordUploadUsage(key) {
  try {
    localStorage.setItem(`upload_cooldown_${key}`, Date.now().toString());
  } catch {}
}

export function getUploadCooldownSeconds(key) {
  const { remainingMs } = checkUploadCooldown(key);
  return Math.ceil(remainingMs / 1000);
}

/**
 * Check if an AI action is allowed (not in cooldown).
 * @param {string} key - unique key for this AI action
 * @returns {{ allowed: boolean, remainingMs: number }}
 */
export function checkAICooldown(key) {
  try {
    const lastUsed = parseInt(localStorage.getItem(`ai_cooldown_${key}`) || '0');
    const elapsed = Date.now() - lastUsed;
    if (elapsed < COOLDOWN_MS) {
      return { allowed: false, remainingMs: COOLDOWN_MS - elapsed };
    }
  } catch {}
  return { allowed: true, remainingMs: 0 };
}

/**
 * Record that an AI action was just used.
 * @param {string} key - unique key for this AI action
 */
export function recordAIUsage(key) {
  try {
    localStorage.setItem(`ai_cooldown_${key}`, Date.now().toString());
  } catch {}
}

/**
 * Get remaining cooldown seconds (0 if not in cooldown).
 * @param {string} key
 * @returns {number} seconds remaining
 */
export function getCooldownSeconds(key) {
  const { remainingMs } = checkAICooldown(key);
  return Math.ceil(remainingMs / 1000);
}