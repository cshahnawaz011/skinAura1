import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Sparkles, Smile, Frown, Meh, Sun, Moon,
  Camera, Trash2, Search, Filter, TrendingUp, Heart, Star,
  AlertCircle, Zap, Calendar, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';

const MOOD_SKIN = [
  { value: 'glowing', emoji: '✨', label: 'Glowing', color: 'bg-amber-400' },
  { value: 'clear', emoji: '😊', label: 'Clear', color: 'bg-emerald-400' },
  { value: 'normal', emoji: '🙂', label: 'Normal', color: 'bg-blue-400' },
  { value: 'dry', emoji: '😕', label: 'Dry/Tight', color: 'bg-orange-400' },
  { value: 'oily', emoji: '💦', label: 'Oily', color: 'bg-yellow-400' },
  { value: 'breakout', emoji: '😤', label: 'Breaking Out', color: 'bg-red-400' },
  { value: 'sensitive', emoji: '🌡️', label: 'Sensitive', color: 'bg-pink-400' },
];

const TRIGGERS = ['Stress', 'Bad Sleep', 'Diet', 'Hormones', 'Weather', 'New Product', 'Exercise', 'Alcohol', 'Dairy', 'Sugar', 'Pollution', 'Travel'];

export default function SkinDiary() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkin, setFilterSkin] = useState('');
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    skin_condition: '',
    triggers: [],
    products_tried: '',
    observations: '',
    photo_notes: '',
    rating: 5,
    title: '',
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const saved = localStorage.getItem('skin-diary-entries');
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  const saveEntry = () => {
    if (!form.title && !form.observations) return;
    const entry = { ...form, id: Date.now().toString(), created: new Date().toISOString() };
    const updated = [entry, ...entries];
    setEntries(updated);
    localStorage.setItem('skin-diary-entries', JSON.stringify(updated));
    setShowForm(false);
    setForm({ date: new Date().toISOString().split('T')[0], skin_condition: '', triggers: [], products_tried: '', observations: '', photo_notes: '', rating: 5, title: '' });
  };

  const deleteEntry = (id) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('skin-diary-entries', JSON.stringify(updated));
  };

  const analyzePatterns = async () => {
    if (entries.length < 2) return;
    setAnalyzing(true);
    const entrySummary = entries.slice(0, 10).map(e => `Date: ${e.date}, Skin: ${e.skin_condition}, Triggers: ${e.triggers?.join(', ')}, Notes: ${e.observations?.slice(0, 100)}`).join('\n');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these skin diary entries and identify patterns, triggers, and trends. Provide actionable insights:\n\n${entrySummary}`,
      response_json_schema: {
        type: 'object',
        properties: {
          main_pattern: { type: 'string' },
          top_triggers: { type: 'array', items: { type: 'string' } },
          positive_factors: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          trend: { type: 'string' }
        }
      }
    });
    setAiInsight(result);
    setAnalyzing(false);
  };

  const toggleTrigger = (t) => {
    setForm(prev => ({
      ...prev,
      triggers: prev.triggers.includes(t) ? prev.triggers.filter(x => x !== t) : [...prev.triggers, t]
    }));
  };

  const filtered = entries.filter(e => {
    const matchSearch = !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.observations?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = !filterSkin || e.skin_condition === filterSkin;
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="w-7 h-7 text-pink-500" /> Skin Diary</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track daily skin observations & discover patterns</p>
        </div>
        <div className="flex gap-2">
          {entries.length >= 2 && (
            <Button variant="outline" onClick={analyzePatterns} disabled={analyzing}>
              {analyzing ? <><Sparkles className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><TrendingUp className="w-4 h-4 mr-2" />Find Patterns</>}
            </Button>
          )}
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-pink-500 to-amber-500">
            <Plus className="w-4 h-4 mr-2" /> New Entry
          </Button>
        </div>
      </div>

      {/* AI Pattern Insight */}
      {aiInsight && (
        <GlassCard className="border-violet-200 dark:border-violet-800">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> Pattern Analysis</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{aiInsight.main_pattern}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-bold text-red-500 mb-1">⚠️ Top Triggers</p>
              {aiInsight.top_triggers?.map((t, i) => <Badge key={i} variant="outline" className="mr-1 mb-1 text-red-500 border-red-200">{t}</Badge>)}
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-500 mb-1">✅ Positive Factors</p>
              {aiInsight.positive_factors?.map((t, i) => <Badge key={i} variant="outline" className="mr-1 mb-1 text-emerald-500 border-emerald-200">{t}</Badge>)}
            </div>
            <div>
              <p className="text-xs font-bold text-blue-500 mb-1">💡 Recommendations</p>
              {aiInsight.recommendations?.slice(0,2).map((r, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400 mb-1">• {r}</p>)}
            </div>
          </div>
        </GlassCard>
      )}

      {/* New Entry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <GlassCard>
              <h3 className="font-bold text-lg mb-4">New Diary Entry</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Entry title..." />
                  <Input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">How does your skin feel?</p>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_SKIN.map(m => (
                      <button key={m.value} onClick={() => setForm(p => ({...p, skin_condition: m.value}))}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${form.skin_condition === m.value ? `${m.color} text-white border-transparent` : 'border-gray-200 dark:border-gray-700'}`}>
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Possible Triggers</p>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map(t => (
                      <Badge key={t} variant={form.triggers.includes(t) ? 'default' : 'outline'}
                        className={`cursor-pointer ${form.triggers.includes(t) ? 'bg-pink-500' : ''}`}
                        onClick={() => toggleTrigger(t)}>{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input value={form.products_tried} onChange={e => setForm(p => ({...p, products_tried: e.target.value}))} placeholder="Products used today..." />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Rating:</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setForm(p => ({...p, rating: n}))}>
                          <Star className={`w-5 h-5 ${n <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Textarea value={form.observations} onChange={e => setForm(p => ({...p, observations: e.target.value}))}
                  placeholder="Detailed observations: texture, new spots, improvements, reactions..." rows={3} />
                <div className="flex gap-2">
                  <Button onClick={saveEntry} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">Save Entry</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter */}
      {entries.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search entries..." className="pl-9" />
          </div>
          <select value={filterSkin} onChange={e => setFilterSkin(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-transparent text-sm">
            <option value="">All conditions</option>
            {MOOD_SKIN.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      )}

      {/* Entries */}
      {filtered.length === 0 ? (
        <GlassCard className="text-center py-12">
          <BookOpen className="w-12 h-12 text-pink-300 mx-auto mb-4" />
          <p className="font-semibold text-lg">Start Your Skin Journey</p>
          <p className="text-gray-500 text-sm mt-1">Track daily observations to uncover what makes your skin glow</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => {
            const skinMood = MOOD_SKIN.find(m => m.value === entry.skin_condition);
            return (
              <GlassCard key={entry.id} animate={false}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold">{entry.title || 'Skin Entry'}</h3>
                      {skinMood && (
                        <span className={`px-2 py-0.5 rounded-full text-xs text-white ${skinMood.color}`}>{skinMood.emoji} {skinMood.label}</span>
                      )}
                      <span className="text-xs text-gray-400">{format(new Date(entry.date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                      <div className="flex">{[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${n <= entry.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}</div>
                    </div>
                    {entry.observations && <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{entry.observations}</p>}
                    {entry.triggers?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.triggers.map(t => <Badge key={t} variant="outline" className="text-xs text-red-500 border-red-200">{t}</Badge>)}
                      </div>
                    )}
                    {entry.products_tried && <p className="text-xs text-gray-500 mt-1">Products: {entry.products_tried}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}