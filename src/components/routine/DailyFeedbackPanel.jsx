import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Check, Loader2, PenLine } from 'lucide-react';
import { format } from 'date-fns';

const FEEDBACK_OPTIONS = [
  { code: 1,  emoji: '😊', label: 'Comfortable & balanced', signal: 'positive' },
  { code: 2,  emoji: '✨', label: 'More glowing',           signal: 'positive' },
  { code: 3,  emoji: '💧', label: 'Slight dryness',         signal: 'mild_damage' },
  { code: 4,  emoji: '🏜️', label: 'Very dry / flaky',       signal: 'high_damage' },
  { code: 5,  emoji: '⚠️', label: 'Mild irritation',        signal: 'mild_damage' },
  { code: 6,  emoji: '🔥', label: 'Burning / stinging',     signal: 'high_damage' },
  { code: 7,  emoji: '💦', label: 'More oily',              signal: 'oil' },
  { code: 8,  emoji: '➖', label: 'No change',              signal: 'neutral' },
  { code: 9,  emoji: '🔴', label: 'New pimples',            signal: 'breakout' },
  { code: 10, emoji: '😰', label: 'Acne worsening',         signal: 'breakout' },
];

const SIGNAL_COLORS = {
  positive:    'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  mild_damage: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  high_damage: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  oil:         'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  neutral:     'border-gray-300 bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400',
  breakout:    'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
};

export default function DailyFeedbackPanel({ userEmail, todayFeedback, onFeedbackSaved }) {
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimer = useRef(null);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (todayFeedback) {
      if (todayFeedback.feedback_codes?.length) setSelected(todayFeedback.feedback_codes);
      if (todayFeedback.notes) setNotes(todayFeedback.notes);
    }
  }, [todayFeedback]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      todayFeedback?.id
        ? base44.entities.SkinFeedback.update(todayFeedback.id, data)
        : base44.entities.SkinFeedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['skinFeedback']);
      setSaved(true);
      setAutoSaving(false);
      setTimeout(() => setSaved(false), 2500);
      onFeedbackSaved?.();
    },
  });

  const doSave = (codes, notesText) => {
    if (!codes.length && !notesText.trim()) return;
    saveMutation.mutate({
      user_email: userEmail,
      date: today,
      feedback_codes: codes,
      notes: notesText,
    });
  };

  const toggle = (code) => {
    const next = selected.includes(code)
      ? selected.filter(c => c !== code)
      : [...selected, code];
    setSelected(next);
    // auto-save immediately on toggle
    doSave(next, notes);
  };

  // Auto-save notes after 1.5s of no typing
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    setAutoSaving(true);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      doSave(selected, val);
    }, 1500);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
        📋 How does your skin feel today?{' '}
        <span className="font-normal text-gray-400">(select all that apply — auto-saves)</span>
      </p>

      {/* Quick-select chips */}
      <div className="grid grid-cols-2 gap-2">
        {FEEDBACK_OPTIONS.map(opt => {
          const isSelected = selected.includes(opt.code);
          return (
            <button
              key={opt.code}
              onClick={() => toggle(opt.code)}
              disabled={saveMutation.isPending}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? SIGNAL_COLORS[opt.signal]
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <span className="text-base flex-shrink-0">{opt.emoji}</span>
              <span className="font-medium text-xs leading-tight">{opt.label}</span>
              {isSelected && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Manual notes input — auto-saves */}
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1.5">
          <PenLine className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Additional notes{' '}
            <span className="font-normal">(auto-saves as you type)</span>
          </p>
        </div>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="e.g. Tried new cleanser today, slight tingling around nose..."
          rows={3}
          className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-white/5 px-3 py-2.5 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
        />
        {/* Auto-save indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          {autoSaving && !saved && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> saving...
            </span>
          )}
          {saved && (
            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
              <Check className="w-3 h-3" /> saved
            </span>
          )}
        </div>
      </div>

      {/* Manual submit (still available) */}
      <Button
        onClick={() => doSave(selected, notes)}
        disabled={(!selected.length && !notes.trim()) || saveMutation.isPending || saved}
        className="w-full bg-gradient-to-r from-pink-500 to-amber-500"
      >
        {saveMutation.isPending
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          : saved
          ? <><Check className="w-4 h-4 mr-2" />Saved! Routine Adapting...</>
          : 'Submit Feedback & Adapt Routine'}
      </Button>
    </div>
  );
}