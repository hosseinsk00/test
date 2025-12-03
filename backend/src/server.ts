import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import truckRoutes from './routes/truck.routes';
import driverRoutes from './routes/driver.routes';
import breakdownRoutes from './routes/breakdown.routes';
import serviceRoutes from './routes/service.routes';
import inspectionRoutes from './routes/inspection.routes';
import fuelRoutes from './routes/fuel.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';
import chatbotRoutes from './routes/chatbot.routes';
import { errorHandler } from './middlewares/errorHandler';
import cronService from './services/cron.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'سرور در حال اجرا است',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/breakdowns', breakdownRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'مسیر یافت نشد',
  });
});

// Error Handler (باید آخرین middleware باشد)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 سرور در حال اجرا است`);
  console.log(`📍 آدرس: http://localhost:${PORT}`);
  console.log(`🌍 محیط: ${process.env.NODE_ENV || 'development'}\n`);

  // شروع Cron Jobs
  cronService.startAllJobs();
});

export default app;
