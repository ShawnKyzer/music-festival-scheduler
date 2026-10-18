/**
 * Display formatting shared by the lineup, schedule and share image. Stage and
 * set times are null until a festival publishes its timetable.
 */

/** "June 2–6", or "May 30 – June 2" when the range spans two months. */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  const startMonth = start.toLocaleDateString([], { month: 'long' });
  const endMonth = end.toLocaleDateString([], { month: 'long' });
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
}

export function formatSetTime(isoString: string | null): string {
  if (!isoString) return 'TBA';
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatVenue(stageName: string | null, stageLocation: string | null): string {
  if (!stageName) return 'Stage TBA';
  return stageLocation ? `${stageName} - ${stageLocation}` : stageName;
}
