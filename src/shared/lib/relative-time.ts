// Internal tool, English-only for now (see docs/conventions.md). Keep the
// locale parameter so we can introduce i18n later without changing call sites.

// en-GB gives the day-first ordering (29 May 2026, 14:30) that matches the
// team's expectation. Easy to swap if Doctorina goes multi-locale later.
export const DEFAULT_LOCALE = "en-GB";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Human-readable relative time. Past:
 *   < 60s     "5 seconds ago"
 *   < 60min   "3 minutes ago"
 *   today     "2 hours ago"
 *   yesterday "yesterday"
 *   < 7d      weekday name
 *   this year "5 August"
 *   older     "12 Oct 2025"
 *
 * Future progression mirrors past with "in …" prefixes.
 */
export function formatRelativeTime(
  date: Date,
  now: Date = new Date(),
  locale = DEFAULT_LOCALE,
): string {
  const diffMs = now.getTime() - date.getTime();
  const isFuture = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const absSec = Math.floor(absMs / 1000);
  const absMin = Math.floor(absSec / 60);
  const absHour = Math.floor(absMin / 60);
  const sign = isFuture ? 1 : -1;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absSec < 60) return rtf.format(sign * absSec, "second");
  if (absMin < 60) return rtf.format(sign * absMin, "minute");
  if (isSameDay(date, now)) return rtf.format(sign * absHour, "hour");

  const adjacentDay = new Date(now);
  adjacentDay.setDate(adjacentDay.getDate() + (isFuture ? 1 : -1));
  if (isSameDay(date, adjacentDay)) return rtf.format(sign * 1, "day");

  const absDay = Math.floor(absMs / (1000 * 60 * 60 * 24));
  if (absDay < 7) {
    return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
  }

  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Tooltip / fallback formatting — "5 August 2025, 14:30". */
export function formatFullDateTime(date: Date, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
