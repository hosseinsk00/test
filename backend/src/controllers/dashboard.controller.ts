import { Request, Response } from 'express';
import prisma from '../config/database';

export class DashboardController {
  /**
   * داشبورد کلی - نمای کامل
   */
  async getOverview(req: Request, res: Response) {
    try {
      const { fromDate, toDate } = req.query;

      const dateFilter: any = {};
      if (fromDate) {
        dateFilter.gte = new Date(fromDate as string);
      }
      if (toDate) {
        dateFilter.lte = new Date(toDate as string);
      }

      // آمار کامیون‌ها
      const [
        totalTrucks,
        activeTrucks,
        underServiceTrucks,
        brokenDownTrucks,
        inactiveTrucks,
      ] = await Promise.all([
        prisma.truck.count({ where: { deletedAt: null } }),
        prisma.truck.count({ where: { status: 'ACTIVE', deletedAt: null } }),
        prisma.truck.count({ where: { status: 'UNDER_SERVICE', deletedAt: null } }),
        prisma.truck.count({ where: { status: 'BROKEN_DOWN', deletedAt: null } }),
        prisma.truck.count({ where: { status: 'INACTIVE', deletedAt: null } }),
      ]);

      // آمار رانندگان
      const [
        totalDrivers,
        activeDrivers,
        assignedDrivers,
        unassignedDrivers,
      ] = await Promise.all([
        prisma.driver.count(),
        prisma.driver.count({ where: { status: 'ACTIVE' } }),
        prisma.driver.count({ where: { currentTruckId: { not: null } } }),
        prisma.driver.count({ where: { currentTruckId: null } }),
      ]);

      // آمار خرابی‌ها
      const [
        totalBreakdowns,
        criticalBreakdowns,
        activeBreakdowns,
        fixedBreakdowns,
      ] = await Promise.all([
        prisma.breakdown.count(
          Object.keys(dateFilter).length > 0
            ? { where: { occurredDate: dateFilter } }
            : {}
        ),
        prisma.breakdown.count({
          where: {
            severity: 'CRITICAL',
            ...(Object.keys(dateFilter).length > 0 ? { occurredDate: dateFilter } : {}),
          },
        }),
        prisma.breakdown.count({
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
          },
        }),
        prisma.breakdown.count({
          where: {
            status: 'FIXED',
            ...(Object.keys(dateFilter).length > 0 ? { occurredDate: dateFilter } : {}),
          },
        }),
      ]);

      // آمار سرویس‌ها
      const [
        totalServices,
        scheduledServices,
        completedServices,
        overdueServices,
      ] = await Promise.all([
        prisma.service.count(
          Object.keys(dateFilter).length > 0
            ? { where: { scheduledDate: dateFilter } }
            : {}
        ),
        prisma.service.count({
          where: { status: 'SCHEDULED' },
        }),
        prisma.service.count({
          where: {
            status: 'COMPLETED',
            ...(Object.keys(dateFilter).length > 0 ? { performedDate: dateFilter } : {}),
          },
        }),
        prisma.service.count({
          where: {
            status: 'SCHEDULED',
            scheduledDate: {
              lt: new Date(),
            },
          },
        }),
      ]);

      // آمار بازدیدها
      const [
        totalInspections,
        passedInspections,
        failedInspections,
        averageInspectionScore,
      ] = await Promise.all([
        prisma.inspection.count(
          Object.keys(dateFilter).length > 0
            ? { where: { inspectionDate: dateFilter } }
            : {}
        ),
        prisma.inspection.count({
          where: {
            passed: true,
            ...(Object.keys(dateFilter).length > 0 ? { inspectionDate: dateFilter } : {}),
          },
        }),
        prisma.inspection.count({
          where: {
            passed: false,
            ...(Object.keys(dateFilter).length > 0 ? { inspectionDate: dateFilter } : {}),
          },
        }),
        prisma.inspection.aggregate({
          where: Object.keys(dateFilter).length > 0 ? { inspectionDate: dateFilter } : {},
          _avg: {
            score: true,
          },
        }),
      ]);

      // آمار سوخت
      const fuelStats = await prisma.fuelRecord.aggregate({
        where: Object.keys(dateFilter).length > 0 ? { recordDate: dateFilter } : {},
        _sum: {
          consumptionLiters: true,
          distance: true,
        },
        _avg: {
          consumptionPerKm: true,
        },
      });

      const fuelRefillStats = await prisma.fuelRefill.aggregate({
        where: Object.keys(dateFilter).length > 0 ? { refillDate: dateFilter } : {},
        _sum: {
          liters: true,
          totalCost: true,
        },
        _avg: {
          pricePerLiter: true,
        },
      });

      // اعلان‌های خوانده نشده
      const unreadNotifications = await prisma.notification.count({
        where: {
          userId: req.user!.userId,
          isRead: false,
        },
      });

      res.json({
        success: true,
        data: {
          fleet: {
            total: totalTrucks,
            active: activeTrucks,
            underService: underServiceTrucks,
            brokenDown: brokenDownTrucks,
            inactive: inactiveTrucks,
            operationalRate: totalTrucks > 0 ? ((activeTrucks / totalTrucks) * 100).toFixed(2) : 0,
          },
          drivers: {
            total: totalDrivers,
            active: activeDrivers,
            assigned: assignedDrivers,
            unassigned: unassignedDrivers,
            assignmentRate: totalDrivers > 0 ? ((assignedDrivers / totalDrivers) * 100).toFixed(2) : 0,
          },
          breakdowns: {
            total: totalBreakdowns,
            critical: criticalBreakdowns,
            active: activeBreakdowns,
            fixed: fixedBreakdowns,
            fixRate: totalBreakdowns > 0 ? ((fixedBreakdowns / totalBreakdowns) * 100).toFixed(2) : 0,
          },
          services: {
            total: totalServices,
            scheduled: scheduledServices,
            completed: completedServices,
            overdue: overdueServices,
            completionRate: totalServices > 0 ? ((completedServices / totalServices) * 100).toFixed(2) : 0,
          },
          inspections: {
            total: totalInspections,
            passed: passedInspections,
            failed: failedInspections,
            averageScore: averageInspectionScore._avg.score?.toFixed(2) || 0,
            passRate: totalInspections > 0 ? ((passedInspections / totalInspections) * 100).toFixed(2) : 0,
          },
          fuel: {
            totalConsumption: fuelStats._sum.consumptionLiters || 0,
            totalDistance: fuelStats._sum.distance || 0,
            averageConsumptionPerKm: fuelStats._avg.consumptionPerKm?.toFixed(4) || 0,
            totalRefills: fuelRefillStats._sum.liters || 0,
            totalCost: fuelRefillStats._sum.totalCost || 0,
            averagePricePerLiter: fuelRefillStats._avg.pricePerLiter?.toFixed(2) || 0,
          },
          notifications: {
            unread: unreadNotifications,
          },
        },
      });
    } catch (error) {
      console.error('خطا در getOverview:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  /**
   * آمار روزانه برای نمودارها
   */
  async getDailyStats(req: Request, res: Response) {
    try {
      const { days = '30' } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));
      startDate.setHours(0, 0, 0, 0);

      // خرابی‌های روزانه
      const breakdownsByDay = await prisma.breakdown.groupBy({
        by: ['occurredDate'],
        where: {
          occurredDate: {
            gte: startDate,
          },
        },
        _count: true,
        orderBy: {
          occurredDate: 'asc',
        },
      });

      // سرویس‌های روزانه
      const servicesByDay = await prisma.service.groupBy({
        by: ['performedDate'],
        where: {
          performedDate: {
            gte: startDate,
            not: null,
          },
          status: 'COMPLETED',
        },
        _count: true,
        orderBy: {
          performedDate: 'asc',
        },
      });

      // مصرف سوخت روزانه
      const fuelByDay = await prisma.fuelRecord.groupBy({
        by: ['recordDate'],
        where: {
          recordDate: {
            gte: startDate,
          },
        },
        _sum: {
          consumptionLiters: true,
          distance: true,
        },
        orderBy: {
          recordDate: 'asc',
        },
      });

      res.json({
        success: true,
        data: {
          breakdowns: breakdownsByDay.map((b) => ({
            date: b.occurredDate,
            count: b._count,
          })),
          services: servicesByDay.map((s) => ({
            date: s.performedDate,
            count: s._count,
          })),
          fuel: fuelByDay.map((f) => ({
            date: f.recordDate,
            consumption: f._sum.consumptionLiters,
            distance: f._sum.distance,
          })),
        },
      });
    } catch (error) {
      console.error('خطا در getDailyStats:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  /**
   * فعالیت‌های اخیر
   */
  async getRecentActivities(req: Request, res: Response) {
    try {
      const { limit = '20' } = req.query;

      const activities = await prisma.activityLog.findMany({
        take: parseInt(limit as string),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      console.error('خطا در getRecentActivities:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  /**
   * وظایف آتی (سرویس‌ها، بازدیدها، اسناد)
   */
  async getUpcomingTasks(req: Request, res: Response) {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14); // 14 روز آینده

      // سرویس‌های آتی
      const upcomingServices = await prisma.service.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledDate: {
            gte: today,
            lte: futureDate,
          },
        },
        take: 10,
        orderBy: {
          scheduledDate: 'asc',
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

      // بیمه‌های منقضی شونده
      const expiringInsurance = await prisma.truck.findMany({
        where: {
          deletedAt: null,
          insuranceExpiry: {
            gte: today,
            lte: futureDate,
          },
        },
        take: 10,
        orderBy: {
          insuranceExpiry: 'asc',
        },
        select: {
          id: true,
          plateNumber: true,
          insuranceExpiry: true,
        },
      });

      // معاینه فنی منقضی شونده
      const expiringInspectionDocs = await prisma.truck.findMany({
        where: {
          deletedAt: null,
          inspectionExpiry: {
            gte: today,
            lte: futureDate,
          },
        },
        take: 10,
        orderBy: {
          inspectionExpiry: 'asc',
        },
        select: {
          id: true,
          plateNumber: true,
          inspectionExpiry: true,
        },
      });

      res.json({
        success: true,
        data: {
          upcomingServices: upcomingServices.map((s) => ({
            id: s.id,
            plateNumber: s.truck.plateNumber,
            serviceType: s.serviceType.name,
            scheduledDate: s.scheduledDate,
            daysRemaining: s.scheduledDate
              ? Math.ceil((s.scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              : null,
          })),
          expiringInsurance: expiringInsurance.map((t) => ({
            id: t.id,
            plateNumber: t.plateNumber,
            expiryDate: t.insuranceExpiry,
            daysRemaining: t.insuranceExpiry
              ? Math.ceil((t.insuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              : null,
          })),
          expiringInspectionDocs: expiringInspectionDocs.map((t) => ({
            id: t.id,
            plateNumber: t.plateNumber,
            expiryDate: t.inspectionExpiry,
            daysRemaining: t.inspectionExpiry
              ? Math.ceil((t.inspectionExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              : null,
          })),
        },
      });
    } catch (error) {
      console.error('خطا در getUpcomingTasks:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  /**
   * بهترین و بدترین کامیون‌ها (بر اساس خرابی، مصرف سوخت)
   */
  async getTruckPerformance(req: Request, res: Response) {
    try {
      const { days = '90' } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      // کامیون‌ها با بیشترین خرابی
      const trucksWithMostBreakdowns = await prisma.breakdown.groupBy({
        by: ['truckId'],
        where: {
          occurredDate: {
            gte: startDate,
          },
        },
        _count: true,
        orderBy: {
          _count: {
            truckId: 'desc',
          },
        },
        take: 5,
      });

      const truckBreakdownDetails = await Promise.all(
        trucksWithMostBreakdowns.map(async (item) => {
          const truck = await prisma.truck.findUnique({
            where: { id: item.truckId },
            select: { plateNumber: true, model: true },
          });
          return {
            truckId: item.truckId,
            plateNumber: truck?.plateNumber,
            model: truck?.model,
            breakdownCount: item._count,
          };
        })
      );

      // کامیون‌ها با بهترین مصرف سوخت
      const bestFuelConsumption = await prisma.fuelRecord.groupBy({
        by: ['truckId'],
        where: {
          recordDate: {
            gte: startDate,
          },
        },
        _avg: {
          consumptionPerKm: true,
        },
        orderBy: {
          _avg: {
            consumptionPerKm: 'asc',
          },
        },
        take: 5,
      });

      const bestFuelDetails = await Promise.all(
        bestFuelConsumption.map(async (item) => {
          const truck = await prisma.truck.findUnique({
            where: { id: item.truckId },
            select: { plateNumber: true, model: true, expectedFuelConsumption: true },
          });
          return {
            truckId: item.truckId,
            plateNumber: truck?.plateNumber,
            model: truck?.model,
            averageConsumptionPerKm: item._avg.consumptionPerKm?.toFixed(4),
            expectedConsumption: truck?.expectedFuelConsumption,
          };
        })
      );

      res.json({
        success: true,
        data: {
          mostBreakdowns: truckBreakdownDetails,
          bestFuelEfficiency: bestFuelDetails,
        },
      });
    } catch (error) {
      console.error('خطا در getTruckPerformance:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  /**
   * هشدارها و اعلان‌های مهم
   */
  async getAlerts(req: Request, res: Response) {
    try {
      const today = new Date();

      // خرابی‌های بحرانی فعال
      const criticalBreakdowns = await prisma.breakdown.count({
        where: {
          severity: 'CRITICAL',
          status: {
            in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'],
          },
        },
      });

      // سرویس‌های سررسید گذشته
      const overdueServices = await prisma.service.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: {
            lt: today,
          },
        },
      });

      // کامیون‌های نیازمند بازدید
      const trucksNeedingInspection = await prisma.truck.count({
        where: {
          deletedAt: null,
          status: {
            in: ['ACTIVE', 'UNDER_SERVICE'],
          },
          OR: [
            {
              lastInspectionDate: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // بیش از 7 روز
              },
            },
            {
              lastInspectionDate: null,
            },
          ],
        },
      });

      // اسناد منقضی شده
      const expiredDocuments = await prisma.truck.count({
        where: {
          deletedAt: null,
          OR: [
            {
              insuranceExpiry: {
                lt: today,
              },
            },
            {
              inspectionExpiry: {
                lt: today,
              },
            },
          ],
        },
      });

      // مصرف سوخت غیرعادی (امروز)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const abnormalFuel = await prisma.notification.count({
        where: {
          type: 'FUEL_ABNORMAL',
          createdAt: {
            gte: todayStart,
          },
        },
      });

      res.json({
        success: true,
        data: {
          criticalBreakdowns,
          overdueServices,
          trucksNeedingInspection,
          expiredDocuments,
          abnormalFuelConsumption: abnormalFuel,
        },
      });
    } catch (error) {
      console.error('خطا در getAlerts:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
