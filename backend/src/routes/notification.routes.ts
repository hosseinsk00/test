import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// دریافت تعداد اعلان‌های خوانده نشده
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

// علامت‌گذاری همه به عنوان خوانده شده
router.post('/mark-all-read', notificationController.markAllAsRead.bind(notificationController));

// حذف همه اعلان‌های خوانده شده
router.delete('/read', notificationController.deleteAllRead.bind(notificationController));

// علامت‌گذاری یک اعلان به عنوان خوانده شده
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

// دریافت لیست اعلان‌ها
router.get('/', notificationController.getAll.bind(notificationController));

// دریافت جزئیات یک اعلان
router.get('/:id', notificationController.getById.bind(notificationController));

// حذف یک اعلان
router.delete('/:id', notificationController.delete.bind(notificationController));

export default router;
