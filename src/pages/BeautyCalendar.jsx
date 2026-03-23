import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Calendar, Plus, Check, Trash2, Bell, Sparkles, Clock,
  ChevronLeft, ChevronRight, Star, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

const EVENT_TYPES = [
  { value: 'facial', label: '💆 Facial', color: 'bg-pink-400' },
  { value: 'exfoliate', label: '✨ Exfoliation', color: 'bg-amber-400' },
  { value: 'mask', label: '🧖 Face Mask', color: 'bg-violet-400' },
  { value: 'dermapen', label: '💉 Dermapen', color: 'bg-red-400' },
  { value: 'peel', label: '🌿 Peel', color: 'bg-emerald-400' },
  { value: 'product_change', label: '🔄 New Product', color: 'bg-blue-400' },
  { value: 'appointment', label: '👨‍⚕️ Derm Visit', color: 'bg-indigo-400' },
  { value: 'period', label: '🔴 Period', color: 'bg-rose-500' },
  { value: 'custom', label: '📝 Custom', color: 'bg-gray-400' },
];

const RECURRING_SUGGESTIONS = [
  { title: 'Retinol Application', frequency: 'Mon, Wed, Fri nights', type: 'custom', note: '3x/week retinol for anti-aging' },
  { title: 'Exfoliation', frequency: 'Every Tuesday & Saturday', type: 'exfoliate', note: 'AHA/BHA 2x per week' },
  { title: 'Clay Face Mask', frequency: 'Every Sunday', type: 'mask', note: 'Weekly deep pore cleansing' },
  { title: 'Collagen Supplement', frequency: 'Daily', type: 'custom', note: 'Morning with vitamin C' },
  { title: 'Dermapen Session', frequency: 'Monthly', type: 'dermapen', note: 'Professional treatment' },
];

