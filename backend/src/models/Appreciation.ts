import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAppreciation extends Document {
  companyId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  recipientId: string;
  recipientName: string;
  message: string;
  category: 'Teamwork' | 'Leadership' | 'Innovation' | 'Support' | 'Customer Success' | 'Learning' | 'Quality' | 'Excellence';
  likes: string[]; // employeeIds
  comments: {
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
  }[];
  reactions: {
    emoji: string;
    users: string[]; // employeeIds
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AppreciationSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    senderId: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    senderRole: { type: String },
    recipientId: { type: String, required: true, index: true },
    recipientName: { type: String, required: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ['Teamwork', 'Leadership', 'Innovation', 'Support', 'Customer Success', 'Learning', 'Quality', 'Excellence'],
      default: 'Teamwork'
    },
    likes: { type: [String], default: [] },
    comments: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    reactions: [
      {
        emoji: { type: String, required: true },
        users: { type: [String], default: [] }
      }
    ]
  },
  { timestamps: true }
);

AppreciationSchema.index({ companyId: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.Appreciation) {
  delete mongoose.models.Appreciation;
}
export const Appreciation: Model<IAppreciation> = mongoose.model<IAppreciation>('Appreciation', AppreciationSchema);
