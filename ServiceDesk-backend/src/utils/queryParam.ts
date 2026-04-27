/**
 * Safely extract a string value from req.query.
 * Express 5 types query values as `string | string[] | undefined`.
 * This helper normalizes to `string | undefined`.
 */
export function qs(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
