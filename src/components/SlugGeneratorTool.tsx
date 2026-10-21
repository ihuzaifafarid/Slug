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
  AlertCircle,
  History,
  Clock,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { 
  generateSlug, 
  analyzeSlug, 
  sanitizeDomain, 
  DEFAULT_SLUG_OPTIONS, 
  SlugOptions,
  SlugAnalysis 
} from '../utils/slugify';
import { SlugStatsWidget } from './SlugStatsWidget';
import { useToast } from '../context/ToastContext';

export interface HistoryItem {
  id: string;
  title: string;
  slug: string;
  timestamp: number;
}

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

const LOCAL_STORAGE_HISTORY_KEY = 'sluggenerator_history_v1';
const MAX_HISTORY_ITEMS = 5;

export const SlugGeneratorTool: React.FC<SlugGeneratorToolProps> = ({ inputRef, externalInput }) => {
  const { showToast, showCopySlugToast, showCopyUrlToast } = useToast();

  // Input state
  const [inputText, setInputText] = useState('Best Running Shoes for Beginners in 2026');
  const [manualSlug, setManualSlug] = useState('');
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);

  // Tactile button copy state indicators
  const [copiedSlugState, setCopiedSlugState] = useState(false);
  const [copiedUrlState, setCopiedUrlState] = useState(false);

  // History state (last 5 slugs in localStorage)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const historyDropdownRef = useRef<HTMLDivElement | null>(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Save history item helper
  const saveToHistory = (title: string, slug: string) => {
    const cleanTitle = title.trim();
    const cleanSlug = slug.trim();
    if (!cleanTitle || !cleanSlug) return;

    setHistory((prev) => {
      // Avoid duplicate consecutive entry with same slug
      if (prev.length > 0 && prev[0].slug === cleanSlug) {
        return prev;
      }
      const newItem: HistoryItem = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle,
        slug: cleanSlug,
        timestamp: Date.now(),
      };
      // Keep only the last 5 items
      const updated = [newItem, ...prev.filter((item) => item.slug !== cleanSlug)].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyDropdownRef.current &&
        !historyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowHistoryDropdown(false);
      }
    };
    if (showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoryDropdown]);

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

  // Reliable clipboard copy helper
  const copyText = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }

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
      return Boolean(successful);
    } catch {
      return false;
    }
  };

  // Primary Copy Slug Handler
  const handleCopySlug = async () => {
    if (!manualSlug || !manualSlug.trim()) {
      showToast({ title: 'Nothing to copy', snippet: 'Enter a title or text to generate a slug', type: 'info' });
      return;
    }
    const success = await copyText(manualSlug);
    if (success) {
      setCopiedSlugState(true);
      setTimeout(() => setCopiedSlugState(false), 1800);
      showCopySlugToast(manualSlug);
    } else {
      showToast({ title: 'Copy failed', snippet: 'Please select and copy the slug manually', type: 'error' });
    }
  };

  // Copy Full URL Handler
  const handleCopyFullUrl = async () => {
    if (!manualSlug || !manualSlug.trim()) {
      showToast({ title: 'Nothing to copy', snippet: 'Enter a title or text to generate a full URL', type: 'info' });
      return;
    }
    const success = await copyText(fullUrl);
    if (success) {
      setCopiedUrlState(true);
      setTimeout(() => setCopiedUrlState(false), 1800);
      showCopyUrlToast(fullUrl);
    } else {
      showToast({ title: 'Copy failed', snippet: 'Please select and copy the URL manually', type: 'error' });
    }
  };

  // History Slug Copy Handler
  const handleCopyHistorySlug = async (slug: string) => {
    const success = await copyText(slug);
    if (success) {
      showCopySlugToast(slug);
    }
  };

  // Batch Slugs Copy Handler
  const handleCopyBatch = async () => {
    const content = batchOutput.join('\n');
    if (!content.trim()) {
      showToast({ title: 'No batch slugs to copy', type: 'info' });
      return;
    }
    const success = await copyText(content);
    if (success) {
      showToast({
        title: 'Batch slugs copied to clipboard',
        snippet: `${batchOutput.filter(Boolean).length} URLs generated`,
        type: 'success',
        actionType: 'batch',
      });
    }
  };

  // Auto-save stable slug to history (debounced 1.2s after typing stops)
  useEffect(() => {
    if (!manualSlug || !inputText || inputText.trim().length < 3) return;
    const timer = setTimeout(() => {
      saveToHistory(inputText, manualSlug);
    }, 1200);
    return () => clearTimeout(timer);
  }, [manualSlug, inputText]);

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
    showToast({ title: 'Editor cleared', snippet: 'Ready for new title or text', type: 'info' });
  };

  const handleGenerateAgain = () => {
    setIsManuallyEdited(false);
    const regenerated = generateSlug(inputText, currentOptions);
    setManualSlug(regenerated);
    if (inputText.trim() && regenerated.trim()) {
      saveToHistory(inputText, regenerated);
    }
    showToast({ title: 'Regenerated fresh slug', snippet: `/${regenerated}`, type: 'success', actionType: 'slug' });
  };

  const handlePresetClick = (preset: string) => {
    setInputText(preset);
    setIsManuallyEdited(false);
  };

  const handleRevertHistory = (item: HistoryItem) => {
    setInputText(item.title);
    setManualSlug(item.slug);
    setIsManuallyEdited(false);
    setShowHistoryDropdown(false);
    showToast({ title: 'Loaded from history', snippet: `/${item.slug}`, type: 'info', actionType: 'slug' });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch {
      // ignore
    }
    showToast({ title: 'Cleared slug history', type: 'info' });
  };

  const handleExportHistoryCsv = () => {
    if (history.length === 0) {
      showToast({ title: 'No history items to export', type: 'info' });
      return;
    }
    const headers = 'Title,Slug,Full_URL,Created_At\n';
    const rows = history
      .map((item) => {
        const escapedTitle = `"${item.title.replace(/"/g, '""')}"`;
        const full = `https://${cleanDomain}/${item.slug}`;
        const isoTime = new Date(item.timestamp).toISOString();
        return `${escapedTitle},"${item.slug}","${full}","${isoTime}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `slug-history-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast({
      title: 'Exported slugs to CSV',
      snippet: `${history.length} items formatted for 301 redirects`,
      type: 'success',
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (elapsedSeconds < 60) return 'Just now';
    const mins = Math.floor(elapsedSeconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'Earlier';
  };

  // Domain & URL preview calculation
  const cleanDomain = sanitizeDomain(customDomain);
  const fullUrl = `https://${cleanDomain}/${manualSlug}`;

  // Analysis of current slug
  const analysis: SlugAnalysis = analyzeSlug(manualSlug);

  return (
    <div id="generator" className="w-full max-w-4xl mx-auto scroll-mt-24">

      {/* Main Tool Container */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 sm:p-8 transition-colors">
        
        {/* Mode Selector (Single vs Batch) */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                mode === 'single'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Single Slug
            </button>
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                mode === 'batch'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Batch Mode (Multiple)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* History Dropdown */}
            <div className="relative" ref={historyDropdownRef}>
              <button
                type="button"
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                  showHistoryDropdown
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
                title="View last 5 generated slugs from localStorage"
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
                {history.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    showHistoryDropdown 
                      ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-950' 
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                  }`}>
                    {history.length}
                  </span>
                )}
              </button>

              {/* History Dropdown Menu Popover */}
              {showHistoryDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl z-30 p-3 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                      <Clock className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      <span>Saved Slugs ({history.length} of {MAX_HISTORY_ITEMS})</span>
                    </div>
                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <div className="py-6 text-center text-neutral-400 dark:text-neutral-500">
                      <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                      <p className="font-medium text-neutral-700 dark:text-neutral-300">No slug history yet</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Your last 5 generated slugs will automatically be saved in localStorage.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-800 transition-colors flex items-center justify-between gap-2 group"
                        >
                          <div 
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() => handleRevertHistory(item)}
                            title="Click to revert generator to this title and slug"
                          >
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-sans">
                              {item.title}
                            </p>
                            <p className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate mt-0.5">
                              /{item.slug}
                            </p>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mt-0.5">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyHistorySlug(item.slug)}
                              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                              title="Copy this slug"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevertHistory(item)}
                              className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                              title="Revert editor to this slug"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {history.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleExportHistoryCsv}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Download CSV for URL migration sheets and 301 redirects"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV ({history.length})</span>
                      </button>

                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        Useful for 301 redirect maps
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Settings Button */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                showAdvanced
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 border-neutral-900 dark:border-white'
                  : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Advanced Settings</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Settings Panel */}
        {showAdvanced && (
          <div className="mt-6 p-5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm animate-in fade-in duration-150 text-neutral-800 dark:text-neutral-200">
            {/* Custom Separator */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                Word Separator
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-800 dark:text-neutral-200">
                  <input
                    type="radio"
                    name="separator"
                    checked={separator === '-'}
                    onChange={() => setSeparator('-')}
                    className="accent-neutral-900 dark:accent-white w-4 h-4 cursor-pointer"
                  />
                  <span>Hyphen ( <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded text-xs font-mono">-</code> Google Recommended )</span>
                </label>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-800 dark:text-neutral-200">
                  <input
                    type="radio"
                    name="separator"
                    checked={separator === '_'}
                    onChange={() => setSeparator('_')}
                    className="accent-neutral-900 dark:accent-white w-4 h-4 cursor-pointer"
                  />
                  <span>Underscore ( <code className="bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 rounded text-xs font-mono">_</code> )</span>
                </label>
              </div>
            </div>

            {/* Custom Domain for Preview */}
            <div>
              <label htmlFor="custom-domain-input" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                Preview Domain
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500 text-xs font-mono">
                  https://
                </span>
                <input
                  id="custom-domain-input"
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full pl-18 pr-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Shown in the URL preview. Not included when copying slug.
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 text-sm block">Convert to Lowercase</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">URLs are case-sensitive on some servers</span>
                </div>
                <input
                  type="checkbox"
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                  className="accent-neutral-900 dark:accent-white w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 text-sm block">Remove Special Characters</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Strips punctuation like !, ?, $, %, &amp;</span>
                </div>
                <input
                  type="checkbox"
                  checked={removeSpecialChars}
                  onChange={(e) => setRemoveSpecialChars(e.target.checked)}
                  className="accent-neutral-900 dark:accent-white w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Max Slug Length */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Maximum Slug Length
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLengthRestricted}
                    onChange={(e) => setIsLengthRestricted(e.target.checked)}
                    className="accent-neutral-900 dark:accent-white w-3.5 h-3.5 cursor-pointer"
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
                      className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                    />
                    <span className="text-xs font-mono font-semibold text-neutral-900 dark:text-neutral-100 w-12 text-right">
                      {maxLength} ch
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Google SERPs display up to ~60-75 characters in URLs before truncating.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 italic py-2">
                  No character limit enforced.
                </p>
              )}
            </div>

            {/* Reset Settings */}
            <div className="md:col-span-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSeparator(DEFAULT_SLUG_OPTIONS.separator || '-');
                  setLowercase(DEFAULT_SLUG_OPTIONS.lowercase ?? true);
                  setRemoveSpecialChars(DEFAULT_SLUG_OPTIONS.removeSpecialChars ?? true);
                  setMaxLength(DEFAULT_SLUG_OPTIONS.maxLength || 80);
                  setIsLengthRestricted(true);
                  setCustomDomain('example.com');
                  showToast({ title: 'Settings reset to default', type: 'info' });
                }}
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium underline underline-offset-4 cursor-pointer"
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
                  className="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                >
                  Enter Your Title or Text
                </label>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
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
                className="w-full p-3.5 text-base sm:text-lg bg-neutral-50/60 hover:bg-neutral-50 focus:bg-white dark:bg-neutral-950 dark:hover:bg-neutral-950 dark:focus:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white transition-colors resize-y min-h-[90px]"
              />

              {/* Preset Test Examples */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium mr-1">Quick Try:</span>
                {PRESET_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handlePresetClick(example)}
                    className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {example}
                  </button>
                ))}
              </div>

              {/* Quick History Revert Bar (if items exist) */}
              {history.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium mr-1 flex items-center gap-1">
                      <History className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                      <span>Recent:</span>
                    </span>
                    {history.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRevertHistory(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 font-mono text-[11px] rounded-md transition-colors cursor-pointer truncate max-w-[190px]"
                        title={`Revert to "${item.title}"`}
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                        <span className="truncate">/{item.slug}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleExportHistoryCsv}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer hover:underline"
                    title="Download CSV file of recent slugs"
                  >
                    <Download className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              )}
            </div>

            {/* Generated Slug Field */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="slug-output" 
                    className="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                  >
                    Your SEO-Friendly Slug
                  </label>
                  {isManuallyEdited && (
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      (Manually edited)
                    </span>
                  )}
                </div>

                {/* Analysis indicators */}
                {manualSlug && (
                  <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
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
                  className="w-full px-4 py-3 text-base font-mono font-medium bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white transition-colors"
                />
              </div>

              {/* Live URL Preview */}
              <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-950/80 rounded-xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <Globe className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                  <span className="text-neutral-500 dark:text-neutral-400 shrink-0">URL Preview:</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-300 truncate select-all">
                    https://{cleanDomain}/<strong className="text-neutral-950 dark:text-white underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">{manualSlug || 'your-slug'}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyFullUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg font-medium transition-all duration-150 cursor-pointer shrink-0 active:scale-[0.98]"
                >
                  {copiedUrlState ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full URL</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real-time SEO Statistics Widget (Characters, Read Time, SERP Budget, Words) */}
              <div className="mt-3">
                <SlugStatsWidget analysis={analysis} slug={manualSlug} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {/* Primary: Copy Slug */}
              <button
                type="button"
                onClick={handleCopySlug}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white"
              >
                {copiedSlugState ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    <span>Copied Slug!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Slug</span>
                  </>
                )}
              </button>

              {/* Secondary: Generate Again */}
              <button
                type="button"
                onClick={handleGenerateAgain}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                title="Reset manual edits and regenerate from title"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Generate Again</span>
              </button>

              {/* Secondary: Clear */}
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
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
                  <label htmlFor="batch-input" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Titles / Headlines (One per line)
                  </label>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {batchInput.split('\n').filter(Boolean).length} lines
                  </span>
                </div>
                <textarea
                  id="batch-input"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  rows={8}
                  placeholder="Enter one title per line..."
                  className="w-full p-3 font-mono text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
                />
              </div>

              {/* Batch Output */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="batch-output" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Generated Slugs
                  </label>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {batchOutput.filter(Boolean).length} slugs
                  </span>
                </div>
                <textarea
                  id="batch-output"
                  readOnly
                  value={batchOutput.join('\n')}
                  rows={8}
                  className="w-full p-3 font-mono text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none select-all transition-colors"
                />
              </div>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyBatch}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold rounded-xl transition-colors cursor-pointer active:scale-[0.98]"
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
                  showToast({ title: 'Exported batch slugs to CSV', snippet: `${batchOutput.filter(Boolean).length} rows generated`, type: 'success' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                <ListOrdered className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBatchInput('');
                  setBatchOutput([]);
                  showToast({ title: 'Cleared batch input', type: 'info' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
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
