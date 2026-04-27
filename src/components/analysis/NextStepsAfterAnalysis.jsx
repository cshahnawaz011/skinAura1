import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const NEXT_STEPS = [
  {
    icon: Sparkles,
    title: 'Build AI Routine',
    desc: 'Get a customized morning & night routine for your skin type',
    page: 'SkinRoutine',
    color: 'from-amber-400 to-orange-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
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
        🚀 What's Next?
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Your skin analysis has been saved — explore these features using your results
      </p>
      <div className="grid grid-cols-1 gap-3">
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
                  Open <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}