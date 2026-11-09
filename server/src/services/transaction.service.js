import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { toMinorUnits, toDecimalAmount } from '../utils/money.js';
import { BudgetAlertService } from './budgetAlert.service.js';
import { isDbConnected } from '../config/db.js';
import { DemoStore } from './demoStore.js';

export class TransactionService {
  static async create(userId, data) {
    if (!isDbConnected()) {
      return DemoStore.createTransaction(userId, data);
    }
    const category = await Category.findOne({
      _id: data.category,
      user: userId,
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (category.type !== data.type) {
      throw ApiError.businessRule(`Category type '${category.type}' does not match transaction type '${data.type}'`);
    }

    const txnDate = new Date(data.date);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (txnDate > oneYearFromNow) {
      throw ApiError.badRequest('Transaction date cannot be more than 1 year in the future');
    }

    const transaction = await Transaction.create({
      user: userId,
      type: data.type,
      amountMinor: toMinorUnits(data.amount),
      category: data.category,
      date: txnDate,
      note: data.note || '',
      paymentMethod: data.paymentMethod || 'card',
    });

    await transaction.populate('category');

    let budgetAlerts = [];
    if (data.type === 'expense') {
      budgetAlerts = await BudgetAlertService.checkAlerts(
        userId,
        txnDate,
        data.category
      );
    }

    const json = transaction.toJSON();
    return {
      ...json,
      budgetAlerts,
    };
  }

  static async list(userId, query = {}) {
    if (!isDbConnected()) {
      return DemoStore.listTransactions(userId, query);
    }
    const filter = { user: new mongoose.Types.ObjectId(userId) };

    if (query.type && (query.type === 'income' || query.type === 'expense')) {
      filter.type = query.type;
    }

    if (query.category && String(query.category).trim() !== '') {
      const catIds = query.category.split(',').map((id) => id.trim()).filter(Boolean);
      const validIds = catIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
      if (validIds.length === 1) {
        filter.category = validIds[0];
      } else if (validIds.length > 1) {
        filter.category = { $in: validIds };
      }
    }

    let fromDate;
    let toDate;
    if (query.from && String(query.from).trim() !== '') {
      const parsed = new Date(query.from);
      if (!isNaN(parsed.getTime())) {
        parsed.setUTCHours(0, 0, 0, 0);
        fromDate = parsed;
      }
    }
    if (query.to && String(query.to).trim() !== '') {
      const parsed = new Date(query.to);
      if (!isNaN(parsed.getTime())) {
        parsed.setUTCHours(23, 59, 59, 999);
        toDate = parsed;
      }
    }
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    }

    if (query.q && String(query.q).trim() !== '') {
      const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.note = { $regex: escaped, $options: 'i' };
    }

    const hasMin = query.minAmount !== undefined && query.minAmount !== null && String(query.minAmount).trim() !== '';
    const hasMax = query.maxAmount !== undefined && query.maxAmount !== null && String(query.maxAmount).trim() !== '';
    if (hasMin || hasMax) {
      filter.amountMinor = {};
      if (hasMin && !isNaN(Number(query.minAmount))) {
        filter.amountMinor.$gte = toMinorUnits(Number(query.minAmount));
      }
      if (hasMax && !isNaN(Number(query.maxAmount))) {
        filter.amountMinor.$lte = toMinorUnits(Number(query.maxAmount));
      }
      if (filter.amountMinor.$gte === undefined && filter.amountMinor.$lte === undefined) {
        delete filter.amountMinor;
      }
    }

    if (query.paymentMethod && String(query.paymentMethod).trim() !== '') {
      filter.paymentMethod = query.paymentMethod;
    }

    const sortMap = {
      '-date': { date: -1, _id: -1 },
      'date': { date: 1, _id: 1 },
      '-amount': { amountMinor: -1, _id: -1 },
      'amount': { amountMinor: 1, _id: 1 },
    };
    const sort = sortMap[query.sort] || sortMap['-date'];

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    // Parallel execution for data, count, and totals
    const [transactions, total, totalsAgg] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('category'),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$type',
            sumMinor: { $sum: '$amountMinor' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const group of totalsAgg) {
      if (group._id === 'income') totalIncome = toDecimalAmount(group.sumMinor);
      if (group._id === 'expense') totalExpense = toDecimalAmount(group.sumMinor);
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: transactions.map((t) => t.toJSON()),
      meta: {
        page,
        limit,
        total,
        totalPages,
        totals: {
          income: totalIncome,
          expense: totalExpense,
          net: Number((totalIncome - totalExpense).toFixed(2)),
          count: total,
        },
      },
    };
  }

  static async getById(userId, txnId) {
    if (!isDbConnected()) {
      return DemoStore.getTransactionById(userId, txnId);
    }
    const txn = await Transaction.findOne({ _id: txnId, user: userId }).populate('category');
    if (!txn) {
      throw ApiError.notFound('Transaction not found');
    }
    return txn.toJSON();
  }

  static async update(userId, txnId, data) {
    if (!isDbConnected()) {
      return DemoStore.updateTransaction(userId, txnId, data);
    }
    const txn = await Transaction.findOne({ _id: txnId, user: userId });
    if (!txn) {
      throw ApiError.notFound('Transaction not found');
    }

    const newType = data.type || txn.type;
    const newCategory = data.category || txn.category;

    if (data.type || data.category) {
      const category = await Category.findOne({ _id: newCategory, user: userId });
      if (!category) {
        throw ApiError.notFound('Category not found');
      }
      if (category.type !== newType) {
        throw ApiError.businessRule(`Category type '${category.type}' does not match transaction type '${newType}'`);
      }
      txn.type = newType;
      txn.category = newCategory;
    }

    if (data.amount !== undefined) {
      txn.amountMinor = toMinorUnits(data.amount);
    }

    if (data.date) {
      txn.date = new Date(data.date);
    }

    if (data.note !== undefined) {
      txn.note = data.note;
    }

    if (data.paymentMethod) {
      txn.paymentMethod = data.paymentMethod;
    }

    await txn.save();
    await txn.populate('category');

    let budgetAlerts = [];
    if (txn.type === 'expense') {
      budgetAlerts = await BudgetAlertService.checkAlerts(
        userId,
        txn.date,
        txn.category._id || txn.category
      );
    }

    const json = txn.toJSON();
    return {
      ...json,
      budgetAlerts,
    };
  }

  static async delete(userId, txnId) {
    if (!isDbConnected()) {
      return DemoStore.deleteTransaction(userId, txnId);
    }
    const txn = await Transaction.findOneAndDelete({ _id: txnId, user: userId });
    if (!txn) {
      throw ApiError.notFound('Transaction not found');
    }
    return { id: txnId, message: 'Transaction deleted successfully' };
  }
}

















