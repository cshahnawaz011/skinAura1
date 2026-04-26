import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

function buildChangelog(feedbackHistory = [], savedRoutine = null) {
  const changes = [];

  feedbackHistory.forEach((f, i) => {
    const codes = f.feedback_codes || [];
    if (codes.includes(4) || codes.includes(6)) {
      changes.push({
        date: f.date,
        version: `v${feedbackHistory.length - i}.${i}`,
        from: 'Active treatment night',
        to: 'Full recovery — no actives',
        reason: 'High damage signal detected',
        type: 'emergency',
      });
    } else if (codes.includes(3) || codes.includes(5)) {
      changes.push({
        date: f.date,
        version: `v${feedbackHistory.length - i}.${i}`,
        from: '2 treatment nights',
        to: '1 treatment night',
        reason: 'Mild damage — reduced frequency',
        type: 'reduce',
      });
    } else if (codes.includes(1) || codes.includes(2)) {
      changes.push({
        date: f.date,
        version: `v${feedbackHistory.length - i}.${i}`,
        from: 'Current level',
        to: 'Maintained / upgrade eligible',
        reason: 'Positive signal — stable progression',
        type: 'positive',
      });
    }
  });

  if (savedRoutine?.updated_date) {
    changes.unshift({
      date: savedRoutine.updated_date.split('T')[0],
      version: 'v1.0',
      from: 'No routine',
      to: 'Routine generated',
      reason: 'Initial routine creation',
      type: 'create',
    });
  }

  return changes.slice(0, 6);
}

const TYPE_STYLES = {
  emergency: { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    dot: '#ef4444', label: 'Emergency' },
  reduce:    { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',  dot: '#f59e0b', label: 'Reduce' },
  positive:  { bg: 'bg-emerald-50',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700',dot: '#34d399',label: 'Stable' },
  create:    { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', dot: '#a78bfa', label: 'Created' },
};

export default function RoutineChangesCard({ feedbackHistory = [], savedRoutine = null }) {
  const [open, setOpen] = useState(true);
  const changelog = buildChangelog(feedbackHistory, savedRoutine);
  const lastChange = changelog[0]?.date || null;
  const autoCount = changelog.filter(c => c.type !== 'create').length;

  return (
    <div className="rounded-2xl border-2 border-indigo-200 overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50">
            <RefreshCw className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Routine Changes</p>
            <p className="text-[10px] text-gray-400">Auto-adjustment history & versioning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{autoCount} auto</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">

              {/* Summary sub-cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-3 text-center bg-indigo-50 border border-indigo-100">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Auto Changes</p>
                  <p className="text-2xl font-black text-indigo-600">{autoCount}</p>
                  <p className="text-[9px] text-indigo-500 font-bold mt-0.5">adaptive</p>
                </div>
                <div className="rounded-xl p-3 text-center bg-gray-50 border border-gray-100 col-span-2">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Last Change</p>
                  <p className="text-xs font-black text-gray-700">
                    {lastChange ? format(new Date(lastChange + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {changelog[0]?.reason || 'No changes yet'}
                  </p>
                </div>
              </div>

              {/* Change History Log */}
              {changelog.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No routine changes yet — log daily feedback to trigger adaptations</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Change History</p>
                  {changelog.map((c, i) => {
                    const s = TYPE_STYLES[c.type] || TYPE_STYLES.create;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${s.bg} ${s.border}`}>
                        {/* Version dot */}
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: s.dot }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${s.badge}`}>{c.version}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
                            <span className="text-[9px] text-gray-400 ml-auto">{c.date ? format(new Date(c.date + 'T00:00:00'), 'MMM d') : ''}</span>
                          </div>
                          {/* Before / After */}
                          <div className="flex items-center gap-1 text-[10px] text-gray-600">
                            <span className="px-2 py-0.5 rounded bg-white border border-gray-200 truncate max-w-[100px]">{c.from}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="px-2 py-0.5 rounded bg-white border border-gray-200 truncate max-w-[100px]">{c.to}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{c.reason}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}