import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Trash2, 
  Sliders, 
  ExternalLink, 
  Sparkles, 
  Globe, 
  ListOrdered,
  AlertCircle
} from 'lucide-react';
import { 
  generateSlug, 
  analyzeSlug, 
  sanitizeDomain, 
  DEFAULT_SLUG_OPTIONS, 
  SlugOptions,
  SlugAnalysis 
} from '../utils/slugify';

interface SlugGeneratorToolProps {
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  externalInput?: string;
}

const PRESET_EXAMPLES = [
  'Best Running Shoes for Beginners',
  '10 Tips for Better SEO!',
  'How to Build an Online Store in 2026',
  'Café & Restaurant Guide',
  'SEO   Tools---For Everyone',
  'Tokyo 2026: 最新のテクノロジー',
];

export const SlugGeneratorTool: React.FC<SlugGeneratorToolProps> = ({ inputRef, externalInput }) => {
  // Input state
  const [inputText, setInputText] = useState('Best Running Shoes for Beginners in 2026');
  const [manualSlug, setManualSlug] = useState('');
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);

  // Sync external input if passed from parent
  useEffect(() => {
    if (externalInput !== undefined && externalInput !== inputText) {
      setInputText(externalInput);
      setIsManuallyEdited(false);
    }
  }, [externalInput]);

  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [separator, setSeparator] = useState<'-' | '_'>('-');
  const [lowercase, setLowercase] = useState(true);
  const [removeSpecialChars, setRemoveSpecialChars] = useState(true);
  const [maxLength, setMaxLength] = useState<number>(80);
  const [isLengthRestricted, setIsLengthRestricted] = useState(true);
  const [customDomain, setCustomDomain] = useState('example.com');

  // Mode: Single vs Batch
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [batchInput, setBatchInput] = useState(
    "How to Write Great Blog Posts\n10 Tips for Better SEO!\nCafé & Restaurant Guide\nE-Commerce Strategy for 2026"
  );
  const [batchOutput, setBatchOutput] = useState<string[]>([]);

  // Feedback states
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const feedbackTimeout = useRef<number | null>(null);

  // Derived current slug
  const currentOptions: SlugOptions = {
    separator,
    lowercase,
    removeSpecialChars,
    maxLength: isLengthRestricted ? maxLength : undefined,
    preserveUnicode: true,
  };

  // Re-generate slug when input or settings change, unless manually modified
  useEffect(() => {
    if (!isManuallyEdited) {
      const generated = generateSlug(inputText, currentOptions);
      setManualSlug(generated);
    }
  }, [inputText, separator, lowercase, removeSpecialChars, maxLength, isLengthRestricted, isManuallyEdited]);

  // Update batch mode output
  useEffect(() => {
    if (mode === 'batch') {
      const lines = batchInput.split('\n');
      const slugs = lines.map(line => generateSlug(line, currentOptions));
      setBatchOutput(slugs);
    }
  }, [batchInput, separator, lowercase, removeSpecialChars, maxLength, isLengthRestricted, mode]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    };
  }, []);

  const showToast = (message: string) => {
    setCopyFeedback(message);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = window.setTimeout(() => {
      setCopyFeedback(null);
    }, 2800);
  };

  // Safe clipboard copying with graceful textarea fallback
  const copyToClipboard = async (text: string, successLabel: string) => {
    if (!text) {
      showToast('Nothing to copy yet');
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast(successLabel);
        return;
      }
    } catch {
      // Fall through to fallback
    }

    // Fallback using temporary textarea
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        showToast(successLabel);
      } else {
        showToast('Unable to copy. Please copy manually.');
      }
    } catch {
      showToast('Clipboard error. Please select and copy manually.');
    }
  };

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setIsManuallyEdited(false);
  };

  const handleManualSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualSlug(e.target.value);
    setIsManuallyEdited(true);
  };

  const handleClear = () => {
    setInputText('');
    setManualSlug('');
    setIsManuallyEdited(false);
    showToast('Cleared input & slug');
  };

  const handleGenerateAgain = () => {
    setIsManuallyEdited(false);
    const regenerated = generateSlug(inputText, currentOptions);
    setManualSlug(regenerated);
    showToast('Regenerated fresh slug');
  };

  const handlePresetClick = (preset: string) => {
    setInputText(preset);
    setIsManuallyEdited(false);
  };

  // Domain & URL preview calculation
  const cleanDomain = sanitizeDomain(customDomain);
  const fullUrl = `https://${cleanDomain}/${manualSlug}`;

  // Analysis of current slug
  const analysis: SlugAnalysis = analyzeSlug(manualSlug);

  return (
    <div id="generator" className="w-full max-w-4xl mx-auto scroll-mt-24">
      {/* Toast Notification */}
      {copyFeedback && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg shadow-xl border border-neutral-700 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Main Tool Container */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
        
        {/* Mode Selector (Single vs Batch) */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                mode === 'single'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Single Slug
            </button>
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                mode === 'batch'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Batch Mode (Multiple)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              showAdvanced
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Advanced Settings</span>
          </button>
        </div>

        {/* Collapsible Advanced Settings Panel */}
        {showAdvanced && (
          <div className="mt-6 p-5 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm animate-in fade-in duration-150">
            {/* Custom Separator */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Word Separator
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-800">
                  <input
                    type="radio"
                    name="separator"
                    checked={separator === '-'}
                    onChange={() => setSeparator('-')}
                    className="accent-neutral-900 w-4 h-4 cursor-pointer"
                  />
                  <span>Hyphen ( <code className="bg-neutral-200 px-1 py-0.5 rounded text-xs font-mono">-</code> Google Recommended )</span>
                </label>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-800">
                  <input
                    type="radio"
                    name="separator"
                    checked={separator === '_'}
                    onChange={() => setSeparator('_')}
                    className="accent-neutral-900 w-4 h-4 cursor-pointer"
                  />
                  <span>Underscore ( <code className="bg-neutral-200 px-1 py-0.5 rounded text-xs font-mono">_</code> )</span>
                </label>
              </div>
            </div>

            {/* Custom Domain for Preview */}
            <div>
              <label htmlFor="custom-domain-input" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Preview Domain
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 text-xs font-mono">
                  https://
                </span>
                <input
                  id="custom-domain-input"
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full pl-18 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Shown in the URL preview. Not included when copying slug.
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-medium text-neutral-800 text-sm block">Convert to Lowercase</span>
                  <span className="text-xs text-neutral-500">URLs are case-sensitive on some servers</span>
                </div>
                <input
                  type="checkbox"
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                  className="accent-neutral-900 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-medium text-neutral-800 text-sm block">Remove Special Characters</span>
                  <span className="text-xs text-neutral-500">Strips punctuation like !, ?, $, %, &amp;</span>
                </div>
                <input
                  type="checkbox"
                  checked={removeSpecialChars}
                  onChange={(e) => setRemoveSpecialChars(e.target.checked)}
                  className="accent-neutral-900 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Max Slug Length */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Maximum Slug Length
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLengthRestricted}
                    onChange={(e) => setIsLengthRestricted(e.target.checked)}
                    className="accent-neutral-900 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Limit length</span>
                </label>
              </div>

              {isLengthRestricted ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="20"
                      max="150"
                      step="5"
                      value={maxLength}
                      onChange={(e) => setMaxLength(Number(e.target.value))}
                      className="w-full accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-semibold text-neutral-900 w-12 text-right">
                      {maxLength} ch
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Google SERPs display up to ~60-75 characters in URLs before truncating.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic py-2">
                  No character limit enforced.
                </p>
              )}
            </div>

            {/* Reset Settings */}
            <div className="md:col-span-2 pt-2 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSeparator(DEFAULT_SLUG_OPTIONS.separator || '-');
                  setLowercase(DEFAULT_SLUG_OPTIONS.lowercase ?? true);
                  setRemoveSpecialChars(DEFAULT_SLUG_OPTIONS.removeSpecialChars ?? true);
                  setMaxLength(DEFAULT_SLUG_OPTIONS.maxLength || 80);
                  setIsLengthRestricted(true);
                  setCustomDomain('example.com');
                  showToast('Reset settings to default');
                }}
                className="text-xs text-neutral-600 hover:text-neutral-900 font-medium underline underline-offset-4 cursor-pointer"
              >
                Reset to Default Settings
              </button>
            </div>
          </div>
        )}

        {/* SINGLE MODE */}
        {mode === 'single' ? (
          <div className="mt-6 space-y-6">
            
            {/* Input Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="title-input" 
                  className="text-sm font-semibold text-neutral-900"
                >
                  Enter Your Title or Text
                </label>
                <span className="text-xs text-neutral-500 tabular-nums">
                  {inputText.length} characters
                </span>
              </div>
              <textarea
                id="title-input"
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                rows={3}
                placeholder="e.g. The Best Running Shoes for Beginners in 2026"
                className="w-full p-3.5 text-base sm:text-lg bg-neutral-50/60 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors resize-y min-h-[90px]"
              />

              {/* Preset Test Examples */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-neutral-500 font-medium mr-1">Quick Try:</span>
                {PRESET_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handlePresetClick(example)}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Slug Field */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="slug-output" 
                    className="text-sm font-semibold text-neutral-900"
                  >
                    Your SEO-Friendly Slug
                  </label>
                  {isManuallyEdited && (
                    <span className="text-xs text-amber-700 font-medium">
                      (Manually edited)
                    </span>
                  )}
                </div>

                {/* Analysis indicators */}
                {manualSlug && (
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="tabular-nums font-mono">{analysis.characterCount} chars</span>
                    <span>·</span>
                    <span className="tabular-nums font-mono">{analysis.wordCount} words</span>
                  </div>
                )}
              </div>

              {/* Editable Slug Input */}
              <div className="relative">
                <input
                  id="slug-output"
                  type="text"
                  value={manualSlug}
                  onChange={handleManualSlugChange}
                  placeholder="your-generated-slug-appears-here"
                  className="w-full px-4 py-3 text-base font-mono font-medium bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                />
              </div>

              {/* Live URL Preview */}
              <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <Globe className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span className="text-neutral-500 shrink-0">URL Preview:</span>
                  <span className="font-mono text-neutral-900 truncate select-all">
                    https://{cleanDomain}/<strong className="text-neutral-950 underline decoration-neutral-300 underline-offset-2">{manualSlug || 'your-slug'}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(fullUrl, 'Full URL copied to clipboard')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-md font-medium transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Full URL</span>
                </button>
              </div>

              {/* Quality & Guidance Note */}
              {manualSlug && (
                <div className="mt-2.5 flex items-start gap-2 text-xs text-neutral-600">
                  <span className="mt-0.5 shrink-0">
                    {analysis.seoRating === 'optimal' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </span>
                  <span>{analysis.seoMessage}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {/* Primary: Copy Slug */}
              <button
                type="button"
                onClick={() => copyToClipboard(manualSlug, 'Slug copied to clipboard!')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Slug</span>
              </button>

              {/* Secondary: Generate Again */}
              <button
                type="button"
                onClick={handleGenerateAgain}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-neutral-50 text-neutral-800 text-sm font-medium rounded-xl border border-neutral-200 transition-colors cursor-pointer"
                title="Reset manual edits and regenerate from title"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Generate Again</span>
              </button>

              {/* Secondary: Clear */}
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-xl border border-neutral-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>

          </div>
        ) : (
          /* BATCH MODE */
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="batch-input" className="text-sm font-semibold text-neutral-900">
                    Titles / Headlines (One per line)
                  </label>
                  <span className="text-xs text-neutral-500 tabular-nums">
                    {batchInput.split('\n').filter(Boolean).length} lines
                  </span>
                </div>
                <textarea
                  id="batch-input"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  rows={8}
                  placeholder="Enter one title per line..."
                  className="w-full p-3 font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Batch Output */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="batch-output" className="text-sm font-semibold text-neutral-900">
                    Generated Slugs
                  </label>
                  <span className="text-xs text-neutral-500 tabular-nums">
                    {batchOutput.filter(Boolean).length} slugs
                  </span>
                </div>
                <textarea
                  id="batch-output"
                  readOnly
                  value={batchOutput.join('\n')}
                  rows={8}
                  className="w-full p-3 font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none select-all"
                />
              </div>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => copyToClipboard(batchOutput.join('\n'), 'All batch slugs copied!')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy All Slugs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + "Title,Slug,Full_URL\n" 
                    + batchInput.split('\n').map((title, i) => {
                        const slug = batchOutput[i] || '';
                        return `"${title.replace(/"/g, '""')}","${slug}","https://${cleanDomain}/${slug}"`;
                      }).join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "slugs-export.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Exported slugs to CSV');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                <ListOrdered className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBatchInput('');
                  setBatchOutput([]);
                  showToast('Cleared batch input');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
