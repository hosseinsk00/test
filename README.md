# 🚛 سیستم مدیریت ناوگان کامیون

یک سیستم جامع و پیشرفته برای مدیریت ناوگان حمل و نقل با قابلیت‌های هوش مصنوعی

## 📋 فهرست مطالب
- [ویژگی‌ها](#ویژگیها)
- [تکنولوژی‌ها](#تکنولوژیها)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [API Documentation](#api-documentation)
- [اطلاعات دسترسی](#اطلاعات-دسترسی)

## ✨ ویژگی‌ها

### مدیریت ناوگان
- ✅ مدیریت کامل کامیون‌ها (قابل گسترش)
- ✅ مدیریت رانندگان با سیستم امتیازدهی
- ✅ پیگیری وضعیت لحظه‌ای کامیون‌ها
- ✅ تولید QR Code برای هر کامیون

### مدیریت خرابی‌ها
- ✅ ثبت و پیگیری خرابی‌ها با 4 سطح اولویت
- ✅ workflow کامل تعمیرات
- ✅ ثبت هزینه‌ها و قطعات مصرفی

### سرویس‌های دوره‌ای
- ✅ 16 نوع سرویس
- ✅ زمان‌بندی هوشمند بر اساس تاریخ و کیلومتر
- ✅ یادآوری خودکار سرویس‌های سررسید

### بازدیدها
- ✅ بازدیدهای هفتگی و ماهانه
- ✅ چک‌لیست 30 آیتمی
- ✅ سیستم امتیازدهی

### مدیریت سوخت
- ✅ تحلیل هوشمند مصرف
- ✅ شناسایی خودکار مصرف غیرعادی

### چت‌بات GPT-4
- ✅ پاسخ به سوالات درباره ناوگان
- ✅ تحلیل خودکار داده‌ها
- ✅ پیشنهادات بهینه‌سازی

## 🛠 تکنولوژی‌ها

### Backend
- Node.js 18+ + Express + TypeScript
- PostgreSQL 14+ + Prisma ORM
- JWT Authentication
- OpenAI GPT-4
- WhatsApp Business API

### Frontend
- React 18+ + TypeScript
- Material-UI
- Redux Toolkit
- React Query
- Jalali Calendar

## 🚀 نصب و راه‌اندازی

### Backend

\`\`\`bash
cd backend
npm install
cp .env.example .env
# ویرایش .env

npx prisma generate
npx prisma migrate dev
npx prisma db seed

npm run dev
\`\`\`

سرور: `http://localhost:5000`

### Frontend

\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

فرانت‌اند: `http://localhost:3000`

## 🔐 اطلاعات دسترسی

\`\`\`
نام کاربری: admin
رمز عبور: admin123
نقش: SUPER_ADMIN
\`\`\`

## 📡 API Endpoints

- `/api/auth` - احراز هویت
- `/api/trucks` - کامیون‌ها
- `/api/drivers` - رانندگان
- `/api/breakdowns` - خرابی‌ها
- `/api/services` - سرویس‌ها
- `/api/inspections` - بازدیدها
- `/api/fuel` - سوخت
- `/api/notifications` - اعلان‌ها
- `/api/dashboard` - داشبورد
- `/api/chatbot` - چت‌بات

مستندات کامل API در فایل backend/API.md

## 📝 License

MIT License

---

**نسخه**: 1.0.0
