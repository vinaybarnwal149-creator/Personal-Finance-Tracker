import { CategoryService } from '../services/category.service.js';

export class CategoryController {
  static async list(req, res) {
    const categories = await CategoryService.list(req.user.id, req.query.type);
    res.status(200).json({
      success: true,
      data: categories,
    });
  }

  static async create(req, res) {
    const category = await CategoryService.create(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: category,
    });
  }

  static async update(req, res) {
    const category = await CategoryService.update(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: category,
    });
  }

  static async delete(req, res) {
    const result = await CategoryService.delete(
      req.user.id,
      req.params.id,
      req.query.reassignTo
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

