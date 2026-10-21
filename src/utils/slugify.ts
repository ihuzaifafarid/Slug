/**
 * Slug generation and validation utility.
 * Follows SEO best practices and handles international Unicode scripts,
 * accent normalization, ligature expansions, and custom options.
 */

export interface SlugOptions {
  separator?: '-' | '_';
  lowercase?: boolean;
  removeSpecialChars?: boolean;
  maxLength?: number;
  preserveUnicode?: boolean;
}

export const DEFAULT_SLUG_OPTIONS: SlugOptions = {
  separator: '-',
  lowercase: true,
  removeSpecialChars: true,
  maxLength: 80,
  preserveUnicode: true,
};

// Common Latin character ligatures and non-NFD substitutions
const SPECIAL_CHAR_MAP: Record<string, string> = {
  'æ': 'ae',
  'Æ': 'ae',
  'œ': 'oe',
  'Œ': 'oe',
  'ø': 'o',
  'Ø': 'o',
  'ß': 'ss',
  'ẞ': 'ss',
  'đ': 'd',
  'Đ': 'd',
  'ł': 'l',
  'Ł': 'l',
  'þ': 'th',
  'Þ': 'th',
  'ð': 'dh',
  'Ð': 'dh',
};

/**
 * Normalizes text and transforms it into a clean, SEO-friendly URL slug.
 */
export function generateSlug(text: string, options: Partial<SlugOptions> = {}): string {
  if (!text || typeof text !== 'string') return '';

  const opts = { ...DEFAULT_SLUG_OPTIONS, ...options };
  const sep = opts.separator || '-';

  let str = text.trim();
  if (!str) return '';

  // 1. Substitute specific ligatures
  for (const [char, replacement] of Object.entries(SPECIAL_CHAR_MAP)) {
    str = str.split(char).join(replacement);
  }

  // 2. Strip standard diacritics via Unicode NFD normalization
  // e.g. "café" -> "cafe", "München" -> "Munchen"
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 3. Lowercase if requested
  if (opts.lowercase) {
    str = str.toLowerCase();
  }

  // 4. Handle ampersands and currency symbols sensibly before punctuation removal
  // & becomes a separator so "Café & Restaurant" -> "cafe-restaurant"
  str = str.replace(/&+/g, ' ');

  // 5. Replace underscores, hyphens, and whitespace with single separator
  // If removeSpecialChars is enabled:
  if (opts.removeSpecialChars) {
    if (opts.preserveUnicode) {
      // Keep Unicode letters (\p{L}) and numbers (\p{N}), convert everything else to separators
      str = str.replace(/[^\p{L}\p{N}]+/gu, sep);
    } else {
      // Latin letters and digits only
      str = str.replace(/[^a-zA-Z0-9]+/g, sep);
    }
  } else {
    // Keep more characters, but still replace spaces and control chars
    str = str.replace(/[\s]+/g, sep);
  }

  // 6. Escape separator for regex replacement of duplicate separators
  const escapedSep = sep === '-' ? '\\-' : sep;
  const duplicateRegex = new RegExp(`${escapedSep}{2,}`, 'g');
  str = str.replace(duplicateRegex, sep);

  // 7. Trim leading and trailing separators
  const trimRegex = new RegExp(`^${escapedSep}+|${escapedSep}+$`, 'g');
  str = str.replace(trimRegex, '');

  // 8. Max length truncation (if configured)
  if (opts.maxLength && opts.maxLength > 0 && str.length > opts.maxLength) {
    str = str.slice(0, opts.maxLength);
    // Remove any trailing separator created by slicing
    str = str.replace(new RegExp(`${escapedSep}+$`, 'g'), '');
  }

  return str;
}

export interface SlugAnalysis {
  characterCount: number;
  wordCount: number;
  estimatedReadTimeSeconds: number;
  readingTimeFormatted: string;
  seoRating: 'optimal' | 'moderate' | 'long' | 'empty';
  seoMessage: string;
  serpPercent: number;
  serpVisibility: 'safe' | 'caution' | 'risk';
  hasNumbers: boolean;
  hasUppercase: boolean;
  hasUnderscore: boolean;
  stopWordsCount: number;
}

const COMMON_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
  'of', 'with', 'by', 'from', 'as', 'is', 'it', 'this', 'that'
]);

/**
 * Analyzes a slug against search engine URL best practices.
 */
export function analyzeSlug(slug: string): SlugAnalysis {
  const charCount = slug.length;

  if (charCount === 0) {
    return {
      characterCount: 0,
      wordCount: 0,
      estimatedReadTimeSeconds: 0,
      readingTimeFormatted: '0s',
      seoRating: 'empty',
      seoMessage: 'Enter a title to generate a slug.',
      serpPercent: 0,
      serpVisibility: 'safe',
      hasNumbers: false,
      hasUppercase: false,
      hasUnderscore: false,
      stopWordsCount: 0,
    };
  }

  // Estimate words by splitting on hyphens or underscores
  const words = slug.toLowerCase().split(/[-_]+/).filter(Boolean);
  const wordCount = words.length;

  // Calculate estimated reading / scanning time
  // Average reading speed is ~220 WPM (3.6 words/sec), but URLs are scanned at ~4 words/sec
  const seconds = Math.max(0.3, parseFloat((wordCount / 3.6).toFixed(1)));
  const readingTimeFormatted = seconds < 1 ? '< 1s' : `~${seconds}s`;

  // Detect stop words
  const stopWordsCount = words.filter((w) => COMMON_STOP_WORDS.has(w)).length;

  const hasNumbers = /\d/.test(slug);
  const hasUppercase = /[A-Z]/.test(slug);
  const hasUnderscore = slug.includes('_');

  // SERP budget calculation (60 characters is the standard mobile/desktop display baseline)
  const serpPercent = Math.min(100, Math.round((charCount / 60) * 100));

  let seoRating: 'optimal' | 'moderate' | 'long' = 'optimal';
  let serpVisibility: 'safe' | 'caution' | 'risk' = 'safe';
  let seoMessage = 'Optimal length (< 60 chars). Fully visible in Google SERP snippets.';

  if (charCount > 80) {
    seoRating = 'long';
    serpVisibility = 'risk';
    seoMessage = 'High truncation risk. URL exceeds 80 characters and will likely be cut off in search snippets.';
  } else if (charCount > 60) {
    seoRating = 'moderate';
    serpVisibility = 'caution';
    seoMessage = 'Approaching 60-char display boundary. May truncate on mobile search viewports.';
  } else if (wordCount > 7) {
    seoRating = 'moderate';
    serpVisibility = 'caution';
    seoMessage = 'Contains over 7 words. Consider condensing to focus on primary keywords.';
  }

  return {
    characterCount: charCount,
    wordCount,
    estimatedReadTimeSeconds: seconds,
    readingTimeFormatted,
    seoRating,
    seoMessage,
    serpPercent,
    serpVisibility,
    hasNumbers,
    hasUppercase,
    hasUnderscore,
    stopWordsCount,
  };
}

/**
 * Cleans a domain string for the live URL preview.
 */
export function sanitizeDomain(domain: string): string {
  if (!domain) return 'example.com';
  // Strip protocol and trailing slashes if user typed them
  let clean = domain.trim();
  clean = clean.replace(/^(https?:\/\/)?/i, '');
  clean = clean.replace(/\/.*$/, '');
  return clean || 'example.com';
}
