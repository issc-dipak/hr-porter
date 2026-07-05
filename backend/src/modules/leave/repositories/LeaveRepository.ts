import { Leave, ILeave } from '@/app/api/models/Leave';

export class LeaveRepository {
  static async findAll(filter: any = {}): Promise<ILeave[]> {
    return Leave.find(filter).sort({ createdAt: -1 });
  }

  static async findById(id: string): Promise<ILeave | null> {
    return Leave.findById(id);
  }

  static async create(leaveData: Partial<ILeave>): Promise<ILeave> {
    return Leave.create(leaveData);
  }

  static async updateById(id: string, updateData: any): Promise<ILeave | null> {
    return Leave.findByIdAndUpdate(id, updateData, { new: true });
  }
}
