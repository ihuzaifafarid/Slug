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

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({ onSelectExample }) => {
  return (
    <section id="examples" className="py-16 sm:py-20 bg-white border-b border-neutral-200 scroll-mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            Real-World Slug Generation Examples
          </h2>
          <p className="mt-3 text-neutral-600 leading-relaxed">
            See how different types of content, multilingual characters, and punctuation are converted into pristine search-engine-ready URLs. Click any example to test it in the generator above.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EXAMPLES_LIST.map((item) => (
            <div
              key={item.title}
              className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  {item.category}
                </div>
                <h3 className="font-semibold text-neutral-900 text-sm sm:text-base mb-2">
                  "{item.title}"
                </h3>
                <div className="p-2.5 bg-white rounded-lg border border-neutral-200 font-mono text-xs text-neutral-900 break-all mb-3 select-all">
                  /{item.slug}
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {item.notes}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelectExample(item.title)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-neutral-700 transition-colors cursor-pointer group-hover:underline underline-offset-4"
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
