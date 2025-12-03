import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';

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
});

export default app;
