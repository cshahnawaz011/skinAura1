import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';

const KNOWN_CONFLICTS = [
  { a: 'Retinol', b: 'AHA', severity: 'high', note: 'Severe irritation risk — never layer same night' },
  { a: 'Retinol', b: 'BHA', severity: 'high', note: 'Over-exfoliation — use on alternate nights only' },
  { a: 'Retinol', b: 'Benzoyl Peroxide', severity: 'high', note: 'Deactivates retinol, strips barrier' },
  { a: 'AHA', b: 'BHA', severity: 'medium', note: 'Can be layered but risks over-exfoliation for beginners' },
  { a: 'Vitamin C', b: 'Niacinamide', severity: 'low', note: 'Mild flushing possible — use different times' },
  { a: 'Niacinamide', b: 'AHA', severity: 'low', note: 'Reduces AHA efficacy slightly — separate by 20 min' },
];

const SAFE_PAIRS = [
  { a: 'Hyaluronic Acid', b: 'Retinol', note: 'Buffers irritation, boosts moisture retention' },
  { a: 'Niacinamide', b: 'Retinol', note: 'Reduces redness from retinol, ideal combo' },
  { a: 'Ceramides', b: 'AHA', note: 'Repairs barrier post-exfoliation' },
  { a: 'SPF', b: 'Vitamin C', note: 'Antioxidant + UV shield — perfect morning duo' },
];

