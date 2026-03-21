import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: 'Public Holiday' | 'Company Holiday' | 'Optional Holiday';
}

const holidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true, unique: true },
    type: { 
      type: String, 
      enum: ['Public Holiday', 'Company Holiday', 'Optional Holiday'], 
      required: true 
    },
  },
  { timestamps: true }
);

export const Holiday = mongoose.model<IHoliday>('Holiday', holidaySchema);
