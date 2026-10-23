import React, { useState, useRef, useEffect } from 'react';
import { Link2, Sun, Moon, Bot, User, ShieldCheck, Zap, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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
  const { user, subscription, quota, isAuthenticated, isAdmin, openAuthModal, openDashboard, openAdmin, logout } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const plan = subscription?.plan || 'free';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* Zone 1: Wordmark */}
        <a 
          href="/" 
          className="flex items-center gap-2 text-neutral-950 dark:text-neutral-100 font-bold text-lg tracking-tight whitespace-nowrap shrink-0 group"
        >
          <span className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center transition-transform group-hover:scale-105">
            <Link2 className="w-4 h-4" />
          </span>
          <span className="flex items-center gap-1.5">
            <span>Slugify</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-wider">
              PRO
            </span>
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-xs lg:text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <a href="#generator" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap">
            Tool
          </a>
          <a href="#pricing" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap font-semibold text-indigo-600 dark:text-indigo-400">
            Pricing
          </a>
          <a href="#best-practices" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap">
            Best Practices
          </a>
          <a href="#examples" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap">
            Examples
          </a>
          <a href="#faq" className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap">
            FAQ
          </a>
          <button 
            type="button" 
            onClick={onOpenContact} 
            className="hover:text-neutral-950 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: Actions (Auth, AI Assistant, Theme, CTA) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* AI SEO Assistant Button */}
          <button
            type="button"
            onClick={onOpenAssistant}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="Open Gemini SEO Chatbot"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">AI SEO</span>
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

          {/* Auth State Button */}
          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs"
              >
                <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-[11px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 max-w-[80px] sm:max-w-[110px] truncate">
                  {user.name}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                  plan === 'premium'
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    : plan === 'pro'
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}>
                  {plan}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                    <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{user.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Quota today:</span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{quota.count}/{quota.limit}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setIsUserMenuOpen(false); openDashboard(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer text-left font-medium"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500" />
                    <span>User Dashboard</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => { setIsUserMenuOpen(false); openAdmin(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors cursor-pointer text-left font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Admin Console</span>
                    </button>
                  )}

                  <a
                    href="#pricing"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer text-left font-medium"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Change Plan</span>
                  </a>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                  <button
                    type="button"
                    onClick={() => { setIsUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <a
                href="#pricing"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg transition-colors"
              >
                <Zap className="w-3 h-3 text-indigo-500" />
                <span>Pricing</span>
              </a>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onFocusGenerator}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-neutral-950 bg-neutral-900 dark:bg-white rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Create Slug
          </button>
        </div>

      </div>
    </header>
  );
};
