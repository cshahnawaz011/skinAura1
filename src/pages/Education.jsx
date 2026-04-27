import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, Sparkles, Lightbulb,
  Check, X, ChevronRight
} from 'lucide-react';
import ArticleModal from '@/components/education/ArticleModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';

const skinTopics = [
  { id: 'acne', label: 'Acne', icon: '🔴', color: 'from-red-400 to-pink-400' },
  { id: 'aging', label: 'Anti-Aging', icon: '✨', color: 'from-purple-400 to-indigo-400' },
  { id: 'brightening', label: 'Brightening', icon: '☀️', color: 'from-amber-400 to-yellow-400' },
  { id: 'hydration', label: 'Hydration', icon: '💧', color: 'from-blue-400 to-cyan-400' },
  { id: 'suncare', label: 'Sun Protection', icon: '🧴', color: 'from-orange-400 to-red-400' },
];

const mythsVsFacts = [
  {
    myth: "You don't need sunscreen on cloudy days",
    fact: "Up to 80% of UV rays can penetrate clouds. Always wear SPF!",
    isFact: false
  },
  {
    myth: "Oily skin doesn't need moisturizer",
    fact: "All skin types need hydration. Skipping moisturizer can make oily skin worse.",
    isFact: false
  },
  {
    myth: "Drinking water hydrates your skin",
    fact: "While important for overall health, water mainly hydrates from within. Topical moisturizers are key.",
    isFact: true
  },
  {
    myth: "Natural products are always better",
    fact: "Natural doesn't mean safe or effective. Many synthetics are gentler and more stable.",
    isFact: false
  },
];

const ingredientDictionary = [
  { name: 'Niacinamide', benefit: 'Reduces pores, brightens, controls oil', goodFor: ['oily', 'acne', 'aging'] },
  { name: 'Hyaluronic Acid', benefit: 'Deep hydration, plumps skin', goodFor: ['dry', 'aging', 'all'] },
  { name: 'Retinol', benefit: 'Anti-aging, cell turnover, acne', goodFor: ['aging', 'acne'] },
  { name: 'Vitamin C', benefit: 'Brightening, antioxidant, collagen', goodFor: ['brightening', 'aging'] },
  { name: 'Salicylic Acid', benefit: 'Unclogs pores, exfoliates', goodFor: ['oily', 'acne'] },
  { name: 'Glycolic Acid', benefit: 'Exfoliates, brightens, anti-aging', goodFor: ['brightening', 'aging'] },
  { name: 'Ceramides', benefit: 'Restores barrier, locks moisture', goodFor: ['dry', 'sensitive'] },
  { name: 'Centella Asiatica', benefit: 'Soothes, heals, anti-inflammatory', goodFor: ['sensitive', 'acne'] },
];

export default function Education() {
  const [activeTab, setActiveTab] = useState('tips');
  const [selectedTopic, setSelectedTopic] = useState('acne');
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyTip, setDailyTip] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openArticle, setOpenArticle] = useState(null);

  useEffect(() => {
    generateDailyTip();
  }, []);

  useEffect(() => {
    if (activeTab === 'articles') {
      loadArticles(selectedTopic);
    }
  }, [selectedTopic, activeTab]);

  const generateDailyTip = async () => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a practical, actionable skincare tip of the day. 
Make it specific and helpful. Include why it works.
Format: Start with an engaging title, then the tip.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          tip: { type: "string" },
          icon: { type: "string" }
        }
      }
    });
    setDailyTip(result);
  };

  const loadArticles = async (topic) => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 4 skincare article summaries about "${topic}".
