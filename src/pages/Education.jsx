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
      <div>
        <h1 className="text-3xl font-bold">Skin Education Hub</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Learn everything about skincare
        </p>
      </div>

      {/* Daily Tip */}
      {dailyTip && (
        <GlassCard className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-pink-900/20 dark:to-amber-900/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-amber-400 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <Badge className="mb-2 bg-amber-500">Tip of the Day</Badge>
              <h3 className="text-lg font-semibold mb-2">{dailyTip.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{dailyTip.tip}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tips">Tips</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="myths">Myths vs Facts</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {skinTopics.map((topic) => (
              <motion.button
                key={topic.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedTopic(topic.id);
                  setActiveTab('articles');
                }}
                className={`p-4 rounded-2xl bg-gradient-to-br ${topic.color} text-white text-center`}
              >
                <span className="text-2xl block mb-2">{topic.icon}</span>
                <span className="font-medium">{topic.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'The Perfect Cleansing Routine', desc: 'Learn the double cleanse method' },
              { title: 'Understanding Your Skin Barrier', desc: 'Why it matters and how to protect it' },
              { title: 'Layering Products Correctly', desc: 'The right order for maximum absorption' },
              { title: 'SPF Explained', desc: 'Everything you need to know about sun protection' },
            ].map((item, i) => (
              <GlassCard key={i} delay={i * 0.1} className="cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold group-hover:text-pink-500 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {skinTopics.map((topic) => (
              <Button
                key={topic.id}
                variant={selectedTopic === topic.id ? 'default' : 'outline'}
                onClick={() => setSelectedTopic(topic.id)}
                className={selectedTopic === topic.id ? 'bg-pink-500' : ''}
              >
                <span className="mr-2">{topic.icon}</span>
                {topic.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <GlassCard key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((article, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard className="h-full cursor-pointer group hover:shadow-lg">
                    <Badge className="mb-3">{article.readingTime} min read</Badge>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-pink-500 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {article.summary}
                    </p>
                    <Button variant="ghost" size="sm" className="mt-4 text-pink-500">
                      Read More <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ingredients Tab */}
      {activeTab === 'ingredients' && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIngredients.map((ing, i) => (
              <motion.div
                key={ing.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard>
                  <h3 className="font-semibold text-lg mb-2">{ing.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {ing.benefit}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ing.goodFor.map(tag => (
                      <Badge key={tag} variant="outline" className="capitalize">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Myths vs Facts Tab */}
      {activeTab === 'myths' && (
        <div className="space-y-4">
          {mythsVsFacts.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.isFact ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {item.isFact ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={item.isFact ? 'bg-emerald-500' : 'bg-red-500'}>
                        {item.isFact ? 'Fact' : 'Myth'}
                      </Badge>
                    </div>
                    <p className="font-medium mb-2">"{item.myth}"</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      <span className="font-medium">Truth:</span> {item.fact}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}