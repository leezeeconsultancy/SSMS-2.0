import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  // Attendance Rules
  lateThresholdHour: number;      // Hour part (e.g., 9)
  lateThresholdMinute: number;    // Minute part (e.g., 15) → 9:15 AM
  checkInStartHour: number;       // Earliest check-in (e.g., 5 AM)
  checkInEndHour: number;         // Latest check-in (e.g., 13 = 1 PM)
  checkOutStartHour: number;      // Earliest check-out (e.g., 11 AM)
  checkOutEndHour: number;        // Latest check-out (e.g., 23 = 11 PM)
  minWorkMinutes: number;         // Minimum work before checkout (e.g., 30)
  maxWorkHours: number;           // Maximum work hours per day (e.g., 16)

  // Payroll Rules
  overtimeMultiplier: number;     // e.g., 1.5
  workingDaysPerMonth: number;    // e.g., 30
  maxOvertimeHoursPerDay: number; // e.g., 4
  defaultWorkHoursPerDay: number; // e.g., 9

  // Leave Rules
  defaultLeaveBalance: number;    // e.g., 18 days/year
  allowPastDateLeave: boolean;    // Allow leave for past dates

  // General
  companyName: string;
  defaultPayoutDay: number;       // e.g., 1st of month
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    // Attendance
    lateThresholdHour: { type: Number, default: 9 },
    lateThresholdMinute: { type: Number, default: 15 },
    checkInStartHour: { type: Number, default: 5 },
    checkInEndHour: { type: Number, default: 13 },
    checkOutStartHour: { type: Number, default: 11 },
    checkOutEndHour: { type: Number, default: 23 },
    minWorkMinutes: { type: Number, default: 30 },
    maxWorkHours: { type: Number, default: 16 },

    // Payroll
    overtimeMultiplier: { type: Number, default: 1.5 },
    workingDaysPerMonth: { type: Number, default: 30 },
    maxOvertimeHoursPerDay: { type: Number, default: 4 },
    defaultWorkHoursPerDay: { type: Number, default: 9 },

    // Leave
    defaultLeaveBalance: { type: Number, default: 18 },
    allowPastDateLeave: { type: Boolean, default: false },

    // General
    companyName: { type: String, default: 'SSMS Startup' },
    defaultPayoutDay: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Helper: Get or create the singleton config
systemConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

export const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);
