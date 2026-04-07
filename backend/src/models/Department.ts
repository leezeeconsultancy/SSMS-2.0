import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
}

const DepartmentSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
