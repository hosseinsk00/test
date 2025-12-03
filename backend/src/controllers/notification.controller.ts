import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class NotificationController {
  // دریافت لیست اعلان‌های کاربر
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        isRead,
        type,
        severity,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: Prisma.NotificationWhereInput = {
        userId: req.user!.userId,
      };

      if (isRead !== undefined) {
        where.isRead = isRead === 'true';
      }

      if (type) {
        where.type = type as any;
      }

      if (severity) {
        where.severity = severity as any;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: {
            userId: req.user!.userId,
            isRead: false,
          },
        }),
      ]);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
        unreadCount,
      });
    } catch (error) {
      console.error('خطا در getAll notifications:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت جزئیات یک اعلان
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: {
          id: parseInt(id),
          userId: req.user!.userId,
        },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'اعلان یافت نشد',
        });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('خطا در getById notification:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // علامت‌گذاری به عنوان خوانده شده
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: {
          id: parseInt(id),
          userId: req.user!.userId,
        },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'اعلان یافت نشد',
        });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: parseInt(id) },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'اعلان به عنوان خوانده شده علامت‌گذاری شد',
        data: updatedNotification,
      });
    } catch (error) {
      console.error('خطا در markAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // علامت‌گذاری همه به عنوان خوانده شده
  async markAllAsRead(req: Request, res: Response) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: req.user!.userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: `${result.count} اعلان به عنوان خوانده شده علامت‌گذاری شد`,
      });
    } catch (error) {
      console.error('خطا در markAllAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // حذف یک اعلان
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.findFirst({
        where: {
          id: parseInt(id),
          userId: req.user!.userId,
        },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'اعلان یافت نشد',
        });
      }

      await prisma.notification.delete({
        where: { id: parseInt(id) },
      });

      res.json({
        success: true,
        message: 'اعلان با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('خطا در delete notification:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // حذف همه اعلان‌های خوانده شده
  async deleteAllRead(req: Request, res: Response) {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          userId: req.user!.userId,
          isRead: true,
        },
      });

      res.json({
        success: true,
        message: `${result.count} اعلان حذف شد`,
      });
    } catch (error) {
      console.error('خطا در deleteAllRead:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت تعداد اعلان‌های خوانده نشده
  async getUnreadCount(req: Request, res: Response) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: req.user!.userId,
          isRead: false,
        },
      });

      res.json({
        success: true,
        data: {
          count,
        },
      });
    } catch (error) {
      console.error('خطا در getUnreadCount:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
