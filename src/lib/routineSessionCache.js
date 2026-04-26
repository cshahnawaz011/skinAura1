/**
 * Session-based caching for routine data
 * Persists across page refreshes for logged-in users
 */

const CACHE_KEY = 'skinRoutineSessionCache';
const USER_KEY = 'cachedRoutineUserEmail';

export const cacheRoutineData = (userEmail, routineData) => {
  if (!userEmail || !routineData) return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(routineData));
    sessionStorage.setItem(USER_KEY, userEmail);
  } catch (e) {
    console.warn('Failed to cache routine data:', e);
  }
};

export const getCachedRoutineData = (userEmail) => {
  if (!userEmail) return null;
  try {
    const cachedUser = sessionStorage.getItem(USER_KEY);
    if (cachedUser !== userEmail) return null;
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.warn('Failed to retrieve cached routine:', e);
    return null;
  }
};

export const clearRoutineCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn('Failed to clear routine cache:', e);
  }
};