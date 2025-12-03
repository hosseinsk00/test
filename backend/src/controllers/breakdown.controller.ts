import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class BreakdownController {
  // دریافت لیست خرابی‌ها
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        severity,
        truckId,
        repairType,
        fromDate,
        toDate,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: Prisma.BreakdownWhereInput = {};

      if (status) {
        where.status = status as any;
      }

      if (severity) {
        where.severity = severity as any;
      }

      if (truckId) {
        where.truckId = parseInt(truckId as string);
      }

      if (repairType) {
        where.repairType = repairType as any;
      }

      if (fromDate || toDate) {
        where.occurredDate = {};
        if (fromDate) {
          where.occurredDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.occurredDate.lte = new Date(toDate as string);
        }
      }

      const [breakdowns, total] = await Promise.all([
        prisma.breakdown.findMany({
          where,
          skip,
          take,
          include: {
            truck: {
              select: {
                id: true,
                plateNumber: true,
                model: true,
              },
            },
            reportedBy: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.breakdown.count({ where }),
      ]);

      res.json({
        success: true,
        data: breakdowns,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('خطا در getAll breakdowns:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت جزئیات یک خرابی
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const breakdown = await prisma.breakdown.findUnique({
        where: { id: parseInt(id) },
        include: {
          truck: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              status: true,
            },
          },
          reportedBy: {
            select: {
              id: true,
              fullName: true,
              role: true,
              phone: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
      });

      if (!breakdown) {
        return res.status(404).json({
          success: false,
          message: 'خرابی یافت نشد',
        });
      }

      res.json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      console.error('خطا در getById breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ثبت خرابی جدید
  async create(req: Request, res: Response) {
    try {
      const {
        truckId,
        breakdownType,
        severity,
        description,
        locationType,
        locationAddress,
        occurredDate,
        occurredKilometer,
        repairType,
        repairLocation,
        estimatedCompletionDate,
        images,
        assignedToId,
      } = req.body;

      // اعتبارسنجی
      if (
        !truckId ||
        !breakdownType ||
        !severity ||
        !description ||
        !locationType ||
        !occurredDate ||
        !occurredKilometer ||
        !repairType
      ) {
        return res.status(400).json({
          success: false,
          message: 'فیلدهای الزامی را پر کنید',
        });
      }

      // بررسی وجود کامیون
      const truck = await prisma.truck.findFirst({
        where: {
          id: parseInt(truckId),
          deletedAt: null,
        },
      });

      if (!truck) {
        return res.status(404).json({
          success: false,
          message: 'کامیون یافت نشد',
        });
      }

      const breakdown = await prisma.breakdown.create({
        data: {
          truckId: parseInt(truckId),
          reportedById: req.user!.userId,
          breakdownType,
          severity,
          description,
          locationType,
          locationAddress,
          occurredDate: new Date(occurredDate),
          occurredKilometer: parseInt(occurredKilometer),
          repairType,
          repairLocation,
          estimatedCompletionDate: estimatedCompletionDate
            ? new Date(estimatedCompletionDate)
            : null,
          images: images || [],
          assignedToId: assignedToId ? parseInt(assignedToId) : null,
          status: 'REPORTED',
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
              model: true,
            },
          },
          reportedBy: {
            select: {
              fullName: true,
            },
          },
        },
      });

      // اگر خرابی بحرانی است، وضعیت کامیون را تغییر بده
      if (severity === 'CRITICAL') {
        await prisma.truck.update({
          where: { id: parseInt(truckId) },
          data: { status: 'IN_REPAIR' },
        });

        // ارسال اعلان (در آینده با WhatsApp)
        await prisma.notification.create({
          data: {
            notificationType: 'BREAKDOWN_CRITICAL',
            relatedEntity: 'breakdown',
            relatedId: breakdown.id,
            title: 'خرابی بحرانی',
            message: `خرابی بحرانی در کامیون ${truck.plateNumber} ثبت شد: ${breakdownType}`,
            severity: 'CRITICAL',
            sendInApp: true,
            sendWhatsapp: true,
          },
        });
      }

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'create',
          entity: 'breakdown',
          entityId: breakdown.id,
          changes: { breakdown },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.status(201).json({
        success: true,
        message: 'خرابی با موفقیت ثبت شد',
        data: breakdown,
      });
    } catch (error) {
      console.error('خطا در create breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ویرایش خرابی
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const breakdown = await prisma.breakdown.findUnique({
        where: { id: parseInt(id) },
      });

      if (!breakdown) {
        return res.status(404).json({
          success: false,
          message: 'خرابی یافت نشد',
        });
      }

      // فقط خرابی‌هایی که هنوز تعمیر نشده‌اند قابل ویرایش هستند
      if (breakdown.status === 'FIXED') {
        return res.status(400).json({
          success: false,
          message: 'نمی‌توانید خرابی تعمیر شده را ویرایش کنید',
        });
      }

      const updatedBreakdown = await prisma.breakdown.update({
        where: { id: parseInt(id) },
        data: {
          ...(updateData.breakdownType && { breakdownType: updateData.breakdownType }),
          ...(updateData.severity && { severity: updateData.severity }),
          ...(updateData.description && { description: updateData.description }),
          ...(updateData.locationType && { locationType: updateData.locationType }),
          ...(updateData.locationAddress !== undefined && {
            locationAddress: updateData.locationAddress,
          }),
          ...(updateData.repairLocation && { repairLocation: updateData.repairLocation }),
          ...(updateData.estimatedCompletionDate && {
            estimatedCompletionDate: new Date(updateData.estimatedCompletionDate),
          }),
          ...(updateData.assignedToId !== undefined && {
            assignedToId: updateData.assignedToId ? parseInt(updateData.assignedToId) : null,
          }),
          ...(updateData.images && { images: updateData.images }),
          ...(updateData.documents && { documents: updateData.documents }),
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
            },
          },
        },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'update',
          entity: 'breakdown',
          entityId: breakdown.id,
          changes: { old: breakdown, new: updatedBreakdown },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'خرابی با موفقیت به‌روزرسانی شد',
        data: updatedBreakdown,
      });
    } catch (error) {
      console.error('خطا در update breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // تغییر وضعیت خرابی
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'وضعیت الزامی است',
        });
      }

      const breakdown = await prisma.breakdown.findUnique({
        where: { id: parseInt(id) },
        include: {
          truck: true,
        },
      });

      if (!breakdown) {
        return res.status(404).json({
          success: false,
          message: 'خرابی یافت نشد',
        });
      }

      const updatedBreakdown = await prisma.breakdown.update({
        where: { id: parseInt(id) },
        data: { status },
      });

      // اگر وضعیت به FIXED تغییر کرد، وضعیت کامیون را به ACTIVE برگردان
      if (status === 'FIXED') {
        await prisma.truck.update({
          where: { id: breakdown.truckId },
          data: { status: 'ACTIVE' },
        });

        // بستن خرابی
        await prisma.breakdown.update({
          where: { id: parseInt(id) },
          data: { closedAt: new Date() },
        });
      }

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'update_status',
          entity: 'breakdown',
          entityId: breakdown.id,
          changes: { oldStatus: breakdown.status, newStatus: status },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'وضعیت خرابی به‌روزرسانی شد',
        data: updatedBreakdown,
      });
    } catch (error) {
      console.error('خطا در updateStatus breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ثبت تعمیر و بستن خرابی
  async completeRepair(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        repairStartDate,
        repairEndDate,
        mechanicName,
        repairCost,
        usedParts,
        documents,
      } = req.body;

      if (!repairStartDate || !repairEndDate || !mechanicName) {
        return res.status(400).json({
          success: false,
          message: 'فیلدهای الزامی تعمیر را پر کنید',
        });
      }

      const breakdown = await prisma.breakdown.findUnique({
        where: { id: parseInt(id) },
        include: {
          truck: true,
        },
      });

      if (!breakdown) {
        return res.status(404).json({
          success: false,
          message: 'خرابی یافت نشد',
        });
      }

      if (breakdown.status === 'FIXED') {
        return res.status(400).json({
          success: false,
          message: 'این خرابی قبلاً تعمیر شده است',
        });
      }

      const updatedBreakdown = await prisma.breakdown.update({
        where: { id: parseInt(id) },
        data: {
          status: 'FIXED',
          repairStartDate: new Date(repairStartDate),
          repairEndDate: new Date(repairEndDate),
          mechanicName,
          repairCost: repairCost ? parseFloat(repairCost) : null,
          usedParts: usedParts || null,
          documents: documents || breakdown.documents,
          closedAt: new Date(),
          actualCompletionDate: new Date(repairEndDate),
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
            },
          },
        },
      });

      // وضعیت کامیون را به ACTIVE برگردان
      await prisma.truck.update({
        where: { id: breakdown.truckId },
        data: { status: 'ACTIVE' },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'complete_repair',
          entity: 'breakdown',
          entityId: breakdown.id,
          changes: { breakdown: updatedBreakdown },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'تعمیر با موفقیت ثبت و خرابی بسته شد',
        data: updatedBreakdown,
      });
    } catch (error) {
      console.error('خطا در completeRepair:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // حذف خرابی
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const breakdown = await prisma.breakdown.findUnique({
        where: { id: parseInt(id) },
      });

      if (!breakdown) {
        return res.status(404).json({
          success: false,
          message: 'خرابی یافت نشد',
        });
      }

      // فقط خرابی‌های REPORTED قابل حذف هستند
      if (breakdown.status !== 'REPORTED' && breakdown.status !== 'REJECTED') {
        return res.status(400).json({
          success: false,
          message: 'فقط خرابی‌های ثبت شده یا رد شده قابل حذف هستند',
        });
      }

      await prisma.breakdown.delete({
        where: { id: parseInt(id) },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'delete',
          entity: 'breakdown',
          entityId: breakdown.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'خرابی با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('خطا در delete breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت آمار خرابی‌ها
  async getStats(req: Request, res: Response) {
    try {
      const { truckId, fromDate, toDate } = req.query;

      const where: Prisma.BreakdownWhereInput = {};

      if (truckId) {
        where.truckId = parseInt(truckId as string);
      }

      if (fromDate || toDate) {
        where.occurredDate = {};
        if (fromDate) {
          where.occurredDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.occurredDate.lte = new Date(toDate as string);
        }
      }

      const [
        total,
        byStatus,
        bySeverity,
        byRepairType,
        totalCost,
        avgCost,
      ] = await Promise.all([
        prisma.breakdown.count({ where }),
        prisma.breakdown.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.breakdown.groupBy({
          by: ['severity'],
          where,
          _count: true,
        }),
        prisma.breakdown.groupBy({
          by: ['repairType'],
          where,
          _count: true,
        }),
        prisma.breakdown.aggregate({
          where: { ...where, status: 'FIXED' },
          _sum: { repairCost: true },
        }),
        prisma.breakdown.aggregate({
          where: { ...where, status: 'FIXED' },
          _avg: { repairCost: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          byStatus,
          bySeverity,
          byRepairType,
          totalCost: totalCost._sum.repairCost || 0,
          avgCost: avgCost._avg.repairCost || 0,
        },
      });
    } catch (error) {
      console.error('خطا در getStats breakdowns:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
