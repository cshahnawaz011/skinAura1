import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, TrendingUp, Target, AlertCircle, Lightbulb } from 'lucide-react';
import PageIntroPopup from '@/components/PageIntroPopup';
import ScienceBasedAMRoutine from '@/components/routine/ScienceBasedAMRoutine';
import ScienceBasedPMRoutine from '@/components/routine/ScienceBasedPMRoutine';
import ToleranceProgressionGuide from '@/components/routine/ToleranceProgressionGuide';
import ProgressMilestones from '@/components/routine/ProgressMilestones';

export default function SkinRoutine() {
  const [activeTab, setActiveTab] = useState('am');

  const tabs = [
    { key: 'am', label: 'Morning Routine', emoji: '☀️', icon: Sun },
    { key: 'pm', label: 'Evening Routine', emoji: '🌙', icon: Moon },
    { key: 'progression', label: 'Tolerance Building', emoji: '📈', icon: TrendingUp },
    { key: 'milestones', label: 'Progress Tracking', emoji: '🎯', icon: Target },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      <PageIntroPopup
        storageKey="intro_SkinRoutine_v2"
        emoji="🧴"
        title="Science-Based Skincare Routine"
        accentColor="#f472b6"
        description="A complete AM/PM skincare system designed for long-term skin health, gradual tolerance building, and measurable results. Start with gentle fundamentals and progressively introduce active ingredients safely."
        tips={[
          { icon: '🔬', title: 'Evidence-Based Actives', text: 'Learn which ingredients (retinoids, exfoliants, antioxidants) work for your skin and how to use them safely.' },
          { icon: '⏱️', title: 'Tolerance Progression', text: 'Discover the 4-phase system: patch test → frequency increase → stabilization → optimization over 8+ weeks.' },
          { icon: '📸', title: 'Track Real Progress', text: 'Monthly check-ins and photos reveal improvements in texture, clarity, hydration, and barrier strength.' },
        ]}
      />

      {/* Header */}
      <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#fff5fb,#f5f0ff)', border: '1px solid rgba(244,114,182,0.18)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
        <div className="p-6">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Science-Based Skincare Routine</h1>
          <p className="text-sm text-gray-500 mb-4">
            Evidence-driven AM/PM system with active ingredient guidance, tolerance progression, and monthly milestones.
          </p>

          {/* Key Principles */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Start Low', desc: 'Low concentration' },
              { label: 'Go Slow', desc: 'Gradual frequency' },
              { label: 'Stay Safe', desc: 'Barrier support' },
            ].map((p) => (
              <div key={p.label} className="px-3 py-2 rounded-xl bg-white/70 border border-white/50">
                <p className="text-xs font-black text-gray-800">{p.label}</p>
                <p className="text-[10px] text-gray-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.03)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? '#f472b6' : '#9ca3af',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'am' && (
          <motion.div key="am" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScienceBasedAMRoutine />
          </motion.div>
        )}

        {activeTab === 'pm' && (
          <motion.div key="pm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ScienceBasedPMRoutine />
          </motion.div>
        )}

        {activeTab === 'progression' && (
          <motion.div key="progression" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ToleranceProgressionGuide />
          </motion.div>
        )}

        {activeTab === 'milestones' && (
          <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProgressMilestones />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical Guidelines Box */}
      <div className="rounded-2xl p-4 border border-red-200" style={{ background: 'rgba(239,68,68,0.05)' }}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-sm text-red-700 mb-2">⚠️ Golden Rules of Active Ingredient Use</p>
            <ul className="text-xs text-red-600 space-y-1.5">
              <li><strong>1. Patch Test First:</strong> Apply treatment to small area (jawline or behind ear) for 1 week before full face use.</li>
              <li><strong>2. Never Double-Active:</strong> Do NOT use retinoid + exfoliant on the same night. Choose ONE per treatment night.</li>
              <li><strong>3. Recovery Nights Essential:</strong> Maintain 2–4 hydration-only recovery nights every week. This is where the magic happens.</li>
              <li><strong>4. Sunscreen Non-Negotiable:</strong> Active ingredients increase photosensitivity. Daily SPF 30+ is required.</li>
              <li><strong>5. Stop If Severely Irritated:</strong> Red, burning, painful texture = pause treatment for 1–2 weeks. Restart at HALF the frequency.</li>
              <li><strong>6. No Comparison Culture:</strong> Skin timelines vary. Someone's 4-week transformation may be your 8-week journey. Trust the process.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ / Tips */}
      <div className="rounded-2xl p-4 border border-blue-200" style={{ background: 'rgba(59,130,246,0.05)' }}>
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-sm text-blue-700 mb-2">💡 Quick Reference: Common Questions</p>
            <div className="space-y-2 text-xs text-blue-800">
              <div>
                <strong>Q: What's the difference between treatment and recovery nights?</strong>
                <p className="text-blue-700 mt-0.5">Treatment nights introduce actives (retinoids, exfoliants) to drive change. Recovery nights focus on hydration and barrier repair—this is when your skin adapts and heals.</p>
              </div>
              <div>
                <strong>Q: How do I know if I'm irritated vs. experiencing normal adjustment?</strong>
                <p className="text-blue-700 mt-0.5">Normal: Light flaking, slight dryness, mild redness that resolves within 48 hours. Concerning: Persistent redness, burning sensation, painful texture, or dryness that doesn't improve.</p>
              </div>
              <div>
                <strong>Q: Can I use multiple actives?</strong>
                <p className="text-blue-700 mt-0.5">Yes, but NOT on the same night. Example: Vitamin C in AM, retinoid on Monday/Wednesday/Friday nights. Vitamin C is stable with other antioxidants in AM routine.</p>
              </div>
              <div>
                <strong>Q: When can I upgrade to higher concentration?</strong>
                <p className="text-blue-700 mt-0.5">After 6–8 weeks of consistent use at lower concentration with no irritation. Start at 0.25–0.5% retinol or 2–3% BHA; upgrade to 1% retinol or 5–10% BHA only after adaptation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign-off */}
      <div className="text-center p-4 rounded-2xl" style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)' }}>
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>Remember:</strong> Skincare is a marathon, not a sprint. Consistency, patience, and evidence-based practices yield the best long-term results. 
          Your skin is unique—adjust frequency and concentration based on YOUR tolerance, not someone else's timeline. 🌱
        </p>
      </div>
    </div>
  );
}