Each should have a catchy title, brief summary, and reading time.
Make them informative and practical.`,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                readingTime: { type: "number" }
              }
            }
          }
        }
      }
    });
    setArticles(result.articles || []);
    setLoading(false);
  };

  const filteredIngredients = ingredientDictionary.filter(ing =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ing.benefit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>📚</div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Skin Education</h1>
          <p className="text-sm text-gray-500">Learn everything about skincare</p>
        </div>
      </div>

      {/* Daily Tip */}
      {dailyTip && (
        <div className="rounded-3xl p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#f472b6)' }}>
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 mb-2">Tip of the Day</span>
              <h3 className="text-base font-bold mb-1">{dailyTip.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{dailyTip.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[['tips','💡','Tips'],['articles','📰','Articles'],['ingredients','🔬','Ingredients'],['myths','❓','Myths']].map(([id, emoji, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: activeTab === id ? 'linear-gradient(135deg,#f472b6,#a78bfa)' : 'white', color: activeTab === id ? 'white' : '#6b7280', border: activeTab === id ? 'none' : '1.5px solid #e5e7eb' }}>
            <span>{emoji}</span>{label}
          </button>
        ))}
      </div>

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {skinTopics.map((topic) => (
              <button key={topic.id} onClick={() => { setSelectedTopic(topic.id); setActiveTab('articles'); }}
                className="p-3 rounded-2xl text-center text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: `linear-gradient(135deg,${topic.id === 'acne' ? '#f43f5e,#f472b6' : topic.id === 'aging' ? '#a78bfa,#6366f1' : topic.id === 'brightening' ? '#f59e0b,#fcd34d' : topic.id === 'hydration' ? '#38bdf8,#06b6d4' : '#fb923c,#ef4444'})` }}>
                <span className="text-2xl block mb-1">{topic.icon}</span>
                <span className="text-xs font-bold">{topic.label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: 'The Perfect Cleansing Routine', desc: 'Learn the double cleanse method', emoji: '🧼' },
              { title: 'Understanding Your Skin Barrier', desc: 'Why it matters and how to protect it', emoji: '🛡️' },
              { title: 'Layering Products Correctly', desc: 'The right order for maximum absorption', emoji: '📐' },
              { title: 'SPF Explained', desc: 'Everything you need to know about sun protection', emoji: '☀️' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-pink-200 transition-all group">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <div>
                    <p className="font-bold text-sm group-hover:text-pink-500 transition-colors">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-pink-400 flex-shrink-0 transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {skinTopics.map((topic) => (
              <button key={topic.id} onClick={() => setSelectedTopic(topic.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: selectedTopic === topic.id ? '#f472b6' : 'white', color: selectedTopic === topic.id ? 'white' : '#6b7280', border: '1.5px solid #e5e7eb' }}>
                {topic.icon} {topic.label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {articles.map((article, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  onClick={() => setOpenArticle(article)}
                  className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-pink-200 transition-all group">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 mb-2 inline-block">{article.readingTime} min read</span>
                  <h3 className="font-bold text-sm mb-1 group-hover:text-pink-500 transition-colors">{article.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{article.summary}</p>
                  <p className="text-xs text-pink-500 font-semibold mt-2 flex items-center gap-1">Read More <ChevronRight className="w-3 h-3" /></p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ingredients Tab */}
      {activeTab === 'ingredients' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search ingredients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:border-pink-300 transition-all" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredIngredients.map((ing, i) => (
              <motion.div key={ing.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-sm mb-1">{ing.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{ing.benefit}</p>
                <div className="flex flex-wrap gap-1">
                  {ing.goodFor.map(tag => <Badge key={tag} variant="outline" className="text-xs capitalize">{tag}</Badge>)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Article Modal */}
      <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />

      {/* Myths vs Facts Tab */}
      {activeTab === 'myths' && (
        <div className="space-y-3">
          {mythsVsFacts.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-3">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.isFact ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {item.isFact ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
              </div>
              <div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1.5 ${item.isFact ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {item.isFact ? 'Fact' : 'Myth'}
                </span>
                <p className="font-semibold text-sm mb-1">"{item.myth}"</p>
                <p className="text-xs text-gray-500 leading-relaxed"><span className="font-bold">Truth:</span> {item.fact}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}