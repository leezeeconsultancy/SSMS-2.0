import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Database Connection Middleware
 * Ensures that the MongoDB connection is active before processing the request.
 * Returns a 503 (Service Unavailable) if the database is disconnected.
 */
export const checkDBConnection = (req: Request, res: Response, next: NextFunction) => {
  const isConnected = mongoose.connection.readyState === 1; // 1 = connected
  
  if (!isConnected) {
    console.warn(`[DB WARNING] Attempting to access ${req.originalUrl} while database is DISCONNECTED.`);
    return res.status(503).json({
      status: 'error',
      code: 'DB_CONNECTION_ERROR',
      message: 'Database connection failed. Please contact support or restart the server.',
      timestamp: new Date().toISOString()
    });
  }
  
  return next();
};
