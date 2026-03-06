import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Zap, Clock, Sparkles, MessageCircle, ArrowRight, FileText } from 'lucide-react';

const NEXT_STEPS = [
  {
    icon: Zap,
    title: 'AI Insights',
    desc: 'इस analysis के आधार पर celebrity match, acne risk और beauty DNA देखें',
    page: 'AiInsights',
    color: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    icon: Clock,
    title: 'Skin Age Prediction',
    desc: 'जानें आपकी skin की biological age क्या है',
    page: 'SkinAgePrediction',
    color: 'from-indigo-400 to-blue-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  {
    icon: Sparkles,
    title: 'AI Routine बनाएं',
    desc: 'आपकी skin type के लिए customized morning & night routine',
    page: 'SkinRoutine',
    color: 'from-amber-400 to-orange-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon: MessageCircle,
    title: 'AI Coach से पूछें',
    desc: 'आपके results के बारे में directly AI coach से बात करें',
    page: 'SkinChat',
    color: 'from-emerald-400 to-teal-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    icon: FileText,
    title: 'Full Report',
    desc: 'PDF report generate करें और 90-day action plan पाएं',
    page: 'SkinReport',
    color: 'from-pink-400 to-rose-400',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
  },
];

export default function NextStepsAfterAnalysis() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 shadow-lg"
    >
      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
        🚀 अब क्या करें?
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        आपकी skin analysis save हो गई — इन features में इसका उपयोग करें
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {NEXT_STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link to={createPageUrl(s.page)} key={s.page}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl p-3 ${s.bg} hover:shadow-md hover:scale-[1.03] transition-all duration-200 cursor-pointer h-full`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="font-semibold text-xs mb-1">{s.title}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-gray-400">
                  खोलें <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}