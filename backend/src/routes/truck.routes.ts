import { Router } from 'express';
import { TruckController } from '../controllers/truck.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const truckController = new TruckController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// دریافت لیست کامیون‌ها (همه نقش‌ها)
router.get('/', truckController.getAll.bind(truckController));

// دریافت جزئیات یک کامیون (همه نقش‌ها)
router.get('/:id', truckController.getById.bind(truckController));

// دریافت خلاصه وضعیت کامیون (همه نقش‌ها)
router.get('/:id/summary', truckController.getSummary.bind(truckController));

// ایجاد کامیون جدید (فقط مدیر کل و مدیر ناوگان)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER'),
  truckController.create.bind(truckController)
);

// ویرایش کامیون (فقط مدیر کل و مدیر ناوگان)
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER'),
  truckController.update.bind(truckController)
);

// حذف کامیون (فقط مدیر کل)
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  truckController.delete.bind(truckController)
);

export default router;
