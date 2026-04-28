/**
 * Routine Store — shared singleton for passing routine data to Products, Ingredients, etc.
 * Other pages import getRoutineStore() to read current routine state.
 */

const STORE_KEY = 'skinaura-routine-store';

export function saveRoutineStore(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...data, _savedAt: Date.now() }));
  } catch {}
}

export function getRoutineStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getActiveIngredients() {
  const store = getRoutineStore();
  if (!store) return [];
  const { modules } = store;
  if (!modules) return [];
  return [...(modules.support || []), ...(modules.actives || [])];
}

export function getRoutineSkinConcerns() {
  const store = getRoutineStore();
  return store?.analysis?.priority_concerns || [];
}

export function getRoutineSkinType() {
  const store = getRoutineStore();
  return store?.analysis?.skin_type || null;
}