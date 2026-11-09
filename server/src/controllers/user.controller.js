import { UserService } from '../services/user.service.js';
import { clearRefreshCookie } from '../utils/tokens.js';

export class UserController {
  static async updateProfile(req, res) {
    const user = await UserService.updateProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      data: { user },
    });
  }

  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const currentRefreshToken = req.cookies.refreshToken;
    const result = await UserService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
      currentRefreshToken
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async deleteAccount(req, res) {
    const { password } = req.body;
    const result = await UserService.deleteAccount(req.user.id, password);
    clearRefreshCookie(res);
    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

