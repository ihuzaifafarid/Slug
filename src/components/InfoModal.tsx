import React from 'react';
import { X, ShieldCheck, Info, Mail, Check } from 'lucide-react';

import { ContactForm } from './ContactForm';

export type ModalType = 'about' | 'privacy' | 'contact' | null;

interface InfoModalProps {
  type: ModalType;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className={`w-full ${type === 'contact' ? 'max-w-xl' : 'max-w-lg'} bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {type === 'about' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-neutral-950 dark:text-neutral-100">About SlugGenerator</h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Fast, client-side SEO utility</span>
              </div>
            </div>

            <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-3 leading-relaxed">
              <p>
                <strong>SlugGenerator</strong> is a dedicated web utility designed to solve one specific problem with precision: converting messy article titles, blog headlines, and e-commerce product names into clean, readable, search-engine-friendly URL slugs.
              </p>
              <p>
                Unlike generic SEO tools wrapped in aggressive banner ads or complicated paywalls, SlugGenerator operates entirely in your browser with zero latency, zero tracking, and real-time live preview.
              </p>
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Key Principles:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Strict adherence to Google search engine URL guidelines</li>
                  <li>Diacritics normalization without destroying multilingual scripts</li>
                  <li>Fast and lightweight with zero external server dependencies</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {type === 'privacy' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-neutral-950 dark:text-neutral-100">Privacy Policy</h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">100% Client-Side Execution</span>
              </div>
            </div>

            <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-3 leading-relaxed">
              <p>
                Your privacy is paramount. SlugGenerator is engineered as a <strong>completely client-side application</strong>:
              </p>
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Server Data Collection:</strong> Any text or titles you enter are processed locally in your browser memory via JavaScript.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>No Database or Cloud Storage:</strong> Generated slugs and custom domains are never logged, stored, or analyzed.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>No Tracking or Ad Cookies:</strong> We do not track your browsing habits, inject third-party ad pixels, or sell user telemetry.</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                You can even use this application offline once loaded.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {type === 'contact' && (
          <ContactForm onClose={onClose} />
        )}
      </div>
    </div>
  );
};
