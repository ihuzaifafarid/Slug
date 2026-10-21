import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'what-is-slug-generator',
    question: '1. What is a slug generator?',
    answer:
      'A slug generator is a tool that converts regular text, article headlines, or product titles into a standardized, web-safe string of characters suitable for URL addresses. It automatically handles lowercase conversion, space-to-hyphen replacement, and strips unsupported punctuation.',
  },
  {
    id: 'how-to-create-seo-friendly-url',
    question: '2. How do I create an SEO-friendly URL?',
    answer:
      'To create an SEO-friendly URL, keep it short and descriptive (typically 3 to 5 words), separate words with hyphens, use all lowercase letters, remove punctuation and special characters, and avoid unnecessary stop words or dates unless essential to the content.',
  },
  {
    id: 'hyphens-vs-underscores',
    question: '3. Should URL slugs use hyphens or underscores?',
    answer:
      "Slugs should almost always use hyphens. Google's search algorithms treat hyphens as natural word separators (e.g., 'best-running-shoes' is indexed as 'best running shoes'), whereas underscores may be treated as a single concatenated term ('best_running_shoes').",
  },
  {
    id: 'shopify-products',
    question: '4. Can I use this slug generator for Shopify products?',
    answer:
      "Yes. In Shopify, URL slugs are known as 'URL handles'. You can paste your Shopify product names, blog titles, or collection names into this generator to produce clean URL handles that improve store scannability and organic search ranking.",
  },
  {
    id: 'affect-seo',
    question: '5. Does changing a URL slug affect SEO?',
    answer:
      'Yes. When you change an established URL slug, search engines treat the new URL as an entirely new page. Unless you set up a permanent 301 redirect from the old URL to the new one, any existing backlinks will return 404 errors and you risk losing search rankings.',
  },
  {
    id: 'is-it-free',
    question: '6. Is this slug generator free?',
    answer:
      'Yes, this slug generator is 100% free with no registration, subscriptions, or usage limits. All conversions are processed locally inside your browser, so your text is never transmitted or stored on any remote server.',
  },
];

export const FaqSection: React.FC = () => {
  // Keep first two open by default for immediate value
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'what-is-slug-generator': true,
    'how-to-create-seo-friendly-url': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-neutral-50/70 border-b border-neutral-200 scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-600">
            Everything you need to know about URL slugs, search engine optimization, and website address formatting.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_DATA.map((item) => {
            const isOpen = Boolean(openItems[item.id]);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-neutral-900 hover:text-neutral-950 cursor-pointer"
                >
                  <span className="text-base">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-neutral-900' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-neutral-600 text-sm leading-relaxed border-t border-neutral-100">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
