import axios from 'axios';
import prisma from '../config/database';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class OpenAIService {
  private apiKey: string;
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions';
  private model: string = 'gpt-4';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  OPENAI_API_KEY یافت نشد. چت‌بات غیرفعال است.');
    }
  }

  /**
   * ارسال درخواست به OpenAI API
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('کلید API OpenAI تنظیم نشده است');
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('خطا در ارتباط با OpenAI:', error.response?.data || error.message);
      throw new Error('خطا در ارتباط با سرویس هوش مصنوعی');
    }
  }

  /**
   * دریافت داده‌های ناوگان برای Context
   */
  async getFleetContext(): Promise<string> {
    try {
      // آمار کلی
      const [
        totalTrucks,
        activeTrucks,
        totalDrivers,
        activeBreakdowns,
        overdueServices,
      ] = await Promise.all([
        prisma.truck.count({ where: { deletedAt: null } }),
        prisma.truck.count({ where: { status: 'ACTIVE', deletedAt: null } }),
        prisma.driver.count(),
        prisma.breakdown.count({
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
          },
        }),
        prisma.service.count({
          where: {
            status: 'SCHEDULED',
            scheduledDate: { lt: new Date() },
          },
        }),
      ]);

      // آمار 30 روز اخیر
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [recentBreakdowns, recentServices, fuelStats] = await Promise.all([
        prisma.breakdown.count({
          where: { occurredDate: { gte: thirtyDaysAgo } },
        }),
        prisma.service.count({
          where: {
            status: 'COMPLETED',
            performedDate: { gte: thirtyDaysAgo },
          },
        }),
        prisma.fuelRecord.aggregate({
          where: { recordDate: { gte: thirtyDaysAgo } },
          _sum: { consumptionLiters: true, distance: true },
          _avg: { consumptionPerKm: true },
        }),
      ]);

      const context = `
اطلاعات فعلی ناوگان کامیون:

آمار کلی:
- تعداد کل کامیون‌ها: ${totalTrucks}
- کامیون‌های فعال: ${activeTrucks}
- تعداد رانندگان: ${totalDrivers}
- خرابی‌های فعال: ${activeBreakdowns}
- سرویس‌های سررسید گذشته: ${overdueServices}

آمار 30 روز اخیر:
- تعداد خرابی‌ها: ${recentBreakdowns}
- سرویس‌های انجام شده: ${recentServices}
- مجموع مصرف سوخت: ${fuelStats._sum.consumptionLiters || 0} لیتر
- مجموع مسافت طی شده: ${fuelStats._sum.distance || 0} کیلومتر
- میانگین مصرف سوخت: ${fuelStats._avg.consumptionPerKm?.toFixed(4) || 0} لیتر/کیلومتر
`;

      return context;
    } catch (error) {
      console.error('خطا در دریافت context ناوگان:', error);
      return 'اطلاعات ناوگان در دسترس نیست';
    }
  }

  /**
   * پردازش سوال کاربر با Context ناوگان
   */
  async askQuestion(question: string, userId: number): Promise<string> {
    try {
      // دریافت context ناوگان
      const fleetContext = await this.getFleetContext();

      // دریافت تاریخچه چت کاربر (5 پیام آخر)
      const chatHistory = await prisma.chatHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // ساخت لیست پیام‌ها
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `شما یک دستیار هوشمند برای سیستم مدیریت ناوگان کامیون هستید.
وظیفه شما پاسخ به سوالات کاربران درباره وضعیت ناوگان، تحلیل داده‌ها و ارائه پیشنهادات است.
همیشه به زبان فارسی پاسخ دهید و از اطلاعات زیر برای پاسخ‌های دقیق استفاده کنید:

${fleetContext}

در پاسخ‌های خود:
- دقیق و مبتنی بر داده باشید
- پیشنهادات عملی ارائه دهید
- از زبان ساده و قابل فهم استفاده کنید
- در صورت نیاز، هشدارهای مهم را برجسته کنید`,
        },
      ];

      // افزودن تاریخچه به ترتیب معکوس
      chatHistory.reverse().forEach((chat) => {
        messages.push({
          role: 'user',
          content: chat.userMessage,
        });
        messages.push({
          role: 'assistant',
          content: chat.botResponse,
        });
      });

      // افزودن سوال جدید
      messages.push({
        role: 'user',
        content: question,
      });

      // دریافت پاسخ از OpenAI
      const response = await this.chat(messages);

      // ذخیره در تاریخچه
      await prisma.chatHistory.create({
        data: {
          userId,
          userMessage: question,
          botResponse: response,
        },
      });

      return response;
    } catch (error: any) {
      console.error('خطا در askQuestion:', error);
      throw error;
    }
  }

  /**
   * تحلیل داده‌های خاص
   */
  async analyzeData(
    dataType: 'fuel' | 'breakdowns' | 'services' | 'performance',
    filters: any
  ): Promise<string> {
    try {
      let data = '';
      let analysisPrompt = '';

      switch (dataType) {
        case 'fuel':
          const fuelData = await this.getFuelAnalysisData(filters);
          data = fuelData;
          analysisPrompt = 'تحلیل جامعی از مصرف سوخت ناوگان ارائه کن و پیشنهاداتی برای بهبود ارائه بده.';
          break;

        case 'breakdowns':
          const breakdownData = await this.getBreakdownAnalysisData(filters);
          data = breakdownData;
          analysisPrompt = 'تحلیل کامل خرابی‌های ناوگان را انجام بده و راهکارهای پیشگیرانه پیشنهاد بده.';
          break;

        case 'services':
          const serviceData = await this.getServiceAnalysisData(filters);
          data = serviceData;
          analysisPrompt = 'وضعیت سرویس‌های دوره‌ای را تحلیل کن و برنامه بهینه پیشنهاد بده.';
          break;

        case 'performance':
          const performanceData = await this.getPerformanceAnalysisData(filters);
          data = performanceData;
          analysisPrompt = 'عملکرد کلی ناوگان را ارزیابی کن و نقاط قوت و ضعف را مشخص کن.';
          break;
      }

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: 'شما یک تحلیلگر داده متخصص در حوزه مدیریت ناوگان هستید. تحلیل‌های شما باید دقیق، کاربردی و به زبان فارسی باشد.',
        },
        {
          role: 'user',
          content: `${analysisPrompt}\n\nداده‌ها:\n${data}`,
        },
      ];

      return await this.chat(messages);
    } catch (error) {
      console.error('خطا در analyzeData:', error);
      throw new Error('خطا در تحلیل داده‌ها');
    }
  }

  /**
   * دریافت داده‌های تحلیل سوخت
   */
  private async getFuelAnalysisData(filters: any): Promise<string> {
    const fuelRecords = await prisma.fuelRecord.findMany({
      where: filters,
      include: {
        truck: {
          select: { plateNumber: true, model: true, expectedFuelConsumption: true },
        },
      },
      orderBy: { recordDate: 'desc' },
      take: 100,
    });

    let data = 'داده‌های مصرف سوخت:\n\n';
    fuelRecords.forEach((record) => {
      data += `کامیون ${record.truck.plateNumber}: ${record.consumptionLiters} لیتر در ${record.distance} کیلومتر (${record.consumptionPerKm.toFixed(4)} لیتر/کیلومتر)\n`;
    });

    return data;
  }

  /**
   * دریافت داده‌های تحلیل خرابی
   */
  private async getBreakdownAnalysisData(filters: any): Promise<string> {
    const breakdowns = await prisma.breakdown.findMany({
      where: filters,
      include: {
        truck: {
          select: { plateNumber: true, model: true },
        },
      },
      orderBy: { occurredDate: 'desc' },
      take: 100,
    });

    let data = 'داده‌های خرابی:\n\n';
    breakdowns.forEach((breakdown) => {
      data += `کامیون ${breakdown.truck.plateNumber}: ${breakdown.description} (${breakdown.severity}, ${breakdown.status})\n`;
    });

    return data;
  }

  /**
   * دریافت داده‌های تحلیل سرویس
   */
  private async getServiceAnalysisData(filters: any): Promise<string> {
    const services = await prisma.service.findMany({
      where: filters,
      include: {
        truck: {
          select: { plateNumber: true },
        },
        serviceType: {
          select: { name: true },
        },
      },
      orderBy: { scheduledDate: 'desc' },
      take: 100,
    });

    let data = 'داده‌های سرویس:\n\n';
    services.forEach((service) => {
      data += `کامیون ${service.truck.plateNumber}: ${service.serviceType.name} (${service.status})\n`;
    });

    return data;
  }

  /**
   * دریافت داده‌های تحلیل عملکرد
   */
  private async getPerformanceAnalysisData(filters: any): Promise<string> {
    const fleetContext = await this.getFleetContext();
    return fleetContext;
  }
}

export default new OpenAIService();
