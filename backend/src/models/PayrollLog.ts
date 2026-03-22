import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollLog extends Document {
  month: number;
  year: number;
  status: 'Open' | 'Closed';
  totalEmployees: number;
  completedEmployees: number;
  totalPayout: number;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
}

const PayrollLogSchema: Schema = new Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  totalEmployees: { type: Number, default: 0 },
  completedEmployees: { type: Number, default: 0 },
  totalPayout: { type: Number, default: 0 },
  completedAt: { type: Date },
  completedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
}, { timestamps: true });

// Composite index for uniqueness per month/year
PayrollLogSchema.index({ month: 1, year: 1 }, { unique: true });

export default mongoose.model<IPayrollLog>('PayrollLog', PayrollLogSchema);
