/**
 * RFC 4180 compliant CSV field escaping.
 * Wrap fields containing commas, quotes, or newlines in double quotes.
 * Escape internal double quotes by doubling them.
 */
export function escapeCsvField(value: string): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
