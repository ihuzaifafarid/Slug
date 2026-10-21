import React from 'react';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { generateSlug } from '../utils/slugify';

interface ExamplesSectionProps {
  onSelectExample: (title: string) => void;
}

const EXAMPLES_LIST = [
  {
    category: 'Blog & Articles',
    title: 'The Best Running Shoes for Beginners in 2026',
    slug: 'the-best-running-shoes-for-beginners-in-2026',
    notes: 'Preserves articles and prepositions naturally for human readability.',
  },
  {
    category: 'E-Commerce / Shopify',
    title: 'Organic Fair-Trade Dark Roast Coffee Beans 500g',
    slug: 'organic-fair-trade-dark-roast-coffee-beans-500g',
    notes: 'Creates clean Shopify product handles without trailing weights or special chars.',
  },
  {
    category: 'Accents & Diacritics',
    title: 'Café & Restaurant Guide: Zürich, Genève & Montréal',
    slug: 'cafe-restaurant-guide-zurich-geneve-montreal',
    notes: 'Accents normalized (é→e, ü→u, è→e), ampersand cleaned without clutter.',
  },
  {
    category: 'Punctuation Clean-up',
    title: '10 Tips for Better SEO! (And What to Avoid in 2026)',
    slug: '10-tips-for-better-seo-and-what-to-avoid-in-2026',
    notes: 'Exclamation marks and parentheses cleanly converted into unified hyphens.',
  },
  {
    category: 'International Scripts',
    title: 'Tokyo 2026: 最新のテクノロジーとAIの未来',
    slug: 'tokyo-2026-最新のテクノロジーとaiの未来',
    notes: 'Preserves valid non-Latin characters instead of producing empty broken slugs.',
  },
];

import { useToast } from '../context/ToastContext';

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({ onSelectExample }) => {
  const { showCopySlugToast } = useToast();
  const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null);

  const handleCopyExample = async (slug: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(slug);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = slug;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 1800);
      showCopySlugToast(slug);
    } catch {
      // ignore
    }
  };

  return (
    <section id="examples" className="py-16 sm:py-20 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 scroll-mt-16 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Real-World Slug Generation Examples
          </h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400 leading-relaxed">
            See how different types of content, multilingual characters, and punctuation are converted into pristine search-engine-ready URLs. Click any example to test it in the generator above.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EXAMPLES_LIST.map((item) => (
            <div
              key={item.title}
              className="p-5 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  {item.category}
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm sm:text-base mb-2">
                  "{item.title}"
                </h3>
                
                {/* Slug box with in-place copy button */}
                <div className="p-2 sm:p-2.5 bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-neutral-900 dark:text-emerald-400 mb-3 flex items-center justify-between gap-2">
                  <span className="truncate select-all">/{item.slug}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyExample(item.slug)}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy this example slug"
                  >
                    {copiedSlug === item.slug ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {item.notes}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopyExample(item.slug)}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                >
                  {copiedSlug === item.slug ? 'Copied to clipboard' : 'Copy slug'}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectExample(item.title)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-200 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer group-hover:underline underline-offset-4"
                >
                  <span>Test in Generator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
