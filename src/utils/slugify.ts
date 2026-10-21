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
  seoRating: 'optimal' | 'moderate' | 'long' | 'empty';
  seoMessage: string;
  hasNumbers: boolean;
  hasUppercase: boolean;
  hasUnderscore: boolean;
}

/**
 * Analyzes a slug against search engine URL best practices.
 */
export function analyzeSlug(slug: string): SlugAnalysis {
  const charCount = slug.length;

  if (charCount === 0) {
    return {
      characterCount: 0,
      wordCount: 0,
      seoRating: 'empty',
      seoMessage: 'Enter a title to generate a slug.',
      hasNumbers: false,
      hasUppercase: false,
      hasUnderscore: false,
    };
  }

  // Estimate words by splitting on hyphens or underscores
  const words = slug.split(/[-_]+/).filter(Boolean);
  const wordCount = words.length;

  const hasNumbers = /\d/.test(slug);
  const hasUppercase = /[A-Z]/.test(slug);
  const hasUnderscore = slug.includes('_');

  let seoRating: 'optimal' | 'moderate' | 'long' = 'optimal';
  let seoMessage = 'Excellent SEO length (under 60 characters).';

  if (charCount > 80) {
    seoRating = 'long';
    seoMessage = 'Slug is quite long (>80 chars). Google may truncate it in search snippets.';
  } else if (charCount > 60) {
    seoRating = 'moderate';
    seoMessage = 'Good length, but approaching SERP display boundary (60–75 chars).';
  } else if (wordCount > 8) {
    seoRating = 'moderate';
    seoMessage = 'Contains many words. Consider condensing to primary keywords.';
  }

  return {
    characterCount: charCount,
    wordCount,
    seoRating,
    seoMessage,
    hasNumbers,
    hasUppercase,
    hasUnderscore,
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
