import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Manager' | 'Employee' | 'Super Admin';
  status: 'Active' | 'Suspended';
  authorizedDeviceId?: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // optional if using SSO later, but required for local
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Employee', 'Super Admin'],
      default: 'Employee',
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
    },
    authorizedDeviceId: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
