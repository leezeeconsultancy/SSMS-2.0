import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { startDailyQRCron } from './cron/dailyQRCron';

dotenv.config();

// Connect to Database, then start cron jobs
connectDB().then(() => {
  startDailyQRCron();
});

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', // Allow multiple local dev ports
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(url => {
      if (!url) return false;
      // Remove trailing slash for comparison
      const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      return origin === cleanUrl;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, we can still allow everything if needed, 
      // but for security it's best to be explicit
      callback(null, true); 
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';
import payrollRoutes from './routes/payrollRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import holidayRoutes from './routes/holidayRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/holidays', holidayRoutes);

// Basic Route for testing
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'API is healthy running SSMS' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = Number(process.env.PORT) || 5001;

// Only listen when running locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📱 Mobile access: http://192.168.0.104:${PORT}`);
  });
}

export default app;
