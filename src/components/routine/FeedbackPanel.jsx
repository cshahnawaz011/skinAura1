import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const FEEDBACK_OPTIONS = [
  { code: 1,  emoji: '😊', label: 'Comfortable',      signal: 'good',    color: '#34d399' },
  { code: 2,  emoji: '✨', label: 'More Glowing',     signal: 'good',    color: '#34d399' },
  { code: 7,  emoji: '💧', label: 'Hydrated',         signal: 'good',    color: '#38bdf8' },
  { code: 8,  emoji: '😐', label: 'No Change',        signal: 'neutral', color: '#9ca3af' },
  { code: 3,  emoji: '🌵', label: 'Slight Dryness',   signal: 'caution', color: '#fb923c' },
  { code: 4,  emoji: '❄️', label: 'Very Dry/Flaky',   signal: 'bad',     color: '#ef4444' },
  { code: 5,  emoji: '🔥', label: 'Mild Irritation',  signal: 'bad',     color: '#ef4444' },
  { code: 6,  emoji: '⚡', label: 'Burning/Stinging', signal: 'bad',     color: '#dc2626' },
  { code: 9,  emoji: '🔴', label: 'New Pimples',      signal: 'bad',     color: '#ef4444' },
  { code: 10, emoji: '💥', label: 'Acne Worsening',   signal: 'bad',     color: '#dc2626' },
  { code: 11, emoji: '🌿', label: 'Less Redness',     signal: 'good',    color: '#34d399' },
  { code: 12, emoji: '🏔️', label: 'Oilier Than Usual',signal: 'caution', color: '#f59e0b' },
];

export default function FeedbackPanel({ user, routineData, onFeedbackSaved }) {
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (code) => setSelected(s => s.includes(code) ? s.filter(c => c !== code) : [...s, code]);

  const handleSave = async () => {
    if (!user || selected.length === 0) return;
    setSaving(true);
    await base44.entities.SkinFeedback.create({
      user_email: user.email,
      date: format(new Date(), 'yyyy-MM-dd'),
      feedback_codes: selected,
      notes,
      routine_day_type: routineData?.dayType || 'recovery',
      concentration_level: 'fixed',
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    onFeedbackSaved?.(selected, notes);
    setSelected([]);
    setNotes('');
  };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.95)', border: '1.5px solid rgba(244,114,182,0.2)', boxShadow: '0 4px 20px rgba(244,114,182,0.08)' }}>
      <div>
        <p className="font-black text-sm text-gray-800 mb-0.5">📊 How's Your Skin Today?</p>
        <p className="text-[10px] text-gray-400">Your feedback auto-adjusts the routine frequency in real time</p>
      </div>

      {/* Feedback chips */}
      <div className="grid grid-cols-3 gap-1.5">
        {FEEDBACK_OPTIONS.map((opt) => {
          const isOn = selected.includes(opt.code);
          return (
            <motion.button
              key={opt.code}
              whileTap={{ scale: 0.92 }}
              onClick={() => toggle(opt.code)}
              className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center transition-all"
              style={{
                background: isOn ? `${opt.color}20` : 'rgba(0,0,0,0.03)',
                border: `1.5px solid ${isOn ? opt.color : 'transparent'}`,
              }}
            >
              <span className="text-lg leading-none">{opt.emoji}</span>
              <span className="text-[9px] font-bold leading-tight" style={{ color: isOn ? opt.color : '#9ca3af' }}>{opt.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Add any notes (weather, diet, sleep, stress)..."
        rows={2}
        className="w-full text-xs rounded-xl px-3 py-2 resize-none outline-none"
        style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}
      />

      <button
        onClick={handleSave}
        disabled={saving || selected.length === 0 || !user}
        className="w-full py-2.5 rounded-xl font-black text-sm text-white transition-all disabled:opacity-50"
        style={{ background: saved ? '#34d399' : 'linear-gradient(135deg,#f472b6,#a78bfa)' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : saved ? <><CheckCircle className="w-4 h-4 inline mr-1" /> Saved & Routine Adjusted</> : 'Save Feedback & Adapt Routine'}
      </button>

      {!user && <p className="text-[10px] text-center text-gray-400">Sign in to save feedback and enable real-time adaptation</p>}
    </div>
  );
}