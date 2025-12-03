# 🚛 سیستم جامع مدیریت ناوگان کامیون

یک سیستم کامل برای مدیریت ناوگان کامیون با قابلیت‌های پیشرفته شامل مدیریت خرابی‌ها، سرویس‌های دوره‌ای، بازدیدها، سوخت، و چت‌بات هوش مصنوعی.

## ✨ ویژگی‌ها

### 🔧 مدیریت خرابی‌ها
- ثبت و پیگیری خرابی‌های کامیون
- دسته‌بندی بر اساس شدت (بحرانی، زیاد، متوسط، کم)
- مدیریت تعمیرات (درون‌سپاری / برون‌سپاری)
- ثبت هزینه‌ها و قطعات مصرفی
- آپلود تصاویر و مدارک

### 🔄 سرویس‌های دوره‌ای
- 18 نوع سرویس از پیش تعریف شده (بیمه، تعویض روغن، معاینه فنی، ...)
- برنامه‌ریزی بر اساس تاریخ و/یا کیلومتر
- هشدارهای خودکار قبل از سررسید
- تقویم سرویس‌ها
- محاسبه خودکار سرویس بعدی

### 🔍 بازدیدهای دوره‌ای
- بازدید هفتگی و ماهیانه
- چک‌لیست جامع 30 آیتمی
- امتیازدهی خودکار
- ثبت اقدامات اصلاحی
- تاریخچه کامل بازدیدها

### ⛽ مدیریت سوخت
- ثبت موجودی روزانه
- محاسبه خودکار مصرف
- تشخیص مصرف غیرعادی
- سوخت‌گیری (کارت سوخت / جابجایی)
- تحلیل دوره‌ای مصرف
- مدیریت کارت سوخت

### 🚚 مدیریت ناوگان
- مدیریت کامیون‌ها و رانندگان
- تاریخچه تخصیص
- امتیازدهی رانندگان
- QR Code برای هر کامیون
- پروفایل کامل هر وسیله

### 🤖 چت‌بات هوشمند
- تحلیل داده‌ها با OpenAI GPT-4
- پاسخ به سوالات
- پیش‌بینی و توصیه
- گزارش‌گیری هوشمند

### 🔔 سیستم اعلانات
- اعلانات درون‌برنامه‌ای
- ارسال خودکار به واتساپ
- هشدارهای خودکار (سرویس، بازدید، خرابی، سوخت)
- Cron Jobs برای بررسی‌های دوره‌ای

### 📊 داشبورد و گزارش‌ها
- نمودارهای تحلیلی
- KPI‌های کلیدی
- گزارش‌های قابل دانلود (PDF, Excel)
- مقایسه دوره‌ای

### 👥 مدیریت کاربران
- 5 نقش کاربری (مدیر کل، مدیر ناوگان، تعمیرات، کارشناس، راننده)
- کنترل دسترسی مبتنی بر نقش (RBAC)
- لاگ فعالیت‌ها
- PWA برای رانندگان

## 🛠️ تکنولوژی‌ها

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- OpenAI API
- WhatsApp Business API

### Frontend (در حال توسعه)
- React 18 + TypeScript
- Material-UI / Ant Design (RTL)
- Redux Toolkit
- Recharts
- PWA Support

## 📁 ساختار پروژه

```
.
├── backend/           # Backend API
│   ├── prisma/        # Database schema & migrations
│   └── src/           # Source code
└── frontend/          # Frontend application (در حال توسعه)
```

## 🚀 شروع سریع

### Backend

```bash
cd backend
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

**اطلاعات ورود پیش‌فرض:**
- نام کاربری: `admin`
- رمز عبور: `admin123`

سرور در آدرس `http://localhost:5000` اجرا می‌شود.

برای جزئیات بیشتر، فایل `backend/README.md` را مطالعه کنید.

## 📖 مستندات API

پس از اجرای سرور، می‌توانید از Postman یا Insomnia برای تست API استفاده کنید.

### Authentication
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

## 🔑 متغیرهای محیطی

فایل `.env` را در پوشه backend با این اطلاعات پر کنید:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fleet_management"
JWT_SECRET=your-secret-key
WHATSAPP_API_KEY=your-api-key
OPENAI_API_KEY=your-openai-key
```

## 📊 دیتابیس

این سیستم از PostgreSQL استفاده می‌کند و شامل این جداول است:

- Users (کاربران)
- Trucks (کامیون‌ها)
- Drivers (رانندگان)
- Breakdowns (خرابی‌ها)
- Services (سرویس‌ها)
- ServiceTypes (انواع سرویس)
- Inspections (بازدیدها)
- FuelRecords (رکوردهای سوخت)
- Notifications (اعلانات)
- و 15 جدول دیگر...

## 🎯 Roadmap

- [x] Backend setup و authentication
- [x] Prisma schema و seed data
- [ ] API endpoints برای تمام ماژول‌ها
- [ ] WhatsApp integration
- [ ] OpenAI chatbot
- [ ] Frontend با React
- [ ] PWA برای موبایل
- [ ] Docker deployment
- [ ] تست‌های واحد

## 👨‍💻 توسعه‌دهنده

این پروژه توسط Claude AI ساخته شده است.

## 📄 لایسنس

MIT

---

**نسخه:** 1.0.0
**آخرین به‌روزرسانی:** 2025
