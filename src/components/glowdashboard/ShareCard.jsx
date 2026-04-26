import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share2, Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function ShareCard({ score, streak, badge, userName, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const bg = score >= 75
    ? 'linear-gradient(135deg, #10b981, #06b6d4)'
    : score >= 50
    ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
    : 'linear-gradient(135deg, #f43f5e, #a855f7)';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = 'SkinAura-Score.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {}
    setDownloading(false);
  };

  const handleCopy = () => {
    const text = `🌟 My Glow Score today is ${score}/100! Streak: ${streak} days 🔥 #SkinAura #SkincareRoutine\n${window.location.origin}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-4 w-full max-w-sm">

        {/* Downloadable Card */}
        <div
          ref={cardRef}
          style={{
            width: '100%',
            borderRadius: 28,
            padding: 3,
            background: bg,
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{
            background: 'linear-gradient(145deg, #fff5f8, #fdf4ff, #fffbf0)',
            borderRadius: 26,
            padding: '28px 24px',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
              <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover' }} alt="SkinAura" />
              <span style={{ fontWeight: 900, fontSize: 20, color: '#1f2937' }}>SkinAura</span>
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 20 }}>{format(new Date(), 'EEEE, MMM d yyyy')}</p>

            {/* Score */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 80, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600, marginTop: 4 }}>Glow Score / 100</div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f97316' }}>🔥{streak}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Day Streak</div>
              </div>
              {badge && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>{badge.emoji}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{badge.label}</div>
                </div>
              )}
            </div>

            {/* Username */}
            <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginBottom: 8 }}>
              "{userName ? `@${userName.split(' ')[0]}` : 'Glowing'}'s Daily Report"
            </p>
            <div style={{ fontSize: 11, color: '#d1d5db' }}>#SkinAura #SkincareRoutine #GlowUp</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold"
          >
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {downloading ? 'Saving...' : 'Download'}
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1"
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Share2 className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button variant="outline" onClick={onClose} className="px-4">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400">📲 Download & share on Instagram, TikTok, WhatsApp</p>
      </div>
    </motion.div>
  );
}