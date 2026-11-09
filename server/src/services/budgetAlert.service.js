import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';

export class BudgetAlertService {
  /**
   * Check if category or overall budgets cross 80% or 100%
   * @param {string} userId
   * @param {Date} date
   * @param {string} categoryId
   * @returns {Promise<Array<{ scope: 'category'|'overall', categoryId?: string, categoryName?: string, percent: number, status: 'warning'|'exceeded' }>>}
   */
  static async checkAlerts(userId, date, categoryId) {
    const alerts = [];
    const dateObj = new Date(date);
    const month = dateObj.toISOString().slice(0, 7); // YYYY-MM

    // Month start and end
    const startOfMonth = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    // Find budgets for this user and month
    const budgets = await Budget.find({
      user: userId,
      month,
      $or: [{ category: categoryId }, { category: null }],
    });

    if (!budgets.length) return alerts;

    // Check category budget
    const categoryBudget = budgets.find((b) => b.category && b.category.toString() === categoryId.toString());
    if (categoryBudget) {
      const sumResult = await Transaction.aggregate([
        {
          $match: {
            user: categoryBudget.user,
            category: categoryBudget.category,
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, totalMinor: { $sum: '$amountMinor' } } },
      ]);

      const spentMinor = sumResult[0]?.totalMinor || 0;
      const pct = Math.round((spentMinor / categoryBudget.limitMinor) * 100);

      if (pct >= 80) {
        const cat = await Category.findById(categoryId);
        alerts.push({
          scope: 'category',
          categoryId: categoryId.toString(),
          categoryName: cat?.name || 'Category',
          percent: pct,
          status: pct >= 100 ? 'exceeded' : 'warning',
        });
      }
    }

    // Check overall budget
    const overallBudget = budgets.find((b) => !b.category);
    if (overallBudget) {
      const sumResult = await Transaction.aggregate([
        {
          $match: {
            user: overallBudget.user,
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, totalMinor: { $sum: '$amountMinor' } } },
      ]);

      const spentMinor = sumResult[0]?.totalMinor || 0;
      const pct = Math.round((spentMinor / overallBudget.limitMinor) * 100);

      if (pct >= 80) {
        alerts.push({
          scope: 'overall',
          categoryName: 'Overall',
          percent: pct,
          status: pct >= 100 ? 'exceeded' : 'warning',
        });
      }
    }

    return alerts;
  }
}

