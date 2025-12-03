# 🚛 Backend - سیستم مدیریت ناوگان کامیون

Backend این سیستم با استفاده از Node.js، Express، TypeScript و Prisma ساخته شده است.

## 🛠️ نصب و راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- PostgreSQL 14+
- npm یا yarn

### مراحل نصب

1. **نصب پکیج‌ها:**
```bash
cd backend
npm install
```

2. **پیکربندی دیتابیس:**
- یک دیتابیس PostgreSQL ایجاد کنید
- فایل `.env` را ویرایش کنید و `DATABASE_URL` را تنظیم کنید

3. **اجرای Migration:**
```bash
npm run prisma:migrate
```

4. **اجرای Seed Data (داده‌های اولیه):**
```bash
npm run seed
```

5. **اجرای سرور:**
```bash
# Development mode با hot reload
npm run dev

# Production mode
npm run build
npm start
```

## 🔑 اطلاعات ورود پیش‌فرض

بعد از اجرای seed، می‌توانید با این اطلاعات وارد شوید:

- **نام کاربری:** `admin`
- **رمز عبور:** `admin123`

## 📁 ساختار پروژه

```
backend/
├── prisma/
│   ├── schema.prisma      # Schema دیتابیس
│   └── seed.ts            # داده‌های اولیه
├── src/
│   ├── config/            # پیکربندی‌ها
│   ├── controllers/       # Controller‌ها
│   ├── middlewares/       # Middleware‌ها
│   ├── routes/            # Route‌ها
│   ├── services/          # Business Logic
│   ├── utils/             # توابع کمکی
│   └── server.ts          # Entry point
├── .env                   # متغیرهای محیطی
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - ورود به سیستم
- `POST /api/auth/logout` - خروج از سیستم
- `POST /api/auth/refresh` - تازه‌سازی توکن
- `POST /api/auth/change-password` - تغییر رمز عبور
- `GET /api/auth/me` - دریافت اطلاعات کاربر فعلی

### Health Check
- `GET /health` - بررسی وضعیت سرور

## 🗄️ دیتابیس

این پروژه از PostgreSQL و Prisma ORM استفاده می‌کند.

### دستورات Prisma مفید:
```bash
# ایجاد migration جدید
npx prisma migrate dev --name migration-name

# اعمال migration‌ها در production
npx prisma migrate deploy

# بازسازی Prisma Client
npx prisma generate

# باز کردن Prisma Studio (رابط گرافیکی)
npx prisma studio
```

## 🔐 امنیت

- احراز هویت با JWT و Refresh Token
- رمزهای عبور با bcrypt هش می‌شوند
- CORS فعال است
- Role-Based Access Control (RBAC)

## 📝 متغیرهای محیطی (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fleet_management"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d
WHATSAPP_API_KEY=your-whatsapp-api-key
OPENAI_API_KEY=your-openai-api-key
```

## 🧪 تست

(در حال توسعه)

## 📦 دیپلوی

(در حال توسعه)

## 🤝 مشارکت

این پروژه توسط Claude AI ساخته شده است.

## 📄 لایسنس

MIT
