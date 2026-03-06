import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ArticleModal({ article, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!article) return;
    setLoading(true);
    setContent(null);
    base44.integrations.Core.InvokeLLM({
      prompt: `Write a detailed, engaging skincare article titled "${article.title}".
The article should be 400-600 words, well-structured with sections, practical tips, and science-backed advice.
Use a warm, expert tone. Include an intro, 3-4 main sections with subheadings (use ### for them), and a conclusion.`,
      response_json_schema: {
        type: "object",
        properties: {
          body: { type: "string" },
          key_takeaways: { type: "array", items: { type: "string" } }
        }
      }
    }).then(r => {
      setContent(r);
      setLoading(false);
    });
  }, [article]);

  return (
    <AnimatePresence>
      {article && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span className="text-xs font-semibold text-pink-500 uppercase tracking-wide">AI Article</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{article.title}</h2>
                <p className="text-xs text-gray-400 mt-1">{article.readingTime} min read</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                  <p className="text-sm text-gray-500">Generating full article...</p>
                </div>
              ) : content ? (
                <>
                  {/* Article body — split by ### sections */}
                  {content.body.split('###').map((section, i) => {
                    if (!section.trim()) return null;
                    const lines = section.trim().split('\n');
                    const heading = lines[0].trim();
                    const body = lines.slice(1).join('\n').trim();
                    return (
                      <div key={i} className="space-y-2">
                        {i > 0 && <h3 className="font-bold text-base text-gray-900 dark:text-white">{heading}</h3>}
                        {i === 0 && <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-medium">{heading}</p>}
                        {body && <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{body}</p>}
                      </div>
                    );
                  })}

                  {/* Key Takeaways */}
                  {content.key_takeaways?.length > 0 && (
                    <div className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20 rounded-2xl p-4 mt-4">
                      <p className="font-bold text-sm text-pink-600 dark:text-pink-400 mb-3">✨ Key Takeaways</p>
                      <ul className="space-y-2">
                        {content.key_takeaways.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-pink-400 font-bold flex-shrink-0">•</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}