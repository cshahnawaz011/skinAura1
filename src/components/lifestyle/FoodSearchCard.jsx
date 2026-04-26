import React, { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FoodSearchCard({ title, emoji, value = [], onChange, color }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const searchFoods = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest 5 healthy foods or meals for: "${search}". For skin health, prioritize foods rich in antioxidants, omega-3s, and vitamins. Return as JSON array with {name: string, benefit: string}`,
        response_json_schema: {
          type: 'object',
          properties: {
            foods: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  benefit: { type: 'string' },
                },
              },
            },
          },
        },
      });
      setResults(res.data?.foods || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addFood = (food) => {
    onChange([...value, food.name]);
    setResults([]);
    setSearch('');
  };

  return (
    <div className="rounded-3xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.7)' }}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((food, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: `${color}20` }}
            >
              <span style={{ color }}>{food}</span>
              <button
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="hover:opacity-60"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchFoods()}
          placeholder="Search foods..."
          className="w-full px-4 py-2.5 rounded-2xl bg-gray-100 text-sm font-medium focus:outline-none focus:ring-2"
          style={{ focusRing: `${color}40` }}
        />

        {search && (
          <button
            onClick={searchFoods}
            disabled={loading}
            className="w-full py-2 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: color, color: '#fff' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Search'}
          </button>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5">
            {results.map((food, i) => (
              <button
                key={i}
                onClick={() => addFood(food)}
                className="w-full text-left p-2.5 rounded-xl text-xs transition-colors"
                style={{ background: `${color}10`, hover: { background: `${color}20` } }}
              >
                <div className="font-semibold" style={{ color }}>{food.name}</div>
                <div className="text-gray-500 text-[11px]">{food.benefit}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}