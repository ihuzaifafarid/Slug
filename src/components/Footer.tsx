import React from 'react';
import { Link2, Shield } from 'lucide-react';
import { ModalType } from './InfoModal';
import { useAuth } from '../context/AuthContext';

interface FooterProps {
  onOpenModal: (type: ModalType) => void;
  onScrollToTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal, onScrollToTop }) => {
  const { isAdmin, openAdmin, openAuthModal } = useAuth();
  return (
    <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 py-12 text-sm text-neutral-600 dark:text-neutral-400 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-100 dark:border-neutral-800">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center text-xs">
              <Link2 className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100 text-base">SlugGenerator</span>
            <span className="text-neutral-400 dark:text-neutral-600">·</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Free SEO URL Generator Tool</span>
          </div>

          {/* Links: Home, About, Privacy Policy, Contact */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={onScrollToTop}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('about')}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('privacy')}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('contact')}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>

            <button
              type="button"
              onClick={() => {
                if (isAdmin) {
                  openAdmin();
                } else {
                  openAuthModal('admin-recovery');
                }
              }}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              <span>Admin Portal</span>
            </button>
          </nav>
        </div>

        {/* Bottom Bar: Privacy & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 dark:text-neutral-500">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Client-side only. Entered titles and generated slugs are never sent to a server.</span>
          </div>

          <div>
            &copy; {new Date().getFullYear()} SlugGenerator. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
};
