import { Category } from '../models/Category.js';
import { DEFAULT_CATEGORIES } from '../utils/constants.js';

export async function seedDefaultCategoriesForUser(userId) {
  const categoriesToInsert = [];

  for (const cat of DEFAULT_CATEGORIES.expense) {
    categoriesToInsert.push({
      user: userId,
      name: cat.name,
      nameLower: cat.name.toLowerCase(),
      type: 'expense',
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
    });
  }

  for (const cat of DEFAULT_CATEGORIES.income) {
    categoriesToInsert.push({
      user: userId,
      name: cat.name,
      nameLower: cat.name.toLowerCase(),
      type: 'income',
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
    });
  }

  await Category.insertMany(categoriesToInsert);
}

