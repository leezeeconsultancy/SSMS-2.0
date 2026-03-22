import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  userId?: mongoose.Types.ObjectId; // Link to user auth credentials
  employeeId: string; // E.g., SSMS-1001
  name: string;
  phone: string;
  email: string;
  department: string;
  designation: string;
  salary: number;
  workHoursPerDay: number; // Configurable per employee (default 9)
  salaryStructureId?: mongoose.Types.ObjectId;
  joiningDate: Date;
  status: 'Active' | 'Suspended';
  managerId?: mongoose.Types.ObjectId; // Link to Manager (Employee)
  qrCodeData?: string; // Stored unique QR identifier
  defaultPayoutDay?: number; // e.g., 5 for 5th of every month
  leaveBalance: number;      // Annual leave quota remaining
}

const employeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    salary: { type: Number, required: true },
    workHoursPerDay: { type: Number, default: 9 },
    joiningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    qrCodeData: { type: String, unique: true, sparse: true },
    defaultPayoutDay: { type: Number, default: 1 }, // Default to 1st of the month
    leaveBalance: { type: Number, default: 18 },     // Annual leave days
  },
  { timestamps: true }
);

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
