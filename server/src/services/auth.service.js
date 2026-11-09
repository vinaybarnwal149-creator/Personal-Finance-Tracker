import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateAccessToken,
  createRefreshToken,
  hashToken,
} from '../utils/tokens.js';
import { seedDefaultCategoriesForUser } from '../seeds/defaultCategories.js';
import { isDbConnected } from '../config/db.js';
import { DemoStore } from './demoStore.js';

export class AuthService {
  static async register(data, req) {
    if (!isDbConnected()) {
      return DemoStore.register(data);
    }
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw ApiError.duplicate('An account with this email already exists');
    }

    const passwordHash = await User.hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      currency: data.currency,
      timezone: data.timezone,
    });

    // Seed default categories for new user
    await seedDefaultCategoriesForUser(user._id);

    const accessToken = generateAccessToken(user._id);
    const { rawToken } = await createRefreshToken(user._id, req);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken: rawToken,
    };
  }

  static async login(email, password, req) {
    if (!isDbConnected()) {
      return DemoStore.login(email, password);
    }
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw ApiError.invalidCredentials();
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      throw ApiError.invalidCredentials();
    }

    const accessToken = generateAccessToken(user._id);
    const { rawToken } = await createRefreshToken(user._id, req);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken: rawToken,
    };
  }

  static async refresh(rawRefreshToken, req) {
    if (!isDbConnected()) {
      return DemoStore.refresh(rawRefreshToken);
    }
    if (!rawRefreshToken) {
      throw ApiError.refreshInvalid('Refresh token is missing');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    if (!storedToken) {
      throw ApiError.refreshInvalid('Refresh token not found');
    }

    // Reuse detection (theft protection): if a revoked token is used, revoke all sessions
    if (storedToken.revokedAt) {
      await RefreshToken.updateMany(
        { user: storedToken.user },
        { revokedAt: new Date() }
      );
      throw ApiError.refreshInvalid('Suspicious activity detected. All sessions revoked.');
    }

    if (new Date() > storedToken.expiresAt) {
      throw ApiError.refreshInvalid('Refresh token expired');
    }

    // Rotate refresh token
    const { rawToken: newRawToken } = await createRefreshToken(storedToken.user, req);
    const newHash = hashToken(newRawToken);

    storedToken.revokedAt = new Date();
    storedToken.replacedByHash = newHash;
    await storedToken.save();

    const user = await User.findById(storedToken.user);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    const newAccessToken = generateAccessToken(user._id);

    return {
      user: user.toJSON(),
      accessToken: newAccessToken,
      refreshToken: newRawToken,
    };
  }

  static async logout(rawRefreshToken) {
    if (!isDbConnected()) {
      return DemoStore.logout(rawRefreshToken);
    }
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
    }
    return { message: 'Logged out successfully' };
  }

  static async getMe(userId) {
    if (!isDbConnected()) {
      return DemoStore.getMe(userId);
    }
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user.toJSON();
  }
}

