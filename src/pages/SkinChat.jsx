import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { checkAICooldown, recordAIUsage, getCooldownSeconds } from '@/components/utils/aiRateLimit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, Bookmark, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const QUICK_QUESTIONS = [
  "Why am I breaking out?",
  "Best routine for my skin?",
  "What ingredients to avoid?",
  "How to reduce dark spots?",
  "Tips for glowing skin?",
  "How does diet affect skin?"
];

export default function SkinChat() {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(getCooldownSeconds('skin_chat'));
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const { data: latestAnalysis } = useQuery({
    queryKey: ['latestAnalysis', user?.email],
    queryFn: () => base44.entities.SkinAnalysis.filter({ user_email: user.email }, '-created_date', 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: chatHistory } = useQuery({
    queryKey: ['chatHistory', user?.email],
    queryFn: async () => {
      const history = await base44.entities.ChatHistory.filter({ user_email: user.email }, '-created_date', 1);
      if (history[0]?.messages) setMessages(history[0].messages);
      return history[0] || null;
    },
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: (msgs) => chatHistory
      ? base44.entities.ChatHistory.update(chatHistory.id, { messages: msgs })
      : base44.entities.ChatHistory.create({ user_email: user.email, messages: msgs, session_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => queryClient.invalidateQueries(['chatHistory']),
  });

  const skinContext = latestAnalysis
    ? `User's skin: ${latestAnalysis.skin_type} type, score ${latestAnalysis.overall_score}/100, acne ${latestAnalysis.acne_level}/10, oiliness ${latestAnalysis.oiliness}/10, dryness ${latestAnalysis.dryness}/10, sensitivity ${latestAnalysis.sensitivity}/10.`
    : '';

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const { allowed } = checkAICooldown('skin_chat');
    if (!allowed) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString(), saved: false };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are SkinAura, a friendly skincare AI coach. Give personalized, actionable advice in 2-3 paragraphs. Be warm and encouraging.\n\n${skinContext}\n\nUser: ${text}`,
    });

    const aiMsg = { role: 'assistant', content: response, timestamp: new Date().toISOString(), saved: false };
    const updated = [...newMessages, aiMsg];
    setMessages(updated);
    setIsTyping(false);
    recordAIUsage('skin_chat');
    setCooldownLeft(3 * 60);
    if (user) saveMutation.mutate(updated);
  };

  const toggleSave = (index) => {
    const updated = messages.map((m, i) => i === index ? { ...m, saved: !m.saved } : m);
    setMessages(updated);
    if (user) saveMutation.mutate(updated);
  };

  const clearChat = () => {
    setMessages([]);
    if (user && chatHistory) saveMutation.mutate([]);
  };

  return (
    <div className="max-w-2xl mx-auto pb-4" style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">AI Skin Coach</h1>
            <p className="text-sm text-gray-500">Ask anything about skincare</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-all">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Chat Window */}
      <div className="flex-1 rounded-3xl overflow-hidden flex flex-col min-h-0"
        style={{ background: 'rgba(255,255,255,0.95)', border: '1.5px solid rgba(244,114,182,0.15)', boxShadow: '0 4px 32px rgba(244,114,182,0.08)' }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png"
                className="w-16 h-16 rounded-2xl object-cover shadow-sm mb-4" alt="SkinAura" />
              <h3 className="text-xl font-black mb-1 text-gray-900">Hi! I'm your AI Skin Coach</h3>
              {latestAnalysis ? (
                <div className="mb-4 px-4 py-2 rounded-2xl text-sm font-medium" style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', color: '#be185d' }}>
                  ✅ Your skin: <strong className="capitalize">{latestAnalysis.skin_type}</strong> · Score {latestAnalysis.overall_score}/100
                </div>
              ) : (
                <Link to="/SkinAnalysis" className="mb-4 px-4 py-2 rounded-2xl text-sm font-medium inline-block" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#d97706' }}>
                  ⚠️ Run Skin Analysis for personalized advice →
                </Link>
              )}
              <p className="text-gray-400 text-sm mb-6 max-w-xs">Ask me anything about your skin, routine, or ingredients.</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-600 transition-all shadow-sm">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png"
                        className="w-7 h-7 rounded-xl object-cover shadow-sm mr-2 flex-shrink-0 self-end mb-1" alt="AI" />
                    )}
                    <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                        ? 'text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700'
                      }`}
                        style={msg.role === 'user' ? { background: 'linear-gradient(135deg,#f472b6,#a78bfa)' } : {}}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === 'assistant' && (
                        <button onClick={() => toggleSave(i)}
                          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all ${msg.saved ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500'}`}>
                          <Bookmark className={`w-3 h-3 ${msg.saved ? 'fill-current' : ''}`} />
                          {msg.saved ? 'Saved' : 'Save'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <img src="https://media.base44.com/images/public/69e797df9f8ad61d944d9a14/31e70b171_icon.png"
                    className="w-7 h-7 rounded-xl object-cover shadow-sm flex-shrink-0" alt="AI" />
                  <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm flex gap-1">
                    {[0, 0.1, 0.2].map((d, i) => (
                      <span key={i} className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Saved strip */}
        {messages.some(m => m.saved) && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-900/10">
            <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mb-1"><Bookmark className="w-3 h-3 fill-current" /> Saved Tips</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {messages.filter(m => m.saved).map((m, i) => (
                <div key={i} className="flex-shrink-0 max-w-[200px] text-xs text-gray-600 bg-white rounded-xl px-3 py-1.5 border border-amber-200">
                  {m.content.substring(0, 80)}…
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={cooldownLeft > 0 ? `Wait ${Math.floor(cooldownLeft / 60)}:${String(cooldownLeft % 60).padStart(2, '0')}` : 'Ask about your skin…'}
              disabled={isTyping || cooldownLeft > 0}
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all disabled:opacity-50"
            />
            <button type="submit" disabled={!input.trim() || isTyping || cooldownLeft > 0}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-40 ios-button-3d flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}