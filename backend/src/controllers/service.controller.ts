import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class ServiceController {
  // دریافت لیست انواع سرویس
  async getServiceTypes(req: Request, res: Response) {
    try {
      const { isActive } = req.query;

      const where: Prisma.ServiceTypeWhereInput = {};

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const serviceTypes = await prisma.serviceType.findMany({
        where,
        orderBy: { displayOrder: 'asc' },
      });

      res.json({
        success: true,
        data: serviceTypes,
      });
    } catch (error) {
      console.error('خطا در getServiceTypes:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ایجاد نوع سرویس جدید (فقط مدیر)
  async createServiceType(req: Request, res: Response) {
    try {
      const {
        name,
        nameEn,
        description,
        scheduleType,
        intervalDays,
        intervalKilometers,
        alertDaysBefore,
        alertKmBefore,
        checklist,
        displayOrder,
      } = req.body;

      if (!name || !scheduleType) {
        return res.status(400).json({
          success: false,
          message: 'نام و نوع برنامه‌ریزی الزامی است',
        });
      }

      const serviceType = await prisma.serviceType.create({
        data: {
          name,
          nameEn,
          description,
          scheduleType,
          intervalDays: intervalDays ? parseInt(intervalDays) : null,
          intervalKilometers: intervalKilometers ? parseInt(intervalKilometers) : null,
          alertDaysBefore: alertDaysBefore ? parseInt(alertDaysBefore) : 7,
          alertKmBefore: alertKmBefore ? parseInt(alertKmBefore) : 500,
          checklist: checklist || null,
          displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        },
      });

      res.status(201).json({
        success: true,
        message: 'نوع سرویس با موفقیت ایجاد شد',
        data: serviceType,
      });
    } catch (error) {
      console.error('خطا در createServiceType:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت لیست سرویس‌ها
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        truckId,
        serviceTypeId,
        fromDate,
        toDate,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: Prisma.ServiceWhereInput = {};

      if (status) {
        where.status = status as any;
      }

      if (truckId) {
        where.truckId = parseInt(truckId as string);
      }

      if (serviceTypeId) {
        where.serviceTypeId = parseInt(serviceTypeId as string);
      }

      if (fromDate || toDate) {
        where.scheduledDate = {};
        if (fromDate) {
          where.scheduledDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.scheduledDate.lte = new Date(toDate as string);
        }
      }

      const [services, total] = await Promise.all([
        prisma.service.findMany({
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
            serviceType: {
              select: {
                id: true,
                name: true,
                scheduleType: true,
              },
            },
            performedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            scheduledDate: 'asc',
          },
        }),
        prisma.service.count({ where }),
      ]);

      res.json({
        success: true,
        data: services,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('خطا در getAll services:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت سرویس‌های سررسید (Due)
  async getDueServices(req: Request, res: Response) {
    try {
      const { days = '7' } = req.query;

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(days as string));

      const services = await prisma.service.findMany({
        where: {
          status: 'SCHEDULED',
          OR: [
            {
              scheduledDate: {
                gte: today,
                lte: futureDate,
              },
            },
          ],
        },
        include: {
          truck: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
            },
          },
          serviceType: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'asc',
        },
      });

      res.json({
        success: true,
        data: services,
      });
    } catch (error) {
      console.error('خطا در getDueServices:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت تقویم سرویس‌ها
  async getCalendar(req: Request, res: Response) {
    try {
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: 'ماه و سال الزامی است',
        });
      }

      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);

      const services = await prisma.service.findMany({
        where: {
          scheduledDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
            },
          },
          serviceType: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'asc',
        },
      });

      res.json({
        success: true,
        data: services,
      });
    } catch (error) {
      console.error('خطا در getCalendar:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ایجاد سرویس جدید (برنامه‌ریزی)
  async create(req: Request, res: Response) {
    try {
      const {
        truckId,
        serviceTypeId,
        scheduledDate,
        scheduledKilometer,
      } = req.body;

      if (!truckId || !serviceTypeId) {
        return res.status(400).json({
          success: false,
          message: 'کامیون و نوع سرویس الزامی است',
        });
      }

      const serviceType = await prisma.serviceType.findUnique({
        where: { id: parseInt(serviceTypeId) },
      });

      if (!serviceType || !serviceType.isActive) {
        return res.status(400).json({
          success: false,
          message: 'نوع سرویس معتبر نیست',
        });
      }

      // اعتبارسنجی بر اساس نوع برنامه‌ریزی
      if (
        (serviceType.scheduleType === 'DATE_ONLY' || serviceType.scheduleType === 'DATE_AND_KM') &&
        !scheduledDate
      ) {
        return res.status(400).json({
          success: false,
          message: 'تاریخ برنامه‌ریزی الزامی است',
        });
      }

      if (
        (serviceType.scheduleType === 'KM_ONLY' || serviceType.scheduleType === 'DATE_AND_KM') &&
        !scheduledKilometer
      ) {
        return res.status(400).json({
          success: false,
          message: 'کیلومتر برنامه‌ریزی الزامی است',
        });
      }

      const service = await prisma.service.create({
        data: {
          truckId: parseInt(truckId),
          serviceTypeId: parseInt(serviceTypeId),
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          scheduledKilometer: scheduledKilometer ? parseInt(scheduledKilometer) : null,
          status: 'SCHEDULED',
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
            },
          },
          serviceType: {
            select: {
              name: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'سرویس با موفقیت برنامه‌ریزی شد',
        data: service,
      });
    } catch (error) {
      console.error('خطا در create service:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // تکمیل سرویس
  async complete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        performedDate,
        performedKilometer,
        checklistResult,
        notes,
        cost,
        documents,
      } = req.body;

      if (!performedDate) {
        return res.status(400).json({
          success: false,
          message: 'تاریخ انجام الزامی است',
        });
      }

      const service = await prisma.service.findUnique({
        where: { id: parseInt(id) },
        include: {
          serviceType: true,
        },
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'سرویس یافت نشد',
        });
      }

      if (service.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'این سرویس قبلاً تکمیل شده است',
        });
      }

      // محاسبه سرویس بعدی
      let nextServiceDate = null;
      let nextServiceKm = null;

      if (service.serviceType.scheduleType === 'DATE_ONLY' || service.serviceType.scheduleType === 'DATE_AND_KM') {
        if (service.serviceType.intervalDays) {
          nextServiceDate = new Date(performedDate);
          nextServiceDate.setDate(nextServiceDate.getDate() + service.serviceType.intervalDays);
        }
      }

      if (service.serviceType.scheduleType === 'KM_ONLY' || service.serviceType.scheduleType === 'DATE_AND_KM') {
        if (service.serviceType.intervalKilometers && performedKilometer) {
          nextServiceKm = parseInt(performedKilometer) + service.serviceType.intervalKilometers;
        }
      }

      // تکمیل سرویس فعلی
      const updatedService = await prisma.service.update({
        where: { id: parseInt(id) },
        data: {
          status: 'COMPLETED',
          performedDate: new Date(performedDate),
          performedKilometer: performedKilometer ? parseInt(performedKilometer) : null,
          performedById: req.user!.userId,
          checklistResult: checklistResult || null,
          notes,
          cost: cost ? parseFloat(cost) : null,
          documents: documents || service.documents,
          nextServiceDate,
          nextServiceKm,
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
            },
          },
          serviceType: {
            select: {
              name: true,
            },
          },
        },
      });

      // ایجاد سرویس بعدی به صورت خودکار
      if (nextServiceDate || nextServiceKm) {
        await prisma.service.create({
          data: {
            truckId: service.truckId,
            serviceTypeId: service.serviceTypeId,
            scheduledDate: nextServiceDate,
            scheduledKilometer: nextServiceKm,
            status: 'SCHEDULED',
          },
        });
      }

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'complete',
          entity: 'service',
          entityId: service.id,
          changes: { service: updatedService },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.json({
        success: true,
        message: 'سرویس با موفقیت تکمیل و سرویس بعدی برنامه‌ریزی شد',
        data: updatedService,
      });
    } catch (error) {
      console.error('خطا در complete service:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // حذف سرویس
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const service = await prisma.service.findUnique({
        where: { id: parseInt(id) },
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'سرویس یافت نشد',
        });
      }

      if (service.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'نمی‌توانید سرویس تکمیل شده را حذف کنید',
        });
      }

      await prisma.service.delete({
        where: { id: parseInt(id) },
      });

      res.json({
        success: true,
        message: 'سرویس با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('خطا در delete service:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
