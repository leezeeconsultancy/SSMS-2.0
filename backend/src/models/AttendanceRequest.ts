import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: 'Late Check-in' | 'Manual Attendance' | 'Other';
  adminNote?: string;
  createdAt: Date;
}

const attendanceRequestSchema = new Schema<IAttendanceRequest>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    type: { type: String, enum: ['Late Check-in', 'Manual Attendance', 'Other'], default: 'Late Check-in' },
    adminNote: { type: String },
  },
  { timestamps: true }
);

export const AttendanceRequest = mongoose.model<IAttendanceRequest>('AttendanceRequest', attendanceRequestSchema);
