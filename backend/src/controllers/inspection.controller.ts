import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class InspectionController {
  // دریافت لیست بازدیدها
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        truckId,
        inspectionTypeId,
        fromDate,
        toDate,
        passed,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: Prisma.InspectionWhereInput = {};

      if (truckId) {
        where.truckId = parseInt(truckId as string);
      }

      if (inspectionTypeId) {
        where.inspectionTypeId = parseInt(inspectionTypeId as string);
      }

      if (passed !== undefined) {
        where.passed = passed === 'true';
      }

      if (fromDate || toDate) {
        where.inspectionDate = {};
        if (fromDate) {
          where.inspectionDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.inspectionDate.lte = new Date(toDate as string);
        }
      }

      const [inspections, total] = await Promise.all([
        prisma.inspection.findMany({
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
            inspectionType: {
              select: {
                id: true,
                name: true,
                intervalDays: true,
              },
            },
            inspector: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            inspectionDate: 'desc',
          },
        }),
        prisma.inspection.count({ where }),
      ]);

      res.json({
        success: true,
        data: inspections,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('خطا در getAll inspections:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت جزئیات یک بازدید
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const inspection = await prisma.inspection.findUnique({
        where: { id: parseInt(id) },
        include: {
          truck: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              currentKilometer: true,
            },
          },
          inspectionType: {
            select: {
              id: true,
              name: true,
              intervalDays: true,
              checklistItems: true,
            },
          },
          inspector: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'بازدید یافت نشد',
        });
      }

      res.json({
        success: true,
        data: inspection,
      });
    } catch (error) {
      console.error('خطا در getById inspection:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت کامیون‌های نیازمند بازدید
  async getDueInspections(req: Request, res: Response) {
    try {
      const today = new Date();

      // دریافت همه کامیون‌های فعال
      const activeTrucks = await prisma.truck.findMany({
        where: {
          status: {
            in: ['ACTIVE', 'UNDER_SERVICE'],
          },
          deletedAt: null,
        },
        select: {
          id: true,
          plateNumber: true,
          model: true,
          lastInspectionDate: true,
        },
      });

      // دریافت انواع بازدید
      const inspectionTypes = await prisma.inspectionType.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          intervalDays: true,
        },
      });

      const dueTrucks = [];

      for (const truck of activeTrucks) {
        for (const inspectionType of inspectionTypes) {
          // محاسبه تاریخ سررسید بازدید
          let dueDate = new Date();

          if (truck.lastInspectionDate) {
            dueDate = new Date(truck.lastInspectionDate);
            dueDate.setDate(dueDate.getDate() + inspectionType.intervalDays);
          }

          // اگر سررسید گذشته یا امروز است
          if (dueDate <= today) {
            const daysPastDue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            dueTrucks.push({
              truckId: truck.id,
              plateNumber: truck.plateNumber,
              model: truck.model,
              inspectionType: inspectionType.name,
              inspectionTypeId: inspectionType.id,
              lastInspectionDate: truck.lastInspectionDate,
              dueDate,
              daysPastDue,
              urgency: daysPastDue > 3 ? 'HIGH' : daysPastDue > 0 ? 'MEDIUM' : 'LOW',
            });
          }
        }
      }

      // مرتب‌سازی بر اساس تعداد روزهای تاخیر
      dueTrucks.sort((a, b) => b.daysPastDue - a.daysPastDue);

      res.json({
        success: true,
        data: dueTrucks,
      });
    } catch (error) {
      console.error('خطا در getDueInspections:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ثبت بازدید جدید
  async create(req: Request, res: Response) {
    try {
      const {
        truckId,
        inspectionTypeId,
        inspectionDate,
        kilometer,
        checklistResults,
        notes,
      } = req.body;

      if (!truckId || !inspectionTypeId || !inspectionDate || !checklistResults) {
        return res.status(400).json({
          success: false,
          message: 'کامیون، نوع بازدید، تاریخ و نتایج چک‌لیست الزامی است',
        });
      }

      const inspectionType = await prisma.inspectionType.findUnique({
        where: { id: parseInt(inspectionTypeId) },
      });

      if (!inspectionType || !inspectionType.isActive) {
        return res.status(400).json({
          success: false,
          message: 'نوع بازدید معتبر نیست',
        });
      }

      // محاسبه امتیاز
      const results = JSON.parse(checklistResults);
      let score = 0;
      let totalItems = 0;

      for (const item of results) {
        if (item.status === 'GOOD') {
          score += 1;
        }
        totalItems += 1;
      }

      const finalScore = totalItems > 0 ? Math.round((score / totalItems) * 100) : 0;
      const passed = finalScore >= 70; // حداقل نمره قبولی 70

      // ایجاد بازدید
      const inspection = await prisma.inspection.create({
        data: {
          truckId: parseInt(truckId),
          inspectionTypeId: parseInt(inspectionTypeId),
          inspectorId: req.user!.userId,
          inspectionDate: new Date(inspectionDate),
          kilometer: kilometer ? parseInt(kilometer) : null,
          checklistResults,
          score: finalScore,
          passed,
          notes,
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
            },
          },
          inspectionType: {
            select: {
              name: true,
            },
          },
        },
      });

      // به‌روزرسانی تاریخ آخرین بازدید کامیون
      await prisma.truck.update({
        where: { id: parseInt(truckId) },
        data: {
          lastInspectionDate: new Date(inspectionDate),
        },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'create',
          entity: 'inspection',
          entityId: inspection.id,
          changes: { inspection },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      // اگر نمره پایین است، ایجاد اعلان
      if (!passed) {
        await prisma.notification.create({
          data: {
            userId: req.user!.userId,
            type: 'INSPECTION_FAILED',
            severity: 'HIGH',
            title: 'بازدید ناموفق',
            message: `بازدید ${inspectionType.name} برای کامیون ${inspection.truck.plateNumber} با نمره ${finalScore} ناموفق بود`,
            relatedEntity: 'inspection',
            relatedEntityId: inspection.id,
          },
        });
      }

      res.status(201).json({
        success: true,
        message: 'بازدید با موفقیت ثبت شد',
        data: inspection,
      });
    } catch (error) {
      console.error('خطا در create inspection:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // افزودن اقدامات اصلاحی
  async addCorrectiveActions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { correctiveActions } = req.body;

      if (!correctiveActions) {
        return res.status(400).json({
          success: false,
          message: 'اقدامات اصلاحی الزامی است',
        });
      }

      const inspection = await prisma.inspection.findUnique({
        where: { id: parseInt(id) },
      });

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'بازدید یافت نشد',
        });
      }

      const updatedInspection = await prisma.inspection.update({
        where: { id: parseInt(id) },
        data: {
          correctiveActions,
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
            },
          },
          inspectionType: {
            select: {
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: 'اقدامات اصلاحی با موفقیت ثبت شد',
        data: updatedInspection,
      });
    } catch (error) {
      console.error('خطا در addCorrectiveActions:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت لیست انواع بازدید
  async getInspectionTypes(req: Request, res: Response) {
    try {
      const { isActive } = req.query;

      const where: Prisma.InspectionTypeWhereInput = {};

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const inspectionTypes = await prisma.inspectionType.findMany({
        where,
        orderBy: { intervalDays: 'asc' },
      });

      res.json({
        success: true,
        data: inspectionTypes,
      });
    } catch (error) {
      console.error('خطا در getInspectionTypes:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // آمار بازدیدها
  async getStats(req: Request, res: Response) {
    try {
      const { fromDate, toDate, truckId } = req.query;

      const where: Prisma.InspectionWhereInput = {};

      if (truckId) {
        where.truckId = parseInt(truckId as string);
      }

      if (fromDate || toDate) {
        where.inspectionDate = {};
        if (fromDate) {
          where.inspectionDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.inspectionDate.lte = new Date(toDate as string);
        }
      }

      const [total, passed, failed, averageScore] = await Promise.all([
        prisma.inspection.count({ where }),
        prisma.inspection.count({ where: { ...where, passed: true } }),
        prisma.inspection.count({ where: { ...where, passed: false } }),
        prisma.inspection.aggregate({
          where,
          _avg: {
            score: true,
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          passed,
          failed,
          passRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
          averageScore: averageScore._avg.score?.toFixed(2) || 0,
        },
      });
    } catch (error) {
      console.error('خطا در getStats inspections:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
