import { Injectable } from '@angular/core';

/**
 * Date utility service for week calculations
 * All calculations use IST (Indian Standard Time, UTC+5:30)
 * Week always starts on Monday (ISO 8601 standard)
 *
 * NOTE: Hardcoded to IST for Phase 1 MVP (2 users in India).
 * For multi-timezone support, this would need to be refactored
 * to use user's local timezone or store timezone preferences.
 */
@Injectable({
  providedIn: 'root'
})
export class DateUtilsService {
  // IST offset in minutes (5 hours 30 minutes = 330 minutes)
  private readonly IST_OFFSET_MINUTES = 330;

  /**
   * Convert any date to IST
   * @param date - Date to convert
   * @returns Date object representing the same moment in IST
   */
  private toIST(date: Date = new Date()): Date {
    // Get UTC time in milliseconds
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    // Add IST offset
    return new Date(utcTime + (this.IST_OFFSET_MINUTES * 60000));
  }

  /**
   * Get Monday of the week for a given date (IST-based)
   * @param date - Date to get week start for (defaults to now)
   * @returns Date object set to Monday 00:00:00 IST
   */
  getWeekStart(date: Date = new Date()): Date {
    // Convert to IST
    const istDate = this.toIST(date);

    // Get day of week in IST (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = istDate.getDay();

    // Calculate days to subtract to get to Monday
    // If Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Create new date for Monday
    const monday = new Date(istDate);
    monday.setDate(istDate.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    return monday;
  }

  /**
   * Get Monday of the week as ISO date string (YYYY-MM-DD)
   * Uses IST for week calculation
   * @param date - Date to get week start for (defaults to now)
   * @returns ISO date string (YYYY-MM-DD)
   */
  getWeekStartISO(date: Date = new Date()): string {
    const istDate = this.toIST(date);
    const weekStart = this.getWeekStart(istDate);

    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get Sunday of the week for a given date (IST-based)
   * @param date - Date to get week end for (defaults to now)
   * @returns Date object set to Sunday 23:59:59 IST
   */
  getWeekEnd(date: Date = new Date()): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  /**
   * Get formatted week range string (e.g., "Jan 1 - Jan 7")
   * @param date - Date within the week
   * @returns Formatted string
   */
  getWeekRangeString(date: Date = new Date()): string {
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    const startStr = weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    const endStr = weekEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `${startStr} - ${endStr}`;
  }

  /**
   * Get last week's Monday as Date
   * @returns Date object for last Monday
   */
  getLastWeekStart(): Date {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return this.getWeekStart(lastWeek);
  }

  /**
   * Get last week's Monday as ISO string
   * @returns ISO date string
   */
  getLastWeekStartISO(): string {
    return this.getWeekStartISO(this.getLastWeekStart());
  }

  /**
   * Get next week's Monday as Date
   * @returns Date object for next Monday
   */
  getNextWeekStart(): Date {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return this.getWeekStart(nextWeek);
  }

  /**
   * Get next week's Monday as ISO string
   * @returns ISO date string
   */
  getNextWeekStartISO(): string {
    return this.getWeekStartISO(this.getNextWeekStart());
  }

  /**
   * Check if a date is within the current week
   * @param date - Date to check
   * @returns true if date is in current week
   */
  isCurrentWeek(date: Date): boolean {
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd();
    return date >= weekStart && date <= weekEnd;
  }

  /**
   * Get the day of week as a number (1=Monday, 7=Sunday) - ISO 8601
   * Uses IST for calculation
   * @param date - Date to check
   * @returns Day number (1-7)
   */
  getDayOfWeek(date: Date = new Date()): number {
    const istDate = this.toIST(date);
    const day = istDate.getDay();
    return day === 0 ? 7 : day; // Convert Sunday from 0 to 7 (ISO 8601)
  }

  /**
   * Get number of days since Monday (0=Monday, 6=Sunday)
   * Uses IST for calculation
   * @param date - Date to check
   * @returns Days since Monday (0-6)
   */
  getDaysSinceMonday(date: Date = new Date()): number {
    const istDate = this.toIST(date);
    const weekStart = this.getWeekStart(istDate);
    const diff = istDate.getTime() - weekStart.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if we're currently on Monday or Tuesday (planning window)
   * @returns true if today is Monday or Tuesday
   */
  isInPlanningWindow(): boolean {
    const dayOfWeek = this.getDayOfWeek();
    return dayOfWeek <= 2; // Monday (1) or Tuesday (2)
  }

  /**
   * Get today's date as ISO string (YYYY-MM-DD) in IST
   * @returns ISO date string for today in IST
   */
  getTodayISO(): string {
    const istDate = this.toIST();
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get number of days until next Monday
   * Used for displaying countdown when planning window is closed
   * @returns Number of days until next Monday (0 if today is Monday)
   */
  getDaysUntilMonday(): number {
    const dayOfWeek = this.getDayOfWeek();

    if (dayOfWeek === 1) {
      // Today is Monday
      return 0;
    } else if (dayOfWeek === 0) {
      // Today is Sunday, Monday is tomorrow
      return 1;
    } else {
      // Calculate days until next Monday
      return 8 - dayOfWeek; // Wednesday (3) → 8-3=5 days, Thursday (4) → 8-4=4 days, etc.
    }
  }

  /**
   * Format a date for display
   * Uses IST timezone for formatting
   * @param date - Date to format (string or Date object)
   * @param format - Format style ('short' | 'medium' | 'long')
   * @returns Formatted date string in IST
   */
  formatDate(date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    let options: Intl.DateTimeFormatOptions;

    if (format === 'short') {
      options = { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' };
    } else if (format === 'long') {
      options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' };
    } else {
      options = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' };
    }

    return d.toLocaleDateString('en-IN', options);
  }

  /**
   * Check if today is Friday, Saturday, or Sunday (early planning window)
   * @returns true if Fri/Sat/Sun
   */
  isWeekend(): boolean {
    const dayOfWeek = this.getDayOfWeek();
    return dayOfWeek >= 5; // Fri(5), Sat(6), Sun(7)
  }

  /**
   * Check if today is Monday
   * @returns true if Monday
   */
  isMonday(): boolean {
    return this.getDayOfWeek() === 1;
  }

  /**
   * Check if today is Tuesday through Sunday (mid-week locked period)
   * @returns true if Tue-Sun
   */
  isMidWeek(): boolean {
    const dayOfWeek = this.getDayOfWeek();
    return dayOfWeek >= 2; // Tue(2) through Sun(7)
  }

  /**
   * Get human-readable day name
   * @param date - Date to get day name for (defaults to now)
   * @returns Day name (e.g., "Monday", "Friday")
   */
  getDayName(date: Date = new Date()): string {
    const istDate = this.toIST(date);
    return istDate.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });
  }

  /**
   * Format week range for display from ISO week start date
   * @param weekStartISO - Monday date in YYYY-MM-DD format
   * @returns e.g., "Dec 30 - Jan 5"
   */
  formatWeekRange(weekStartISO: string): string {
    const monday = new Date(weekStartISO);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startStr = monday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    const endStr = sunday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `${startStr} - ${endStr}`;
  }

  /**
   * Calculate hours until Monday midnight IST
   * Used for showing countdown in UI
   * @returns Number of hours until Monday 11:59 PM IST (0 if not Monday)
   */
  getHoursUntilMondayMidnight(): number {
    const now = this.toIST();
    const currentDayOfWeek = this.getDayOfWeek();

    if (currentDayOfWeek !== 1) {
      return 0; // Not Monday, no countdown
    }

    // Calculate Monday midnight (end of Monday)
    const mondayMidnight = new Date(now);
    mondayMidnight.setHours(23, 59, 59, 999);

    const diffMs = mondayMidnight.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60)); // Convert to hours
  }
}
