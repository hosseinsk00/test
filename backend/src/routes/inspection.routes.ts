import { Router } from 'express';
import { InspectionController } from '../controllers/inspection.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const inspectionController = new InspectionController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// دریافت لیست انواع بازدید (همه نقش‌ها)
router.get('/types', inspectionController.getInspectionTypes.bind(inspectionController));

// دریافت کامیون‌های نیازمند بازدید (همه نقش‌ها به جز راننده)
router.get(
  '/due',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  inspectionController.getDueInspections.bind(inspectionController)
);

// دریافت آمار بازدیدها (همه نقش‌ها به جز راننده)
router.get(
  '/stats',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  inspectionController.getStats.bind(inspectionController)
);

// دریافت لیست بازدیدها (همه نقش‌ها)
router.get('/', inspectionController.getAll.bind(inspectionController));

// دریافت جزئیات یک بازدید (همه نقش‌ها)
router.get('/:id', inspectionController.getById.bind(inspectionController));

// ثبت بازدید جدید (همه نقش‌ها به جز راننده)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  inspectionController.create.bind(inspectionController)
);

// افزودن اقدامات اصلاحی (فقط مدیر، مدیر ناوگان و تعمیرات)
router.post(
  '/:id/corrective-actions',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE'),
  inspectionController.addCorrectiveActions.bind(inspectionController)
);

export default router;
