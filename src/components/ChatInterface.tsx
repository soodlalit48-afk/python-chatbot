import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, ChatMessage } from '../lib/supabase';
import { Send, Loader2, LogOut, Coins, AlertCircle, Bot, User as UserIcon } from 'lucide-react';
import PaymentModal from './PaymentModal';

export default function ChatInterface() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    if (!user) return;

    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) {
      setMessages(data);
    }
    setLoadingHistory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading || !profile) return;

    if (profile.credits <= 0) {
      setError('You have no credits left. Please purchase more credits to continue chatting.');
      setShowPaymentModal(true);
      return;
    }

    setError('');
    const userMessage = message.trim();
    setMessage('');
    setLoading(true);

    const tempMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      user_id: user!.id,
      message: userMessage,
      response: '',
      credits_used: 1,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const { data: session } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const newMessage: ChatMessage = {
        ...tempMessage,
        id: Date.now().toString(),
        response: data.response,
      };

      setMessages((prev) => prev.map((m) => (m.id === tempMessage.id ? newMessage : m)));

      await refreshProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Python & ML Assistant</h1>
              <p className="text-sm text-gray-600">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 active:scale-95 animate-pulse-glow"
            >
              <Coins className="w-4 h-4 animate-spin-slow" />
              <span>{profile?.credits || 0} Credits</span>
            </button>
            <button
              onClick={signOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {loadingHistory ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 animate-slide-up">
              <div className="animate-float">
                <Bot className="w-16 h-16 mx-auto text-gradient-blue-400 mb-4 animate-bounce-in" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Python & ML Assistant!
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Ask me anything about Python programming, Machine Learning, Data Science, and related technologies.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  'How do I use pandas to read a CSV file?',
                  'Explain neural networks in simple terms',
                  'What is the difference between supervised and unsupervised learning?',
                  'How to implement a linear regression in Python?',
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(example)}
                    className="p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg hover:scale-105 transition-all transform active:scale-95 animate-fade-in"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="space-y-4 animate-fade-in">
                <div className="flex gap-3 justify-end">
                  <div className="max-w-[80%] bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                {msg.response && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                      <p className="whitespace-pre-wrap break-words text-gray-800">{msg.response}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about Python, ML, Data Science..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !message.trim() || (profile?.credits || 0) <= 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 transform hover:scale-110 active:scale-95 hover:shadow-lg disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </div>
        </form>
      </main>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={async () => {
          await refreshProfile();
          setShowPaymentModal(false);
        }}
      />
    </div>
  );
}
