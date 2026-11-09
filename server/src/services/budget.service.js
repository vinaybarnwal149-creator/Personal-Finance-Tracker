import mongoose from 'mongoose';
import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { ApiError } from '../utils/ApiError.js';
import { toMinorUnits, toDecimalAmount } from '../utils/money.js';
import { isDbConnected } from '../config/db.js';
import { DemoStore } from './demoStore.js';

export class BudgetService {
  static async list(userId, month) {
    if (!isDbConnected()) {
      return DemoStore.listBudgets(userId, month);
    }
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const [year, m] = targetMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, m - 1, 1));
    const endDate = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));

    // Find all budgets for this month
    const budgets = await Budget.find({
      user: userId,
      month: targetMonth,
    }).populate('category');

    // Aggregate all expenses for this month in a single query
    const expenseAgg = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpentMinor: { $sum: '$amountMinor' },
        },
      },
    ]);

    const spentByCategoryMap = new Map();
    let totalOverallSpentMinor = 0;

    for (const item of expenseAgg) {
      const catId = item._id ? item._id.toString() : 'null';
      spentByCategoryMap.set(catId, item.totalSpentMinor);
      totalOverallSpentMinor += item.totalSpentMinor;
    }

    return budgets.map((b) => {
      const limit = toDecimalAmount(b.limitMinor);
      let spentMinor = 0;

      if (b.category) {
        spentMinor = spentByCategoryMap.get(b.category._id.toString()) || 0;
      } else {
        spentMinor = totalOverallSpentMinor;
      }

      const spent = toDecimalAmount(spentMinor);
      const remaining = Number(Math.max(0, limit - spent).toFixed(2));
      const percent = b.limitMinor > 0 ? Math.round((spentMinor / b.limitMinor) * 100) : 0;

      let status = 'ok';
      if (percent >= 100) {
        status = 'exceeded';
      } else if (percent >= 80) {
        status = 'warning';
      }

      return {
        id: b._id.toString(),
        month: b.month,
        category: b.category
          ? {
              id: b.category._id.toString(),
              name: b.category.name,
              color: b.category.color,
              icon: b.category.icon,
            }
          : null,
        limit,
        spent,
        remaining,
        percent,
        status,
      };
    });
  }

  static async upsert(userId, data) {
    if (!isDbConnected()) {
      return DemoStore.upsertBudget(userId, data);
    }
    let categoryDoc = null;
    if (data.category) {
      categoryDoc = await Category.findOne({
        _id: data.category,
        user: userId,
      });
      if (!categoryDoc) {
        throw ApiError.notFound('Category not found');
      }
      if (categoryDoc.type !== 'expense') {
        throw ApiError.businessRule('Budgets can only be set for expense categories');
      }
    }

    const limitMinor = toMinorUnits(data.limit);
    const filter = {
      user: userId,
      month: data.month,
      category: data.category || null,
    };

    const budget = await Budget.findOneAndUpdate(
      filter,
      { $set: { limitMinor } },
      { new: true, upsert: true, runValidators: true }
    ).populate('category');

    return budget.toJSON();
  }

  static async delete(userId, budgetId) {
    if (!isDbConnected()) {
      return DemoStore.deleteBudget(userId, budgetId);
    }
    const budget = await Budget.findOneAndDelete({ _id: budgetId, user: userId });
    if (!budget) {
      throw ApiError.notFound('Budget not found');
    }
    return { id: budgetId, message: 'Budget deleted successfully' };
  }

  static async copy(userId, fromMonth, toMonth) {
    if (!isDbConnected()) {
      return { copiedCount: 0 };
    }
    const sourceBudgets = await Budget.find({ user: userId, month: fromMonth });
    if (!sourceBudgets.length) {
      return { copiedCount: 0 };
    }

    let copiedCount = 0;
    for (const b of sourceBudgets) {
      const exists = await Budget.findOne({
        user: userId,
        month: toMonth,
        category: b.category || null,
      });

      if (!exists) {
        await Budget.create({
          user: userId,
          month: toMonth,
          category: b.category || null,
          limitMinor: b.limitMinor,
        });
        copiedCount++;
      }
    }

    return { copiedCount };
  }
}

