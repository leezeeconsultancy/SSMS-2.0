import mongoose from 'mongoose';
import dns from 'dns';

/**
 * Maximum number of connection attempts before giving up.
 */
const MAX_RETRIES = 3;

/**
 * Delay between retry attempts (in milliseconds).
 */
const RETRY_DELAY_MS = 5000;

/**
 * Helper to wait for a given number of milliseconds.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Connects to MongoDB with retry logic and detailed deployment logging.
 * Returns true on success, false on failure.
 * Retries up to MAX_RETRIES times with RETRY_DELAY_MS between attempts.
 * 
 * Designed to handle MongoDB Atlas free tier cold starts which can take
 * 10-30 seconds to wake up from sleep mode.
 */
export const connectDB = async (): Promise<boolean> => {
  // 🌐 DNS OVERRIDE — Force reliable DNS for MongoDB SRV resolution
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (dnsErr: unknown) {
    console.warn('[DB] ⚠️ Failed to set DNS servers (non-fatal):', dnsErr instanceof Error ? dnsErr.message : dnsErr);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssms';
  
  // Log connection attempt (mask password for security)
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log(`[DB] Attempting connection to: ${maskedUri}`);
  console.log(`[DB] Mongoose version: ${mongoose.version}`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[DB] Connection attempt ${attempt}/${MAX_RETRIES}...`);
      
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 45000,  // 45s timeout — accommodates free tier cold start
        connectTimeoutMS: 45000,          // 45s timeout for initial connection
        socketTimeoutMS: 60000,           // 60s timeout for socket operations
      });
      
      console.log(`[DB] ✅ MongoDB Connected Successfully (attempt ${attempt})`);
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
      console.error(`[DB] ❌ MongoDB Connection attempt ${attempt}/${MAX_RETRIES} FAILED`);
      if (error instanceof Error) {
        console.error(`[DB]    Name:    ${error.name}`);
        console.error(`[DB]    Message: ${error.message}`);
      } else {
        console.error(`[DB]    Error:   ${JSON.stringify(error)}`);
      }
      
      if (attempt < MAX_RETRIES) {
        console.log(`[DB] ⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await delay(RETRY_DELAY_MS);
      }
    }
  }
  
  console.error(`[DB] ❌ All ${MAX_RETRIES} connection attempts failed.`);
  return false;
};
