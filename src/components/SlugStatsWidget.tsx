import React from 'react';
import { SlugAnalysis } from '../utils/slugify';
import { 
  Clock, 
  Hash, 
  Type, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  BarChart3,
  Search
} from 'lucide-react';

interface SlugStatsWidgetProps {
  analysis: SlugAnalysis;
  slug: string;
}

export const SlugStatsWidget: React.FC<SlugStatsWidgetProps> = ({ analysis, slug }) => {
  if (!slug) {
    return (
      <div className="p-3.5 bg-neutral-50/70 dark:bg-neutral-950/70 rounded-xl border border-neutral-200/70 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          <span>Real-time SEO metrics will display once a title is entered.</span>
        </div>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">0 chars · 0s read</span>
      </div>
    );
  }

  // Visual color determination
  const isSafe = analysis.serpVisibility === 'safe';
  const isCaution = analysis.serpVisibility === 'caution';
  const isRisk = analysis.serpVisibility === 'risk';

  const barColor = isRisk 
    ? 'bg-rose-500' 
    : isCaution 
    ? 'bg-amber-500' 
    : 'bg-emerald-500';

  const statusBadge = isRisk ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
      <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
      <span>SERP Truncation Risk</span>
    </span>
  ) : isCaution ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60">
      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      <span>Approaching Limit</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
      <span>Optimal SERP Length</span>
    </span>
  );

  return (
    <div className="p-4 bg-neutral-50/80 dark:bg-neutral-950/80 rounded-xl border border-neutral-200/90 dark:border-neutral-800 text-xs transition-all animate-in fade-in duration-100">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200/70 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <BarChart3 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <span>SEO Real-Time Statistics</span>
        </div>
        <div>{statusBadge}</div>
      </div>

      {/* 4 Stat Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Metric 1: Character Count */}
        <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="text-[11px] font-medium">Characters</span>
            <Type className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold font-mono text-neutral-950 dark:text-neutral-100 tabular-nums">
              {analysis.characterCount}
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">/ 60 target</span>
          </div>
          {/* Progress bar towards 60-char baseline */}
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${barColor}`}
              style={{ width: `${Math.min(100, Math.round((analysis.characterCount / 60) * 100))}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Estimated Read Time */}
        <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="text-[11px] font-medium">Est. Read Time</span>
            <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold font-mono text-neutral-950 dark:text-neutral-100 tabular-nums">
              {analysis.readingTimeFormatted}
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 truncate">
            ~4 words / sec scan
          </p>
        </div>

        {/* Metric 3: Word Count */}
        <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="text-[11px] font-medium">Word Count</span>
            <Hash className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold font-mono text-neutral-950 dark:text-neutral-100 tabular-nums">
              {analysis.wordCount}
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">words</span>
          </div>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 truncate">
            {analysis.wordCount <= 5 ? 'Ideal (3–5 words)' : 'Can be condensed'}
          </p>
        </div>

        {/* Metric 4: SERP Display Budget */}
        <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="text-[11px] font-medium">SERP Budget</span>
            <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold font-mono text-neutral-950 dark:text-neutral-100 tabular-nums">
              {analysis.serpPercent}%
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 truncate">
            {analysis.characterCount <= 60 ? '100% Mobile Safe' : 'May wrap or cut off'}
          </p>
        </div>

      </div>

      {/* SEO Recommendation Line */}
      <div className="mt-3 pt-2.5 border-t border-neutral-200/70 dark:border-neutral-800 flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-300">
        {isSafe ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        )}
        <span className="leading-snug">{analysis.seoMessage}</span>
        {analysis.stopWordsCount > 0 && (
          <span className="text-neutral-400 dark:text-neutral-500 ml-auto hidden sm:inline whitespace-nowrap">
            {analysis.stopWordsCount} stop word{analysis.stopWordsCount > 1 ? 's' : ''} preserved
          </span>
        )}
      </div>

    </div>
  );
};
