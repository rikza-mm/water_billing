/**
 * Utility functions for safe number conversion and formatting
 */

/**
 * Safely converts a value to number with fallback
 * @param value - Value to convert (string, number, null, undefined)
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Converted number or fallback
 */
export const safeNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  
  return fallback;
};

/**
 * Safely formats a number to fixed decimal places
 * @param value - Value to format
 * @param decimals - Number of decimal places (default: 1)
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Formatted number string
 */
export const safeToFixed = (value: unknown, decimals: number = 1, fallback: number = 0): string => {
  const num = safeNumber(value, fallback);
  return num.toFixed(decimals);
};

/**
 * Safely converts value to currency format
 * @param value - Value to format
 * @param fallback - Fallback value if conversion fails (default: 0)
 * @returns Formatted currency string
 */
export const safeCurrency = (value: unknown, fallback: number = 0): number => {
  return safeNumber(value, fallback);
};

/**
 * Checks if a value is a valid number (not null, undefined, NaN, or empty string)
 * @param value - Value to check
 * @returns True if valid number
 */
export const isValidNumber = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  
  if (typeof value === 'string') {
    return !isNaN(parseFloat(value));
  }
  
  return false;
};

/**
 * Safely calculates percentage
 * @param value - Numerator value
 * @param total - Denominator value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage as number
 */
export const safePercentage = (value: unknown, total: unknown, decimals: number = 1): number => {
  const num = safeNumber(value, 0);
  const den = safeNumber(total, 0);
  
  if (den === 0) return 0;
  
  const percentage = (num / den) * 100;
  return parseFloat(percentage.toFixed(decimals));
};

/**
 * Safely sums an array of values
 * @param values - Array of values to sum
 * @returns Sum as number
 */
export const safeSum = (values: Array<unknown>): number => {
  return values.reduce<number>((sum, value) => sum + safeNumber(value, 0), 0);
};

/**
 * Safely calculates average of an array of values
 * @param values - Array of values
 * @param decimals - Number of decimal places (default: 2)
 * @returns Average as number
 */
export const safeAverage = (values: Array<unknown>, decimals: number = 2): number => {
  if (values.length === 0) return 0;
  
  const sum = safeSum(values);
  const average = sum / values.length;
  
  return parseFloat(average.toFixed(decimals));
};
