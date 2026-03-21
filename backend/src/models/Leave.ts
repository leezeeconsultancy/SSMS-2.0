import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  employeeId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  leaveType: 'Sick' | 'Casual' | 'Paid' | 'Unpaid';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Neutral';
  approvedBy?: mongoose.Types.ObjectId; // User ID of the admin/manager who approved
}

const leaveSchema = new Schema<ILeave>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    leaveType: { 
      type: String, 
      enum: ['Sick', 'Casual', 'Paid', 'Unpaid'], 
      required: true 
    },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected', 'Neutral'], 
      default: 'Pending' 
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Leave = mongoose.model<ILeave>('Leave', leaveSchema);
