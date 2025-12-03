import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 شروع Seeding...');

  // 1. ایجاد کاربر Admin پیش‌فرض
  console.log('📝 ایجاد کاربر Admin...');
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'مدیر سیستم',
      phone: '09123456789',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ کاربر Admin ایجاد شد:', admin.username);

  // 2. ایجاد 18 نوع سرویس پیش‌فرض
  console.log('📝 ایجاد انواع سرویس...');

  const serviceTypes = [
    {
      name: 'بیمه نامه-بدنه',
      nameEn: 'Body Insurance',
      description: 'بیمه بدنه کامیون',
      scheduleType: 'DATE_ONLY',
      intervalDays: 365,
      intervalKilometers: null,
      alertDaysBefore: 7,
      alertKmBefore: 0,
      displayOrder: 1,
    },
    {
      name: 'بیمه نامه-شخص ثالث',
      nameEn: 'Third Party Insurance',
      description: 'بیمه شخص ثالث',
      scheduleType: 'DATE_ONLY',
      intervalDays: 365,
      intervalKilometers: null,
      alertDaysBefore: 7,
      alertKmBefore: 0,
      displayOrder: 2,
    },
    {
      name: 'سرویس دوره‌ای-تعویض روغن',
      nameEn: 'Oil Change',
      description: 'تعویض روغن موتور',
      scheduleType: 'DATE_AND_KM',
      intervalDays: 90,
      intervalKilometers: 10000,
      alertDaysBefore: 7,
      alertKmBefore: 500,
      checklist: {
        items: [
          { id: 1, title: 'تعویض روغن موتور', required: true },
          { id: 2, title: 'تعویض فیلتر روغن', required: true },
          { id: 3, title: 'بررسی فشار روغن', required: true },
        ],
      },
      displayOrder: 3,
    },
    {
      name: 'سرویس دوره‌ای-گریسکاری کله و تانکر',
      nameEn: 'Head and Tank Greasing',
      description: 'گریسکاری کله کش و تانکر',
      scheduleType: 'DATE_AND_KM',
      intervalDays: 30,
      intervalKilometers: 5000,
      alertDaysBefore: 7,
      alertKmBefore: 500,
      displayOrder: 4,
    },
    {
      name: 'تعویض فیلتر هوا',
      nameEn: 'Air Filter Replacement',
      description: 'تعویض فیلتر هوا',
      scheduleType: 'DATE_AND_KM',
      intervalDays: 180,
      intervalKilometers: 20000,
      alertDaysBefore: 7,
      alertKmBefore: 500,
      displayOrder: 5,
    },
    {
      name: 'معاینه فنی',
      nameEn: 'Technical Inspection',
      description: 'معاینه فنی سالیانه',
      scheduleType: 'DATE_ONLY',
      intervalDays: 365,
      intervalKilometers: null,
      alertDaysBefore: 7,
      alertKmBefore: 0,
      displayOrder: 6,
    },
    {
      name: 'سرویس دوره‌ای-کارواش',
      nameEn: 'Car Wash',
      description: 'کارواش کامیون',
      scheduleType: 'DATE_ONLY',
      intervalDays: 7,
      intervalKilometers: null,
      alertDaysBefore: 1,
      alertKmBefore: 0,
      displayOrder: 7,
    },
    {
      name: 'سرویس دوره‌ای-گریسکاری ماشین',
      nameEn: 'Vehicle Greasing',
      description: 'گریسکاری کامل ماشین',
      scheduleType: 'DATE_AND_KM',
      intervalDays: 30,
      intervalKilometers: 5000,
      alertDaysBefore: 7,
      alertKmBefore: 500,
      displayOrder: 8,
    },
    {
      name: 'کپسول آتش‌نشانی',
      nameEn: 'Fire Extinguisher',
      description: 'تعویض یا شارژ کپسول آتش‌نشانی',
      scheduleType: 'DATE_ONLY',
      intervalDays: 365,
      intervalKilometers: null,
      alertDaysBefore: 30,
      alertKmBefore: 0,
      displayOrder: 9,
    },
    {
      name: 'سرویس دوره‌ای-دینام',
      nameEn: 'Alternator Service',
      description: 'سرویس دینام',
      scheduleType: 'DATE_AND_KM',
      intervalDays: 180,
      intervalKilometers: 30000,
      alertDaysBefore: 7,
      alertKmBefore: 500,
      displayOrder: 10,
    },
    {
      name: 'سرویس دوره‌ای-استارت',
      nameEn: 'Starter Service',
      description: 'سرویس استارت',
      scheduleType: 'DATE_AND_KM',
      intervalDays: 180,
      intervalKilometers: 30000,
      alertDaysBefore: 7,
      alertKmBefore: 500,
      displayOrder: 11,
    },
    {
      name: 'سرویس روغن گیربکس',
      nameEn: 'Gearbox Oil Service',
      description: 'تعویض روغن گیربکس',
      scheduleType: 'DATE_AND_KM',
      intervalDays: 365,
      intervalKilometers: 100000,
      alertDaysBefore: 30,
      alertKmBefore: 5000,
      displayOrder: 12,
    },
    {
      name: 'سرویس روغن دیفرانسیل',
      nameEn: 'Differential Oil Service',
      description: 'تعویض روغن دیفرانسیل',
      scheduleType: 'DATE_AND_KM',
      intervalDays: 365,
      intervalKilometers: 100000,
      alertDaysBefore: 30,
      alertKmBefore: 5000,
      displayOrder: 13,
    },
    {
      name: 'پروانه فعالیت',
      nameEn: 'Activity License',
      description: 'تمدید پروانه فعالیت',
      scheduleType: 'DATE_ONLY',
      intervalDays: 365,
      intervalKilometers: null,
      alertDaysBefore: 30,
      alertKmBefore: 0,
      displayOrder: 14,
    },
    {
      name: 'گیت پاس',
      nameEn: 'Gate Pass',
      description: 'تمدید گیت پاس',
      scheduleType: 'DATE_ONLY',
      intervalDays: 365,
      intervalKilometers: null,
      alertDaysBefore: 30,
      alertKmBefore: 0,
      displayOrder: 15,
    },
    {
      name: 'مدت قرارداد راننده',
      nameEn: 'Driver Contract',
      description: 'تمدید قرارداد راننده',
      scheduleType: 'DATE_ONLY',
      intervalDays: 365,
      intervalKilometers: null,
      alertDaysBefore: 30,
      alertKmBefore: 0,
      displayOrder: 16,
    },
  ];

  for (const serviceType of serviceTypes) {
    await prisma.serviceType.upsert({
      where: { name: serviceType.name },
      update: serviceType,
      create: serviceType,
    });
  }
  console.log(`✅ ${serviceTypes.length} نوع سرویس ایجاد شد`);

  // 3. ایجاد انواع بازدید
  console.log('📝 ایجاد انواع بازدید...');

  const weeklyInspectionChecklist = {
    sections: [
      {
        name: 'بررسی‌های عمومی',
        items: [
          { id: 1, title: 'فیلتر هواکش', score: 3, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 2, title: 'موجودی آب رادیاتور', score: 3, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 3, title: 'وضعیت ظاهری کامیون', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 4, title: 'وضعیت کابینت', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 5, title: 'وضعیت ظاهری تانکر', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 6, title: 'روغن موتور', score: 3, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 7, title: 'روغن هیدرولیک', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 8, title: 'روغن گیربکس', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 9, title: 'روغن دیفرانسیل', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 10, title: 'گریس‌کاری', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 11, title: 'باتری', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 12, title: 'فشار روغن ماشین', score: 3, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 13, title: 'درصد باد لاستیک‌ها', score: 3, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 14, title: 'خطای کیلومتر', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 15, title: 'موجودی سوخت', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 16, title: 'درصد ادبلو', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 17, title: 'توری باک', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 18, title: 'سیستم ترمز', score: 3, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 19, title: 'چراغ‌ها', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 20, title: 'سیستم سرمایشی', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 21, title: 'جک‌های بالابر تانکر', score: 3, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 22, title: 'سوپاپ‌ها و شیرها', score: 3, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 23, title: 'برف‌پاک‌کن', score: 1, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
          { id: 24, title: 'درب‌های بالای تانکر', score: 2, type: 'select', options: ['خوب', 'متوسط', 'ضعیف'] },
        ],
      },
      {
        name: 'لاستیک‌ها',
        items: [
          { id: 25, title: 'محور فرمان چپ', score: 2, type: 'tire_check' },
          { id: 26, title: 'محور فرمان راست', score: 2, type: 'tire_check' },
          { id: 27, title: 'محور دیفرانسیل بیرونی چپ', score: 2, type: 'tire_check' },
          { id: 28, title: 'محور دیفرانسیل بیرونی راست', score: 2, type: 'tire_check' },
          { id: 29, title: 'محور دیفرانسیل داخلی چپ', score: 2, type: 'tire_check' },
          { id: 30, title: 'محور دیفرانسیل داخلی راست', score: 2, type: 'tire_check' },
        ],
      },
    ],
  };

  await prisma.inspectionType.upsert({
    where: { name: 'بازدید هفتگی' },
    update: {},
    create: {
      name: 'بازدید هفتگی',
      frequency: 'WEEKLY',
      checklist: weeklyInspectionChecklist,
      maxScore: 100,
      passingScore: 70,
      isActive: true,
    },
  });

  await prisma.inspectionType.upsert({
    where: { name: 'بازدید ماهیانه' },
    update: {},
    create: {
      name: 'بازدید ماهیانه',
      frequency: 'MONTHLY',
      checklist: weeklyInspectionChecklist, // مشابه هفتگی برای نمونه
      maxScore: 100,
      passingScore: 70,
      isActive: true,
    },
  });

  console.log('✅ 2 نوع بازدید ایجاد شد');

  // 4. ایجاد تنظیمات سیستم پیش‌فرض
  console.log('📝 ایجاد تنظیمات سیستم...');

  const systemSettings = [
    {
      settingKey: 'fuel_standard_consumption',
      settingValue: '0.60',
      settingType: 'number',
      description: 'مصرف استاندارد سوخت (لیتر/کیلومتر)',
      isPublic: true,
    },
    {
      settingKey: 'fuel_abnormal_threshold',
      settingValue: '100',
      settingType: 'number',
      description: 'آستانه هشدار اختلاف سوخت (لیتر)',
      isPublic: true,
    },
    {
      settingKey: 'ai_api_url',
      settingValue: 'https://api.openai.com/v1/chat/completions',
      settingType: 'string',
      description: 'URL API هوش مصنوعی',
      isPublic: false,
    },
    {
      settingKey: 'ai_model',
      settingValue: 'gpt-4-turbo-preview',
      settingType: 'string',
      description: 'مدل هوش مصنوعی',
      isPublic: false,
    },
    {
      settingKey: 'whatsapp_api_url',
      settingValue: 'https://api.whatsiplus.com',
      settingType: 'string',
      description: 'URL API واتساپ',
      isPublic: false,
    },
    {
      settingKey: 'whatsapp_group_ids',
      settingValue: '["120363292564959780"]',
      settingType: 'json',
      description: 'آی‌دی گروه‌های واتساپ',
      isPublic: false,
    },
    {
      settingKey: 'backup_schedule',
      settingValue: 'weekly',
      settingType: 'string',
      description: 'برنامه پشتیبان‌گیری',
      isPublic: false,
    },
    {
      settingKey: 'service_alert_days',
      settingValue: '7,15,30',
      settingType: 'string',
      description: 'روزهای هشدار سرویس',
      isPublic: true,
    },
    {
      settingKey: 'inspection_weekly_interval',
      settingValue: '7',
      settingType: 'number',
      description: 'دوره بازدید هفتگی (روز)',
      isPublic: true,
    },
    {
      settingKey: 'inspection_monthly_interval',
      settingValue: '30',
      settingType: 'number',
      description: 'دوره بازدید ماهیانه (روز)',
      isPublic: true,
    },
    {
      settingKey: 'inspection_passing_score',
      settingValue: '70',
      settingType: 'number',
      description: 'حداقل امتیاز قبولی بازدید',
      isPublic: true,
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: setting,
      create: setting,
    });
  }
  console.log(`✅ ${systemSettings.length} تنظیم سیستم ایجاد شد`);

  // 5. ایجاد کارت سوخت نمونه
  console.log('📝 ایجاد کارت سوخت...');

  await prisma.fuelCard.upsert({
    where: { cardNumber: '1234-5678-9012-3456' },
    update: {},
    create: {
      cardNumber: '1234-5678-9012-3456',
      currentBalance: 50000000, // 50 میلیون ریال
      isActive: true,
    },
  });
  console.log('✅ کارت سوخت ایجاد شد');

  console.log('\n✅ Seeding با موفقیت انجام شد!');
  console.log('\n📌 اطلاعات ورود:');
  console.log('   نام کاربری: admin');
  console.log('   رمز عبور: admin123');
}

main()
  .catch((e) => {
    console.error('❌ خطا در Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
