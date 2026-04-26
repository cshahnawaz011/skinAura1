import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Loader2, Sparkles, Bookmark, Trash2, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import GlassCard from '@/components/ui/GlassCard';

const quickQuestions = [
  "Why am I breaking out?",
  "Best routine for my skin?",
  "What ingredients to avoid?",
  "How to reduce dark spots?",
  "Tips for glowing skin?",
  "How does diet affect my skin?"
];

export default function SkinChat() {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(getCooldownSeconds('skin_chat'));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: async () => {
      const analyses = await base44.entities.SkinAnalysis.filter(
        { user_email: user.email },
        '-created_date',
        1
      );
      return analyses[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: chatHistory } = useQuery({
    queryKey: ['chatHistory', user?.email],
    queryFn: async () => {
      const history = await base44.entities.ChatHistory.filter(
        { user_email: user.email },
        '-created_date',
        1
      );
      if (history[0]?.messages) {
        setMessages(history[0].messages);
      }
      return history[0] || null;
    },
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: async (newMessages) => {
      if (chatHistory) {
        return base44.entities.ChatHistory.update(chatHistory.id, {
          messages: newMessages,
        });
      }
      return base44.entities.ChatHistory.create({
        user_email: user.email,
        messages: newMessages,
        session_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['chatHistory']),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSkinContext = () => {
    if (!latestAnalysis) return '';
    return `
User's skin profile:
- Skin type: ${latestAnalysis.skin_type}
- Skin tone: ${latestAnalysis.skin_tone}
- Acne level: ${latestAnalysis.acne_level}/10
- Dark spots: ${latestAnalysis.dark_spots}/10
- Wrinkles: ${latestAnalysis.wrinkles}/10
- Oiliness: ${latestAnalysis.oiliness}/10
- Dryness: ${latestAnalysis.dryness}/10
- Sensitivity: ${latestAnalysis.sensitivity}/10
- Overall score: ${latestAnalysis.overall_score}/100
`;
  };

  const getUserLang = () => {
    const langMap = { en: 'English', hi: 'Hindi', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', pt: 'Portuguese', ru: 'Russian', tr: 'Turkish' };
    return langMap[localStorage.getItem('glowai-lang') || 'en'] || 'English';
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const { allowed } = checkAICooldown('skin_chat');
    if (!allowed) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      saved: false,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are SkinAura, a friendly and knowledgeable skincare AI assistant. 
You provide personalized skincare advice based on the user's skin profile.
Be helpful, encouraging, and provide specific actionable advice.
Keep responses concise but informative (2-3 paragraphs max).
Respond in ${getUserLang()}.

${getSkinContext()}

User's question: ${text}

Provide a helpful, personalized response:`,
    });

    const assistantMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      saved: false,
    };

    const updatedMessages = [...newMessages, assistantMessage];
    setMessages(updatedMessages);
    setIsTyping(false);
    recordAIUsage('skin_chat');
    setCooldownLeft(3 * 60);

    if (user) {
      saveMutation.mutate(updatedMessages);
    }
  };

  const toggleSaveMessage = (index) => {
    const updated = messages.map((msg, i) => 
      i === index ? { ...msg, saved: !msg.saved } : msg
    );
    setMessages(updated);
    if (user) {
      saveMutation.mutate(updated);
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (user && chatHistory) {
      saveMutation.mutate([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">AI Skin Coach</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Ask anything about skincare
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-16 h-16 rounded-2xl object-cover shadow-sm mb-4" alt="SkinAura" />
              <h3 className="text-xl font-semibold mb-2">Hi! I'm your AI Skin Coach</h3>
              {latestAnalysis ? (
                <div className="mb-4 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800 text-sm text-pink-700 dark:text-pink-300">
                  ✅ मुझे पता है आपकी skin <strong className="capitalize">{latestAnalysis.skin_type}</strong> type की है — Score: <strong>{latestAnalysis.overall_score}/100</strong>। मैं इसी के हिसाब से personalized advice दूँगा।
                </div>
              ) : (
                <div className="mb-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                  ⚠️ <a href="/SkinAnalysis" className="underline font-semibold">Skin Analysis</a> करने के बाद मैं और बेहतर personalized advice दे पाऊँगा।
                </div>
              )}
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                कुछ भी skincare से जुड़ा पूछें — मैं यहाँ हूँ!
              </p>
              
              {/* Quick Questions */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {quickQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(q)}
                    className="text-sm"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white'
                          : 'bg-white/80 dark:bg-gray-800/80'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png" className="w-6 h-6 rounded-full object-cover shadow-sm" alt="SkinAura" />
                          <span className="text-sm font-medium text-gray-500">SkinAura</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => toggleSaveMessage(i)}
                          className={`mt-2 flex items-center gap-1 text-sm ${
                            msg.saved ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${msg.saved ? 'fill-current' : ''}`} />
                          {msg.saved ? 'Saved' : 'Save'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-gray-500"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={cooldownLeft > 0 ? `Available in ${Math.floor(cooldownLeft/60)}:${String(cooldownLeft%60).padStart(2,'0')}` : "Ask about skincare..."}
              className="flex-1"
              disabled={isTyping || cooldownLeft > 0}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isTyping || cooldownLeft > 0}
              className="ios-button-3d text-white"
              style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}
              title={cooldownLeft > 0 ? `Available in ${cooldownLeft}s` : ''}
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </GlassCard>

      {/* Saved Messages */}
      {messages.some(m => m.saved) && (
        <GlassCard className="mt-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-500" />
            Saved Advice
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {messages.filter(m => m.saved).map((msg, i) => (
              <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                {msg.content.substring(0, 150)}...
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}