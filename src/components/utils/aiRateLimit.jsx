// Rate limiting disabled — all AI & upload actions are always allowed
export function checkUploadCooldown(key) { return { allowed: true, remainingMs: 0 }; }
export function recordUploadUsage(key) {}
export function getUploadCooldownSeconds(key) { return 0; }
export function checkAICooldown(key) { return { allowed: true, remainingMs: 0 }; }
export function recordAIUsage(key) {}
export function getCooldownSeconds(key) { return 0; }