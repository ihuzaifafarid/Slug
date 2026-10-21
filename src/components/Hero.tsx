import React from 'react';
import { SlugGeneratorTool } from './SlugGeneratorTool';

interface HeroProps {
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  externalInput?: string;
}

export const Hero: React.FC<HeroProps> = ({ inputRef, externalInput }) => {
  return (
    <section className="pt-10 pb-14 sm:pt-14 sm:pb-20 bg-gradient-to-b from-neutral-50 via-white to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 border-b border-neutral-200/70 dark:border-neutral-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Hero Copy */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 dark:text-white text-balance leading-tight">
            Generate Clean, SEO-Friendly URL Slugs
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed text-balance">
            Convert titles into readable, search-engine-friendly URLs in seconds. Free, fast, and easy to use.
          </p>
        </div>

        {/* Main Generator Tool directly below description */}
        <SlugGeneratorTool inputRef={inputRef} externalInput={externalInput} />

      </div>
    </section>
  );
};
