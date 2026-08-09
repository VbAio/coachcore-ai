/** True only when the value looks like a real verification timestamp. */
export function isEmailVerified(value: unknown): boolean {
  if (value == null || value === false) return false;

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === 'number') {
    // Auth.js may store Date as unix ms
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'false') {
      return false;
    }
    const parsed = Date.parse(trimmed);
    return !Number.isNaN(parsed);
  }

  return false;
}
