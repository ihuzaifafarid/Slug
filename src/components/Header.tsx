import React from 'react';
import { Link2, Sun, Moon, Bot } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onFocusGenerator: () => void;
  onOpenContact: () => void;
  onOpenAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onFocusGenerator, 
  onOpenContact,
  onOpenAssistant
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a 
          href="/" 
          className="flex items-center gap-2 text-neutral-950 dark:text-neutral-100 font-bold text-lg tracking-tight whitespace-nowrap shrink-0 group"
        >
          <span className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center transition-transform group-hover:scale-105">
            <Link2 className="w-4 h-4" />
          </span>
          <span>SlugGenerator</span>
        </a>

        {/* Zone 2: clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <a href="#generator" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Tool
          </a>
          <a href="#best-practices" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Best Practices
          </a>
          <a href="#examples" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Examples
          </a>
          <a href="#faq" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            FAQ
          </a>
          <button 
            type="button" 
            onClick={onOpenContact} 
            className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-sm font-medium"
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: Actions (Theme Toggle, AI Assistant, Primary CTA) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI SEO Assistant Button */}
          <button
            type="button"
            onClick={onOpenAssistant}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="Open Gemini SEO Chatbot"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onFocusGenerator}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white dark:text-neutral-950 bg-neutral-900 dark:bg-white rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Create Slug
          </button>
        </div>
      </div>
    </header>
  );
};
