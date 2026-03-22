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
if (process.env.NODE_ENV !== 'production') {
  // Disable strict security headers in dev to prevent mobile access blocks
  // app.use(helmet()); 
} else {
  app.use(helmet());
}

app.use(cors({
  origin: function(origin, callback) {
    // In development, echo back whatever origin is requesting (crucial for mobile IP access)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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
import payoutRoutes from './routes/payoutRoutes';
import configRoutes from './routes/configRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/config', configRoutes);

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
