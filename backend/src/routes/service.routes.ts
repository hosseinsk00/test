import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const serviceController = new ServiceController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// دریافت لیست انواع سرویس (همه نقش‌ها)
router.get('/types', serviceController.getServiceTypes.bind(serviceController));

// ایجاد نوع سرویس جدید (فقط مدیر کل)
router.post(
  '/types',
  authorize('SUPER_ADMIN'),
  serviceController.createServiceType.bind(serviceController)
);

// دریافت سرویس‌های سررسید (همه نقش‌ها به جز راننده)
router.get(
  '/due',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  serviceController.getDueServices.bind(serviceController)
);

// دریافت تقویم سرویس‌ها (همه نقش‌ها به جز راننده)
router.get(
  '/calendar',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  serviceController.getCalendar.bind(serviceController)
);

// دریافت لیست سرویس‌ها (همه نقش‌ها)
router.get('/', serviceController.getAll.bind(serviceController));

// ایجاد سرویس جدید (فقط مدیر و مدیر ناوگان)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER'),
  serviceController.create.bind(serviceController)
);

// تکمیل سرویس (فقط مدیر، مدیر ناوگان و تعمیرات)
router.post(
  '/:id/complete',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE'),
  serviceController.complete.bind(serviceController)
);

// حذف سرویس (فقط مدیر کل)
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  serviceController.delete.bind(serviceController)
);

export default router;
