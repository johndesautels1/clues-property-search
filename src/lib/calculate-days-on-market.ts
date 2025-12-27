/**
 * Calculate Days on Market (DOM) from listing date
 *
 * Auto-updates every calendar day - no timer needed!
 * Calculates the difference between today and the listing date.
 *
 * @param listingDate - ISO date string or Date object (e.g., "2024-12-20" or "2024-12-20T10:00:00Z")
 * @returns Number of days on market (0 if listed today, 1 if listed yesterday, etc.)
 */
export function calculateDaysOnMarket(listingDate: string | Date | null | undefined): number {
  if (!listingDate) return 0;

  try {
    const listed = new Date(listingDate);
    const today = new Date();

    // Reset both dates to midnight to get full day difference
    listed.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - listed.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Return 0 if listing date is in the future (shouldn't happen, but safety check)
    return Math.max(0, diffDays);
  } catch (error) {
    console.warn('[calculateDaysOnMarket] Invalid date:', listingDate, error);
    return 0;
  }
}

/**
 * Format days on market with human-readable label
 *
 * @param days - Number of days
 * @returns Formatted string (e.g., "New Today", "2 days", "45 days")
 */
export function formatDaysOnMarket(days: number): string {
  if (days === 0) return 'New Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Get color class based on days on market
 * Hot properties (0-7 days) = green
 * Normal (8-30 days) = amber
 * Stale (31-90 days) = orange
 * Very stale (90+ days) = red
 *
 * @param days - Number of days on market
 * @returns Tailwind color class
 */
export function getDaysOnMarketColor(days: number): string {
  if (days <= 7) return 'text-green-400';
  if (days <= 30) return 'text-amber-400';
  if (days <= 90) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Get market velocity status
 *
 * @param days - Number of days on market
 * @returns Status label
 */
export function getMarketVelocityStatus(days: number): string {
  if (days <= 7) return 'Hot';
  if (days <= 30) return 'Normal';
  if (days <= 90) return 'Slow';
  return 'Stale';
}
