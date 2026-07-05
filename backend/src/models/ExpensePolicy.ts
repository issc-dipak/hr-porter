import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExpensePolicy extends Document {
  companyId: string;
  travelLimit: number;
  foodLimit: number;
  hotelLimit: number;
  monthlyBudget: number;
  departmentBudget?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ExpensePolicySchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    travelLimit: { type: Number, required: true, default: 5000 },
    foodLimit: { type: Number, required: true, default: 1500 },
    hotelLimit: { type: Number, required: true, default: 8000 },
    monthlyBudget: { type: Number, required: true, default: 200000 },
    departmentBudget: { type: Map, of: Number, default: {} }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ExpensePolicy) {
  delete mongoose.models.ExpensePolicy;
}
export const ExpensePolicy: Model<IExpensePolicy> = mongoose.model<IExpensePolicy>('ExpensePolicy', ExpensePolicySchema);
