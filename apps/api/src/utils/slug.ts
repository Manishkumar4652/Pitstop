/**
 * Converts a text title/name into a URL-friendly, lowercase alphanumeric slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-')  // replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, '');  // remove leading and trailing hyphens
}

/**
 * Generates a unique slug candidate by appending a 4-digit numeric suffix if needed.
 */
export function generateUniqueSlug(baseName: string): string {
  const base = slugify(baseName) || 'rest-stop';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}
