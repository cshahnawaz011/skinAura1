import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Camera, Zap, Sparkles, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    step: 1,
    icon: Camera,
    title: 'Skin Analysis',
    desc: 'अपनी त्वचा का AI-आधारित गहरा मूल्यांकन करें',
    page: 'SkinAnalysis',
    color: 'from-pink-400 to-rose-400',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
  },
  {
    step: 2,
    icon: Zap,
    title: 'AI Insights',
    desc: 'Celebrity match, acne risk, diet & stress analysis',
    page: 'AiInsights',
    color: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
  },
  {
    step: 3,
    icon: Sparkles,
    title: 'Routine + Products',
    desc: 'AI-जेनरेटेड रूटीन और प्रोडक्ट सुझाव पाएं',
    page: 'SkinRoutine',
    color: 'from-amber-400 to-orange-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    step: 4,
    icon: MessageCircle,
    title: 'AI Skin Coach',
    desc: 'अपने skin data के साथ personalized सवाल पूछें',
    page: 'SkinChat',
    color: 'from-emerald-400 to-teal-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
];

export default function UserJourney({ latestAnalysis }) {
  return (
    <div className="glass rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-bold mb-1">🗺️ आपका Skin Journey</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        इस क्रम में फॉलो करें — हर step अगले को और बेहतर बनाता है
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const done = idx === 0 && !!latestAnalysis;
          return (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <Link to={createPageUrl(s.page)}>
                <div className={`rounded-2xl border p-4 ${s.bg} ${s.border} hover:shadow-md transition-all duration-200 cursor-pointer h-full`}>
                  {/* Step number */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {done ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <span className="text-xs font-bold text-gray-400 bg-white/60 dark:bg-black/20 rounded-full w-6 h-6 flex items-center justify-center">
                        {s.step}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400">
                    Start <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
              {/* Connector arrow between steps (desktop) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}