import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const driverController = new DriverController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// دریافت لیست رانندگان (همه نقش‌ها)
router.get('/', driverController.getAll.bind(driverController));

// دریافت جزئیات یک راننده (همه نقش‌ها)
router.get('/:id', driverController.getById.bind(driverController));

// دریافت عملکرد راننده (همه نقش‌ها)
router.get('/:id/performance', driverController.getPerformance.bind(driverController));

// ایجاد راننده جدید (فقط مدیر کل و مدیر ناوگان)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER'),
  driverController.create.bind(driverController)
);

// ویرایش راننده (فقط مدیر کل و مدیر ناوگان)
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER'),
  driverController.update.bind(driverController)
);

// حذف راننده (فقط مدیر کل)
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  driverController.delete.bind(driverController)
);

// تخصیص راننده به کامیون (فقط مدیر کل و مدیر ناوگان)
router.post(
  '/:driverId/assign',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER'),
  driverController.assignToTruck.bind(driverController)
);

// لغو تخصیص راننده (فقط مدیر کل و مدیر ناوگان)
router.post(
  '/:driverId/unassign',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER'),
  driverController.unassignFromTruck.bind(driverController)
);

export default router;
