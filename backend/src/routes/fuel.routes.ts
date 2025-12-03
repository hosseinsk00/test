import { Router } from 'express';
import { FuelController } from '../controllers/fuel.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const fuelController = new FuelController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// دریافت آمار کلی سوخت (همه نقش‌ها به جز راننده)
router.get(
  '/stats',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  fuelController.getStats.bind(fuelController)
);

// شناسایی مصرف‌های غیرعادی (فقط مدیر و مدیر ناوگان)
router.get(
  '/anomalies',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER'),
  fuelController.detectAnomalies.bind(fuelController)
);

// تحلیل مصرف سوخت یک کامیون (همه نقش‌ها به جز راننده)
router.get(
  '/analysis',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  fuelController.getConsumptionAnalysis.bind(fuelController)
);

// دریافت لیست کارت‌های سوخت (همه نقش‌ها)
router.get('/cards', fuelController.getFuelCards.bind(fuelController));

// دریافت لیست سوخت‌گیری‌ها (همه نقش‌ها)
router.get('/refills', fuelController.getRefills.bind(fuelController));

// ثبت سوخت‌گیری جدید (همه نقش‌ها)
router.post('/refills', fuelController.createRefill.bind(fuelController));

// دریافت لیست رکوردهای مصرف (همه نقش‌ها)
router.get('/', fuelController.getAll.bind(fuelController));

// دریافت جزئیات یک رکورد (همه نقش‌ها)
router.get('/:id', fuelController.getById.bind(fuelController));

// ثبت رکورد مصرف جدید (همه نقش‌ها)
router.post('/', fuelController.create.bind(fuelController));

export default router;
