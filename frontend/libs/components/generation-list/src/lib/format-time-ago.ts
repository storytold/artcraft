// Compact relative-time formatter ("just now", "5 minutes ago", "2 months
// ago") for gallery list rows. Kept dependency-free — the apps have no date
// library, and this avoids pulling one in for a single label.

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

const pluralize = (value: number, unit: string): string =>
  `${value} ${unit}${value === 1 ? "" : "s"} ago`;

export function formatTimeAgo(input: string | number | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (!Number.isFinite(seconds) || seconds < 0) return "just now";
  if (seconds < 45) return "just now";
  if (seconds < HOUR) return pluralize(Math.round(seconds / MINUTE), "minute");
  if (seconds < DAY) return pluralize(Math.round(seconds / HOUR), "hour");
  if (seconds < WEEK) return pluralize(Math.round(seconds / DAY), "day");
  if (seconds < MONTH) return pluralize(Math.round(seconds / WEEK), "week");
  if (seconds < YEAR) return pluralize(Math.round(seconds / MONTH), "month");
  return pluralize(Math.round(seconds / YEAR), "year");
}
