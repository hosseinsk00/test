import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiresAt,
} from '../utils/jwt';

export class AuthController {
  // ورود به سیستم
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'نام کاربری و رمز عبور الزامی است',
        });
      }

      // پیدا کردن کاربر
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'نام کاربری یا رمز عبور اشتباه است',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'حساب کاربری غیرفعال است',
        });
      }

      // بررسی رمز عبور
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'نام کاربری یا رمز عبور اشتباه است',
        });
      }

      // ایجاد توکن‌ها
      const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // ذخیره refresh token در دیتابیس
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: getRefreshTokenExpiresAt(),
        },
      });

      // به‌روزرسانی آخرین ورود
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'login',
          entity: 'user',
          entityId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'ورود موفقیت‌آمیز',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            phone: user.phone,
          },
        },
      });
    } catch (error) {
      console.error('خطا در login:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // خروج از سیستم
  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // حذف refresh token از دیتابیس
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      // ثبت لاگ
      if (req.user) {
        await prisma.activityLog.create({
          data: {
            userId: req.user.userId,
            action: 'logout',
            entity: 'user',
            entityId: req.user.userId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || null,
          },
        });
      }

      res.json({
        success: true,
        message: 'خروج موفقیت‌آمیز',
      });
    } catch (error) {
      console.error('خطا در logout:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // تازه‌سازی توکن
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token الزامی است',
        });
      }

      // بررسی معتبر بودن refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // بررسی وجود token در دیتابیس
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token نامعتبر',
        });
      }

      // بررسی انقضا
      if (new Date() > tokenRecord.expiresAt) {
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
        return res.status(401).json({
          success: false,
          message: 'Refresh token منقضی شده',
        });
      }

      // ایجاد access token جدید
      const newAccessToken = generateAccessToken({
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      console.error('خطا در refresh token:', error);
      res.status(401).json({
        success: false,
        message: 'Refresh token نامعتبر',
      });
    }
  }

  // تغییر رمز عبور
  async changePassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'ابتدا وارد سیستم شوید',
        });
      }

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'رمز عبور قدیم و جدید الزامی است',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'رمز عبور جدید باید حداقل 6 کاراکتر باشد',
        });
      }

      // پیدا کردن کاربر
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'کاربر یافت نشد',
        });
      }

      // بررسی رمز عبور قدیم
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

      if (!isOldPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'رمز عبور قدیم اشتباه است',
        });
      }

      // هش کردن رمز عبور جدید
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // به‌روزرسانی رمز عبور
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // حذف تمام refresh token‌های کاربر (logout از همه جا)
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'change_password',
          entity: 'user',
          entityId: userId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'رمز عبور با موفقیت تغییر کرد. لطفاً دوباره وارد شوید',
      });
    } catch (error) {
      console.error('خطا در change password:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت اطلاعات کاربر فعلی
  async me(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'ابتدا وارد سیستم شوید',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          nationalId: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'کاربر یافت نشد',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('خطا در me:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
