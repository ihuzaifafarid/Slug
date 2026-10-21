import React from 'react';
import { Link2 } from 'lucide-react';

interface HeaderProps {
  onFocusGenerator: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onFocusGenerator }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a 
          href="/" 
          className="flex items-center gap-2 text-neutral-950 font-bold text-lg tracking-tight whitespace-nowrap shrink-0 group"
        >
          <span className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center transition-transform group-hover:scale-105">
            <Link2 className="w-4 h-4" />
          </span>
          <span>SlugGenerator</span>
        </a>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
          <a href="#generator" className="hover:text-neutral-950 transition-colors whitespace-nowrap shrink-0">
            Tool
          </a>
          <a href="#best-practices" className="hover:text-neutral-950 transition-colors whitespace-nowrap shrink-0">
            Best Practices
          </a>
          <a href="#examples" className="hover:text-neutral-950 transition-colors whitespace-nowrap shrink-0">
            Examples
          </a>
          <a href="#faq" className="hover:text-neutral-950 transition-colors whitespace-nowrap shrink-0">
            FAQ
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onFocusGenerator}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 cursor-pointer"
          >
            Create Slug
          </button>
        </div>
      </div>
    </header>
  );
};
