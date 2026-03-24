import mongoose from 'mongoose';

/**
 * Connects to MongoDB with detailed deployment logging.
 * Returns true on success, false on failure.
 * Never throws — all errors are caught and logged.
 */
export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssms';
  
  // Log connection attempt (mask password for security)
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log(`[DB] Attempting connection to: ${maskedUri}`);
  console.log(`[DB] Mongoose version: ${mongoose.version}`);
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,  // 10s timeout instead of 30s default
      connectTimeoutMS: 10000,
    });
    
    console.log(`[DB] ✅ MongoDB Connected Successfully`);
    console.log(`[DB]    Host: ${conn.connection.host}`);
    console.log(`[DB]    Database: ${conn.connection.name}`);
    console.log(`[DB]    ReadyState: ${conn.connection.readyState}`);
    
    // Monitor connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] ⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('[DB] ❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('[DB] 🔄 MongoDB reconnected');
    });
    
    return true;
  } catch (error) {
    console.error('[DB] ❌ MongoDB Connection FAILED');
    if (error instanceof Error) {
      console.error(`[DB]    Name:    ${error.name}`);
      console.error(`[DB]    Message: ${error.message}`);
      console.error(`[DB]    Stack:   ${error.stack}`);
    } else {
      console.error(`[DB]    Error:   ${JSON.stringify(error)}`);
    }
    return false;
  }
};
