import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOnboardingCounter extends Document {
  companyId: string;
  year: number;
  seq: number;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingCounterSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    year: { type: Number, required: true, default: 2026 },
    seq: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

OnboardingCounterSchema.index({ companyId: 1, year: 1 }, { unique: true });

if (mongoose.models && mongoose.models.OnboardingCounter) {
  delete mongoose.models.OnboardingCounter;
}

export const OnboardingCounter: Model<IOnboardingCounter> = mongoose.model<IOnboardingCounter>('OnboardingCounter', OnboardingCounterSchema);
