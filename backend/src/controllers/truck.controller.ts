import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class TruckController {
  // دریافت لیست کامیون‌ها با فیلتر و صفحه‌بندی
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        plateNumber,
        driverId,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: Prisma.TruckWhereInput = {
        deletedAt: null,
      };

      if (status) {
        where.status = status as any;
      }

      if (plateNumber) {
        where.plateNumber = {
          contains: plateNumber as string,
        };
      }

      if (driverId) {
        where.currentDriverId = parseInt(driverId as string);
      }

      const [trucks, total] = await Promise.all([
        prisma.truck.findMany({
          where,
          skip,
          take,
          include: {
            currentDriver: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                licenseNumber: true,
                driverScore: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.truck.count({ where }),
      ]);

      res.json({
        success: true,
        data: trucks,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('خطا در getAll trucks:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت جزئیات یک کامیون
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const truck = await prisma.truck.findFirst({
        where: {
          id: parseInt(id),
          deletedAt: null,
        },
        include: {
          currentDriver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              licenseNumber: true,
              licenseType: true,
              driverScore: true,
            },
          },
          breakdowns: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: {
              status: { not: 'FIXED' },
            },
          },
          services: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: {
              status: { not: 'COMPLETED' },
            },
            include: {
              serviceType: true,
            },
          },
        },
      });

      if (!truck) {
        return res.status(404).json({
          success: false,
          message: 'کامیون یافت نشد',
        });
      }

      res.json({
        success: true,
        data: truck,
      });
    } catch (error) {
      console.error('خطا در getById truck:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ایجاد کامیون جدید
  async create(req: Request, res: Response) {
    try {
      const {
        plateNumber,
        model,
        manufactureYear,
        chassisNumber,
        engineNumber,
        tankType,
        tankManufactureYear,
        tankPlateNumber,
        startWorkDate,
        fuelConsumptionStandard,
        currentDriverId,
      } = req.body;

      // اعتبارسنجی ورودی‌ها
      if (!plateNumber || !model || !manufactureYear || !chassisNumber || !engineNumber || !startWorkDate) {
        return res.status(400).json({
          success: false,
          message: 'فیلدهای الزامی را پر کنید',
        });
      }

      // بررسی تکراری بودن شماره پلاک
      const existingTruck = await prisma.truck.findUnique({
        where: { plateNumber },
      });

      if (existingTruck) {
        return res.status(400).json({
          success: false,
          message: 'این شماره پلاک قبلاً ثبت شده است',
        });
      }

      // اگر راننده انتخاب شده، بررسی کن که راننده وجود داشته باشد و فعال باشد
      if (currentDriverId) {
        const driver = await prisma.driver.findUnique({
          where: { id: currentDriverId },
        });

        if (!driver || !driver.isActive) {
          return res.status(400).json({
            success: false,
            message: 'راننده انتخاب شده معتبر نیست',
          });
        }
      }

      // ایجاد QR Code URL (می‌تواند یک URL به صفحه جزئیات کامیون باشد)
      const qrCodeUrl = `/trucks/${plateNumber}`;

      const truck = await prisma.truck.create({
        data: {
          plateNumber,
          model,
          manufactureYear: parseInt(manufactureYear),
          chassisNumber,
          engineNumber,
          tankType,
          tankManufactureYear: tankManufactureYear ? parseInt(tankManufactureYear) : null,
          tankPlateNumber,
          startWorkDate: new Date(startWorkDate),
          fuelConsumptionStandard: fuelConsumptionStandard || 0.6,
          currentDriverId,
          qrCode: qrCodeUrl,
          createdById: req.user?.userId,
        },
        include: {
          currentDriver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user?.userId,
          action: 'create',
          entity: 'truck',
          entityId: truck.id,
          changes: { truck },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.status(201).json({
        success: true,
        message: 'کامیون با موفقیت ایجاد شد',
        data: truck,
      });
    } catch (error) {
      console.error('خطا در create truck:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ویرایش کامیون
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        plateNumber,
        model,
        manufactureYear,
        chassisNumber,
        engineNumber,
        tankType,
        tankManufactureYear,
        tankPlateNumber,
        startWorkDate,
        status,
        fuelConsumptionStandard,
        currentDriverId,
      } = req.body;

      const truck = await prisma.truck.findFirst({
        where: {
          id: parseInt(id),
          deletedAt: null,
        },
      });

      if (!truck) {
        return res.status(404).json({
          success: false,
          message: 'کامیون یافت نشد',
        });
      }

      // بررسی تکراری بودن شماره پلاک (اگر تغییر کرده)
      if (plateNumber && plateNumber !== truck.plateNumber) {
        const existingTruck = await prisma.truck.findUnique({
          where: { plateNumber },
        });

        if (existingTruck) {
          return res.status(400).json({
            success: false,
            message: 'این شماره پلاک قبلاً ثبت شده است',
          });
        }
      }

      const updatedTruck = await prisma.truck.update({
        where: { id: parseInt(id) },
        data: {
          ...(plateNumber && { plateNumber }),
          ...(model && { model }),
          ...(manufactureYear && { manufactureYear: parseInt(manufactureYear) }),
          ...(chassisNumber && { chassisNumber }),
          ...(engineNumber && { engineNumber }),
          ...(tankType && { tankType }),
          ...(tankManufactureYear && { tankManufactureYear: parseInt(tankManufactureYear) }),
          ...(tankPlateNumber !== undefined && { tankPlateNumber }),
          ...(startWorkDate && { startWorkDate: new Date(startWorkDate) }),
          ...(status && { status }),
          ...(fuelConsumptionStandard && { fuelConsumptionStandard }),
          ...(currentDriverId !== undefined && { currentDriverId }),
        },
        include: {
          currentDriver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
        },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user?.userId,
          action: 'update',
          entity: 'truck',
          entityId: truck.id,
          changes: { old: truck, new: updatedTruck },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'کامیون با موفقیت به‌روزرسانی شد',
        data: updatedTruck,
      });
    } catch (error) {
      console.error('خطا در update truck:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // حذف نرم (soft delete)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const truck = await prisma.truck.findFirst({
        where: {
          id: parseInt(id),
          deletedAt: null,
        },
      });

      if (!truck) {
        return res.status(404).json({
          success: false,
          message: 'کامیون یافت نشد',
        });
      }

      await prisma.truck.update({
        where: { id: parseInt(id) },
        data: {
          deletedAt: new Date(),
        },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user?.userId,
          action: 'delete',
          entity: 'truck',
          entityId: truck.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'کامیون با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('خطا در delete truck:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت خلاصه وضعیت یک کامیون
  async getSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const truck = await prisma.truck.findFirst({
        where: {
          id: parseInt(id),
          deletedAt: null,
        },
      });

      if (!truck) {
        return res.status(404).json({
          success: false,
          message: 'کامیون یافت نشد',
        });
      }

      // آمار خرابی‌ها
      const breakdownsCount = await prisma.breakdown.count({
        where: { truckId: truck.id },
      });

      const openBreakdowns = await prisma.breakdown.count({
        where: {
          truckId: truck.id,
          status: { not: 'FIXED' },
        },
      });

      // آمار سرویس‌ها
      const servicesCount = await prisma.service.count({
        where: { truckId: truck.id },
      });

      const upcomingServices = await prisma.service.count({
        where: {
          truckId: truck.id,
          status: 'SCHEDULED',
        },
      });

      // آمار بازدیدها
      const inspectionsCount = await prisma.inspection.count({
        where: { truckId: truck.id },
      });

      const lastInspection = await prisma.inspection.findFirst({
        where: { truckId: truck.id },
        orderBy: { inspectionDate: 'desc' },
        select: {
          inspectionDate: true,
          totalScore: true,
          isPassed: true,
        },
      });

      // هزینه کل
      const totalBreakdownCost = await prisma.breakdown.aggregate({
        where: {
          truckId: truck.id,
          status: 'FIXED',
        },
        _sum: {
          repairCost: true,
        },
      });

      const totalServiceCost = await prisma.service.aggregate({
        where: {
          truckId: truck.id,
          status: 'COMPLETED',
        },
        _sum: {
          cost: true,
        },
      });

      res.json({
        success: true,
        data: {
          truck: {
            id: truck.id,
            plateNumber: truck.plateNumber,
            model: truck.model,
            status: truck.status,
          },
          stats: {
            breakdowns: {
              total: breakdownsCount,
              open: openBreakdowns,
            },
            services: {
              total: servicesCount,
              upcoming: upcomingServices,
            },
            inspections: {
              total: inspectionsCount,
              last: lastInspection,
            },
            costs: {
              totalBreakdownCost: totalBreakdownCost._sum.repairCost || 0,
              totalServiceCost: totalServiceCost._sum.cost || 0,
              total: (totalBreakdownCost._sum.repairCost || 0) + (totalServiceCost._sum.cost || 0),
            },
          },
        },
      });
    } catch (error) {
      console.error('خطا در getSummary truck:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
