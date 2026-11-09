/**
 * Formats a numeric amount into localized currency
 * @param {number} amount
 * @param {string} currency
 * @param {string} locale
 * @returns {string}
 */
export function formatCurrency(amount = 0, currency = 'USD', locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

/**
 * Formats signed currency (+ for income, - for expense)
 * @param {number} amount
 * @param {'income'|'expense'} type
 * @param {string} currency
 * @param {string} locale
 */
export function formatSignedCurrency(amount = 0, type = 'expense', currency = 'USD', locale = 'en-US') {
  const formatted = formatCurrency(Math.abs(amount), currency, locale);
  if (type === 'income') {
    return `+${formatted}`;
  }
  return `-${formatted}`;
}

/**
 * Formats currency in a compact form for chart axes (e.g. ₹50K, $1.2M)
 * @param {number} amount
 * @param {string} currency
 * @param {string} locale
 */
export function formatCompactCurrency(amount = 0, currency = 'USD', locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount}`;
  }
}
