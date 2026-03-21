import mongoose, { Schema, Document } from 'mongoose';

export interface ISalaryRule extends Document {
  ruleName: string; // e.g. "Late Penalty"
  condition: string; // e.g. "Check-in after 9:30"
  triggerType: 'Late' | 'Half Day' | 'Absent' | 'Early Leave';
  deductionType: 'FixedAmount' | 'Percentage' | 'FullDayCut';
  deductionValue: number; // The amount in ₹, or the percentage % (e.g. 50 for 50%)
  isActive: boolean;
}

const salaryRuleSchema = new Schema<ISalaryRule>(
  {
    ruleName: { type: String, required: true },
    condition: { type: String, default: '' },
    triggerType: { 
      type: String, 
      enum: ['Late', 'Half Day', 'Absent', 'Early Leave'], 
      required: true 
    },
    deductionType: { 
      type: String, 
      enum: ['FixedAmount', 'Percentage', 'FullDayCut'], 
      required: true 
    },
    deductionValue: { type: Number, required: true }, // Put 0 if FullDayCut
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SalaryRule = mongoose.model<ISalaryRule>('SalaryRule', salaryRuleSchema);
