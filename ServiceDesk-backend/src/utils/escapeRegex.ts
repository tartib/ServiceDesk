/**
 * Escapes all regex-special characters so the string can be safely
 * used inside `new RegExp()` or MongoDB `$regex` as a literal match.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
