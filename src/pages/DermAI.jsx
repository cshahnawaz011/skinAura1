import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, Trash2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "Analyze my skin data and give me a treatment plan",
  "What ingredients should I avoid for my skin type?",
  "How do I get rid of dark spots naturally?",
  "Build me a morning and night routine",
];

export default function DermAI() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const unsubscribeRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
    return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    setInitializing(true);
    const conv = await base44.agents.createConversation({ agent_name: "DermAI" });
    setConversation(conv);
    setMessages(conv.messages || []);
    unsubscribeRef.current = base44.agents.subscribeToConversation(conv.id, (updated) => {
      setMessages([...updated.messages]);
    });
    setInitializing(false);
  };

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || !conversation || loading) return;
    setLoading(true);
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: msg });
    setLoading(false);
  };

  const resetChat = async () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    setMessages([]);
    setConversation(null);
    await initConversation();
  };

  const visibleMessages = messages.filter((m) => !m.hidden);

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-10rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-amber-300 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dr. Glow AI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI Dermatologist · Personalized Advice</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={resetChat} title="New conversation">
          <Trash2 className="w-4 h-4 text-gray-400" />
        </Button>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl glass p-4 space-y-4 mb-4">
        {initializing ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-amber-300 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">Hi, I'm Dr. Glow AI</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your personal AI dermatologist. Ask me anything about your skin!</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-sm text-left px-4 py-3 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-pink-50 dark:hover:bg-pink-900/20 border border-pink-100 dark:border-pink-900/30 text-gray-700 dark:text-gray-200 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-amber-300 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-pink-400 to-pink-500 text-white rounded-br-sm"
                      : "bg-white/80 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0">
                      {typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)}
                    </ReactMarkdown>
                  ) : (
                    typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-amber-300 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/80 dark:bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 0.2, 0.4].map((d) => (
                  <motion.div key={d} className="w-2 h-2 bg-pink-400 rounded-full"
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, delay: d, repeat: Infinity }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-3 rounded-xl border border-pink-100 dark:border-pink-900/30 bg-white/80 dark:bg-white/10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
          placeholder="Ask Dr. Glow AI anything about your skin..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={loading || initializing}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={loading || initializing || !input.trim()}
          className="bg-gradient-to-br from-pink-400 to-amber-400 text-white rounded-xl px-4 hover:opacity-90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}