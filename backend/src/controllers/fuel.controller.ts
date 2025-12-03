import { Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import whatsappService from '../services/whatsapp.service';

export class FuelController {
  // دریافت لیست رکوردهای مصرف سوخت
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        truckId,
        fromDate,
        toDate,
        minConsumption,
        maxConsumption,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: Prisma.FuelRecordWhereInput = {};

      if (truckId) {
        where.truckId = parseInt(truckId as string);
      }

      if (fromDate || toDate) {
        where.recordDate = {};
        if (fromDate) {
          where.recordDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.recordDate.lte = new Date(toDate as string);
        }
      }

      if (minConsumption || maxConsumption) {
        where.consumptionLiters = {};
        if (minConsumption) {
          where.consumptionLiters.gte = parseFloat(minConsumption as string);
        }
        if (maxConsumption) {
          where.consumptionLiters.lte = parseFloat(maxConsumption as string);
        }
      }

      const [fuelRecords, total] = await Promise.all([
        prisma.fuelRecord.findMany({
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
            recordedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            recordDate: 'desc',
          },
        }),
        prisma.fuelRecord.count({ where }),
      ]);

      res.json({
        success: true,
        data: fuelRecords,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('خطا در getAll fuel records:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت جزئیات یک رکورد
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const fuelRecord = await prisma.fuelRecord.findUnique({
        where: { id: parseInt(id) },
        include: {
          truck: {
            select: {
              id: true,
              plateNumber: true,
              model: true,
              expectedFuelConsumption: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      if (!fuelRecord) {
        return res.status(404).json({
          success: false,
          message: 'رکورد سوخت یافت نشد',
        });
      }

      res.json({
        success: true,
        data: fuelRecord,
      });
    } catch (error) {
      console.error('خطا در getById fuel record:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ثبت رکورد مصرف سوخت جدید
  async create(req: Request, res: Response) {
    try {
      const {
        truckId,
        recordDate,
        startKilometer,
        endKilometer,
        consumptionLiters,
        routeDescription,
        notes,
      } = req.body;

      if (!truckId || !recordDate || !startKilometer || !endKilometer || !consumptionLiters) {
        return res.status(400).json({
          success: false,
          message: 'کامیون، تاریخ، کیلومترها و مصرف سوخت الزامی است',
        });
      }

      const truck = await prisma.truck.findUnique({
        where: { id: parseInt(truckId) },
        select: {
          id: true,
          plateNumber: true,
          expectedFuelConsumption: true,
        },
      });

      if (!truck) {
        return res.status(404).json({
          success: false,
          message: 'کامیون یافت نشد',
        });
      }

      // محاسبه مسافت و مصرف به ازای هر کیلومتر
      const distance = parseInt(endKilometer) - parseInt(startKilometer);
      const consumptionPerKm = distance > 0 ? parseFloat(consumptionLiters) / distance : 0;

      // بررسی مصرف غیرعادی
      let isAbnormal = false;
      let differenceFromExpected = 0;

      if (truck.expectedFuelConsumption) {
        const expectedConsumption = (truck.expectedFuelConsumption / 100) * distance;
        differenceFromExpected = parseFloat(consumptionLiters) - expectedConsumption;

        // اگر اختلاف بیشتر از 20% باشد، غیرعادی است
        const threshold = expectedConsumption * 0.2;
        isAbnormal = Math.abs(differenceFromExpected) > threshold;
      }

      const fuelRecord = await prisma.fuelRecord.create({
        data: {
          truckId: parseInt(truckId),
          recordDate: new Date(recordDate),
          startKilometer: parseInt(startKilometer),
          endKilometer: parseInt(endKilometer),
          distance,
          consumptionLiters: parseFloat(consumptionLiters),
          consumptionPerKm,
          routeDescription,
          notes,
          recordedById: req.user!.userId,
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
          action: 'create',
          entity: 'fuel_record',
          entityId: fuelRecord.id,
          changes: { fuelRecord },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      // اگر مصرف غیرعادی است، ایجاد اعلان و ارسال پیام واتساپ
      if (isAbnormal && differenceFromExpected > 0) {
        await prisma.notification.create({
          data: {
            userId: req.user!.userId,
            type: 'FUEL_ABNORMAL',
            severity: 'MEDIUM',
            title: 'مصرف سوخت غیرعادی',
            message: `مصرف سوخت کامیون ${truck.plateNumber} ${differenceFromExpected.toFixed(1)} لیتر بیشتر از حد مجاز است`,
            relatedEntity: 'fuel_record',
            relatedEntityId: fuelRecord.id,
          },
        });

        // ارسال پیام واتساپ به گروه مدیریت
        try {
          const message = whatsappService.formatFuelAbnormalAlert(truck, differenceFromExpected);
          await whatsappService.sendAlertToManagement(message);
        } catch (error) {
          console.error('خطا در ارسال پیام واتساپ:', error);
        }
      }

      res.status(201).json({
        success: true,
        message: 'رکورد سوخت با موفقیت ثبت شد',
        data: fuelRecord,
        warning: isAbnormal ? 'مصرف سوخت غیرعادی شناسایی شد' : null,
      });
    } catch (error) {
      console.error('خطا در create fuel record:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت لیست سوخت‌گیری‌ها
  async getRefills(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        truckId,
        fuelCardId,
        fromDate,
        toDate,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: Prisma.FuelRefillWhereInput = {};

      if (truckId) {
        where.truckId = parseInt(truckId as string);
      }

      if (fuelCardId) {
        where.fuelCardId = parseInt(fuelCardId as string);
      }

      if (fromDate || toDate) {
        where.refillDate = {};
        if (fromDate) {
          where.refillDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.refillDate.lte = new Date(toDate as string);
        }
      }

      const [refills, total] = await Promise.all([
        prisma.fuelRefill.findMany({
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
            fuelCard: {
              select: {
                id: true,
                cardNumber: true,
                supplier: true,
              },
            },
            recordedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            refillDate: 'desc',
          },
        }),
        prisma.fuelRefill.count({ where }),
      ]);

      res.json({
        success: true,
        data: refills,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('خطا در getRefills:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // ثبت سوخت‌گیری جدید
  async createRefill(req: Request, res: Response) {
    try {
      const {
        truckId,
        fuelCardId,
        refillDate,
        kilometer,
        liters,
        pricePerLiter,
        stationName,
        stationLocation,
        receiptNumber,
        notes,
      } = req.body;

      if (!truckId || !refillDate || !liters || !pricePerLiter) {
        return res.status(400).json({
          success: false,
          message: 'کامیون، تاریخ، لیتر و قیمت الزامی است',
        });
      }

      const totalCost = parseFloat(liters) * parseFloat(pricePerLiter);

      const refill = await prisma.fuelRefill.create({
        data: {
          truckId: parseInt(truckId),
          fuelCardId: fuelCardId ? parseInt(fuelCardId) : null,
          refillDate: new Date(refillDate),
          kilometer: kilometer ? parseInt(kilometer) : null,
          liters: parseFloat(liters),
          pricePerLiter: parseFloat(pricePerLiter),
          totalCost,
          stationName,
          stationLocation,
          receiptNumber,
          notes,
          recordedById: req.user!.userId,
        },
        include: {
          truck: {
            select: {
              plateNumber: true,
            },
          },
          fuelCard: {
            select: {
              cardNumber: true,
            },
          },
        },
      });

      // ثبت لاگ
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: 'create',
          entity: 'fuel_refill',
          entityId: refill.id,
          changes: { refill },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      res.status(201).json({
        success: true,
        message: 'سوخت‌گیری با موفقیت ثبت شد',
        data: refill,
      });
    } catch (error) {
      console.error('خطا در createRefill:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // دریافت لیست کارت‌های سوخت
  async getFuelCards(req: Request, res: Response) {
    try {
      const { status } = req.query;

      const where: Prisma.FuelCardWhereInput = {};

      if (status) {
        where.status = status as any;
      }

      const fuelCards = await prisma.fuelCard.findMany({
        where,
        include: {
          assignedTruck: {
            select: {
              id: true,
              plateNumber: true,
            },
          },
        },
        orderBy: {
          cardNumber: 'asc',
        },
      });

      res.json({
        success: true,
        data: fuelCards,
      });
    } catch (error) {
      console.error('خطا در getFuelCards:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // تحلیل مصرف سوخت
  async getConsumptionAnalysis(req: Request, res: Response) {
    try {
      const { truckId, fromDate, toDate } = req.query;

      if (!truckId) {
        return res.status(400).json({
          success: false,
          message: 'شناسه کامیون الزامی است',
        });
      }

      const where: Prisma.FuelRecordWhereInput = {
        truckId: parseInt(truckId as string),
      };

      if (fromDate || toDate) {
        where.recordDate = {};
        if (fromDate) {
          where.recordDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.recordDate.lte = new Date(toDate as string);
        }
      }

      const [records, truck, aggregations] = await Promise.all([
        prisma.fuelRecord.findMany({
          where,
          orderBy: {
            recordDate: 'asc',
          },
        }),
        prisma.truck.findUnique({
          where: { id: parseInt(truckId as string) },
          select: {
            plateNumber: true,
            expectedFuelConsumption: true,
          },
        }),
        prisma.fuelRecord.aggregate({
          where,
          _sum: {
            consumptionLiters: true,
            distance: true,
          },
          _avg: {
            consumptionPerKm: true,
          },
          _count: true,
        }),
      ]);

      if (!truck) {
        return res.status(404).json({
          success: false,
          message: 'کامیون یافت نشد',
        });
      }

      const totalConsumption = aggregations._sum.consumptionLiters || 0;
      const totalDistance = aggregations._sum.distance || 0;
      const averageConsumptionPerKm = aggregations._avg.consumptionPerKm || 0;
      const recordCount = aggregations._count;

      // محاسبه مصرف به ازای 100 کیلومتر
      const consumptionPer100Km = totalDistance > 0 ? (totalConsumption / totalDistance) * 100 : 0;

      // مقایسه با مصرف مورد انتظار
      let comparisonWithExpected = null;
      if (truck.expectedFuelConsumption) {
        const difference = consumptionPer100Km - truck.expectedFuelConsumption;
        const percentageDiff = (difference / truck.expectedFuelConsumption) * 100;
        comparisonWithExpected = {
          expected: truck.expectedFuelConsumption,
          actual: consumptionPer100Km,
          difference,
          percentageDiff: percentageDiff.toFixed(2),
          status: Math.abs(percentageDiff) <= 10 ? 'NORMAL' : percentageDiff > 10 ? 'HIGH' : 'LOW',
        };
      }

      // روند مصرف (آخرین 5 رکورد)
      const recentTrend = records.slice(-5).map((r) => ({
        date: r.recordDate,
        consumptionPerKm: r.consumptionPerKm,
        distance: r.distance,
        liters: r.consumptionLiters,
      }));

      res.json({
        success: true,
        data: {
          truck: {
            plateNumber: truck.plateNumber,
            expectedFuelConsumption: truck.expectedFuelConsumption,
          },
          summary: {
            totalRecords: recordCount,
            totalConsumption,
            totalDistance,
            averageConsumptionPerKm,
            consumptionPer100Km: consumptionPer100Km.toFixed(2),
          },
          comparison: comparisonWithExpected,
          recentTrend,
        },
      });
    } catch (error) {
      console.error('خطا در getConsumptionAnalysis:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // شناسایی مصرف‌های غیرعادی
  async detectAnomalies(req: Request, res: Response) {
    try {
      const { days = '30' } = req.query;

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(days as string));

      // دریافت همه رکوردهای اخیر
      const records = await prisma.fuelRecord.findMany({
        where: {
          recordDate: {
            gte: fromDate,
          },
        },
        include: {
          truck: {
            select: {
              id: true,
              plateNumber: true,
              expectedFuelConsumption: true,
            },
          },
        },
        orderBy: {
          recordDate: 'desc',
        },
      });

      const anomalies = [];

      for (const record of records) {
        if (!record.truck.expectedFuelConsumption) continue;

        const expectedConsumption = (record.truck.expectedFuelConsumption / 100) * record.distance;
        const difference = record.consumptionLiters - expectedConsumption;
        const percentageDiff = (difference / expectedConsumption) * 100;

        // اگر اختلاف بیشتر از 20% باشد
        if (Math.abs(percentageDiff) > 20) {
          anomalies.push({
            recordId: record.id,
            truckId: record.truck.id,
            plateNumber: record.truck.plateNumber,
            recordDate: record.recordDate,
            distance: record.distance,
            actualConsumption: record.consumptionLiters,
            expectedConsumption: expectedConsumption.toFixed(2),
            difference: difference.toFixed(2),
            percentageDiff: percentageDiff.toFixed(2),
            severity: Math.abs(percentageDiff) > 40 ? 'HIGH' : 'MEDIUM',
          });
        }
      }

      res.json({
        success: true,
        data: {
          totalChecked: records.length,
          anomaliesFound: anomalies.length,
          anomalies,
        },
      });
    } catch (error) {
      console.error('خطا در detectAnomalies:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  // آمار کلی سوخت
  async getStats(req: Request, res: Response) {
    try {
      const { fromDate, toDate } = req.query;

      const where: Prisma.FuelRecordWhereInput = {};

      if (fromDate || toDate) {
        where.recordDate = {};
        if (fromDate) {
          where.recordDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.recordDate.lte = new Date(toDate as string);
        }
      }

      const [recordStats, refillStats] = await Promise.all([
        prisma.fuelRecord.aggregate({
          where,
          _sum: {
            consumptionLiters: true,
            distance: true,
          },
          _avg: {
            consumptionPerKm: true,
          },
          _count: true,
        }),
        prisma.fuelRefill.aggregate({
          where: fromDate || toDate ? {
            refillDate: where.recordDate,
          } : {},
          _sum: {
            liters: true,
            totalCost: true,
          },
          _avg: {
            pricePerLiter: true,
          },
          _count: true,
        }),
      ]);

      res.json({
        success: true,
        data: {
          consumption: {
            totalRecords: recordStats._count,
            totalLiters: recordStats._sum.consumptionLiters || 0,
            totalDistance: recordStats._sum.distance || 0,
            averagePerKm: recordStats._avg.consumptionPerKm || 0,
          },
          refills: {
            totalRefills: refillStats._count,
            totalLiters: refillStats._sum.liters || 0,
            totalCost: refillStats._sum.totalCost || 0,
            averagePricePerLiter: refillStats._avg.pricePerLiter || 0,
          },
        },
      });
    } catch (error) {
      console.error('خطا در getStats fuel:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
