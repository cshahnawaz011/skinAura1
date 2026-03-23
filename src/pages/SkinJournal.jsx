import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Sparkles, Loader2, Trash2, Calendar, Tag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format } from 'date-fns';

const MOOD_EMOJIS = { great: '😄', good: '🙂', neutral: '😐', bad: '😔', terrible: '😫' };
const TAGS = ['Breakout', 'Glowing', 'Dry', 'Oily', 'Sensitive', 'New Product', 'Travel', 'Hormonal', 'Reaction', 'Improvement'];

export default function SkinJournal() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', content: '', mood: 'neutral', tags: [], date: new Date().toISOString().split('T')[0] });
  const [aiLoading, setAiLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['skinJournal', user?.email],
    queryFn: () => base44.entities.SkinJournal.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SkinJournal.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['skinJournal']); setShowForm(false); setForm({ title: '', content: '', mood: 'neutral', tags: [], date: new Date().toISOString().split('T')[0] }); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SkinJournal.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['skinJournal'])
  });

  const aiEnhance = async () => {
    if (!form.content.trim()) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `A user wrote this skin journal entry: "${form.content}". 
Enhance it with:
1. More detailed skin observation notes
2. Possible causes for what they described
3. Suggested actions
Keep it personal and concise. Return just the enhanced text.`
    });
    setForm(f => ({ ...f, content: res }));
    setAiLoading(false);
  };

  const filtered = entries.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.content?.toLowerCase().includes(search.toLowerCase()) ||
    e.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  if (!user) return (
    <div className="max-w-3xl mx-auto">
      <GlassCard className="text-center py-12">
        <BookOpen className="w-12 h-12 text-pink-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Skin Journal</h2>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-amber-500">Sign In</Button>
      </GlassCard>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="w-7 h-7 text-pink-500" /> Skin Journal</h1>
          <p className="text-gray-500 mt-1">Track your skin journey, observations & breakthroughs</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-pink-500 to-amber-500">
          <Plus className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <h3 className="font-bold mb-3">New Journal Entry</h3>
            <div className="space-y-3">
              <Input placeholder="Title (e.g. 'First week with retinol')" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

              <div className="flex gap-2 flex-wrap">
                <p className="w-full text-xs text-gray-500 font-semibold">Mood:</p>
                {Object.entries(MOOD_EMOJIS).map(([val, emoji]) => (
                  <button key={val} onClick={() => setForm(f => ({ ...f, mood: val }))}
                    className={`px-3 py-1 rounded-xl text-sm border-2 transition-all ${form.mood === val ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                    {emoji} {val}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Tags:</p>
                <div className="flex flex-wrap gap-1">
                  {TAGS.map(tag => (
                    <Badge key={tag} onClick={() => setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))}
                      className={`cursor-pointer ${form.tags.includes(tag) ? 'bg-pink-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Textarea placeholder="How does your skin feel? What changed? What products did you use?" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
                <Button size="sm" variant="outline" onClick={aiEnhance} disabled={aiLoading || !form.content} className="absolute bottom-2 right-2 text-xs gap-1">
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Enhance
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => createMutation.mutate({ user_email: user.email, ...form })} disabled={!form.title || !form.content} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">
                  Save Entry
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input placeholder="Search entries..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <GlassCard key={i} className="animate-pulse h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-10">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No journal entries yet. Start documenting your skin journey!</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-lg">{MOOD_EMOJIS[entry.mood] || '📝'}</span>
                      <h3 className="font-bold text-base">{entry.title}</h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {entry.date || format(new Date(entry.created_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {entry.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {entry.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                      </div>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{entry.content}</p>
                  </div>
                  <button onClick={() => deleteMutation.mutate(entry.id)} className="text-gray-300 hover:text-red-400 ml-3 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}