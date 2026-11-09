import { BudgetService } from '../services/budget.service.js';

export class BudgetController {
  static async list(req, res) {
    const budgets = await BudgetService.list(req.user.id, req.query.month);
    res.status(200).json({
      success: true,
      data: budgets,
    });
  }

  static async upsert(req, res) {
    const budget = await BudgetService.upsert(req.user.id, req.body);
    res.status(200).json({
      success: true,
      data: budget,
    });
  }

  static async delete(req, res) {
    const result = await BudgetService.delete(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async copy(req, res) {
    const { fromMonth, toMonth } = req.body;
    const result = await BudgetService.copy(req.user.id, fromMonth, toMonth);
    res.status(200).json({
      success: true,
      data: result,
    });
  }
}
