const SEVERITY_STYLE = {
  high:   { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
  medium: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
  low:    { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
};

// Derive ingredient list from saved products + routine
function extractIngredients(savedProducts = [], routineData = null) {
  const fromProducts = savedProducts.flatMap(p => p.key_ingredients || []);
  const fromRoutine = (routineData?.morning_routine || []).flatMap(s => s.key_ingredients || []);
  return [...new Set([...fromProducts, ...fromRoutine])];
}

function findConflicts(ingredients) {
  return KNOWN_CONFLICTS.filter(c =>
    ingredients.some(i => i.toLowerCase().includes(c.a.toLowerCase())) &&
    ingredients.some(i => i.toLowerCase().includes(c.b.toLowerCase()))
  );
}

function buildMatrix(ingredients) {
  const topIng = ingredients.slice(0, 5);
  return { rows: topIng, cols: topIng };
}

function getCellStatus(a, b) {
  if (a === b) return 'self';
  const conflict = KNOWN_CONFLICTS.find(c =>
    (c.a.toLowerCase() === a.toLowerCase() && c.b.toLowerCase() === b.toLowerCase()) ||
    (c.b.toLowerCase() === a.toLowerCase() && c.a.toLowerCase() === b.toLowerCase())
  );
  if (conflict) return conflict.severity;
  const safe = SAFE_PAIRS.find(p =>
    (p.a.toLowerCase() === a.toLowerCase() && p.b.toLowerCase() === b.toLowerCase()) ||
    (p.b.toLowerCase() === a.toLowerCase() && p.a.toLowerCase() === b.toLowerCase())
  );
  if (safe) return 'safe';
  return 'unknown';
}

const CELL_COLORS = {
  self:    { bg: '#f3f4f6', label: '—' },
  safe:    { bg: '#d1fae5', label: '✓' },
  high:    { bg: '#fee2e2', label: '✗' },
  medium:  { bg: '#fef3c7', label: '⚠' },
  low:     { bg: '#fefce8', label: '~' },
  unknown: { bg: '#f9fafb', label: '?' },
};

export default function IngredientIntelligenceCard({ savedProducts = [], routineData = null }) {
  const [open, setOpen] = useState(true);
  const [showMatrix, setShowMatrix] = useState(false);

  const ingredients = extractIngredients(savedProducts, routineData);
  const conflicts = findConflicts(ingredients);
  const compatScore = Math.max(0, 100 - conflicts.reduce((s, c) =>
    s + (c.severity === 'high' ? 30 : c.severity === 'medium' ? 15 : 5), 0));
  const matrix = buildMatrix(ingredients);

  const compatColor = compatScore >= 85 ? '#34d399' : compatScore >= 65 ? '#facc15' : '#ef4444';

  return (
    <div className="rounded-2xl border-2 border-violet-200 overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-50">
            <FlaskConical className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-left">
            <p className="font-black text-sm">Ingredient Intelligence</p>
            <p className="text-[10px] text-gray-400">Conflict detection & compatibility matrix</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conflicts.length > 0 && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">

              {/* Sub-cards */}
              <div className="grid grid-cols-3 gap-2">
                {/* Conflict Count */}
                <div className={`rounded-xl p-3 text-center ${conflicts.length > 0 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Conflicts</p>
                  <p className={`text-2xl font-black ${conflicts.length > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{conflicts.length}</p>
                  <p className={`text-[9px] font-bold mt-1 ${conflicts.length > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {conflicts.length > 0 ? 'Detected' : 'None found'}
                  </p>
                </div>

                {/* Safe Combo Check */}
                <div className="rounded-xl p-3 text-center bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Safe Combos</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {SAFE_PAIRS.filter(p =>
                      ingredients.some(i => i.toLowerCase().includes(p.a.toLowerCase())) &&
                      ingredients.some(i => i.toLowerCase().includes(p.b.toLowerCase()))
                    ).length}
                  </p>
                  <p className="text-[9px] font-bold text-emerald-600 mt-1">Verified ✓</p>
                </div>

                {/* Compatibility Score */}
                <div className="rounded-xl p-3 text-center border border-gray-100" style={{ background: `${compatColor}10` }}>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Compat Score</p>
                  <p className="text-2xl font-black" style={{ color: compatColor }}>{compatScore}</p>
                  <p className="text-[9px] font-bold mt-1" style={{ color: compatColor }}>/100</p>
                </div>
              </div>

              {/* Warning bodies */}
              {conflicts.length > 0 && (
                <div className="space-y-2">
                  {conflicts.map((c, i) => {
                    const s = SEVERITY_STYLE[c.severity];
                    return (
                      <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border ${s.bg} ${s.border}`}>
                        <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${s.text}`} />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-xs font-black ${s.text}`}>{c.a} + {c.b}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${s.badge}`}>{c.severity}</span>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-0.5">{c.note}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Safe pairs highlight */}
              {ingredients.length > 0 && (
                <div className="space-y-1.5">
                  {SAFE_PAIRS.filter(p =>
                    ingredients.some(i => i.toLowerCase().includes(p.a.toLowerCase())) &&
                    ingredients.some(i => i.toLowerCase().includes(p.b.toLowerCase()))
                  ).slice(0, 2).map((p, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-emerald-700">{p.a} + {p.b}</p>
                        <p className="text-[10px] text-gray-500">{p.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Interaction Matrix toggle */}
              {matrix.rows.length >= 2 && (
                <div>
                  <button onClick={() => setShowMatrix(s => !s)}
                    className="text-xs font-bold text-violet-600 flex items-center gap-1 hover:text-violet-800">
                    {showMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showMatrix ? 'Hide' : 'Show'} Interaction Matrix
                  </button>
                  <AnimatePresence>
                    {showMatrix && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
                        <div className="rounded-xl border border-gray-100 overflow-x-auto">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr>
                                <th className="p-1.5 text-left text-gray-400 font-bold" />
                                {matrix.cols.map(c => (
                                  <th key={c} className="p-1.5 text-center text-gray-500 font-bold max-w-[60px] truncate">{c.slice(0, 8)}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {matrix.rows.map(row => (
                                <tr key={row} className="border-t border-gray-50">
                                  <td className="p-1.5 text-gray-500 font-bold whitespace-nowrap max-w-[70px] truncate">{row.slice(0, 9)}</td>
                                  {matrix.cols.map(col => {
                                    const status = getCellStatus(row, col);
                                    const cell = CELL_COLORS[status];
                                    return (
                                      <td key={col} className="p-1.5 text-center font-black" style={{ background: cell.bg, color: status === 'safe' ? '#059669' : status === 'high' ? '#dc2626' : status === 'medium' ? '#d97706' : '#9ca3af' }}>
                                        {cell.label}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="px-2 py-1.5 flex flex-wrap gap-2 border-t border-gray-100">
                            {[['✓', '#d1fae5', 'Safe'], ['✗', '#fee2e2', 'Conflict'], ['⚠', '#fef3c7', 'Caution'], ['?', '#f9fafb', 'Unknown']].map(([sym, bg, lbl]) => (
                              <span key={lbl} className="flex items-center gap-1 text-[9px] text-gray-500">
                                <span className="w-4 h-4 rounded flex items-center justify-center font-bold text-[10px]" style={{ background: bg }}>{sym}</span>{lbl}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {ingredients.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">Add products to your shelf to enable conflict detection</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}