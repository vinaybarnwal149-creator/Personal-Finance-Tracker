import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { toMinorUnits } from '../utils/money.js';

export async function generateDemoData(userId) {
  const categories = await Category.find({ user: userId });
  const catMap = {};
  for (const c of categories) {
    catMap[c.name] = c._id;
  }

  const transactions = [];
  const now = new Date();

  // Generate ~6 months of realistic transactions
  for (let m = 5; m >= 0; m--) {
    const year = now.getFullYear();
    const month = now.getMonth() - m;
    const baseDate = new Date(year, month, 1);

    // 1. Monthly Salary on 1st ($4,500)
    if (catMap['Salary']) {
      transactions.push({
        user: userId,
        type: 'income',
        amountMinor: toMinorUnits(4500),
        category: catMap['Salary'],
        date: new Date(year, month, 1, 9, 0),
        note: 'Monthly salary deposit',
        paymentMethod: 'bank_transfer',
      });
    }

    // 2. Freelance Gig on 15th ($850)
    if (catMap['Freelance'] && (m % 2 === 0)) {
      transactions.push({
        user: userId,
        type: 'income',
        amountMinor: toMinorUnits(850),
        category: catMap['Freelance'],
        date: new Date(year, month, 15, 14, 30),
        note: 'Web development freelance project',
        paymentMethod: 'digital_wallet',
      });
    }

    // 3. Rent & Housing on 2nd ($1,350)
    if (catMap['Rent & Housing']) {
      transactions.push({
        user: userId,
        type: 'expense',
        amountMinor: toMinorUnits(1350),
        category: catMap['Rent & Housing'],
        date: new Date(year, month, 2, 10, 0),
        note: 'Apartment rent payment',
        paymentMethod: 'bank_transfer',
      });
    }

    // 4. Utilities on 5th ($145.50)
    if (catMap['Utilities']) {
      transactions.push({
        user: userId,
        type: 'expense',
        amountMinor: toMinorUnits(145.5),
        category: catMap['Utilities'],
        date: new Date(year, month, 5, 11, 20),
        note: 'Electricity and high-speed internet',
        paymentMethod: 'card',
      });
    }

    // 5. Groceries (weekly: 4th, 11th, 18th, 25th) (~$110-$140)
    if (catMap['Groceries']) {
      const groceryDays = [4, 11, 18, 25];
      for (const day of groceryDays) {
        const amt = 115 + (day % 3) * 12.5;
        transactions.push({
          user: userId,
          type: 'expense',
          amountMinor: toMinorUnits(amt),
          category: catMap['Groceries'],
          date: new Date(year, month, day, 17, 45),
          note: 'Supermarket weekly grocery haul',
          paymentMethod: 'card',
        });
      }
    }

    // 6. Food & Dining (weekends) (~$45-$85)
    if (catMap['Food & Dining']) {
      const diningDays = [7, 14, 21, 28];
      for (const day of diningDays) {
        transactions.push({
          user: userId,
          type: 'expense',
          amountMinor: toMinorUnits(45 + (day % 4) * 10),
          category: catMap['Food & Dining'],
          date: new Date(year, month, day, 20, 15),
          note: 'Dinner with friends at local bistro',
          paymentMethod: 'card',
        });
      }
    }

    // 7. Transport (~$65 monthly metro / fuel)
    if (catMap['Transport']) {
      transactions.push({
        user: userId,
        type: 'expense',
        amountMinor: toMinorUnits(75),
        category: catMap['Transport'],
        date: new Date(year, month, 8, 8, 30),
        note: 'Monthly transit card refill',
        paymentMethod: 'card',
      });
    }

    // 8. Entertainment / Subscriptions
    if (catMap['Entertainment']) {
      transactions.push({
        user: userId,
        type: 'expense',
        amountMinor: toMinorUnits(38),
        category: catMap['Entertainment'],
        date: new Date(year, month, 12, 19, 0),
        note: 'Cinema tickets and popcorn',
        paymentMethod: 'card',
      });
    }

    if (catMap['Subscriptions']) {
      transactions.push({
        user: userId,
        type: 'expense',
        amountMinor: toMinorUnits(19.99),
        category: catMap['Subscriptions'],
        date: new Date(year, month, 16, 6, 0),
        note: 'Music & Cloud streaming subscription',
        paymentMethod: 'card',
      });
    }
  }

  await Transaction.insertMany(transactions);

  // Generate Budgets for current month
  const currentMonthKey = now.toISOString().slice(0, 7);
  const budgets = [
    {
      user: userId,
      month: currentMonthKey,
      category: null, // Overall budget
      limitMinor: toMinorUnits(3200),
    },
  ];

  if (catMap['Groceries']) {
    budgets.push({
      user: userId,
      month: currentMonthKey,
      category: catMap['Groceries'],
      limitMinor: toMinorUnits(600),
    });
  }

  if (catMap['Food & Dining']) {
    budgets.push({
      user: userId,
      month: currentMonthKey,
      category: catMap['Food & Dining'],
      limitMinor: toMinorUnits(300),
    });
  }

  if (catMap['Entertainment']) {
    budgets.push({
      user: userId,
      month: currentMonthKey,
      category: catMap['Entertainment'],
      limitMinor: toMinorUnits(150),
    });
  }

  await Budget.insertMany(budgets);
}

