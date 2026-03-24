import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import { connectDB } from '../config/db';

/**
 * Database Connection Middleware
 * Ensures that the MongoDB connection is active before processing the request.
 * Handles Serverless Cold Starts by awaiting connectDB() if needed.
 */
export const checkDBConnection = async (req: Request, res: Response, next: NextFunction) => {
  // If already connected, proceed instantly
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  
  console.log(`[DB] Connection state is ${mongoose.connection.readyState}. Awaiting connection for serverless cold start...`);
  
  // Await the asynchronous database connection (needed for Vercel/Serverless)
  await connectDB();
  
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  console.warn(`[DB WARNING] Attempting to access ${req.originalUrl} while database is DISCONNECTED.`);
  return res.status(503).json({
    status: 'error',
    code: 'DB_CONNECTION_ERROR',
    message: 'Database connection failed. Please contact support or restart the server.',
    timestamp: new Date().toISOString()
  });
};
