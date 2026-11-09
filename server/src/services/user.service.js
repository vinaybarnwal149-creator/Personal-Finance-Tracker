import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import { hashToken } from '../utils/tokens.js';
import { isDbConnected } from '../config/db.js';
import { DemoStore } from './demoStore.js';

export class UserService {
  static async updateProfile(userId, updateData) {
    if (!isDbConnected()) {
      return DemoStore.updateProfile(userId, updateData);
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user.toJSON();
  }

  static async changePassword(userId, currentPassword, newPassword, currentRefreshToken) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    // Revoke all refresh tokens except current session
    if (currentRefreshToken) {
      const currentHash = hashToken(currentRefreshToken);
      await RefreshToken.updateMany(
        { user: userId, tokenHash: { $ne: currentHash } },
        { revokedAt: new Date() }
      );
    } else {
      await RefreshToken.updateMany({ user: userId }, { revokedAt: new Date() });
    }

    return { message: 'Password updated successfully' };
  }

  static async deleteAccount(userId, password) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw ApiError.badRequest('Incorrect password confirmation');
    }

    // Cascade delete all owned data
    await Promise.all([
      Transaction.deleteMany({ user: userId }),
      Category.deleteMany({ user: userId }),
      Budget.deleteMany({ user: userId }),
      RefreshToken.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);

    return { message: 'Account and all associated data deleted successfully' };
  }
}

