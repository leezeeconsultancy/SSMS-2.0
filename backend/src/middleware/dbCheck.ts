import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import { connectDB } from '../config/db';

/**
 * Helper to wait for a given number of milliseconds.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Database Connection Middleware
 * Ensures that the MongoDB connection is active before processing the request.
 * Handles Serverless Cold Starts by awaiting connectDB() if needed.
 * 
 * Includes retry logic for MongoDB Atlas free tier which can take time to wake up.
 * Shows user-friendly messages instead of scary error messages.
 */
export const checkDBConnection = async (req: Request, res: Response, next: NextFunction) => {
  // If already connected, proceed instantly
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  
  console.log(`[DB] Connection state is ${mongoose.connection.readyState}. Awaiting connection for serverless cold start...`);
  
  // Retry up to 2 times with a short delay — free tier MongoDB may need extra time
  const MAX_MIDDLEWARE_RETRIES = 2;
  
  for (let attempt = 1; attempt <= MAX_MIDDLEWARE_RETRIES; attempt++) {
    // Await the asynchronous database connection (needed for Vercel/Serverless)
    await connectDB();
    
    if ((mongoose.connection.readyState as number) === 1) {
      console.log(`[DB] ✅ Connection established on middleware attempt ${attempt}`);
      return next();
    }
    
    if (attempt < MAX_MIDDLEWARE_RETRIES) {
      console.log(`[DB] ⏳ Middleware retry ${attempt}/${MAX_MIDDLEWARE_RETRIES}, waiting 3s...`);
      await delay(3000);
    }
  }

  console.warn(`[DB WARNING] Attempting to access ${req.originalUrl} while database is DISCONNECTED.`);
  return res.status(503).json({
    status: 'error',
    code: 'DB_CONNECTION_ERROR',
    message: 'Service is waking up — please wait a moment and try again. Free-tier databases may take a few seconds to start.',
    retryable: true,
    timestamp: new Date().toISOString()
  });
};
