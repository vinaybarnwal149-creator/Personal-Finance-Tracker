import { StatsService } from '../services/stats.service.js';

export class StatsController {
  static async getSummary(req, res) {
    const summary = await StatsService.getSummary(
      req.user.id,
      req.query.from,
      req.query.to
    );
    res.status(200).json({
      success: true,
      data: summary,
    });
  }

  static async getByCategory(req, res) {
    const data = await StatsService.getByCategory(
      req.user.id,
      req.query.from,
      req.query.to,
      req.query.type || 'expense'
    );
    res.status(200).json({
      success: true,
      data,
    });
  }

  static async getMonthly(req, res) {
    const months = req.query.months ? Number(req.query.months) : 6;
    const data = await StatsService.getMonthly(req.user.id, months);
    res.status(200).json({
      success: true,
      data,
    });
  }

  static async getDaily(req, res) {
    const data = await StatsService.getDaily(
      req.user.id,
      req.query.from,
      req.query.to
    );
    res.status(200).json({
      success: true,
      data,
    });
  }

  static async getTopTransactions(req, res) {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const type = req.query.type || 'expense';
    const data = await StatsService.getTopTransactions(
      req.user.id,
      req.query.from,
      req.query.to,
      limit,
      type
    );
    res.status(200).json({
      success: true,
      data,
    });
  }
}

