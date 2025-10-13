import type { CompareDirective } from './CompareDirective';
import type { DirectiveRequest, MatchResult, MatchContext } from '../core/types';
import { NumberUtils } from '../utils/NumberUtils';

/**
 * Number directive for number range and tolerance comparisons
 *
 * Validates that a number is within a range or tolerance
 *
 * Examples:
 * - {{compare:number:range:0:100}} → Number between 0 and 100
 * - {{compare:number:tolerance:42:±5}} → Number 42 ± 5 (37-47)
 * - {{compare:number:tolerance:100:±10%}} → Number 100 ± 10% (90-110)
 */
export class NumberDirective implements CompareDirective {
  readonly name = 'number';

  createMatcher(request: DirectiveRequest) {
    const { directive } = request;

    if (directive.args.length === 0) {
      throw new Error('number directive requires at least one argument');
    }

    const mode = directive.args[0];

    if (mode === 'range') {
      return this.createRangeMatcher(directive.args.slice(1));
    } else if (mode === 'tolerance') {
      return this.createToleranceMatcher(directive.args.slice(1));
    } else {
      throw new Error(`Unknown number mode '${mode}'. Available modes: range, tolerance`);
    }
  }

  /**
   * Create a range matcher
   *
   * Args: [min, max]
   * Example: ["0", "100"]
   */
  private createRangeMatcher(args: string[]) {
    if (args.length < 2) {
      throw new Error('number:range requires 2 arguments: min and max');
    }

    const range = NumberUtils.parseNumberRange(args[0], args[1]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actual: any, _expected: any, _context: MatchContext): MatchResult => {
      // Check if actual is a number
      if (typeof actual !== 'number') {
        return {
          success: false,
          error: `Expected number, got ${typeof actual}`,
        };
      }

      // Check if within range
      const result = NumberUtils.isNumberInRange(actual, range);

      if (result.inRange) {
        return {
          success: true,
          details: `Number ${actual} is within range ${NumberUtils.formatRange(range)}`,
          matchedValue: actual,
        };
      } else {
        return {
          success: false,
          error: `Number ${actual} is outside range ${NumberUtils.formatRange(range)} (distance: ${result.distance})`,
        };
      }
    };
  }

  /**
   * Create a tolerance matcher
   *
   * Args: [value, tolerance]
   * Example: ["42", "±5"] or ["100", "±10%"]
   */
  private createToleranceMatcher(args: string[]) {
    if (args.length < 2) {
      throw new Error('number:tolerance requires 2 arguments: value and tolerance');
    }

    const spec = NumberUtils.parseNumberTolerance(args[0], args[1]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actual: any, _expected: any, _context: MatchContext): MatchResult => {
      // Check if actual is a number
      if (typeof actual !== 'number') {
        return {
          success: false,
          error: `Expected number, got ${typeof actual}`,
        };
      }

      // Check if within tolerance
      const result = NumberUtils.isNumberWithinTolerance(actual, spec);

      if (result.within) {
        return {
          success: true,
          details: `Number ${actual} is within tolerance of ${NumberUtils.formatTolerance(spec)} (difference: ${result.difference.toFixed(2)}, allowed: ${result.allowedDifference.toFixed(2)})`,
          matchedValue: actual,
        };
      } else {
        return {
          success: false,
          error: `Number ${actual} exceeds tolerance of ${NumberUtils.formatTolerance(spec)} (difference: ${result.difference.toFixed(2)}, allowed: ${result.allowedDifference.toFixed(2)})`,
        };
      }
    };
  }
}
