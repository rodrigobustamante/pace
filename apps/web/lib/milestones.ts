/**
 * Pure helpers for milestone ordering and display.
 */

/** Returns the number of days from today (UTC midnight) to the given ISO date.
 *  Negative means the date is in the past. */
export function daysUntilMilestone(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Sort comparator for milestone arrays.
 *
 *  Order:
 *  1. Upcoming (days >= 0) — nearest first (ascending).
 *  2. Past (days < 0)      — most recent first, oldest last (descending absolute).
 */
export function compareMilestones(
  a: { targetDate: string },
  b: { targetDate: string },
): number {
  const da = daysUntilMilestone(a.targetDate);
  const db = daysUntilMilestone(b.targetDate);
  const aIsPast = da < 0;
  const bIsPast = db < 0;

  // Past milestones always come after upcoming ones
  if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;

  // Both upcoming: nearest date first
  if (!aIsPast) return da - db;

  // Both past: most recent first (least negative days first)
  return db - da;
}

/** Returns a new sorted array of milestones (does not mutate the input). */
export function sortMilestones<T extends { targetDate: string }>(milestones: T[]): T[] {
  return [...milestones].sort(compareMilestones);
}
