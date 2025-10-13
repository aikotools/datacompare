import type { CompareDirective } from './CompareDirective';
import type { DirectiveRequest, MatchResult, MatchContext, TimeUnit } from '../core/types';
import { TimeUtils } from '../utils/TimeUtils';

/**
 * Time directive for time range comparisons
 *
 * Validates that a timestamp is within a range of a base time
 *
 * Examples:
 * - {{compare:time:range:-300:+300:seconds}}  → Within 5 minutes past and future
 * - {{compare:time:range:+60:minutes}} → Up to 60 minutes in the future
 * - {{compare:time:range:-60:minutes}} → Up to 60 minutes in the past
 * - {{compare:time:exact}} → Exact time match
 */
export class TimeDirective implements CompareDirective {
  readonly name = 'time';

  createMatcher(request: DirectiveRequest) {
    const { directive } = request;

    if (directive.args.length === 0) {
      throw new Error('time directive requires at least one argument');
    }

    const mode = directive.args[0];

    if (mode === 'range') {
      return this.createRangeMatcher(directive.args.slice(1));
    } else if (mode === 'exact') {
      return this.createExactMatcher();
    } else {
      throw new Error(`Unknown time mode '${mode}'. Available modes: range, exact`);
    }
  }

  /**
   * Create a range matcher
   *
   * Args formats:
   * - ["-300", "+300", "seconds"] → Combined range (past and future)
   * - ["+60", "seconds"] → Future only
   * - ["-60", "seconds"] → Past only
   */
  private createRangeMatcher(args: string[]) {
    if (args.length < 2) {
      throw new Error('time:range requires at least 2 arguments');
    }

    // Validate unit (last argument)
    const validUnits: TimeUnit[] = [
      'milliseconds',
      'seconds',
      'minutes',
      'hours',
      'days',
      'weeks',
      'months',
      'years',
    ];

    const unit = args[args.length - 1] as TimeUnit;
    if (!validUnits.includes(unit)) {
      throw new Error(`Invalid time unit '${unit}'. Valid units: ${validUnits.join(', ')}`);
    }

    // Parse range based on number of arguments
    let range;
    if (args.length === 3) {
      // Combined range: ["-300", "+300", "seconds"]
      const before = parseFloat(args[0]);
      const after = parseFloat(args[1]);
      if (isNaN(before) || isNaN(after)) {
        throw new Error(`Invalid time range values: ${args[0]}, ${args[1]}`);
      }
      range = { before, after, unit };
    } else if (args.length === 2) {
      // Single-sided: ["+60", "seconds"] or ["-60", "seconds"]
      const value = parseFloat(args[0]);
      if (isNaN(value)) {
        throw new Error(`Invalid time range value: ${args[0]}`);
      }
      if (value >= 0) {
        range = { before: 0, after: value, unit };
      } else {
        range = { before: value, after: 0, unit };
      }
    } else {
      throw new Error(
        `Invalid number of arguments for time:range. Expected 2 or 3, got ${args.length}`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actual: any, _expected: any, matchContext: MatchContext): MatchResult => {
      try {
        // Parse actual timestamp
        const actualTime = TimeUtils.parseTimestamp(actual);

        // Get base time from context
        const baseTime = TimeUtils.getBaseTime(matchContext.compareContext);

        // Check if within range
        const result = TimeUtils.isTimeInRange(actualTime, baseTime, range);

        if (result.inRange) {
          return {
            success: true,
            details: `Time within range ${TimeUtils.formatRange(range)} (difference: ${result.difference.toFixed(2)} ${result.unit})`,
            matchedValue: actual,
          };
        } else {
          return {
            success: false,
            error: `Time outside range ${TimeUtils.formatRange(range)}. Difference: ${result.difference.toFixed(2)} ${result.unit}`,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: `Time parsing error: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    };
  }

  /**
   * Create an exact matcher (±0)
   */
  private createExactMatcher() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actual: any, _expected: any, matchContext: MatchContext): MatchResult => {
      try {
        // Parse actual timestamp
        const actualTime = TimeUtils.parseTimestamp(actual);

        // Get base time from context
        const baseTime = TimeUtils.getBaseTime(matchContext.compareContext);

        // Check if exactly equal
        const diff = actualTime.diff(baseTime).as('milliseconds');

        if (diff === 0) {
          return {
            success: true,
            details: 'Time matches exactly',
            matchedValue: actual,
          };
        } else {
          return {
            success: false,
            error: `Time mismatch. Difference: ${diff} milliseconds`,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: `Time parsing error: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    };
  }
}
