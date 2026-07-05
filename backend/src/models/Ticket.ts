import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITicket extends Document {
  companyId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  assignedTo?: string; // agent user email or ID
  assignedToName?: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  attachments?: string[];
  rating?: number;
  feedback?: string;
  escalated?: boolean;
  escalatedReason?: string;
  department: string;
  aiSummary?: string;
  aiSuggestedResponse?: string;
  aiPriorityRecommended?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    assignedTo: { type: String, default: '' },
    assignedToName: { type: String, default: '' },
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, required: true, default: 'Medium' },
    description: { type: String, required: true },
    status: { type: String, required: true, default: 'Open' },
    attachments: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    escalated: { type: Boolean, default: false },
    escalatedReason: { type: String, default: '' },
    department: { type: String, required: true },
    aiSummary: { type: String, default: '' },
    aiSuggestedResponse: { type: String, default: '' },
    aiPriorityRecommended: { type: String, default: '' },
  },
  { timestamps: true }
);

TicketSchema.index({ companyId: 1, status: 1 });
TicketSchema.index({ companyId: 1, employeeEmail: 1 });

if (mongoose.models && mongoose.models.Ticket) {
  delete mongoose.models.Ticket;
}
export const Ticket: Model<ITicket> = mongoose.model<ITicket>('Ticket', TicketSchema);
