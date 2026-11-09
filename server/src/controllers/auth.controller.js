import { AuthService } from '../services/auth.service.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/tokens.js';

export class AuthController {
  static async register(req, res) {
    const result = await AuthService.register(req.body, req);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password, req);
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }

  static async refresh(req, res) {
    const rawToken = req.cookies.refreshToken;
    const result = await AuthService.refresh(rawToken, req);
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }

  static async logout(req, res) {
    const rawToken = req.cookies.refreshToken;
    await AuthService.logout(rawToken);
    clearRefreshCookie(res);
    res.status(200).json({
      success: true,
      data: { message: 'Logged out' },
    });
  }

  static async getMe(req, res) {
    const user = await AuthService.getMe(req.user.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  }
}

