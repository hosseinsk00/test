import axios from 'axios';
import FormData from 'form-data';
import prisma from '../config/database';

const WHATSAPP_API_BASE = process.env.WHATSAPP_API_BASE || 'https://api.whatsiplus.com';
const API_KEY = process.env.WHATSAPP_API_KEY || 'jvbg3nw-g5yolcg-y4266kq-hzlll9g-gt1qq4w';

interface SendMessageOptions {
  phoneNumber?: string;
  groupId?: string;
  message: string;
  schedule?: number;
  link?: string;
  file?: Buffer;
  base64File?: string;
}

class WhatsAppService {
  /**
   * ارسال پیام به شماره خصوصی (POST)
   */
  async sendMessage(options: SendMessageOptions): Promise<any> {
    const formData = new FormData();

    if (options.phoneNumber) {
      formData.append('phonenumber', options.phoneNumber);
    }
    formData.append('message', options.message);

    if (options.schedule) {
      formData.append('schedule', options.schedule.toString());
    }

    if (options.link) {
      formData.append('link', options.link);
    }

    if (options.file) {
      formData.append('file', options.file, 'attachment');
    }

    if (options.base64File) {
      formData.append('base64_file', options.base64File);
    }

    try {
      const response = await axios.post(
        `${WHATSAPP_API_BASE}/sendMsg/${API_KEY}`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('WhatsApp Send Message Error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * ارسال پیام به شماره خصوصی (GET - ساده‌تر)
   */
  async sendMessageSimple(phoneNumber: string, message: string, link?: string): Promise<any> {
    try {
      const params: any = {
        phonenumber: phoneNumber,
        message: message,
      };

      if (link) {
        params.link = link;
      }

      const response = await axios.get(`${WHATSAPP_API_BASE}/sendMsg/${API_KEY}`, { params });

      return response.data;
    } catch (error: any) {
      console.error('WhatsApp Send Simple Error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * ارسال پیام به گروه
   */
  async sendGroupMessage(options: Omit<SendMessageOptions, 'phoneNumber'>): Promise<any> {
    const formData = new FormData();

    if (!options.groupId) {
      throw new Error('Group ID is required');
    }

    formData.append('groupId', options.groupId);
    formData.append('message', options.message);

    if (options.link) {
      formData.append('link', options.link);
    }

    if (options.file) {
      formData.append('file', options.file, 'attachment');
    }

    if (options.base64File) {
      formData.append('base64_file', options.base64File);
    }

    try {
      const response = await axios.post(
        `${WHATSAPP_API_BASE}/sendGroup/${API_KEY}`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('WhatsApp Send Group Message Error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp group message: ${error.message}`);
    }
  }

  /**
   * ارسال هشدار به گروه‌های مدیریتی
   */
  async sendAlertToManagement(message: string, link?: string): Promise<void> {
    const groupIds = await this.getWhatsAppGroupIds();

    const promises = groupIds.map((groupId) =>
      this.sendGroupMessage({ groupId, message, link })
    );

    await Promise.all(promises);
  }

  /**
   * دریافت لیست گروه‌های واتساپ از تنظیمات
   */
  private async getWhatsAppGroupIds(): Promise<string[]> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'whatsapp_group_ids' },
      });

      if (setting) {
        return JSON.parse(setting.settingValue);
      }

      return ['120363292564959780']; // مقدار پیش‌فرض
    } catch (error) {
      console.error('خطا در دریافت Group IDs:', error);
      return ['120363292564959780'];
    }
  }

  /**
   * فرمت کردن پیام برای اعلانات سرویس
   */
  formatServiceAlert(truck: any, service: any, daysRemaining: number): string {
    return `🚛 *هشدار سرویس*

کامیون: ${truck.plateNumber}
سرویس: ${service.serviceType?.name || 'نامشخص'}
سررسید: ${service.scheduledDate ? new Date(service.scheduledDate).toLocaleDateString('fa-IR') : '-'} (${daysRemaining} روز دیگر)
کیلومتر برنامه: ${service.scheduledKilometer?.toLocaleString('fa-IR') || '-'}

لطفاً اقدامات لازم را انجام دهید.`;
  }

  /**
   * فرمت کردن پیام برای خرابی بحرانی
   */
  formatBreakdownAlert(truck: any, breakdown: any): string {
    return `🚨 *خرابی بحرانی*

کامیون: ${truck.plateNumber}
نوع: ${breakdown.breakdownType}
شدت: بحرانی 🔴

تاریخ: ${new Date(breakdown.occurredDate).toLocaleDateString('fa-IR')}
کیلومتر: ${breakdown.occurredKilometer.toLocaleString('fa-IR')}
مکان: ${breakdown.locationAddress || '-'}

لطفاً فوراً اقدام کنید!`;
  }

  /**
   * فرمت کردن پیام برای بازدید سررسید
   */
  formatInspectionDueAlert(truck: any, inspectionType: string, daysOverdue: number): string {
    return `⚠️ *هشدار بازدید*

کامیون: ${truck.plateNumber}
نوع بازدید: ${inspectionType}
وضعیت: ${daysOverdue} روز تأخیر ⏰

لطفاً در اسرع وقت بازدید انجام شود.`;
  }

  /**
   * فرمت کردن پیام برای مصرف سوخت غیرعادی
   */
  formatFuelAbnormalAlert(truck: any, difference: number): string {
    return `⛽ *هشدار مصرف سوخت*

کامیون: ${truck.plateNumber}
اختلاف مصرف: ${difference.toFixed(1)} لیتر 🔴

مصرف سوخت بیش از حد مجاز است.
لطفاً بررسی شود.`;
  }
}

export default new WhatsAppService();
