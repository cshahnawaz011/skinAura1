import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  "Why is my skin oily today?",
  "What should I change in my routine?",
  "How to reduce acne naturally?",
  "Best ingredients for my skin?",
];

export default function AICoachEntry() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}>
      <Link to="/SkinChat">
        <div className="p-6 rounded-3xl cursor-pointer backdrop-blur-md hover:shadow-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,248,246,0.9) 100%)',
            border: '1px solid rgba(244,114,182,0.15)',
            boxShadow: '0 8px 32px rgba(244,114,182,0.06)'
          }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Ask Your Skin AI</p>
              <p className="text-xs text-gray-500 mt-1">Get instant skincare guidance</p>
            </div>
          </div>

          {/* Example prompts */}
          <div className="space-y-2.5 mt-3 pt-3 border-t border-gray-200">
            {EXAMPLE_PROMPTS.slice(0, 2).map((prompt, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-700 p-2.5 rounded-lg hover:bg-pink-50 transition">
                <span className="text-pink-400">→</span>
                <span className="font-medium">{prompt}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}