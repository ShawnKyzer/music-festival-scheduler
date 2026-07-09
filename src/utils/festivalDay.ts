/**
 * Festival-day helpers.
 *
 * A festival "day" doesn't end at midnight — headline and late-night sets run
 * past 00:00 and belong to the day that started the previous evening. For
 * example, FLORENCE + THE MACHINE starts at 2026-07-10T00:30 but is part of the
 * Thursday July 9 programme.
 *
 * We treat the boundary between festival days as 06:00: anything starting
 * before 06:00 counts towards the previous calendar day. This keeps every
 * late-night set (which all start by ~01:15 and end by 02:00) grouped with its
 * evening, while the earliest evening sets (~18:30) stay on their own day.
 *
 * This constant is interpolated directly into the date(...) SQL modifier in
 * src/db/queries.ts, so the JS grouping and the SQL day buckets can't drift.
 */
export const FESTIVAL_DAY_OFFSET_HOURS = 6;

/**
 * Returns the festival day (YYYY-MM-DD) that an ISO timestamp belongs to.
 *
 * The timestamps are stored without a timezone (they are wall-clock festival
 * time), so this does pure calendar arithmetic in UTC to avoid the device
 * timezone shifting the resulting date — matching SQLite's timezone-agnostic
 * date() behaviour.
 */
export function festivalDay(isoString: string): string {
  const [datePart, timePart = '00:00:00'] = isoString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = 0] = timePart.split(':').map(Number);

  const shifted = new Date(
    Date.UTC(year, month - 1, day, hour) -
      FESTIVAL_DAY_OFFSET_HOURS * 60 * 60 * 1000
  );

  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
