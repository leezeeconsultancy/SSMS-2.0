import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IDailyQR extends Document {
  employeeId: mongoose.Types.ObjectId;
  token: string;
  date: string; // YYYY-MM-DD format, one per day
  used: boolean;
}

const dailyQRSchema = new Schema<IDailyQR>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    token: { type: String, required: true, unique: true },
    date: { type: String, required: true }, // e.g. "2026-03-15"
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index: one QR per employee per day
dailyQRSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const DailyQR = mongoose.model<IDailyQR>('DailyQR', dailyQRSchema);

// Utility: generate today's QR token for an employee
export const generateDailyToken = (employeeId: string, date: string): string => {
  return crypto.createHash('sha256').update(`${employeeId}-${date}-${process.env.JWT_SECRET || 'salt'}`).digest('hex').slice(0, 16);
};
