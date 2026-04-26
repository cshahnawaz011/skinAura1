import React from 'react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Shows offline status and syncing indicator
 */
export default function OfflineIndicator() {
  const { isOffline } = useOfflineMode();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-sm font-semibold"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Offline — Using cached data</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}