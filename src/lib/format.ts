/** Dates in Ghanaian English style, e.g. "17 Nov 2026". */
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

/** "5 minutes ago", "yesterday", "3 days ago"; older than a month falls back to the date. */
export function timeAgo(iso: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 30 * 86_400) return rtf.format(Math.round(diff / 86_400), 'day');
  return formatDate(iso);
}

/** A YYYY-MM-DD needed-by date compared with today: overdue, today, soon (within 7 days) or later. */
export function neededByState(neededBy: string | undefined, now = new Date()) {
  if (!neededBy || !/^\d{4}-\d{2}-\d{2}$/.test(neededBy)) return null;
  const today = now.toISOString().slice(0, 10);
  const days = Math.round((Date.parse(`${neededBy}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  const state = days < 0 ? 'overdue' : days === 0 ? 'today' : days <= 7 ? 'soon' : 'later';
  return { state, days, label: formatDate(`${neededBy}T00:00:00Z`) } as const;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;
