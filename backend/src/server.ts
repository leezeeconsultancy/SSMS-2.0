import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { startDailyQRCron } from './cron/dailyQRCron';
import { initWarmupCron } from './cron/warmupCron';
import { checkDBConnection } from './middleware/dbCheck';

dotenv.config();

// ============================================================
// 🛡️ GLOBAL ERROR HANDLERS — Catch crashes before they kill the process
// ============================================================
process.on('uncaughtException', (error: Error) => {
  console.error('============================================================');
  console.error('💥 UNCAUGHT EXCEPTION — Server crashing!');
  console.error(`   Name:    ${error.name}`);
  console.error(`   Message: ${error.message}`);
  console.error(`   Stack:   ${error.stack}`);
  console.error('============================================================');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('============================================================');
  console.error('💥 UNHANDLED PROMISE REJECTION');
  if (reason instanceof Error) {
    console.error(`   Name:    ${reason.name}`);
    console.error(`   Message: ${reason.message}`);
    console.error(`   Stack:   ${reason.stack}`);
  } else {
    console.error(`   Reason:  ${JSON.stringify(reason)}`);
  }
  console.error('============================================================');
  // Don't exit — log it so Render shows the error
});

// ============================================================
// 🔍 DEPLOYMENT DIAGNOSTICS — Print everything at startup
// ============================================================
console.log('============================================================');
console.log('🔍 SSMS DEPLOYMENT DIAGNOSTICS');
console.log(`🕒 Timestamp:     ${new Date().toISOString()}`);
console.log(`🖥️  Node Version:  ${process.version}`);
console.log(`📦 Platform:      ${process.platform} (${process.arch})`);
console.log(`🔑 NODE_ENV:      ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`📡 PORT:          ${process.env.PORT || '5001 (default)'}`);
console.log('');
console.log('🔐 Environment Variable Check:');
console.log(`   MONGODB_URI:   ${process.env.MONGODB_URI ? '✅ PRESENT' : '❌ MISSING'}`);
console.log(`   JWT_SECRET:    ${process.env.JWT_SECRET ? '✅ PRESENT' : '❌ MISSING'}`);
console.log(`   FRONTEND_URL:  ${process.env.FRONTEND_URL ? '✅ PRESENT' : '⚠️  MISSING (optional)'}`);
console.log(`   REDIS_URL:     ${process.env.REDIS_URL ? '✅ PRESENT' : '⚠️  MISSING (optional)'}`);
console.log('============================================================');

const app = express();

// Middleware
if (process.env.NODE_ENV !== 'production') {
  // Disable strict security headers in dev to prevent mobile access blocks
  // app.use(helmet()); 
} else {
  app.use(helmet());
}

app.use(cors({
  origin: function (origin, callback) {
    // In development, echo back whatever origin is requesting (crucial for mobile IP access)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://ssms-2-0.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Basic Route for health check (Allowed without DB)
app.get('/api/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({
    status: 'API is running',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Global DB Connection middleware for all other /api routes
app.use('/api', checkDBConnection);

// Routes
console.log('[BOOT] Loading route modules...');
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authRoutes = require('./routes/authRoutes').default;
  app.use('/api/auth', authRoutes);
  console.log('[BOOT] ✅ authRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load authRoutes:', e instanceof Error ? e.message : e);
}

try {
  const employeeRoutes = require('./routes/employeeRoutes').default;
  app.use('/api/employees', employeeRoutes);
  console.log('[BOOT] ✅ employeeRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load employeeRoutes:', e instanceof Error ? e.message : e);
}

try {
  const attendanceRoutes = require('./routes/attendanceRoutes').default;
  app.use('/api/attendance', attendanceRoutes);
  console.log('[BOOT] ✅ attendanceRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load attendanceRoutes:', e instanceof Error ? e.message : e);
}

try {
  const leaveRoutes = require('./routes/leaveRoutes').default;
  app.use('/api/leaves', leaveRoutes);
  console.log('[BOOT] ✅ leaveRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load leaveRoutes:', e instanceof Error ? e.message : e);
}

try {
  const payrollRoutes = require('./routes/payrollRoutes').default;
  app.use('/api/payroll', payrollRoutes);
  console.log('[BOOT] ✅ payrollRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load payrollRoutes:', e instanceof Error ? e.message : e);
}

try {
  const analyticsRoutes = require('./routes/analyticsRoutes').default;
  app.use('/api/analytics', analyticsRoutes);
  console.log('[BOOT] ✅ analyticsRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load analyticsRoutes:', e instanceof Error ? e.message : e);
}

try {
  const holidayRoutes = require('./routes/holidayRoutes').default;
  app.use('/api/holidays', holidayRoutes);
  console.log('[BOOT] ✅ holidayRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load holidayRoutes:', e instanceof Error ? e.message : e);
}

try {
  const payoutRoutes = require('./routes/payoutRoutes').default;
  app.use('/api/payouts', payoutRoutes);
  console.log('[BOOT] ✅ payoutRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load payoutRoutes:', e instanceof Error ? e.message : e);
}

try {
  const configRoutes = require('./routes/configRoutes').default;
  app.use('/api/config', configRoutes);
  console.log('[BOOT] ✅ configRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load configRoutes:', e instanceof Error ? e.message : e);
}

try {
  const departmentRoutes = require('./routes/departmentRoutes').default;
  app.use('/api/departments', departmentRoutes);
  console.log('[BOOT] ✅ departmentRoutes loaded');
} catch (e: unknown) {
  console.error('[BOOT] ❌ Failed to load departmentRoutes:', e instanceof Error ? e.message : e);
}

console.log('[BOOT] Route loading complete.');

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[EXPRESS ERROR]', err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = Number(process.env.PORT) || 5001;

// ============================================================
// 🚀 SERVER STARTUP — Connect DB first, then listen
// ============================================================
const startServer = async () => {
  console.log('[BOOT] Connecting to MongoDB...');

  const dbConnected = await connectDB();

  if (dbConnected) {
    console.log('[BOOT] ✅ MongoDB connected successfully');
    // Start cron jobs only after DB is connected
    try {
      startDailyQRCron();
      initWarmupCron();
      console.log('[BOOT] ✅ Cron jobs started');
    } catch (cronError: unknown) {
      console.error('[BOOT] ⚠️ Cron job startup failed (non-fatal):', cronError instanceof Error ? cronError.message : cronError);
    }
  } else {
    console.error('[BOOT] ⚠️ MongoDB connection FAILED — server will start but DB routes will return 503');
  }

  // Start the Express HTTP server
  app.listen(PORT, '0.0.0.0', () => {
    console.log('============================================================');
    console.log(`🚀 SSMS Server LISTENING on port ${PORT}`);
    console.log(`✨ Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${dbConnected ? 'Connected' : 'DISCONNECTED'}`);
    console.log(`📅 Started: ${new Date().toISOString()}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📱 Local: http://localhost:${PORT}`);
    }
    console.log('============================================================');
  });
};

startServer().catch((error: Error) => {
  console.error('============================================================');
  console.error('💥 FATAL: Server startup failed!');
  console.error(`   Error: ${error.message}`);
  console.error(`   Stack: ${error.stack}`);
  console.error('============================================================');
  process.exit(1);
});

export default app;
