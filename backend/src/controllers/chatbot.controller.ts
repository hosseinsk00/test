import { Request, Response } from 'express';
import openaiService from '../services/openai.service';
import prisma from '../config/database';

export class ChatbotController {
  /**
   * ارسال سوال به چت‌بات
   */
  async ask(req: Request, res: Response) {
    try {
      const { question } = req.body;

      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'سوال نمی‌تواند خالی باشد',
        });
      }

      const response = await openaiService.askQuestion(question, req.user!.userId);

      res.json({
        success: true,
        data: {
          question,
          answer: response,
        },
      });
    } catch (error: any) {
      console.error('خطا در ask chatbot:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'خطای سرور',
      });
    }
  }

  /**
   * دریافت تاریخچه چت کاربر
   */
  async getHistory(req: Request, res: Response) {
    try {
      const { page = '1', limit = '20' } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [history, total] = await Promise.all([
        prisma.chatHistory.findMany({
          where: { userId: req.user!.userId },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.chatHistory.count({
          where: { userId: req.user!.userId },
        }),
      ]);

      res.json({
        success: true,
        data: history,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error('خطا در getHistory:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  /**
   * حذف تاریخچه چت
   */
  async clearHistory(req: Request, res: Response) {
    try {
      const result = await prisma.chatHistory.deleteMany({
        where: { userId: req.user!.userId },
      });

      res.json({
        success: true,
        message: `${result.count} پیام حذف شد`,
      });
    } catch (error) {
      console.error('خطا در clearHistory:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }

  /**
   * تحلیل داده‌ها با هوش مصنوعی
   */
  async analyze(req: Request, res: Response) {
    try {
      const { dataType, filters } = req.body;

      if (!dataType) {
        return res.status(400).json({
          success: false,
          message: 'نوع داده الزامی است',
        });
      }

      const validTypes = ['fuel', 'breakdowns', 'services', 'performance'];
      if (!validTypes.includes(dataType)) {
        return res.status(400).json({
          success: false,
          message: 'نوع داده نامعتبر است',
        });
      }

      const analysis = await openaiService.analyzeData(dataType, filters || {});

      // ذخیره تحلیل در تاریخچه
      await prisma.chatHistory.create({
        data: {
          userId: req.user!.userId,
          userMessage: `تحلیل ${dataType}`,
          botResponse: analysis,
        },
      });

      res.json({
        success: true,
        data: {
          dataType,
          analysis,
        },
      });
    } catch (error: any) {
      console.error('خطا در analyze:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'خطای سرور',
      });
    }
  }

  /**
   * پیشنهادات سریع
   */
  async quickSuggestions(req: Request, res: Response) {
    try {
      const suggestions = [
        'وضعیت کلی ناوگان چطور است؟',
        'کدام کامیون بیشترین خرابی را داشته؟',
        'میانگین مصرف سوخت ناوگان چقدر است؟',
        'چند سرویس سررسید گذشته داریم؟',
        'کامیون‌های نیازمند بازدید کدامند؟',
        'هزینه کل تعمیرات در ماه گذشته چقدر بوده؟',
        'بهترین راننده از نظر عملکرد کیست؟',
        'پیشنهاداتی برای کاهش مصرف سوخت بده',
      ];

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      console.error('خطا در quickSuggestions:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور',
      });
    }
  }
}
