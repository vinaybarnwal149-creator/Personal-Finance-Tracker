import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { ApiError } from '../utils/ApiError.js';
import { isDbConnected } from '../config/db.js';
import { DemoStore } from './demoStore.js';

export class CategoryService {
  static async list(userId, type) {
    if (!isDbConnected()) {
      return DemoStore.listCategories(userId, type);
    }
    const filter = { user: userId };
    if (type) {
      filter.type = type;
    }
    const categories = await Category.find(filter).sort({ name: 1 });
    return categories.map((c) => c.toJSON());
  }

  static async create(userId, data) {
    if (!isDbConnected()) {
      return DemoStore.createCategory(userId, data);
    }
    const existing = await Category.findOne({
      user: userId,
      type: data.type,
      nameLower: data.name.toLowerCase().trim(),
    });
    if (existing) {
      throw ApiError.duplicate('A category with this name already exists for this type');
    }

    const category = await Category.create({
      user: userId,
      name: data.name,
      type: data.type,
      color: data.color || '#6366F1',
      icon: data.icon || 'tag',
      isDefault: false,
    });

    return category.toJSON();
  }

  static async update(userId, categoryId, data) {
    if (!isDbConnected()) {
      return DemoStore.updateCategory(userId, categoryId, data);
    }
    const category = await Category.findOne({ _id: categoryId, user: userId });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    if (data.name && data.name.toLowerCase().trim() !== category.nameLower) {
      const duplicate = await Category.findOne({
        user: userId,
        type: category.type,
        nameLower: data.name.toLowerCase().trim(),
        _id: { $ne: categoryId },
      });
      if (duplicate) {
        throw ApiError.duplicate('A category with this name already exists for this type');
      }
      category.name = data.name;
    }

    if (data.color) category.color = data.color;
    if (data.icon) category.icon = data.icon;

    await category.save();
    return category.toJSON();
  }

  static async delete(userId, categoryId, reassignToId) {
    if (!isDbConnected()) {
      return DemoStore.deleteCategory(userId, categoryId);
    }
    const category = await Category.findOne({ _id: categoryId, user: userId });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    const txnCount = await Transaction.countDocuments({
      user: userId,
      category: categoryId,
    });

    if (txnCount > 0) {
      if (!reassignToId) {
        throw ApiError.categoryInUse({ count: txnCount });
      }

      if (reassignToId.toString() === categoryId.toString()) {
        throw ApiError.badRequest('Cannot reassign to the same category being deleted');
      }

      const targetCategory = await Category.findOne({
        _id: reassignToId,
        user: userId,
      });

      if (!targetCategory) {
        throw ApiError.notFound('Target reassign category not found');
      }

      if (targetCategory.type !== category.type) {
        throw ApiError.businessRule('Reassignment category must have the same transaction type');
      }

      // Reassign transactions
      await Transaction.updateMany(
        { user: userId, category: categoryId },
        { $set: { category: reassignToId } }
      );
    }

    // Remove any budgets referencing this category
    await Budget.deleteMany({ user: userId, category: categoryId });
    await Category.deleteOne({ _id: categoryId, user: userId });

    return { id: categoryId, message: 'Category deleted successfully' };
  }
}

