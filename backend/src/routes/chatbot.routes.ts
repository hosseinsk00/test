import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const chatbotController = new ChatbotController();

// همه route‌ها نیاز به احراز هویت دارند
router.use(authenticate);

// پیشنهادات سریع (همه نقش‌ها)
router.get('/suggestions', chatbotController.quickSuggestions.bind(chatbotController));

// تاریخچه چت (همه نقش‌ها)
router.get('/history', chatbotController.getHistory.bind(chatbotController));

// حذف تاریخچه (همه نقش‌ها)
router.delete('/history', chatbotController.clearHistory.bind(chatbotController));

// ارسال سوال (همه نقش‌ها)
router.post('/ask', chatbotController.ask.bind(chatbotController));

// تحلیل داده‌ها (فقط مدیران)
router.post(
  '/analyze',
  authorize('SUPER_ADMIN', 'FLEET_MANAGER', 'MAINTENANCE', 'NETWORK_EXPERT'),
  chatbotController.analyze.bind(chatbotController)
);

export default router;
