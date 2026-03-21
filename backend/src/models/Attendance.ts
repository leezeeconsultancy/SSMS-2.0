import mongoose, { Schema, Document } from 'mongoose';

interface ILocation {
  latitude: number;
  longitude: number;
}

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  checkIn: {
    time: Date;
    location: ILocation;
    deviceType: string;
  };
  checkOut?: {
    time: Date;
    location: ILocation;
    deviceType: string;
  };
  totalWorkingHours?: number;
  overTimeHours?: number;
  status: 'Present' | 'Absent' | 'Half Day' | 'Late' | 'Neutral';
  flags: string[]; // Suspicious activity flags
  serverCheckInTime: Date;  // Server-recorded time (can't be faked)
  serverCheckOutTime?: Date; // Server-recorded time (can't be faked)
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: {
      time: { type: Date, required: true },
      location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
      deviceType: { type: String, required: true },
    },
    checkOut: {
      time: { type: Date },
      location: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      deviceType: { type: String },
    },
    totalWorkingHours: { type: Number, default: 0 },
    overTimeHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half Day', 'Late', 'Neutral'],
      default: 'Present',
    },
    flags: [{ type: String }], // e.g. ['SUSPICIOUS_LOCATION', 'LATE_CHECKOUT']
    serverCheckInTime: { type: Date },
    serverCheckOutTime: { type: Date },
  },
  { timestamps: true }
);

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
