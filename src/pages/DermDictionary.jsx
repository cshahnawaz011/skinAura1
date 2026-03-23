import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const COMMON_TERMS = [
  'Hyaluronic Acid', 'Retinol', 'Niacinamide', 'AHA', 'BHA', 'Ceramides',
  'Peptides', 'Vitamin C', 'SPF', 'Collagen', 'Exfoliation', 'Comedogenic',
  'Humectant', 'Emollient', 'Occlusive', 'Toner', 'Serum', 'Double Cleansing',
  'Skin Barrier', 'pH Balance', 'Hyperpigmentation', 'Rosacea', 'Eczema'
];

export default function DermDictionary() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [definition, setDefinition] = useState(null);
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const lookup = async (term) => {
    const t = term || search;
    if (!t.trim()) return;
    setSearch(t);
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Define the skincare/dermatology term "${t}" in simple, friendly language.`,
      response_json_schema: {
        type: "object",
        properties: {
          term: { type: "string" },
          simple_definition: { type: "string" },
          how_it_works: { type: "string" },
          best_for_skin_types: { type: "array", items: { type: "string" } },
          examples: { type: "array", items: { type: "string" } },
          usage_tips: { type: "string" },
          pairs_well_with: { type: "array", items: { type: "string" } },
          avoid_with: { type: "array", items: { type: "string" } },
          fun_fact: { type: "string" }
        }
      }
    });
    setDefinition(res);
    setHistory(prev => [res, ...prev.filter(h => h.term !== res.term)].slice(0, 10));
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="w-7 h-7 text-indigo-500" /> Derm Dictionary</h1>
        <p className="text-gray-500 mt-1">Understand every skincare term & ingredient</p>
      </div>

      <GlassCard>
        <div className="flex gap-2">
          <Input placeholder="Search any term (e.g. retinol, SPF, AHA...)" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} className="flex-1" />
          <Button onClick={() => lookup()} disabled={loading || !search.trim()} className="bg-gradient-to-r from-indigo-500 to-violet-500">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {COMMON_TERMS.map(term => (
            <button key={term} onClick={() => lookup(term)}
              className="text-xs px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all">
              {term}
            </button>
          ))}
        </div>
      </GlassCard>

      {definition && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20">
            <h2 className="text-2xl font-black text-indigo-600 mb-2">{definition.term}</h2>
            <p className="text-base text-gray-700 dark:text-gray-200 mb-3">{definition.simple_definition}</p>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                <p className="font-semibold text-xs text-gray-400 uppercase mb-1">How It Works</p>
                <p className="text-gray-700 dark:text-gray-300">{definition.how_it_works}</p>
              </div>

              {definition.best_for_skin_types?.length > 0 && (
                <div>
                  <p className="font-semibold text-xs text-gray-400 uppercase mb-1">Best For</p>
                  <div className="flex gap-1 flex-wrap">{definition.best_for_skin_types.map((s, i) => <Badge key={i} variant="outline" className="text-xs capitalize">{s}</Badge>)}</div>
                </div>
              )}

              {definition.usage_tips && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="font-semibold text-xs text-emerald-600 uppercase mb-1">Usage Tips</p>
                  <p className="text-gray-700 dark:text-gray-300">{definition.usage_tips}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {definition.pairs_well_with?.length > 0 && (
                  <div>
                    <p className="font-semibold text-xs text-emerald-500 mb-1">✅ Pairs with</p>
                    {definition.pairs_well_with.map((p, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400">• {p}</p>)}
                  </div>
                )}
                {definition.avoid_with?.length > 0 && (
                  <div>
                    <p className="font-semibold text-xs text-red-500 mb-1">❌ Avoid with</p>
                    {definition.avoid_with.map((a, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400">• {a}</p>)}
                  </div>
                )}
              </div>

              {definition.fun_fact && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="font-semibold text-xs text-amber-600 mb-1">✨ Fun Fact</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{definition.fun_fact}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {history.length > 1 && (
        <GlassCard>
          <h3 className="font-bold mb-3 text-gray-500 text-sm uppercase tracking-wide">Recent Lookups</h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(1).map((h, i) => (
              <button key={i} onClick={() => setDefinition(h)} className="text-sm px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                {h.term}
              </button>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}