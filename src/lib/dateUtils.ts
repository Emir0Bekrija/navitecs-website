/**
 * Timezone-aware date utilities.
 * All public-facing dates are stored in UTC by the DB.
 * These helpers convert "YYYY-MM-DD" filter strings from the admin UI
 * to proper UTC Date boundaries using the business timezone.
 */

const BUSINESS_TZ = "Europe/Sarajevo";

/** Returns the timezone offset in ms for a given IANA tz at a given UTC instant. */
function getOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");

  const h = get("hour");
  const localAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    h === 24 ? 0 : h, // Intl may return 24 for midnight
    get("minute"),
    get("second"),
  );
  return localAsUtc - date.getTime();
}

/**
 * Parses a "YYYY-MM-DD" date string as the start of that calendar day
 * in Europe/Sarajevo timezone, returned as a UTC Date.
 *
 * e.g. "2026-04-28" → 2026-04-27T22:00:00Z (when Sarajevo is UTC+2)
 */
export function tzStartOfDay(dateStr: string): Date {
  // Use noon UTC as the probe to safely determine the offset (avoids DST edges at midnight)
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const offsetMs = getOffsetMs(probe, BUSINESS_TZ);
  return new Date(new Date(`${dateStr}T00:00:00Z`).getTime() - offsetMs);
}

/**
 * Parses a "YYYY-MM-DD" date string as the end of that calendar day (23:59:59.999)
 * in Europe/Sarajevo timezone, returned as a UTC Date.
 *
 * e.g. "2026-04-28" → 2026-04-28T21:59:59.999Z (when Sarajevo is UTC+2)
 */
export function tzEndOfDay(dateStr: string): Date {
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const offsetMs = getOffsetMs(probe, BUSINESS_TZ);
  return new Date(new Date(`${dateStr}T23:59:59.999Z`).getTime() - offsetMs);
}
