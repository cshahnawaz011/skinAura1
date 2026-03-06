import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, X, Sparkles, Instagram, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// The visual card that gets captured as image
export function ShareCardCanvas({ analysis, userName, forwardRef }) {
  const concerns = [
    { label: 'Acne', value: analysis?.acne_level ?? 0, emoji: '🔴' },
    { label: 'Dark Spots', value: analysis?.dark_spots ?? 0, emoji: '🎯' },
    { label: 'Oiliness', value: analysis?.oiliness ?? 0, emoji: '✨' },
    { label: 'Dryness', value: analysis?.dryness ?? 0, emoji: '🏜️' },
  ];

  const score = analysis?.overall_score ?? 0;
  const grade = score >= 85 ? 'Excellent ✨' : score >= 70 ? 'Good 👍' : score >= 50 ? 'Moderate 🌱' : 'Needs Care 💪';
  const skinType = analysis?.skin_type ? analysis.skin_type.charAt(0).toUpperCase() + analysis.skin_type.slice(1) : 'Unknown';

  return (
    <div
      ref={forwardRef}
      style={{
        width: '400px',
        background: 'linear-gradient(135deg, #fff5f7 0%, #fdf2ff 50%, #fff9e6 100%)',
        borderRadius: '24px',
        padding: '32px',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(251, 182, 206, 0.3)' }} />
      <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(167, 243, 208, 0.3)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, position: 'relative' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #f472b6, #fbbf24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18
        }}>✨</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(90deg, #d4a853, #f5e3a0, #d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GlowAI</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>My Skin Report</div>
        </div>
      </div>

      {/* Score circle */}
      <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative' }}>
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: 130, height: 130, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f472b6, #fbbf24)',
          boxShadow: '0 8px 30px rgba(244, 114, 182, 0.4)',
        }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>/100</div>
        </div>
        <div style={{ marginTop: 10, fontSize: 16, fontWeight: 700, color: '#374151' }}>{grade}</div>
        <div style={{
          display: 'inline-block', marginTop: 4, padding: '3px 14px',
          borderRadius: 999, background: 'rgba(244,114,182,0.12)',
          fontSize: 13, fontWeight: 600, color: '#db2777'
        }}>
          {skinType} Skin
        </div>
      </div>

      {/* Concern bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {concerns.map((c) => {
          const pct = Math.round((c.value / 10) * 100);
          const color = c.value <= 3 ? '#10b981' : c.value <= 6 ? '#f59e0b' : '#ef4444';
          return (
            <div key={c.label} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{c.emoji} {c.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{c.value}/10</span>
              </div>
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* User & CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #f472b6, #fbbf24)',
        borderRadius: 14, padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>Analyzed by</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{userName || 'GlowAI User'}</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', textAlign: 'right' }}>
          <div style={{ fontWeight: 700 }}>GlowAI.app</div>
          <div>#GlowAI #SkinScore</div>
        </div>
      </div>
    </div>
  );
}

export default function GlowShareCard({ analysis, userName }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const downloadImage = async () => {
    setDownloading(true);
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = 'GlowAI-MySkinScore.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  };

  if (!analysis) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="bg-gradient-to-r from-pink-500 to-amber-500 gap-2"
      >
        <Share2 className="w-4 h-4" /> Share My Score
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Share Your Glow Score 🌸</h3>
                  <p className="text-sm text-gray-500">Download & post on Instagram, TikTok or Facebook</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Card Preview */}
              <div className="flex justify-center mb-5 overflow-hidden">
                <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center', marginBottom: '-48px' }}>
                  <ShareCardCanvas analysis={analysis} userName={userName} forwardRef={cardRef} />
                </div>
              </div>

              {/* Social hints */}
              <div className="flex gap-2 mb-4 flex-wrap justify-center">
                {['#GlowAI', '#SkinScore', '#SkincareRoutine', '#GlowUp'].map(tag => (
                  <span key={tag} className="text-xs bg-pink-50 dark:bg-pink-900/20 text-pink-600 px-2 py-1 rounded-full font-medium">{tag}</span>
                ))}
              </div>

              <Button
                onClick={downloadImage}
                disabled={downloading}
                className="w-full bg-gradient-to-r from-pink-500 to-amber-500 text-white font-semibold py-5 text-base"
              >
                {downloading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Preparing Image...</>
                ) : (
                  <><Download className="w-5 h-5 mr-2" /> Download & Share</>
                )}
              </Button>
              <p className="text-center text-xs text-gray-400 mt-3">
                📲 Post on TikTok, Instagram, or Facebook with #GlowAI
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}