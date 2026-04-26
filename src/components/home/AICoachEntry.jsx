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
        <div className="ios-card p-6 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-pink-50"
          style={{ border: '1px solid rgba(168, 85, 247, 0.2)' }}>
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
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.slice(0, 2).map((prompt, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600 p-2 rounded-lg hover:bg-white/50 transition">
                <span className="text-lg">→</span>
                <span>{prompt}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}