export default function BeautyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'custom', note: '', reminder: true });
  const [generating, setGenerating] = useState(false);
  const [aiSchedule, setAiSchedule] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('beauty-calendar-events');
    if (saved) setEvents(JSON.parse(saved));
  }, []);

  const saveEvents = (updated) => {
    setEvents(updated);
    localStorage.setItem('beauty-calendar-events', JSON.stringify(updated));
  };

  const addEvent = () => {
    if (!form.title || !selectedDate) return;
    const event = {
      id: Date.now().toString(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      ...form
    };
    saveEvents([...events, event]);
    setShowForm(false);
    setForm({ title: '', type: 'custom', note: '', reminder: true });
  };

  const deleteEvent = (id) => saveEvents(events.filter(e => e.id !== id));

  const addSuggestion = (suggestion) => {
    const today = new Date();
    const event = {
      id: Date.now().toString(),
      date: format(today, 'yyyy-MM-dd'),
      title: suggestion.title,
      type: suggestion.type,
      note: suggestion.note,
      recurring: suggestion.frequency,
      reminder: true
    };
    saveEvents([...events, event]);
  };

  const generateAICalendar = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: 'Create an optimal monthly beauty calendar for someone with combination skin wanting to improve their skin health. Include treatments, product rotations, and lifestyle reminders with specific dates and frequencies.',
      response_json_schema: {
        type: 'object',
        properties: {
          monthly_theme: { type: 'string' },
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                week: { type: 'number' },
                day_of_week: { type: 'string' },
                treatment: { type: 'string' },
                why: { type: 'string' },
                duration: { type: 'string' }
              }
            }
          },
          monthly_goals: { type: 'array', items: { type: 'string' } }
        }
      }
    });
    setAiSchedule(result);
    setGenerating(false);
  };

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const selectedEvents = selectedDate ? events.filter(e => e.date === format(selectedDate, 'yyyy-MM-dd')) : [];
  const todayEvents = events.filter(e => e.date === format(new Date(), 'yyyy-MM-dd'));

  const getEventTypeConfig = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Calendar className="w-7 h-7 text-pink-500" />Beauty Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Schedule treatments, track routines, never miss a beat</p>
        </div>
        <Button onClick={generateAICalendar} disabled={generating} className="bg-gradient-to-r from-violet-500 to-pink-500">
          {generating ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          AI Schedule Month
        </Button>
      </div>

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
          <p className="text-sm font-bold text-pink-500 mb-2">📅 Today</p>
          <div className="flex flex-wrap gap-2">
            {todayEvents.map(e => {
              const tc = getEventTypeConfig(e.type);
              return <Badge key={e.id} className={`${tc.color} text-white`}>{e.title}</Badge>;
            })}
          </div>
        </GlassCard>
      )}

      {/* Calendar */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-bold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
          {monthDays.map(day => {
            const dayEvents = events.filter(e => e.date === format(day, 'yyyy-MM-dd'));
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            return (
              <button key={day.toString()} onClick={() => { setSelectedDate(day); setShowForm(false); }}
                className={`relative aspect-square flex flex-col items-center justify-start p-1 rounded-xl transition-all text-sm
                  ${isSelected ? 'bg-pink-500 text-white' : isCurrentDay ? 'bg-pink-100 dark:bg-pink-900/30 font-bold' : 'hover:bg-white/50 dark:hover:bg-white/10'}`}>
                <span className="text-xs">{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                    {dayEvents.slice(0, 3).map(e => {
                      const tc = getEventTypeConfig(e.type);
                      return <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${tc.color}`} />;
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Selected Day Events */}
      {selectedDate && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{format(selectedDate, 'EEEE, MMMM d')}</h3>
            <Button size="sm" onClick={() => setShowForm(true)} className="bg-gradient-to-r from-pink-500 to-amber-500">
              <Plus className="w-3 h-3 mr-1" /> Add Event
            </Button>
          </div>
          {showForm && (
            <div className="space-y-3 mb-4 p-3 bg-white/50 dark:bg-white/5 rounded-xl">
              <Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Event title..." />
              <div className="grid grid-cols-2 gap-2">
                {EVENT_TYPES.map(type => (
                  <button key={type.value} onClick={() => setForm(p => ({...p, type: type.value}))}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all ${form.type === type.value ? `${type.color} text-white border-transparent` : 'border-gray-200 dark:border-gray-700'}`}>
                    {type.label}
                  </button>
                ))}
              </div>
              <Input value={form.note} onChange={e => setForm(p => ({...p, note: e.target.value}))} placeholder="Notes..." />
              <div className="flex gap-2">
                <Button onClick={addEvent} className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500">Add</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No events. Tap + to add a beauty event.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(event => {
                const tc = getEventTypeConfig(event.type);
                return (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 rounded-xl">
                    <span className={`w-3 h-3 rounded-full ${tc.color} flex-shrink-0`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      {event.note && <p className="text-xs text-gray-500">{event.note}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteEvent(event.id)} className="text-red-400 h-7 w-7 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* AI Schedule */}
      {aiSchedule && (
        <GlassCard>
          <h3 className="font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" />{aiSchedule.monthly_theme}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {aiSchedule.events?.map((e, i) => (
              <div key={i} className="flex items-start gap-3 p-2 bg-white/40 dark:bg-white/5 rounded-xl">
                <Badge variant="outline" className="text-xs">Week {e.week} {e.day_of_week}</Badge>
                <div>
                  <p className="text-sm font-medium">{e.treatment}</p>
                  <p className="text-xs text-gray-500">{e.why}</p>
                </div>
                <span className="text-xs text-gray-400 ml-auto">{e.duration}</span>
              </div>
            ))}
          </div>
          {aiSchedule.monthly_goals?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs font-bold text-pink-500 mb-1">Monthly Goals</p>
              {aiSchedule.monthly_goals.map((g, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-300">• {g}</p>)}
            </div>
          )}
        </GlassCard>
      )}

      {/* Recurring Suggestions */}
      <GlassCard>
        <h3 className="font-bold mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-amber-400" />Recommended Treatments</h3>
        <div className="space-y-2">
          {RECURRING_SUGGESTIONS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 rounded-xl">
              <div className="flex-1">
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-gray-500">{s.frequency}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => addSuggestion(s)}><Plus className="w-3 h-3 mr-1" />Add</Button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}