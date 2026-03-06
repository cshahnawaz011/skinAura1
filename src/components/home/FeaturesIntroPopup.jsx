import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    emoji: '🤳',
    gradient: 'from-pink-400 to-rose-400',
    bg: 'from-pink-50 to-rose-50',
    title: 'AI Skin Analysis',
    desc: 'Upload a selfie and get a clinical-grade skin health report in seconds — acne, dark spots, wrinkles, oiliness & more.',
  },
  {
    emoji: '✨',
    gradient: 'from-amber-400 to-orange-400',
    bg: 'from-amber-50 to-orange-50',
    title: 'Personalized Routine',
    desc: 'Get a morning & night skincare routine tailored to YOUR skin type, concerns, and lifestyle habits.',
  },
  {
    emoji: '🤖',
    gradient: 'from-violet-400 to-purple-400',
    bg: 'from-violet-50 to-purple-50',
    title: 'Dr. Glow AI',
    desc: 'Chat with your personal AI dermatologist 24/7. Ask anything about your skin, products, or ingredients.',
  },
  {
    emoji: '📈',
    gradient: 'from-emerald-400 to-teal-400',
    bg: 'from-emerald-50 to-teal-50',
    title: 'Progress Tracking',
    desc: 'Track your skin journey with photos and scores. Watch your glow improve week by week.',
  },
  {
    emoji: '🌿',
    gradient: 'from-lime-400 to-green-400',
    bg: 'from-lime-50 to-green-50',
    title: 'Lifestyle & Wellness',
    desc: 'Log water, sleep, diet & exercise. See how your daily habits directly impact your skin health.',
  },
  {
    emoji: '💧',
    gradient: 'from-blue-400 to-cyan-400',
    bg: 'from-blue-50 to-cyan-50',
    title: 'Products & Ingredients',
    desc: 'Discover the best products for your skin. Check ingredients for safety, compare formulas & more.',
  },
];

export default function FeaturesIntroPopup({ onClose }) {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: 'spring', damping: 22 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center z-10"
          style={{ position: 'absolute' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* Top gradient section */}
            <div className={`bg-gradient-to-br ${slide.bg} dark:from-gray-800 dark:to-gray-700 px-8 pt-10 pb-6 text-center`}>
              <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <span className="text-4xl">{slide.emoji}</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{slide.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{slide.desc}</p>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 py-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`rounded-full transition-all duration-300 ${i === step ? 'w-5 h-2 bg-pink-500' : 'w-2 h-2 bg-gray-200 dark:bg-gray-600'}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              )}
              {isLast ? (
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500 text-white font-semibold gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Get Started!
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  className={`flex-1 bg-gradient-to-br ${slide.gradient} text-white font-semibold gap-1`}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}