const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes
const UPLOAD_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

export function checkUploadCooldown(key) {
  try {
    const lastUsed = parseInt(localStorage.getItem(`upload_cooldown_${key}`) || '0');
    const elapsed = Date.now() - lastUsed;
    if (elapsed < UPLOAD_COOLDOWN_MS) return { allowed: false, remainingMs: UPLOAD_COOLDOWN_MS - elapsed };
  } catch {}
  return { allowed: true, remainingMs: 0 };
}

export function recordUploadUsage(key) {
  try { localStorage.setItem(`upload_cooldown_${key}`, Date.now().toString()); } catch {}
}

export function getUploadCooldownSeconds(key) {
  const { remainingMs } = checkUploadCooldown(key);
  return Math.ceil(remainingMs / 1000);
}

export function checkAICooldown(key) {
  try {
    const lastUsed = parseInt(localStorage.getItem(`ai_cooldown_${key}`) || '0');
    const elapsed = Date.now() - lastUsed;
    if (elapsed < COOLDOWN_MS) return { allowed: false, remainingMs: COOLDOWN_MS - elapsed };
  } catch {}
  return { allowed: true, remainingMs: 0 };
}

export function recordAIUsage(key) {
  try { localStorage.setItem(`ai_cooldown_${key}`, Date.now().toString()); } catch {}
}

export function getCooldownSeconds(key) {
  const { remainingMs } = checkAICooldown(key);
  return Math.ceil(remainingMs / 1000);
}