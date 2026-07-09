import { festivalDay, FESTIVAL_DAY_OFFSET_HOURS } from '../festivalDay';

describe('festivalDay', () => {
  it('keeps evening sets on their own calendar day', () => {
    // JENNIE — Thu 22:45
    expect(festivalDay('2026-07-09T22:45:00')).toBe('2026-07-09');
    // JALEN NGONDA — Sat 18:30 (earliest start)
    expect(festivalDay('2026-07-11T18:30:00')).toBe('2026-07-11');
  });

  it('rolls late-night sets back onto the previous day', () => {
    // FLORENCE + THE MACHINE starts 00:30 but belongs to Thursday July 9
    expect(festivalDay('2026-07-10T00:30:00')).toBe('2026-07-09');
    // KSAL — latest post-midnight start, 01:15
    expect(festivalDay('2026-07-12T01:15:00')).toBe('2026-07-11');
  });

  it('treats the 06:00 boundary as the start of a new festival day', () => {
    expect(festivalDay('2026-07-10T05:59:00')).toBe('2026-07-09');
    expect(festivalDay('2026-07-10T06:00:00')).toBe('2026-07-10');
  });

  it('rolls a date back across a month boundary', () => {
    expect(festivalDay('2026-08-01T01:00:00')).toBe('2026-07-31');
  });

  it('exposes a 6-hour offset', () => {
    expect(FESTIVAL_DAY_OFFSET_HOURS).toBe(6);
  });
});
