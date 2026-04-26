import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const QUOTES = [
  { text: "We can't help everyone, but everyone can help someone.", author: "Ronald Reagan" },
  { text: "It is better to fail in originality than to succeed in imitation.", author: "Herman Melville" },
  { text: "Consistency is the most powerful skincare ingredient.", author: "SkinAura" },
  { text: "Small habits, done daily, create lasting transformation.", author: "SkinAura" },
  { text: "Your skin is a reflection of your inner health.", author: "SkinAura" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Glow from the inside out — nourish, rest, repeat.", author: "SkinAura" },
];

const todayQuote = QUOTES[new Date().getDay() % QUOTES.length];

export default function SkinLogSection({ log, updateField }) {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField('skin_log_photo', file_url);
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      {/* Daily Quote */}
      <div className="rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg,rgba(244,114,182,0.1),rgba(167,139,250,0.1))', border: '1.5px solid rgba(244,114,182,0.2)' }}>
        <p className="text-base font-black text-gray-700 leading-relaxed">"{todayQuote.text}"</p>
        <p className="text-xs text-gray-400 mt-1">— {todayQuote.author}</p>
      </div>

      {/* Skin Analysis Log */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'linear-gradient(145deg,#faf5ff,#f3e8ff)', border: '1.5px solid rgba(168,85,247,0.2)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
            🔬
          </div>
          <p className="font-black text-sm">Skin & Reflection Log</p>
        </div>

        <div>
          <label className="text-[10px] font-bold text-purple-500 mb-1 block">📝 Gathered's Prompt (morning reflection)</label>
          <textarea value={log.gathered_prompt || ''} onChange={e => updateField('gathered_prompt', e.target.value)}
            rows={2} placeholder="What are you grateful for today? How is your skin feeling?"
            className="w-full rounded-xl border border-purple-200 px-3 py-2 text-xs bg-white resize-none focus:outline-none focus:border-purple-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-purple-500 mb-1 block">⚡ Challenging Prompt (evening reflection)</label>
          <textarea value={log.challenging_prompt || ''} onChange={e => updateField('challenging_prompt', e.target.value)}
            rows={2} placeholder="What challenged you today? What will you do differently?"
            className="w-full rounded-xl border border-purple-200 px-3 py-2 text-xs bg-white resize-none focus:outline-none focus:border-purple-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-purple-500 mb-1 block">⚠️ Quality Issues Log</label>
          <textarea value={log.quality_issues || ''} onChange={e => updateField('quality_issues', e.target.value)}
            rows={2} placeholder="Any skin quality issues, app issues, or observations..."
            className="w-full rounded-xl border border-purple-200 px-3 py-2 text-xs bg-white resize-none focus:outline-none focus:border-purple-400" />
        </div>

        {/* Photo upload */}
        <div>
          <label className="text-[10px] font-bold text-purple-500 mb-1 block">📸 Skin Log Photo (optional)</label>
          {log.skin_log_photo ? (
            <div className="relative">
              <img src={log.skin_log_photo} alt="Skin log" className="w-full h-36 object-cover rounded-xl" />
              <button onClick={() => updateField('skin_log_photo', null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-black">✕</button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-purple-200 cursor-pointer hover:border-purple-400 transition-colors bg-white">
              {uploading ? <Loader2 className="w-6 h-6 text-purple-400 animate-spin" /> : <Camera className="w-6 h-6 text-purple-400" />}
              <span className="text-xs text-purple-500 font-semibold">{uploading ? 'Uploading...' : 'Tap to add skin photo'}</span>
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </div>

        {/* 24hr badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <span className="text-2xl">🏅</span>
          <div>
            <p className="text-xs font-black text-purple-700">24-Hour Memory Badge</p>
            <p className="text-[10px] text-purple-400">Log every day for 24hrs straight to earn this badge!</p>
          </div>
        </div>
      </div>
    </div>
  );
}