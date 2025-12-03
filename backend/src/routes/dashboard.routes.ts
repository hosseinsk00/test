import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// همه route‌های داشبورد فقط برای نقش‌های مدیریتی
router.use(authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'));

// نمای کلی داشبورد
router.get('/overview', dashboardController.getOverview.bind(dashboardController));

// آمار روزانه برای نمودارها
router.get('/daily-stats', dashboardController.getDailyStats.bind(dashboardController));

// فعالیت‌های اخیر
router.get('/recent-activities', dashboardController.getRecentActivities.bind(dashboardController));

// وظایف آتی
router.get('/upcoming-tasks', dashboardController.getUpcomingTasks.bind(dashboardController));

// عملکرد کامیون‌ها
router.get('/truck-performance', dashboardController.getTruckPerformance.bind(dashboardController));

// هشدارها و اعلان‌های مهم
router.get('/alerts', dashboardController.getAlerts.bind(dashboardController));

export default router;
