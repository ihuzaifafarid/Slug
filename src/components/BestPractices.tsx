import React from 'react';
import { Check, X, ShieldAlert, BookOpen, Layers, Sparkles } from 'lucide-react';

export const BestPractices: React.FC = () => {
  return (
    <section id="best-practices" className="py-16 sm:py-20 bg-white border-b border-neutral-200 scroll-mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section 1: What is a URL slug? */}
        <div className="mb-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 mb-4">
              What is a URL slug?
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed mb-6">
              A URL slug is the readable, human-friendly part of a web address that identifies a specific page on a website. For example, in <code className="bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded font-mono text-sm border border-neutral-200">example.com/seo-friendly-urls</code>, the slug is <strong className="font-semibold text-neutral-900">seo-friendly-urls</strong>.
            </p>
          </div>

          {/* URL Anatomy Graphic */}
          <div className="p-5 sm:p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Anatomy of an SEO-Friendly Web Address
            </h3>
            
            <div className="p-3 sm:p-4 bg-white rounded-xl border border-neutral-200 font-mono text-xs sm:text-sm overflow-x-auto flex items-center gap-1">
              <span className="text-neutral-400 select-all">https://</span>
              <span className="text-neutral-500 font-semibold select-all">example.com/</span>
              <span className="text-neutral-400 select-all">blog/</span>
              <span className="bg-neutral-900 text-white px-2 py-0.5 rounded font-bold tracking-wide select-all">
                seo-friendly-urls
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-400 block mb-0.5">Protocol</span>
                <span className="font-semibold text-neutral-800">https://</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-400 block mb-0.5">Domain</span>
                <span className="font-semibold text-neutral-800">example.com</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-400 block mb-0.5">Directory Path</span>
                <span className="font-semibold text-neutral-800">/blog/</span>
              </div>
              <div className="p-2.5 bg-neutral-900 text-white rounded-lg">
                <span className="text-neutral-400 block mb-0.5">The Slug</span>
                <span className="font-semibold text-white">seo-friendly-urls</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Best practices for SEO-friendly slugs */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 mb-4">
            Best Practices for SEO-Friendly Slugs
          </h2>
          <p className="text-neutral-600 mb-8 max-w-3xl leading-relaxed">
            Search engines like Google rely on URL structures to understand page hierarchy and topical relevance. Clean slugs also improve human click-through rates (CTR) across search results and social platforms.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            
            <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  1. Keep slugs short and descriptive
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Focus on 3 to 5 primary words. Shorter URLs are easier to read, remember, share, and prevent search engines from truncating your link in desktop and mobile results.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-200/80 font-mono text-xs text-neutral-700">
                <span className="text-neutral-400">Target:</span> Under 60 characters
              </div>
            </div>

            <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  2. Use hyphens to separate words
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Google officially recommends hyphens (<code className="bg-neutral-200 px-1 py-0.5 rounded text-xs">-</code>) rather than underscores (<code className="bg-neutral-200 px-1 py-0.5 rounded text-xs">_</code>). Search crawlers treat hyphens as spaces, whereas underscores may combine words together.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-200/80 font-mono text-xs text-neutral-700">
                <span className="text-neutral-400">Standard:</span> word-one-word-two
              </div>
            </div>

            <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  3. Use meaningful keywords naturally
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Include target keywords that accurately reflect what the reader will find on the page. Avoid repetitive keyword stuffing, which looks spammy to both visitors and search engines.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-200/80 font-mono text-xs text-neutral-700">
                <span className="text-neutral-400">Example:</span> running-shoes-for-beginners
              </div>
            </div>

            <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  4. Avoid unnecessary parameters &amp; symbols
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Strip out query strings, session IDs, dates (unless publishing time-sensitive news), punctuation marks, and non-ASCII symbols that can cause browser encoding errors.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-200/80 font-mono text-xs text-neutral-700">
                <span className="text-neutral-400">Avoid:</span> ?id=9482&amp;session=xyz
              </div>
            </div>

            <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  5. Keep URLs readable for people
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  If a human cannot immediately guess what your page is about just by glancing at the link, your slug is not optimized. Clear URLs build user trust and boost click-through rates.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-200/80 font-mono text-xs text-neutral-700">
                <span className="text-neutral-400">Rule of thumb:</span> Instantly scannable
              </div>
            </div>

            <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  6. Avoid changing URLs without 301 redirects
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Established URLs accumulate search authority and external backlinks. If you must modify an existing slug, implement a permanent 301 server redirect to protect your SEO rankings.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-200/80 font-mono text-xs text-neutral-700">
                <span className="text-neutral-400">HTTP Status:</span> 301 Moved Permanently
              </div>
            </div>

          </div>

          {/* Good vs Bad Comparison Table */}
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm sm:text-base">URL Slug Comparison: Good vs. Bad</h3>
                <p className="text-xs text-neutral-300">Real-world examples of how formatting affects search clarity</p>
              </div>
            </div>

            <div className="divide-y divide-neutral-200 bg-white">
              
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>SEO-Optimized Slug</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-neutral-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    /best-running-shoes-beginners
                  </div>
                  <p className="text-xs text-neutral-500">Concise, hyphenated, clear topical intent.</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Poor Slug Structure</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-neutral-700 bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                    /p?id=8291_Best_Running_Shoes!_2026_FINAL
                  </div>
                  <p className="text-xs text-neutral-500">Uses underscores, query parameter, exclamation point.</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>SEO-Optimized Slug</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-neutral-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    /cafe-restaurant-guide-paris
                  </div>
                  <p className="text-xs text-neutral-500">Normalized accents ("café" → "cafe") and clean hyphenation.</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Poor Slug Structure</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-neutral-700 bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                    /Caf%C3%A9%20&amp;%20Restaurant%20Guide
                  </div>
                  <p className="text-xs text-neutral-500">Messy URL encoding (%C3%A9, %20) and unhandled ampersand.</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>SEO-Optimized Slug</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-neutral-900 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                    /how-to-bake-sourdough-bread
                  </div>
                  <p className="text-xs text-neutral-500">Natural title-based slug without superfluous fluff.</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Poor Slug Structure</span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-neutral-700 bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                    /2026/04/12/recipes/post-index.php?entry=41
                  </div>
                  <p className="text-xs text-neutral-500">Deep folder bloat, unnecessary server extension, meaningless ID.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
