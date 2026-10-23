export interface SlugOptions {
  separator?: '-' | '_';
  lowercase?: boolean;
  removeSpecialChars?: boolean;
  maxLength?: number;
  preserveUnicode?: boolean;
}

export function serverGenerateSlug(input: string, options: SlugOptions = {}): string {
  const {
    separator = '-',
    lowercase = true,
    removeSpecialChars = true,
    maxLength,
  } = options;

  if (!input || typeof input !== 'string') return '';

  let slug = input.trim();

  // Normalize Unicode characters (accents, umlauts, e.g. café -> cafe)
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Convert & to 'and'
  slug = slug.replace(/&/g, `${separator}and${separator}`);

  if (removeSpecialChars) {
    // Keep alphanumeric and Unicode letters/numbers, replace punctuation with separator
    slug = slug.replace(/[^\p{L}\p{N}]+/gu, separator);
  } else {
    // Keep everything except whitespace
    slug = slug.replace(/\s+/g, separator);
  }

  // Replace consecutive separators with a single separator
  const escapeSep = separator === '-' ? '\\-' : separator;
  const multiSepRegex = new RegExp(`${escapeSep}+`, 'g');
  slug = slug.replace(multiSepRegex, separator);

  // Trim leading and trailing separators
  const trimSepRegex = new RegExp(`^${escapeSep}+|${escapeSep}+$`, 'g');
  slug = slug.replace(trimSepRegex, '');

  // Truncate to maximum length if specified
  if (maxLength && maxLength > 0 && slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Don't cut off in the middle of a word if possible
    const lastSepIndex = slug.lastIndexOf(separator);
    if (lastSepIndex > maxLength * 0.7) {
      slug = slug.substring(0, lastSepIndex);
    }
    slug = slug.replace(trimSepRegex, '');
  }

  return slug;
}
