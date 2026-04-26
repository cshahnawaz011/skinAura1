// Global background operations manager
let operations = {};
const listeners = new Set();

export const backgroundOps = {
  // Start an operation
  start: (id, label) => {
    operations[id] = { label, startTime: Date.now(), status: 'running' };
    notifyListeners();
  },

  // Update operation progress
  updateProgress: (id, progress) => {
    if (operations[id]) {
      operations[id].progress = progress;
      notifyListeners();
    }
  },

  // Complete an operation
  complete: (id) => {
    if (operations[id]) {
      operations[id].status = 'complete';
      setTimeout(() => {
        delete operations[id];
        notifyListeners();
      }, 1500);
    }
  },

  // Get all operations
  getAll: () => operations,

  // Subscribe to changes
  subscribe: (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
};

function notifyListeners() {
  listeners.forEach(cb => cb({ ...operations }));
}