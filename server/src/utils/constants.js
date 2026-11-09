export const TRANSACTION_TYPES = ['income', 'expense'];

export const PAYMENT_METHODS = [
  'cash',
  'card',
  'bank_transfer',
  'digital_wallet',
  'other'
];

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'JPY',
  'AUD',
  'CAD',
  'AED',
  'SGD',
  'CNY',
  'BRL',
  'ZAR'
];

export const DEFAULT_CATEGORIES = {
  expense: [
    { name: 'Food & Dining', color: '#F97316', icon: 'utensils' },
    { name: 'Groceries', color: '#84CC16', icon: 'shopping-cart' },
    { name: 'Rent & Housing', color: '#6366F1', icon: 'home' },
    { name: 'Utilities', color: '#06B6D4', icon: 'zap' },
    { name: 'Transport', color: '#14B8A6', icon: 'car' },
    { name: 'Health', color: '#F43F5E', icon: 'heart-pulse' },
    { name: 'Entertainment', color: '#A855F7', icon: 'film' },
    { name: 'Shopping', color: '#EC4899', icon: 'shopping-bag' },
    { name: 'Education', color: '#8B5CF6', icon: 'graduation-cap' },
    { name: 'Travel', color: '#F59E0B', icon: 'plane' },
    { name: 'Subscriptions', color: '#64748B', icon: 'repeat' },
    { name: 'Other', color: '#94A3B8', icon: 'tag' }
  ],
  income: [
    { name: 'Salary', color: '#10B981', icon: 'briefcase' },
    { name: 'Freelance', color: '#22C55E', icon: 'laptop' },
    { name: 'Investments', color: '#0EA5E9', icon: 'trending-up' },
    { name: 'Gifts', color: '#EC4899', icon: 'gift' },
    { name: 'Other', color: '#94A3B8', icon: 'tag' }
  ]
};
