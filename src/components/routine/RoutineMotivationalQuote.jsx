import React from 'react';
import { Sparkles } from 'lucide-react';

const QUOTES = [
  { text: '"Consistency is the secret ingredient no product can replace."', author: 'Skin Truth' },
  { text: '"Your skin is rewriting itself every 28 days. Make sure the story changes."', author: 'Dermatology Wisdom' },
  { text: '"Great skin is not a destination — it\'s a daily decision."', author: 'SkinAura' },
  { text: '"Less products, more patience. That\'s the barrier-first promise."', author: 'Routine Science' },
  { text: '"Every feedback logged is a signal your skin sent — listen to it."', author: 'Adaptive Care' },
];

export default function RoutineMotivationalQuote() {
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  return (
    <div className="rounded-2xl p-5 text-center"
      style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.12))', border: '1.5px solid rgba(244,114,182,0.2)' }}>
      <Sparkles className="w-5 h-5 text-pink-400 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-700 italic leading-relaxed mb-2">{quote.text}</p>
      <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">— {quote.author}</p>
    </div>
  );
}