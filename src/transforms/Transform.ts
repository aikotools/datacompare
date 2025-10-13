/**
 * Base interface for value transforms
 *
 * Transforms modify values before comparison
 * Example: Convert timestamp to ISO string, normalize strings, etc.
 */
export interface CompareTransform {
  /**
   * Unique name for this transform (e.g., 'toISO', 'toString')
   */
  readonly name: string;

  /**
   * Apply the transformation to a value
   *
   * @param value - Value to transform
   * @param params - Optional parameters for the transform
   * @returns Transformed value
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply(value: any, params?: string[]): any;
}
