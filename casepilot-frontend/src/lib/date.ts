export function formatDateOnly(value: string): string {
  if (!value) {
    return value;
  }

  const normalized = value.trim();

  const isoMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const dottedMatch = normalized.match(/^(\d{2}\.\d{2}\.\d{4})/);
  if (dottedMatch) {
    return dottedMatch[1];
  }

  return normalized;
}