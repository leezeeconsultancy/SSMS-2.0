import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ssms');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[DB ERROR] Connection failed: ${error.message}`);
    } else {
      console.error('[DB ERROR] An unexpected error occurred during database connection');
    }
    return false;
  }
};
