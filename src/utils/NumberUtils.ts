import type { NumberRange, NumberTolerance } from '../core/types';

/**
 * Utility functions for number comparisons and range calculations
 */
export class NumberUtils {
  /**
   * Parse a number range specification
   *
   * Format: min:max
   * Example: "0:100" → {min: 0, max: 100}
   */
  static parseNumberRange(minStr: string, maxStr: string): NumberRange {
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);

    if (isNaN(min) || isNaN(max)) {
      throw new Error(`Invalid number range: ${minStr}:${maxStr}`);
    }

    if (min > max) {
      throw new Error(`Invalid range: min (${min}) cannot be greater than max (${max})`);
    }

    return { min, max };
  }

  /**
   * Parse a number tolerance specification
   *
   * Formats:
   * - ±5 → {value: 0, tolerance: 5, isPercentage: false}
   * - ±10% → {value: 0, tolerance: 10, isPercentage: true}
   */
  static parseNumberTolerance(valueStr: string, toleranceStr: string): NumberTolerance {
    const value = parseFloat(valueStr);
    if (isNaN(value)) {
      throw new Error(`Invalid value: ${valueStr}`);
    }

    // Check if tolerance is percentage
    const isPercentage = toleranceStr.endsWith('%');
    const toleranceNumStr = isPercentage ? toleranceStr.slice(0, -1) : toleranceStr;

    // Remove ± prefix if present
    const cleanTolerance = toleranceNumStr.startsWith('±')
      ? toleranceNumStr.slice(1)
      : toleranceNumStr;

    const tolerance = parseFloat(cleanTolerance);
    if (isNaN(tolerance) || tolerance < 0) {
      throw new Error(`Invalid tolerance: ${toleranceStr}`);
    }

    return { value, tolerance, isPercentage };
  }

  /**
   * Check if a number is within a range
   */
  static isNumberInRange(
    actual: number,
    range: NumberRange
  ): { inRange: boolean; distance: number } {
    const inRange = actual >= range.min && actual <= range.max;

    // Calculate distance from range (0 if inside, positive if outside)
    let distance = 0;
    if (actual < range.min) {
      distance = range.min - actual;
    } else if (actual > range.max) {
      distance = actual - range.max;
    }

    return { inRange, distance };
  }

  /**
   * Check if a number is within tolerance of a value
   */
  static isNumberWithinTolerance(
    actual: number,
    spec: NumberTolerance
  ): { within: boolean; difference: number; allowedDifference: number } {
    // Calculate allowed difference
    const allowedDifference = spec.isPercentage
      ? (Math.abs(spec.value) * spec.tolerance) / 100
      : spec.tolerance;

    // Calculate actual difference
    const difference = Math.abs(actual - spec.value);

    // Check if within tolerance
    const within = difference <= allowedDifference;

    return { within, difference, allowedDifference };
  }

  /**
   * Format a range for error messages
   */
  static formatRange(range: NumberRange): string {
    return `[${range.min}, ${range.max}]`;
  }

  /**
   * Format a tolerance for error messages
   */
  static formatTolerance(spec: NumberTolerance): string {
    if (spec.isPercentage) {
      return `${spec.value} ±${spec.tolerance}%`;
    } else {
      return `${spec.value} ±${spec.tolerance}`;
    }
  }
}
