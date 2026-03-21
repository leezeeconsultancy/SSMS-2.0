import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficeLocation extends Document {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // How close the employee must be (default 200m)
  isActive: boolean;
}

const officeLocationSchema = new Schema<IOfficeLocation>(
  {
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radiusMeters: { type: Number, default: 200 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const OfficeLocation = mongoose.model<IOfficeLocation>('OfficeLocation', officeLocationSchema);
