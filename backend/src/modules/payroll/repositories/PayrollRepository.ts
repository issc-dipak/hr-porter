import { Payroll, IPayroll } from '@/app/api/models/Payroll';

export class PayrollRepository {
  static async findAll(filter: any = {}): Promise<IPayroll[]> {
    return Payroll.find(filter).sort({ createdAt: -1 });
  }

  static async findById(id: string): Promise<IPayroll | null> {
    return Payroll.findById(id);
  }

  static async create(data: Partial<IPayroll>): Promise<IPayroll> {
    return Payroll.create(data);
  }

  static async updateById(id: string, data: any): Promise<IPayroll | null> {
    return Payroll.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteById(id: string): Promise<IPayroll | null> {
    return Payroll.findByIdAndDelete(id);
  }

  static async deleteOne(filter: any): Promise<any> {
    return Payroll.deleteOne(filter);
  }
}
