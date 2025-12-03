import cron from 'node-cron';
import prisma from '../config/database';
import whatsappService from './whatsapp.service';

class CronService {
  /**
   * راه‌اندازی همه Cron Jobs
   */
  startAllJobs() {
    console.log('🕐 شروع Cron Jobs...');

    // هر روز ساعت 8 صبح - بررسی سرویس‌های سررسید
    cron.schedule('0 8 * * *', async () => {
      console.log('⏰ بررسی سرویس‌های سررسید...');
      await this.checkDueServices();
    });

    // هر روز ساعت 8 صبح - بررسی بازدیدهای سررسید
    cron.schedule('0 8 * * *', async () => {
      console.log('⏰ بررسی بازدیدهای سررسید...');
      await this.checkOverdueInspections();
    });

    // هر روز ساعت 8 صبح - بررسی انقضای بیمه و معاینه فنی
    cron.schedule('0 8 * * *', async () => {
      console.log('⏰ بررسی انقضای بیمه و معاینه فنی...');
      await this.checkExpiringDocuments();
    });

    // هر روز ساعت 9 شب - تحلیل مصرف سوخت
    cron.schedule('0 21 * * *', async () => {
      console.log('⏰ تحلیل مصرف سوخت...');
      await this.analyzeFuelConsumption();
    });

    // هر ساعت - بررسی اعلان‌های خوانده نشده
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ بررسی اعلان‌های خوانده نشده...');
      await this.sendUnreadNotifications();
    });

    console.log('✅ Cron Jobs راه‌اندازی شدند');
  }

  /**
   * بررسی سرویس‌های سررسید
   */
  async checkDueServices() {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 روز آینده

      const dueServices = await prisma.service.findMany({
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
              currentKilometer: true,
            },
          },
          serviceType: {
            select: {
              name: true,
              alertDaysBefore: true,
              alertKmBefore: true,
            },
          },
        },
      });

      for (const service of dueServices) {
        let shouldAlert = false;
        let daysRemaining = 0;

        if (service.scheduledDate) {
          daysRemaining = Math.ceil(
            (service.scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysRemaining <= (service.serviceType.alertDaysBefore || 7)) {
            shouldAlert = true;
          }
        }

        // بررسی کیلومتر
        if (service.scheduledKilometer && service.truck.currentKilometer) {
          const kmRemaining = service.scheduledKilometer - service.truck.currentKilometer;
          if (kmRemaining <= (service.serviceType.alertKmBefore || 500)) {
            shouldAlert = true;
          }
        }

        if (shouldAlert) {
          // ایجاد اعلان
          const existingNotification = await prisma.notification.findFirst({
            where: {
              type: 'SERVICE_DUE',
              relatedEntity: 'service',
              relatedEntityId: service.id,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // آخرین 24 ساعت
              },
            },
          });

          if (!existingNotification) {
            // پیدا کردن کاربران مرتبط (مدیران و تعمیرکاران)
            const users = await prisma.user.findMany({
              where: {
                role: {
                  in: ['SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE'],
                },
              },
            });

            for (const user of users) {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  type: 'SERVICE_DUE',
                  severity: daysRemaining <= 3 ? 'HIGH' : 'MEDIUM',
                  title: 'سرویس سررسید',
                  message: `سرویس ${service.serviceType.name} برای کامیون ${service.truck.plateNumber} ${daysRemaining} روز دیگر سررسید است`,
                  relatedEntity: 'service',
                  relatedEntityId: service.id,
                },
              });
            }

            // ارسال پیام واتساپ
            try {
              const message = whatsappService.formatServiceAlert(
                service.truck,
                service,
                daysRemaining
              );
              await whatsappService.sendAlertToManagement(message);
            } catch (error) {
              console.error('خطا در ارسال پیام واتساپ:', error);
            }
          }
        }
      }

      console.log(`✅ بررسی ${dueServices.length} سرویس انجام شد`);
    } catch (error) {
      console.error('خطا در checkDueServices:', error);
    }
  }

  /**
   * بررسی بازدیدهای سررسید
   */
  async checkOverdueInspections() {
    try {
      const today = new Date();

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
          lastInspectionDate: true,
        },
      });

      const inspectionTypes = await prisma.inspectionType.findMany({
        where: { isActive: true },
      });

      for (const truck of activeTrucks) {
        for (const inspectionType of inspectionTypes) {
          let dueDate = new Date();

          if (truck.lastInspectionDate) {
            dueDate = new Date(truck.lastInspectionDate);
            dueDate.setDate(dueDate.getDate() + inspectionType.intervalDays);
          }

          // اگر سررسید گذشته است
          if (dueDate <= today) {
            const daysPastDue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // بررسی اعلان تکراری
            const existingNotification = await prisma.notification.findFirst({
              where: {
                type: 'INSPECTION_DUE',
                message: {
                  contains: `${truck.plateNumber}`,
                },
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // آخرین 7 روز
                },
              },
            });

            if (!existingNotification) {
              const users = await prisma.user.findMany({
                where: {
                  role: {
                    in: ['SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'],
                  },
                },
              });

              for (const user of users) {
                await prisma.notification.create({
                  data: {
                    userId: user.id,
                    type: 'INSPECTION_DUE',
                    severity: daysPastDue > 5 ? 'HIGH' : 'MEDIUM',
                    title: 'بازدید سررسید',
                    message: `بازدید ${inspectionType.name} برای کامیون ${truck.plateNumber} ${daysPastDue} روز تاخیر دارد`,
                    relatedEntity: 'truck',
                    relatedEntityId: truck.id,
                  },
                });
              }

              // ارسال پیام واتساپ
              try {
                const message = whatsappService.formatInspectionDueAlert(
                  truck,
                  inspectionType.name,
                  daysPastDue
                );
                await whatsappService.sendAlertToManagement(message);
              } catch (error) {
                console.error('خطا در ارسال پیام واتساپ:', error);
              }
            }
          }
        }
      }

      console.log(`✅ بررسی بازدیدها برای ${activeTrucks.length} کامیون انجام شد`);
    } catch (error) {
      console.error('خطا در checkOverdueInspections:', error);
    }
  }

  /**
   * بررسی انقضای بیمه و معاینه فنی
   */
  async checkExpiringDocuments() {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 روز آینده

      const trucks = await prisma.truck.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              insuranceExpiry: {
                gte: today,
                lte: futureDate,
              },
            },
            {
              inspectionExpiry: {
                gte: today,
                lte: futureDate,
              },
            },
          ],
        },
      });

      for (const truck of trucks) {
        // بررسی بیمه
        if (truck.insuranceExpiry) {
          const daysRemaining = Math.ceil(
            (truck.insuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysRemaining <= 30) {
            const existingNotification = await prisma.notification.findFirst({
              where: {
                type: 'INSURANCE_EXPIRY',
                relatedEntity: 'truck',
                relatedEntityId: truck.id,
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            });

            if (!existingNotification) {
              const users = await prisma.user.findMany({
                where: {
                  role: {
                    in: ['SUPER_ADMIN', 'FLEET_MANAGER'],
                  },
                },
              });

              for (const user of users) {
                await prisma.notification.create({
                  data: {
                    userId: user.id,
                    type: 'INSURANCE_EXPIRY',
                    severity: daysRemaining <= 7 ? 'HIGH' : 'MEDIUM',
                    title: 'انقضای بیمه',
                    message: `بیمه کامیون ${truck.plateNumber} ${daysRemaining} روز دیگر منقضی می‌شود`,
                    relatedEntity: 'truck',
                    relatedEntityId: truck.id,
                  },
                });
              }
            }
          }
        }

        // بررسی معاینه فنی
        if (truck.inspectionExpiry) {
          const daysRemaining = Math.ceil(
            (truck.inspectionExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysRemaining <= 30) {
            const existingNotification = await prisma.notification.findFirst({
              where: {
                type: 'DOCUMENT_EXPIRY',
                relatedEntity: 'truck',
                relatedEntityId: truck.id,
                message: {
                  contains: 'معاینه فنی',
                },
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            });

            if (!existingNotification) {
              const users = await prisma.user.findMany({
                where: {
                  role: {
                    in: ['SUPER_ADMIN', 'FLEET_MANAGER'],
                  },
                },
              });

              for (const user of users) {
                await prisma.notification.create({
                  data: {
                    userId: user.id,
                    type: 'DOCUMENT_EXPIRY',
                    severity: daysRemaining <= 7 ? 'HIGH' : 'MEDIUM',
                    title: 'انقضای معاینه فنی',
                    message: `معاینه فنی کامیون ${truck.plateNumber} ${daysRemaining} روز دیگر منقضی می‌شود`,
                    relatedEntity: 'truck',
                    relatedEntityId: truck.id,
                  },
                });
              }
            }
          }
        }
      }

      console.log(`✅ بررسی اسناد برای ${trucks.length} کامیون انجام شد`);
    } catch (error) {
      console.error('خطا در checkExpiringDocuments:', error);
    }
  }

  /**
   * تحلیل مصرف سوخت
   */
  async analyzeFuelConsumption() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      // دریافت رکوردهای دیروز
      const yesterdayRecords = await prisma.fuelRecord.findMany({
        where: {
          recordDate: {
            gte: yesterday,
            lte: endOfYesterday,
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
      });

      for (const record of yesterdayRecords) {
        if (!record.truck.expectedFuelConsumption) continue;

        const expectedConsumption = (record.truck.expectedFuelConsumption / 100) * record.distance;
        const difference = record.consumptionLiters - expectedConsumption;
        const percentageDiff = (difference / expectedConsumption) * 100;

        // اگر اختلاف بیشتر از 25% باشد
        if (percentageDiff > 25) {
          const users = await prisma.user.findMany({
            where: {
              role: {
                in: ['SUPER_ADMIN', 'FLEET_MANAGER'],
              },
            },
          });

          for (const user of users) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                type: 'FUEL_ABNORMAL',
                severity: percentageDiff > 40 ? 'HIGH' : 'MEDIUM',
                title: 'مصرف سوخت غیرعادی',
                message: `مصرف سوخت کامیون ${record.truck.plateNumber} در تاریخ ${record.recordDate.toLocaleDateString('fa-IR')} ${percentageDiff.toFixed(1)}٪ بیشتر از حد مجاز است`,
                relatedEntity: 'fuel_record',
                relatedEntityId: record.id,
              },
            });
          }
        }
      }

      console.log(`✅ تحلیل ${yesterdayRecords.length} رکورد سوخت انجام شد`);
    } catch (error) {
      console.error('خطا در analyzeFuelConsumption:', error);
    }
  }

  /**
   * ارسال اعلان‌های خوانده نشده
   */
  async sendUnreadNotifications() {
    try {
      // این تابع می‌تواند برای ارسال ایمیل یا پوش نوتیفیکیشن استفاده شود
      const unreadCount = await prisma.notification.count({
        where: {
          isRead: false,
        },
      });

      console.log(`📬 ${unreadCount} اعلان خوانده نشده موجود است`);
    } catch (error) {
      console.error('خطا در sendUnreadNotifications:', error);
    }
  }
}

export default new CronService();
