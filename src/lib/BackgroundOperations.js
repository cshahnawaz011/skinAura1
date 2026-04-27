// Global background operations manager with persistence
const STORAGE_KEY = 'skinaura_bg_ops';

let operations = {};
const listeners = new Set();

// Load operations from localStorage on init
function loadOperations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Keep only operations started within last hour
      const now = Date.now();
      operations = Object.fromEntries(
        Object.entries(parsed).filter(([_, op]) => now - op.startTime < 3600000)
      );
    }
  } catch {}
}

loadOperations();

export const backgroundOps = {
  // Start an operation
  start: (id, label, metadata = {}) => {
    operations[id] = {
      label,
      startTime: Date.now(),
      status: 'running',
      progress: 0,
      metadata,
    };
    persistOperations();
    notifyListeners();
  },

  // Update operation progress
  updateProgress: (id, progress) => {
    if (operations[id]) {
      operations[id].progress = progress;
      persistOperations();
      notifyListeners();
    }
  },

  // Complete an operation with optional result
  complete: (id, result = null) => {
    if (operations[id]) {
      operations[id].status = 'complete';
      operations[id].result = result;
      operations[id].completedAt = Date.now();
      persistOperations();
      notifyListeners();

      // Auto-remove after 2 seconds
      setTimeout(() => {
        delete operations[id];
        persistOperations();
        notifyListeners();
      }, 2000);
    }
  },

  // Fail an operation
  fail: (id, error) => {
    if (operations[id]) {
      operations[id].status = 'failed';
      operations[id].error = error;
      operations[id].completedAt = Date.now();
      persistOperations();
      notifyListeners();

      setTimeout(() => {
        delete operations[id];
        persistOperations();
        notifyListeners();
      }, 2000);
    }
  },

  // Get all operations
  getAll: () => operations,

  // Get specific operation
  get: (id) => operations[id] || null,

  // Check if operation exists and is running
  isRunning: (id) => operations[id]?.status === 'running',

  // Subscribe to changes
  subscribe: (callback) => {
    listeners.add(callback);
    callback({ ...operations });
    return () => listeners.delete(callback);
  },
};

function persistOperations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
  } catch {}
}

function notifyListeners() {
  listeners.forEach(cb => cb({ ...operations }));
}