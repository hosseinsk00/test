import { Router } from 'express';
import { BreakdownController } from '../controllers/breakdown.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const breakdownController = new BreakdownController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// دریافت آمار خرابی‌ها (همه نقش‌ها به جز راننده)
router.get(
  '/stats',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  breakdownController.getStats.bind(breakdownController)
);

// دریافت لیست خرابی‌ها (همه نقش‌ها)
router.get('/', breakdownController.getAll.bind(breakdownController));

// دریافت جزئیات یک خرابی (همه نقش‌ها)
router.get('/:id', breakdownController.getById.bind(breakdownController));

// ثبت خرابی جدید (همه نقش‌ها می‌توانند خرابی ثبت کنند)
router.post('/', breakdownController.create.bind(breakdownController));

// ویرایش خرابی (فقط مدیر، مدیر ناوگان و تعمیرات)
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE'),
  breakdownController.update.bind(breakdownController)
);

// تغییر وضعیت خرابی (فقط مدیر، مدیر ناوگان و تعمیرات)
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE'),
  breakdownController.updateStatus.bind(breakdownController)
);

// ثبت تعمیر و بستن خرابی (فقط مدیر، مدیر ناوگان و تعمیرات)
router.post(
  '/:id/complete',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE'),
  breakdownController.completeRepair.bind(breakdownController)
);

// حذف خرابی (فقط مدیر کل)
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  breakdownController.delete.bind(breakdownController)
);

export default router;
