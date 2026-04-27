import { useEffect } from 'react';
import { backgroundOps } from '@/lib/BackgroundOperations';

/**
 * Hook to restore operations and cached results on page load
 * Checks localStorage for analysis/routine results from interrupted operations
 */
export function useOperationRecovery() {
  useEffect(() => {
    const operations = backgroundOps.getAll();
    
    // Check for completed skin analysis
    if (operations.skinAnalysis?.status === 'complete' && operations.skinAnalysis?.result?.analysisResult) {
      const cached = localStorage.getItem('skinAnalysisCache');
      if (cached) {
        // Result exists and operation completed — restore is handled by cache
        return;
      }
    }

    // Check for completed routine
    if (operations.skinRoutine?.status === 'complete' && operations.skinRoutine?.result?.routineResult) {
      const cached = localStorage.getItem('skinRoutineCache');
      if (cached) {
        // Result exists and operation completed — restore is handled by cache
        return;
      }
    }

    // Keep running operations alive by re-subscribing
    const unsubscribe = backgroundOps.subscribe(() => {});
    return () => unsubscribe();
  }, []);
}