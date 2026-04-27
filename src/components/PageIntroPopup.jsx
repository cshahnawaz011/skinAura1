import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Shows a one-time intro popup for a page.
 * storageKey: unique key per page (e.g. 'intro_SkinAnalysis')
 * title, emoji, description, tips: content to display
 */
export default function PageIntroPopup({ storageKey, emoji, title, description, tips = [], accentColor = '#f472b6' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) setShow(true);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed inset-x-4 bottom-24 z-50 rounded-3xl overflow-hidden shadow-2xl max-w-md mx-auto"
            style={{ background: '#ffffff' }}
          >
            {/* Gradient accent top bar */}
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, #a78bfa, #60a5fa)` }} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${accentColor}15`, border: `1.5px solid ${accentColor}30` }}>
                    {emoji}
                  </div>
                  <div>
                    <p className="font-black text-base text-gray-900 leading-tight">{title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">How to get the best results</p>
                  </div>
                </div>
                <button onClick={dismiss}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-2"
                  style={{ background: '#f3f4f6' }}>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{description}</p>

              {/* Tips */}
              {tips.length > 0 && (
                <div className="space-y-2 mb-5">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl"
                      style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
                      <span className="text-sm flex-shrink-0">{tip.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800">{tip.title}</p>
                        <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA Button */}
              <button onClick={dismiss}
                className="w-full py-3 rounded-2xl font-black text-white text-sm ios-button-3d"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #a78bfa)` }}>
                Got it — Let's Begin ✨
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}