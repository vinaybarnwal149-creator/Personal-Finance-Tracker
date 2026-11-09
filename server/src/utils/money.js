/**
 * Utility functions for money operations (handling integer minor units)
 */

/**
 * Converts decimal currency amount to minor integer units (e.g. 12.34 -> 1234)
 * @param {number} amount
 * @returns {number}
 */
export function toMinorUnits(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new TypeError('Amount must be a valid number');
  }
  return Math.round(amount * 100);
}

/**
 * Converts minor integer units to decimal currency amount (e.g. 1234 -> 12.34)
 * @param {number} amountMinor
 * @returns {number}
 */
export function toDecimalAmount(amountMinor) {
  if (typeof amountMinor !== 'number' || Number.isNaN(amountMinor)) {
    return 0;
  }
  return Number((amountMinor / 100).toFixed(2));
}
