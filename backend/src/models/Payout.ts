import mongoose, { Schema, Document } from 'mongoose';

export interface IPayout extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  holdAmount: number;
  payoutDate: Date;
  status: 'Pending' | 'Processing' | 'Paid' | 'On Hold' | 'Cancelled';
  remarks?: string;
}

const payoutSchema = new Schema<IPayout>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    holdAmount: { type: Number, default: 0 },
    payoutDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Processing', 'Paid', 'On Hold', 'Cancelled'], default: 'Paid' },
    remarks: { type: String },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate payouts for same month
payoutSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
