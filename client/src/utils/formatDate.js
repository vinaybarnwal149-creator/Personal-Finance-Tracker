import { format, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format date with friendly relative labels
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM yyyy');
}

/**
 * Format date for input[type="date"]
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function toDateInputValue(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return format(date, 'yyyy-MM-dd');
}
