import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Loader2, 
  Sparkles, 
  RotateCcw, 
  ChevronDown, 
  MessageSquare,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface SeoChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlug?: string;
  currentTitle?: string;
}

const STARTER_PROMPTS = [
  "Review my current slug for SEO strengths",
  "Should I remove stop words from this URL?",
  "How should I structure a Shopify product handle?",
  "What is the best way to set up a 301 redirect?",
];

export const SeoChatbot: React.FC<SeoChatbotProps> = ({
  isOpen,
  onClose,
  currentSlug,
  currentTitle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'model',
      text: "Hello! I'm your SEO URL Strategy Assistant. Ask me anything about optimizing your website slugs, search ranking best practices, keyword density, or setting up 301 redirects.",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setInputValue('');
    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          context: {
            currentSlug,
            currentTitle,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to receive AI response');
      }

      const data = await response.json();
      const modelMessage: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'model',
        text: "Conversation reset. How can I help you optimize your URLs or website architecture today?",
        timestamp: Date.now(),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg h-[620px] max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-950 dark:text-neutral-50 text-sm">
                  SEO URL Assistant
                </h3>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[240px]">
                {currentSlug ? `Context: /${currentSlug}` : 'Ask SEO & slug architecture questions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread (Scrollable) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <span className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                )}
                
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium'
                      : 'bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-neutral-500 dark:text-neutral-400 text-xs py-1">
              <span className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-600 dark:text-neutral-300" />
                <span>Analyzing SEO patterns...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Starter Chips */}
        {messages.length <= 3 && (
          <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap gap-1.5 bg-neutral-50/50 dark:bg-neutral-950/40">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] px-2.5 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer text-left truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask an SEO or slug question..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 disabled:opacity-40 text-white dark:text-neutral-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
