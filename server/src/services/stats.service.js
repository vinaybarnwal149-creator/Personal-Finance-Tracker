import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { toDecimalAmount } from '../utils/money.js';
import { isDbConnected } from '../config/db.js';
import { DemoStore } from './demoStore.js';

export class StatsService {
  static async getPeriodDates(userId, queryFrom, queryTo) {
    const user = await User.findById(userId);
    const tz = user?.timezone || 'UTC';

    let from;
    let to;

    if (queryFrom && String(queryFrom).trim() !== '') {
      const parsedFrom = new Date(queryFrom);
      if (!isNaN(parsedFrom.getTime())) {
        parsedFrom.setUTCHours(0, 0, 0, 0);
        from = parsedFrom;
      }
    }

    if (queryTo && String(queryTo).trim() !== '') {
      const parsedTo = new Date(queryTo);
      if (!isNaN(parsedTo.getTime())) {
        parsedTo.setUTCHours(23, 59, 59, 999);
        to = parsedTo;
      }
    }

    if (!from || !to) {
      const now = new Date();
      if (!from) {
        from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      }
      if (!to) {
        to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      }
    }

    return { from, to, timezone: tz };
  }

  static async getSummary(userId, queryFrom, queryTo) {
    if (!isDbConnected()) {
      return DemoStore.getSummary(userId, queryFrom, queryTo);
    }
    const { from, to } = await this.getPeriodDates(userId, queryFrom, queryTo);
    const durationMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    const [currentAgg, prevAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: '$type',
            totalMinor: { $sum: '$amountMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { $gte: prevFrom, $lte: prevTo },
          },
        },
        {
          $group: {
            _id: '$type',
            totalMinor: { $sum: '$amountMinor' },
          },
        },
      ]),
    ]);

    let income = 0;
    let expense = 0;
    let count = 0;
    for (const item of currentAgg) {
      if (item._id === 'income') {
        income = toDecimalAmount(item.totalMinor);
        count += item.count;
      }
      if (item._id === 'expense') {
        expense = toDecimalAmount(item.totalMinor);
        count += item.count;
      }
    }

    let prevIncome = 0;
    let prevExpense = 0;
    for (const item of prevAgg) {
      if (item._id === 'income') prevIncome = toDecimalAmount(item.totalMinor);
      if (item._id === 'expense') prevExpense = toDecimalAmount(item.totalMinor);
    }

    const balance = Number((income - expense).toFixed(2));
    const prevBalance = Number((prevIncome - prevExpense).toFixed(2));
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

    const calcChange = (cur, prev) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / Math.abs(prev)) * 100);
    };

    return {
      income,
      expense,
      balance,
      savingsRate,
      count,
      previous: {
        income: prevIncome,
        expense: prevExpense,
        balance: prevBalance,
      },
      changePct: {
        income: calcChange(income, prevIncome),
        expense: calcChange(expense, prevExpense),
        balance: calcChange(balance, prevBalance),
      },
    };
  }

  static async getByCategory(userId, queryFrom, queryTo, type = 'expense') {
    if (!isDbConnected()) {
      return DemoStore.getByCategory(userId, queryFrom, queryTo, type);
    }
    const { from, to } = await this.getPeriodDates(userId, queryFrom, queryTo);

    const agg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type,
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$category',
          totalMinor: { $sum: '$amountMinor' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: '$categoryDoc' },
      { $sort: { totalMinor: -1 } },
    ]);

    const grandTotalMinor = agg.reduce((acc, curr) => acc + curr.totalMinor, 0);

    return agg.map((item) => {
      const total = toDecimalAmount(item.totalMinor);
      const percent = grandTotalMinor > 0 ? Math.round((item.totalMinor / grandTotalMinor) * 100) : 0;
      return {
        categoryId: item.categoryDoc._id.toString(),
        name: item.categoryDoc.name,
        color: item.categoryDoc.color,
        icon: item.categoryDoc.icon,
        total,
        percent,
        count: item.count,
      };
    });
  }

  static async getMonthly(userId, monthsCount = 6) {
    if (!isDbConnected()) {
      return DemoStore.getMonthly(userId, monthsCount);
    }
    const user = await User.findById(userId);
    const timezone = user?.timezone || 'UTC';

    const now = new Date();
    // Build list of month keys (YYYY-MM) in chronological order
    const monthKeys = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      monthKeys.push(d.toISOString().slice(0, 7));
    }

    const [firstYear, firstMonth] = monthKeys[0].split('-').map(Number);
    const startRange = new Date(Date.UTC(firstYear, firstMonth - 1, 1));

    const agg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: startRange },
        },
      },
      {
        $group: {
          _id: {
            m: {
              $dateToString: {
                format: '%Y-%m',
                date: '$date',
                timezone: timezone.includes('/') ? timezone : 'UTC',
              },
            },
            type: '$type',
          },
          totalMinor: { $sum: '$amountMinor' },
        },
      },
    ]);

    const dataMap = new Map();
    for (const key of monthKeys) {
      dataMap.set(key, { month: key, income: 0, expense: 0, net: 0 });
    }

    for (const item of agg) {
      const m = item._id.m;
      if (dataMap.has(m)) {
        const entry = dataMap.get(m);
        const amount = toDecimalAmount(item.totalMinor);
        if (item._id.type === 'income') entry.income = amount;
        if (item._id.type === 'expense') entry.expense = amount;
        entry.net = Number((entry.income - entry.expense).toFixed(2));
      }
    }

    return Array.from(dataMap.values());
  }

  static async getDaily(userId, queryFrom, queryTo) {
    if (!isDbConnected()) {
      return DemoStore.getDaily(userId, queryFrom, queryTo);
    }
    const { from, to, timezone } = await this.getPeriodDates(userId, queryFrom, queryTo);

    const agg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            d: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date',
                timezone: timezone && timezone.includes('/') ? timezone : 'UTC',
              },
            },
            type: '$type',
          },
          totalMinor: { $sum: '$amountMinor' },
        },
      },
    ]);

    // Build zero-filled daily map across range
    const dailyMap = new Map();
    const curr = new Date(from);
    while (curr <= to) {
      const dateStr = curr.toISOString().slice(0, 10);
      dailyMap.set(dateStr, { date: dateStr, income: 0, expense: 0 });
      curr.setDate(curr.getDate() + 1);
    }

    for (const item of agg) {
      const d = item._id.d;
      if (dailyMap.has(d)) {
        const entry = dailyMap.get(d);
        const amount = toDecimalAmount(item.totalMinor);
        if (item._id.type === 'income') entry.income = amount;
        if (item._id.type === 'expense') entry.expense = amount;
      }
    }

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  static async getTopTransactions(userId, queryFrom, queryTo, limit = 5, type = 'expense') {
    if (!isDbConnected()) {
      return DemoStore.getTopTransactions(userId, queryFrom, queryTo, limit, type);
    }
    const { from, to } = await this.getPeriodDates(userId, queryFrom, queryTo);

    const filter = {
      user: userId,
      date: { $gte: from, $lte: to },
    };
    if (type) filter.type = type;

    const txns = await Transaction.find(filter)
      .sort({ amountMinor: -1 })
      .limit(limit)
      .populate('category');

    return txns.map((t) => t.toJSON());
  }
}

