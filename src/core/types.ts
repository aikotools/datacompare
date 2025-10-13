/**
 * Core types and interfaces for the datacompare engine
 */

/**
 * Request parameters for comparing data
 */
export interface CompareRequest {
  /** Expected object with compare directives */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any

  /** Actual object to compare against */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actual: any

  /** Optional context for comparison */
  context?: CompareContext

  /** Optional comparison options */
  options?: CompareOptions
}

/**
 * Options for data comparison
 */
export interface CompareOptions {
  /** Data format being compared */
  format?: 'json' | 'text' | 'xml'

  /** Strict mode: exact matching everywhere (no partial matching) */
  strictMode?: boolean

  /** Ignore extra properties in actual object (default: true) */
  ignoreExtraProperties?: boolean

  /** Maximum nesting depth for recursive comparison */
  maxDepth?: number

  /** Stop comparison after first N errors (for performance) */
  maxErrors?: number
}

/**
 * Context passed during comparison
 */
export interface CompareContext {
  /** Test case identifier */
  testcaseId?: string

  /** ISO timestamp when test started */
  startTimeTest?: string

  /** ISO timestamp when script started */
  startTimeScript?: string

  /** Additional context data */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/**
 * Result of a comparison operation
 */
export interface CompareResult {
  /** Overall success status (true = no errors) */
  success: boolean

  /** List of all errors found */
  errors: CompareError[]

  /** Detailed information about all checks performed */
  details: CompareDetail[]

  /** Statistics about the comparison */
  stats: CompareStats
}

/**
 * Error type enumeration
 */
export enum CompareErrorType {
  MISSING_PROPERTY = 'MISSING_PROPERTY',
  EXTRA_PROPERTY = 'EXTRA_PROPERTY',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  VALUE_MISMATCH = 'VALUE_MISMATCH',
  PATTERN_MISMATCH = 'PATTERN_MISMATCH',
  RANGE_EXCEEDED = 'RANGE_EXCEEDED',
  ARRAY_LENGTH_MISMATCH = 'ARRAY_LENGTH_MISMATCH',
  ARRAY_ELEMENT_MISMATCH = 'ARRAY_ELEMENT_MISMATCH',
  REFERENCE_UNRESOLVED = 'REFERENCE_UNRESOLVED',
  REFERENCE_AMBIGUOUS = 'REFERENCE_AMBIGUOUS',
  DIRECTIVE_ERROR = 'DIRECTIVE_ERROR',
}

/**
 * A single comparison error
 */
export interface CompareError {
  /** JSON path to the error location */
  path: string

  /** Type of error */
  type: CompareErrorType

  /** Expected value */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any

  /** Actual value */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actual: any

  /** Human-readable error message */
  message: string
}

/**
 * Detailed information about a single check
 */
export interface CompareDetail {
  /** JSON path to the checked location */
  path: string

  /** Whether the check passed */
  passed: boolean

  /** Expected value */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any

  /** Actual value */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actual: any

  /** Optional message */
  message?: string

  /** Type of check performed */
  checkType?: string
}

/**
 * Statistics about the comparison
 */
export interface CompareStats {
  /** Total number of checks performed */
  totalChecks: number

  /** Number of checks that passed */
  passedChecks: number

  /** Number of checks that failed */
  failedChecks: number

  /** Comparison duration in milliseconds */
  duration: number

  /** Maximum depth reached during comparison */
  maxDepthReached?: number
}

/**
 * Parsed compare directive structure
 */
export interface ParsedDirective {
  /** Original directive string */
  original: string

  /** Directive action (startsWith, endsWith, time, ref, etc.) */
  action: string

  /** Directive arguments */
  args: string[]

  /** Transform pipeline */
  transforms: ParsedTransform[]
}

/**
 * Parsed transform in a directive
 */
export interface ParsedTransform {
  /** Transform name */
  name: string

  /** Transform parameters */
  params: string[]
}

/**
 * Match context for directive evaluation
 */
export interface MatchContext {
  /** JSON path as array */
  path: string[]

  /** Actual value */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actual: any

  /** Expected value (may contain directive) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: any

  /** Compare context */
  compareContext: CompareContext

  /** Parent object (for context-aware matching) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parent?: any
}

/**
 * Result of a match operation
 */
export interface MatchResult {
  /** Whether the match succeeded */
  success: boolean

  /** Error message if match failed */
  error?: string

  /** Additional details about the match */
  details?: string

  /** Actual value that was matched (after transformations) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matchedValue?: any
}

/**
 * Request for directive resolution
 */
export interface DirectiveRequest {
  /** Parsed directive */
  directive: ParsedDirective

  /** Comparison context */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>

  /** Reference to registry (avoiding circular dependency) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registry?: any
}

/**
 * Time range specification
 */
export interface TimeRange {
  /** Offset before base time (negative or 0) */
  before: number

  /** Offset after base time (positive or 0) */
  after: number

  /** Time unit (seconds, minutes, hours, days) */
  unit: TimeUnit
}

/**
 * Time unit enumeration
 */
export type TimeUnit =
  | 'milliseconds'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years'

/**
 * Number range specification
 */
export interface NumberRange {
  /** Minimum value (inclusive) */
  min: number

  /** Maximum value (inclusive) */
  max: number
}

/**
 * Number tolerance specification
 */
export interface NumberTolerance {
  /** Base value */
  value: number

  /** Tolerance amount */
  tolerance: number

  /** Whether tolerance is percentage */
  isPercentage: boolean
}

/**
 * Reference placeholder information
 */
export interface ReferencePlaceholder {
  /** Unique identifier */
  id: string

  /** List of paths where this reference appears */
  paths: ReferencePath[]

  /** Resolved value (once determined) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any

  /** Whether value has been resolved */
  resolved: boolean
}

/**
 * Path where a reference appears
 */
export interface ReferencePath {
  /** JSON path as array */
  path: string[]

  /** Type of occurrence (value or key) */
  type: 'value' | 'key'

  /** Value found at this path in actual object */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actualValue?: any
}

/**
 * Comparison constants (special keywords)
 */
export const COMPARE_KEYWORDS = {
  /** Exact property matching for objects */
  EXACT: '{{compare:exact}}',

  /** Ignore this value during comparison */
  IGNORE: '{{compare:ignore}}',

  /** Ignore remaining array elements */
  IGNORE_REST: '{{compare:ignoreRest}}',

  /** Ignore array element order */
  IGNORE_ORDER: '{{compare:ignoreOrder}}',
} as const

/**
 * Directive pattern regex
 */
export const DIRECTIVE_PATTERN = /\{\{compare:([^}]+)\}\}/g
