import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns';

export function getPeriodDates(preset, customFrom = '', customTo = '') {
  const now = new Date();

  switch (preset) {
    case 'last_month': {
      const prev = subMonths(now, 1);
      return {
        from: format(startOfMonth(prev), 'yyyy-MM-dd'),
        to: format(endOfMonth(prev), 'yyyy-MM-dd'),
      };
    }
    case 'last_3_months': {
      const threeMonthsAgo = subMonths(now, 2);
      return {
        from: format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    }
    case 'this_year': {
      return {
        from: format(startOfYear(now), 'yyyy-MM-dd'),
        to: format(endOfYear(now), 'yyyy-MM-dd'),
      };
    }
    case 'custom': {
      return {
        from: customFrom || format(startOfMonth(now), 'yyyy-MM-dd'),
        to: customTo || format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    }
    case 'this_month':
    default: {
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    }
  }
}
