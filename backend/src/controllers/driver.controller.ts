import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class DriverController {
  // دریافت لیست رانندگان
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        isActive,
        nationalId,
        phone,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: Prisma.DriverWhereInput = {};

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (nationalId) {
        where.nationalId = {
          contains: nationalId as string,
        };
      }

      if (phone) {
        where.phone = {
          contains: phone as string,
        };
      }

      const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
          where,
          skip,
          take,
          include: {
            currentTrucks: {
              select: {
                id: true,
                plateNumber: true,
                model: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.driver.count({ where }),
      ]);

      res.json({
        success: true,
        data: drivers,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('خطا در getAll drivers:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت جزئیات یک راننده
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const driver = await prisma.driver.findUnique({
        where: { id: parseInt(id) },
        include: {
          currentTrucks: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              status: true,
              manufactureYear: true,
            },
          },
          assignments: {
            take: 10,
            orderBy: { assignedDate: 'desc' },
            include: {
              truck: {
                select: {
                  plateNumber: true,
                  model: true,
                },
              },
            },
          },
        },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'راننده یافت نشد',
        });
      }

      res.json({
        success: true,
        data: driver,
      });
    } catch (error) {
      console.error('خطا در getById driver:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ایجاد راننده جدید
  async create(req: Request, res: Response) {
    try {
      const {
        fullName,
        nationalId,
        phone,
        address,
        licenseNumber,
        licenseType,
        licenseExpiryDate,
        workStartDate,
      } = req.body;

      // اعتبارسنجی
      if (!fullName || !nationalId || !phone || !licenseNumber || !licenseType || !licenseExpiryDate || !workStartDate) {
        return res.status(400).json({
          success: false,
          message: 'فیلدهای الزامی را پر کنید',
        });
      }

      // بررسی تکراری بودن کد ملی
      const existingDriver = await prisma.driver.findUnique({
        where: { nationalId },
      });

      if (existingDriver) {
        return res.status(400).json({
          success: false,
          message: 'این کد ملی قبلاً ثبت شده است',
        });
      }

      // بررسی تکراری بودن شماره گواهینامه
      const existingLicense = await prisma.driver.findUnique({
        where: { licenseNumber },
      });

      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'این شماره گواهینامه قبلاً ثبت شده است',
        });
      }

      const driver = await prisma.driver.create({
        data: {
          fullName,
          nationalId,
          phone,
          address,
          licenseNumber,
          licenseType,
          licenseExpiryDate: new Date(licenseExpiryDate),
          workStartDate: new Date(workStartDate),
          createdById: req.user?.userId,
        },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user?.userId,
          action: 'create',
          entity: 'driver',
          entityId: driver.id,
          changes: { driver },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.status(201).json({
        success: true,
        message: 'راننده با موفقیت ایجاد شد',
        data: driver,
      });
    } catch (error) {
      console.error('خطا در create driver:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ویرایش راننده
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        fullName,
        nationalId,
        phone,
        address,
        licenseNumber,
        licenseType,
        licenseExpiryDate,
        driverScore,
        isActive,
      } = req.body;

      const driver = await prisma.driver.findUnique({
        where: { id: parseInt(id) },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'راننده یافت نشد',
        });
      }

      // بررسی تکراری بودن کد ملی (اگر تغییر کرده)
      if (nationalId && nationalId !== driver.nationalId) {
        const existingDriver = await prisma.driver.findUnique({
          where: { nationalId },
        });

        if (existingDriver) {
          return res.status(400).json({
            success: false,
            message: 'این کد ملی قبلاً ثبت شده است',
          });
        }
      }

      // بررسی تکراری بودن شماره گواهینامه (اگر تغییر کرده)
      if (licenseNumber && licenseNumber !== driver.licenseNumber) {
        const existingLicense = await prisma.driver.findUnique({
          where: { licenseNumber },
        });

        if (existingLicense) {
          return res.status(400).json({
            success: false,
            message: 'این شماره گواهینامه قبلاً ثبت شده است',
          });
        }
      }

      const updatedDriver = await prisma.driver.update({
        where: { id: parseInt(id) },
        data: {
          ...(fullName && { fullName }),
          ...(nationalId && { nationalId }),
          ...(phone && { phone }),
          ...(address !== undefined && { address }),
          ...(licenseNumber && { licenseNumber }),
          ...(licenseType && { licenseType }),
          ...(licenseExpiryDate && { licenseExpiryDate: new Date(licenseExpiryDate) }),
          ...(driverScore !== undefined && { driverScore }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user?.userId,
          action: 'update',
          entity: 'driver',
          entityId: driver.id,
          changes: { old: driver, new: updatedDriver },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'راننده با موفقیت به‌روزرسانی شد',
        data: updatedDriver,
      });
    } catch (error) {
      console.error('خطا در update driver:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // حذف راننده
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const driver = await prisma.driver.findUnique({
        where: { id: parseInt(id) },
        include: {
          currentTrucks: true,
        },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'راننده یافت نشد',
        });
      }

      // بررسی اینکه آیا راننده به کامیونی تخصیص داده شده یا نه
      if (driver.currentTrucks.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'نمی‌توانید راننده‌ای که به کامیون تخصیص داده شده را حذف کنید',
        });
      }

      await prisma.driver.delete({
        where: { id: parseInt(id) },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user?.userId,
          action: 'delete',
          entity: 'driver',
          entityId: driver.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'راننده با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('خطا در delete driver:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت عملکرد راننده
  async getPerformance(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const driver = await prisma.driver.findUnique({
        where: { id: parseInt(id) },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'راننده یافت نشد',
        });
      }

      // تعداد کامیون‌هایی که رانده
      const trucksCount = await prisma.truckDriverAssignment.groupBy({
        by: ['truckId'],
        where: { driverId: driver.id },
      });

      // آخرین تخصیص
      const currentAssignment = await prisma.truckDriverAssignment.findFirst({
        where: {
          driverId: driver.id,
          unassignedDate: null,
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
              model: true,
            },
          },
        },
      });

      // محاسبه مدت زمان کار (روز)
      const workDays = Math.floor(
        (new Date().getTime() - new Date(driver.workStartDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      res.json({
        success: true,
        data: {
          driver: {
            id: driver.id,
            fullName: driver.fullName,
            driverScore: driver.driverScore,
            fuelEfficiencyScore: driver.fuelEfficiencyScore,
            accidentCount: driver.accidentCount,
            violationCount: driver.violationCount,
            workStartDate: driver.workStartDate,
            isActive: driver.isActive,
          },
          performance: {
            trucksCount: trucksCount.length,
            currentTruck: currentAssignment?.truck || null,
            workDays,
            workYears: (workDays / 365).toFixed(1),
          },
        },
      });
    } catch (error) {
      console.error('خطا در getPerformance driver:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // تخصیص راننده به کامیون
  async assignToTruck(req: Request, res: Response) {
    try {
      const { driverId } = req.params;
      const { truckId, reason } = req.body;

      if (!truckId) {
        return res.status(400).json({
          success: false,
          message: 'شناسه کامیون الزامی است',
        });
      }

      const driver = await prisma.driver.findUnique({
        where: { id: parseInt(driverId) },
      });

      if (!driver || !driver.isActive) {
        return res.status(400).json({
          success: false,
          message: 'راننده یافت نشد یا غیرفعال است',
        });
      }

      const truck = await prisma.truck.findFirst({
        where: {
          id: parseInt(truckId),
          deletedAt: null,
        },
      });

      if (!truck) {
        return res.status(400).json({
          success: false,
          message: 'کامیون یافت نشد',
        });
      }

      // بررسی اینکه راننده قبلاً به کامیون دیگری تخصیص داده نشده باشد
      const currentAssignment = await prisma.truckDriverAssignment.findFirst({
        where: {
          driverId: parseInt(driverId),
          unassignedDate: null,
        },
      });

      if (currentAssignment) {
        // ابتدا تخصیص قبلی را ببند
        await prisma.truckDriverAssignment.update({
          where: { id: currentAssignment.id },
          data: {
            unassignedDate: new Date(),
            reason: reason || 'تخصیص به کامیون جدید',
          },
        });
      }

      // بررسی اینکه کامیون قبلاً راننده نداشته باشد
      const truckCurrentAssignment = await prisma.truckDriverAssignment.findFirst({
        where: {
          truckId: parseInt(truckId),
          unassignedDate: null,
        },
      });

      if (truckCurrentAssignment) {
        // ابتدا تخصیص قبلی کامیون را ببند
        await prisma.truckDriverAssignment.update({
          where: { id: truckCurrentAssignment.id },
          data: {
            unassignedDate: new Date(),
            reason: reason || 'تعویض راننده',
          },
        });
      }

      // ایجاد تخصیص جدید
      const assignment = await prisma.truckDriverAssignment.create({
        data: {
          truckId: parseInt(truckId),
          driverId: parseInt(driverId),
          assignedDate: new Date(),
          reason,
          assignedById: req.user?.userId,
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
              model: true,
            },
          },
          driver: {
            select: {
              fullName: true,
              licenseNumber: true,
            },
          },
        },
      });

      // به‌روزرسانی currentDriverId در جدول truck
      await prisma.truck.update({
        where: { id: parseInt(truckId) },
        data: { currentDriverId: parseInt(driverId) },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user?.userId,
          action: 'assign',
          entity: 'truck_driver_assignment',
          entityId: assignment.id,
          changes: { assignment },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'راننده با موفقیت به کامیون تخصیص داده شد',
        data: assignment,
      });
    } catch (error) {
      console.error('خطا در assignToTruck:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // لغو تخصیص راننده از کامیون
  async unassignFromTruck(req: Request, res: Response) {
    try {
      const { driverId } = req.params;
      const { reason } = req.body;

      const currentAssignment = await prisma.truckDriverAssignment.findFirst({
        where: {
          driverId: parseInt(driverId),
          unassignedDate: null,
        },
      });

      if (!currentAssignment) {
        return res.status(404).json({
          success: false,
          message: 'تخصیص فعالی یافت نشد',
        });
      }

      const updatedAssignment = await prisma.truckDriverAssignment.update({
        where: { id: currentAssignment.id },
        data: {
          unassignedDate: new Date(),
          reason: reason || 'لغو تخصیص',
        },
        include: {
          truck: {
            select: {
              id: true,
              plateNumber: true,
            },
          },
          driver: {
            select: {
              fullName: true,
            },
          },
        },
      });

      // به‌روزرسانی currentDriverId در جدول truck
      await prisma.truck.update({
        where: { id: currentAssignment.truckId },
        data: { currentDriverId: null },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user?.userId,
          action: 'unassign',
          entity: 'truck_driver_assignment',
          entityId: updatedAssignment.id,
          changes: { assignment: updatedAssignment },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'تخصیص راننده لغو شد',
        data: updatedAssignment,
      });
    } catch (error) {
      console.error('خطا در unassignFromTruck:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
