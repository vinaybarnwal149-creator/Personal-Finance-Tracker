import { TransactionService } from '../services/transaction.service.js';

export class TransactionController {
  static async create(req, res) {
    const transaction = await TransactionService.create(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: transaction,
    });
  }

  static async list(req, res) {
    const result = await TransactionService.list(req.user.id, req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  static async getById(req, res) {
    const transaction = await TransactionService.getById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: transaction,
    });
  }

  static async update(req, res) {
    const transaction = await TransactionService.update(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: transaction,
    });
  }

  static async delete(req, res) {
    const result = await TransactionService.delete(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

