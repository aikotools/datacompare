import { DateTime, Duration } from 'luxon';
import type { TimeRange, TimeUnit } from '../core/types';

/**
 * Utility functions for time comparisons and range calculations
 */
export class TimeUtils {
  /**
   * Parse a time range specification
   *
   * Formats:
   * - -60:+60 → {before: -60, after: 60} (both past and future)
   * - +60 → {before: 0, after: 60} (only future)
   * - -60 → {before: -60, after: 0} (only past)
   */
  static parseTimeRange(rangeSpec: string, unit: TimeUnit): TimeRange {
    if (rangeSpec.includes(':')) {
      // Combined range: -60:+60 (past:future)
      const [beforeStr, afterStr] = rangeSpec.split(':');
      const before = parseFloat(beforeStr);
      const after = parseFloat(afterStr);

      if (isNaN(before) || isNaN(after)) {
        throw new Error(`Invalid time range: ${rangeSpec}`);
      }

      return { before, after, unit };
    } else {
      // Single sided: +60 or -60
      const value = parseFloat(rangeSpec);
      if (isNaN(value)) {
        throw new Error(`Invalid time range: ${rangeSpec}`);
      }

      if (value >= 0) {
        return { before: 0, after: value, unit };
      } else {
        return { before: value, after: 0, unit };
      }
    }
  }

  /**
   * Check if a time is within a range of a base time
   */
  static isTimeInRange(
    actualTime: DateTime,
    baseTime: DateTime,
    range: TimeRange
  ): { inRange: boolean; difference: number; unit: string } {
    // Calculate time difference in the specified unit
    const diff = actualTime.diff(baseTime);
    const diffValue = diff.as(range.unit);

    // Check if within range
    const inRange = diffValue >= range.before && diffValue <= range.after;

    return {
      inRange,
      difference: diffValue,
      unit: range.unit,
    };
  }

  /**
   * Parse a timestamp (string or number) to DateTime
   *
   * Supports:
   * - ISO strings: "2023-12-01T10:30:00Z"
   * - Unix timestamps in seconds: 1234567890
   * - Unix timestamps in milliseconds: 1234567890000
   */
  static parseTimestamp(value: string | number): DateTime {
    if (typeof value === 'string') {
      const dt = DateTime.fromISO(value, { zone: 'utc' });
      if (!dt.isValid) {
        throw new Error(`Invalid ISO timestamp: ${value}`);
      }
      return dt;
    }

    if (typeof value === 'number') {
      // Detect if seconds or milliseconds (< 10 billion = seconds)
      const isSeconds = value < 10000000000;
      const dt = isSeconds
        ? DateTime.fromSeconds(value, { zone: 'utc' })
        : DateTime.fromMillis(value, { zone: 'utc' });

      if (!dt.isValid) {
        throw new Error(`Invalid timestamp: ${value}`);
      }
      return dt;
    }

    throw new Error(`Unsupported timestamp type: ${typeof value}`);
  }

  /**
   * Get base time from context
   *
   * Priority: startTimeTest > startTimeScript > current time
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getBaseTime(context: Record<string, any>): DateTime {
    if (context.startTimeTest) {
      return this.parseTimestamp(context.startTimeTest);
    }

    if (context.startTimeScript) {
      return this.parseTimestamp(context.startTimeScript);
    }

    // Default to current time
    return DateTime.utc();
  }

  /**
   * Calculate a time with offset
   */
  static calculateTime(baseTime: DateTime, offset: number, unit: TimeUnit): DateTime {
    const duration = Duration.fromObject({ [unit]: offset });
    return baseTime.plus(duration);
  }

  /**
   * Format a range for error messages
   */
  static formatRange(range: TimeRange): string {
    if (range.before === 0 && range.after > 0) {
      return `+${range.after} ${range.unit}`;
    } else if (range.after === 0 && range.before < 0) {
      return `${range.before} ${range.unit}`;
    } else {
      return `${range.before}:+${range.after} ${range.unit}`;
    }
  }
}
