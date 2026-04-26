import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backgroundOps } from '@/lib/BackgroundOperations';
import { Loader2, CheckCircle, X } from 'lucide-react';

export default function BackgroundOperationBar() {
  const [operations, setOperations] = useState({});
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = backgroundOps.subscribe(setOperations);
    return unsubscribe;
  }, []);

  const opCount = Object.keys(operations).length;
  const completedCount = Object.values(operations).filter(op => op.status === 'complete').length;
  const runningCount = Object.values(operations).filter(op => op.status === 'running').length;

  if (opCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto"
      >
        <div
          className="rounded-2xl overflow-hidden shadow-2xl border"
          style={{
            background: 'linear-gradient(135deg,rgba(244,114,182,0.95),rgba(167,139,250,0.95))',
            borderColor: 'rgba(255,255,255,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-white"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {runningCount > 0 && <Loader2 className="w-4 h-4 animate-spin" />}
                {completedCount > 0 && <CheckCircle className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">
                  {runningCount > 0
                    ? `Processing... ${runningCount} operation(s)`
                    : `${completedCount} complete`}
                </p>
                <p className="text-xs opacity-80">
                  {Object.values(operations)
                    .map(op => op.label)
                    .join(' • ')}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold px-2 py-1 rounded-full bg-white/20">
              {expanded ? '−' : '+'}
            </div>
          </button>

          {/* Progress bars */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/20 px-4 py-3 space-y-2"
              >
                {Object.entries(operations).map(([id, op]) => (
                  <div key={id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-white/90">
                      <span className="font-semibold">{op.label}</span>
                      {op.status === 'complete' ? (
                        <span className="text-emerald-300">✓ Done</span>
                      ) : (
                        <span className="text-white/70">
                          {op.progress ? `${op.progress}%` : 'Processing...'}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: op.status === 'complete' ? '100%' : `${op.progress || 0}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}