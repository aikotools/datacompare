import { CompareRegistry } from './CompareRegistry';
import { CompareParser } from './CompareParser';
import { RecursiveComparer } from './RecursiveComparer';
import type {
  CompareRequest,
  CompareResult,
  CompareError,
  CompareDetail,
  CompareStats,
  CompareErrorType,
} from './types';

/**
 * Main comparison engine
 *
 * Entry point for all data comparison operations
 */
export class CompareEngine {
  private registry: CompareRegistry;
  private parser: CompareParser;

  constructor(registry?: CompareRegistry) {
    this.registry = registry || new CompareRegistry();
    this.parser = new CompareParser();
  }

  /**
   * Get the registry (for registering custom directives)
   */
  getRegistry(): CompareRegistry {
    return this.registry;
  }

  /**
   * Get the parser
   */
  getParser(): CompareParser {
    return this.parser;
  }

  /**
   * Compare expected and actual data
   *
   * This is the main entry point for comparison operations
   */
  async compare(request: CompareRequest): Promise<CompareResult> {
    const startTime = Date.now();
    const errors: CompareError[] = [];
    const details: CompareDetail[] = [];

    const { expected, actual, context = {}, options = {} } = request;

    // Set default options
    const mergedOptions = {
      format: 'json' as const,
      ignoreExtraProperties: true,
      ...options,
    };

    // Validate inputs
    if (actual === undefined) {
      errors.push({
        path: 'root',
        type: 'MISSING_PROPERTY' as CompareErrorType,
        expected: 'any value',
        actual: undefined,
        message: 'Actual value is undefined',
      });

      return this.buildResult(errors, details, startTime);
    }

    // Use RecursiveComparer for deep comparison
    const comparer = new RecursiveComparer(this.parser, this.registry);
    const result = await comparer.compare(expected, actual, [], context, mergedOptions);

    errors.push(...result.errors);
    details.push(...result.details);

    return this.buildResult(errors, details, startTime, result.maxDepthReached);
  }

  /**
   * Build the final result
   */
  private buildResult(
    errors: CompareError[],
    details: CompareDetail[],
    startTime: number,
    maxDepthReached?: number
  ): CompareResult {
    const duration = Date.now() - startTime;
    const passedChecks = details.filter(d => d.passed).length;
    const failedChecks = errors.length;
    const totalChecks = passedChecks + failedChecks;

    const stats: CompareStats = {
      totalChecks,
      passedChecks,
      failedChecks,
      duration,
      maxDepthReached,
    };

    return {
      success: errors.length === 0,
      errors,
      details,
      stats,
    };
  }
}
