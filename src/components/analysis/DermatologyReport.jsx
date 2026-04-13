import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Stethoscope, Pill, Shield, Clock, FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SEVERITY_CONFIG = {
  mild: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  moderate: { color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  severe: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300', badge: 'bg-red-100 text-red-700' },
  none: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

function ConditionCard({ condition, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[condition.severity] || SEVERITY_CONFIG.mild;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-2xl border p-4 cursor-pointer transition-all ${cfg.bg} ${cfg.border}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/70 dark:bg-black/20 flex items-center justify-center flex-shrink-0 text-lg">
            {condition.emoji || '🔬'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">{condition.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${cfg.badge}`}>
                {condition.severity}
              </span>
              {condition.requires_dermatologist && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" /> See Dermatologist
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{condition.description}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/40 dark:border-white/10 space-y-3"
          >
            {condition.triggers?.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-600 mb-1">Known Triggers</p>
                  <div className="flex flex-wrap gap-1">
                    {condition.triggers.map((t, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-white/60 dark:bg-black/20 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {condition.skincare_dos?.length > 0 && (
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-600 mb-1">Skincare DO's</p>
                  <ul className="space-y-0.5">
                    {condition.skincare_dos.map((d, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-300">✓ {d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {condition.skincare_donts?.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-500 mb-1">Skincare DON'Ts</p>
                  <ul className="space-y-0.5">
                    {condition.skincare_donts.map((d, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-300">✗ {d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {condition.key_ingredients?.length > 0 && (
              <div className="flex items-start gap-2">
                <FlaskConical className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-600 mb-1">Clinically Proven Ingredients</p>
                  <div className="flex flex-wrap gap-1">
                    {condition.key_ingredients.map((ing, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">{ing}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {condition.rx_options && (
              <div className="flex items-start gap-2">
                <Pill className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-purple-600 mb-1">Prescription Options (Consult Doctor)</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{condition.rx_options}</p>
                </div>
              </div>
            )}

            {condition.routine_modification && (
              <div className="p-3 rounded-xl bg-white/60 dark:bg-black/20 border border-white/40">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">🔄 Routine Modification Required</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{condition.routine_modification}</p>
              </div>
            )}

            {condition.expected_improvement && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-1">Expected Improvement</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{condition.expected_improvement}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DermatologyReport({ dermData }) {
  if (!dermData) return null;

  const conditions = dermData.conditions || [];
  const hasConditions = conditions.filter(c => c.severity !== 'none').length > 0;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg,#f0e6ff,#e8f0ff)', border: '1px solid #d4b8ff' }}>
        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-purple-800 dark:text-purple-300">Clinic-Grade Dermatology Report</h3>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{dermData.summary}</p>
        </div>
        <div className="text-center flex-shrink-0">
          <div className="text-2xl font-black text-purple-600">{dermData.skin_health_grade}</div>
          <div className="text-xs text-purple-400">Grade</div>
        </div>
      </div>

      {/* Overall Assessment */}
      {dermData.overall_assessment && (
        <div className="p-3 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
          style={{ background: 'rgba(245,240,255,0.6)', border: '1px solid #e5d8ff' }}>
          {dermData.overall_assessment}
        </div>
      )}

      {/* Conditions */}
      {hasConditions ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Detected Dermatological Conditions:</p>
          {conditions.filter(c => c.severity !== 'none').map((cond, i) => (
            <ConditionCard key={i} condition={cond} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 rounded-2xl" style={{ background: 'rgba(220,252,231,0.5)', border: '1px solid #86efac' }}>
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-semibold text-emerald-700">No significant dermatological conditions detected</p>
          <p className="text-sm text-emerald-600 mt-1">Your skin appears clinically healthy. Keep up your routine!</p>
        </div>
      )}

      {/* Routine Change Notice */}
      {dermData.routine_changes_required && (
        <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,#fff3e8,#ffe8f0)', border: '1px solid #fcd5b0' }}>
          <p className="text-sm font-bold text-orange-700 mb-1">🔄 Routine Adjustments Recommended</p>
          <p className="text-sm text-orange-600">{dermData.routine_changes_required}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center px-4">
        ⚕️ This AI report is for informational purposes only and does not replace a professional dermatologist's diagnosis. For severe conditions, please consult a licensed dermatologist.
      </p>
    </div>
  );
}