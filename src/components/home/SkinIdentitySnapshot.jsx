import React from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

function ScoreRing({ score }) {
  const r = 40, circ = 2 * Math.PI * r;
  const pct = score / 100;
  return (
    <svg width="100" height="100" className="rotate-[-90deg]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(100,200,200,0.1)" strokeWidth="6" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="url(#healthGrad)" strokeWidth="6"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      <defs>
        <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const SKIN_MOODS = {
  glowing: { icon: '✨', color: 'text-amber-500', label: 'Glowing' },
  dehydrated: { icon: '💧', color: 'text-cyan-500', label: 'Dehydrated' },
  stressed: { icon: '⚡', color: 'text-red-500', label: 'Stressed' },
  balanced: { icon: '🌿', color: 'text-emerald-500', label: 'Balanced' },
};

export default function SkinIdentitySnapshot({ skinAnalysis, loading }) {
  const score = skinAnalysis?.overall_score || 0;
  const skinType = skinAnalysis?.skin_type || 'unknown';
  
  // Determine skin mood based on analysis
  const determineSkinMood = () => {
    if (!skinAnalysis) return 'balanced';
    if (skinAnalysis.dryness > 6) return 'dehydrated';
    if (skinAnalysis.redness > 6 || skinAnalysis.sensitivity > 6) return 'stressed';
    if (score > 75) return 'glowing';
    return 'balanced';
  };
  
  const mood = determineSkinMood();
  const moodData = SKIN_MOODS[mood];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <div className="p-8 rounded-3xl backdrop-blur-md" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,248,246,0.9) 100%)',
        border: '1px solid rgba(244,114,182,0.15)',
        boxShadow: '0 8px 32px rgba(244,114,182,0.08), inset 0 1px 2px rgba(255,255,255,0.8)'
      }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Skin Health Status</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900">{score}</span>
              <span className="text-xl text-gray-400 font-semibold">/100</span>
            </div>
            <p className="text-sm text-gray-600 capitalize mt-2 font-medium">{skinType} Skin</p>
          </div>
          <div className="relative flex-shrink-0">
            <ScoreRing score={score} />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              {loading ? '...' : moodData.icon}
            </div>
          </div>
        </div>

        {/* Skin Mood */}
        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(196,181,253,0.08))', border: '1px solid rgba(244,114,182,0.1)' }}>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Current Mood</p>
          <p className={`text-lg font-bold ${moodData.color}`}>{moodData.label}</p>
        </div>

        {/* Last Scan */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-gray-500 font-semibold">Last Scan</p>
          <p className="text-xs text-gray-700 font-medium">{skinAnalysis ? new Date(skinAnalysis.analysis_date).toLocaleDateString() : 'Never'}</p>
        </div>

        {/* Primary CTA */}
        <Link to="/SkinAnalysis">
          <button className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:shadow-lg active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)',
              boxShadow: '0 8px 24px rgba(244,114,182,0.3)'
            }}>
            <Camera className="w-4 h-4 inline mr-2" />
            {skinAnalysis ? 'Update Scan' : 'Analyze Now'}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}