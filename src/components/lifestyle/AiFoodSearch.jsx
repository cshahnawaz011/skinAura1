import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Plus, X, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiFoodSearch({ onAddFood }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const searchFood = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    setError('');
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this food/drink for skin health: "${query}".
Return a JSON with:
- name: the food name (cleaned up)
- skin_impact: "good", "bad", or "neutral"
- skin_score: 1-10 (10 = best for skin)
- benefits: array of up to 3 short skin benefits (if good)
- concerns: array of up to 3 short skin concerns (if bad)
- key_nutrients: array of up to 3 key nutrients relevant for skin
- verdict: one sentence summary for skin health`,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          skin_impact: { type: "string" },
          skin_score: { type: "number" },
          benefits: { type: "array", items: { type: "string" } },
          concerns: { type: "array", items: { type: "string" } },
          key_nutrients: { type: "array", items: { type: "string" } },
          verdict: { type: "string" }
        }
      }
    });
    setResults(res);
    setLoading(false);
  };

  const handleAdd = () => {
    if (!results) return;
    onAddFood(results.name, results.skin_impact === 'good');
    setQuery('');
    setResults(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search any food (e.g. 'mango', 'pizza', 'chai')"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchFood()}
          className="flex-1"
        />
        <Button onClick={searchFood} disabled={loading || !query.trim()} className="bg-gradient-to-r from-pink-500 to-amber-500">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border-2 ${
              results.skin_impact === 'good' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
              : results.skin_impact === 'bad' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-base">{results.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {results.skin_impact === 'good'
                    ? <ThumbsUp className="w-4 h-4 text-emerald-500" />
                    : results.skin_impact === 'bad'
                    ? <ThumbsDown className="w-4 h-4 text-red-500" />
                    : <Sparkles className="w-4 h-4 text-amber-500" />
                  }
                  <span className={`text-sm font-semibold ${results.skin_impact === 'good' ? 'text-emerald-600' : results.skin_impact === 'bad' ? 'text-red-600' : 'text-amber-600'}`}>
                    Skin Score: {results.skin_score}/10
                  </span>
                </div>
              </div>
              <button onClick={() => setResults(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 italic">{results.verdict}</p>

            {results.benefits?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {results.benefits.map((b, i) => <Badge key={i} className="bg-emerald-500 text-xs">{b}</Badge>)}
              </div>
            )}
            {results.concerns?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {results.concerns.map((c, i) => <Badge key={i} className="bg-red-500 text-xs">{c}</Badge>)}
              </div>
            )}
            {results.key_nutrients?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {results.key_nutrients.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n}</Badge>)}
              </div>
            )}

            <Button onClick={handleAdd} size="sm" className={`w-full ${results.skin_impact === 'good' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
              <Plus className="w-3 h-3 mr-1" />
              Add to {results.skin_impact === 'good' ? 'Good' : 'Bad'} Foods
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}