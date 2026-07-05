import { Employee, IEmployee } from '@/app/api/models/Employee';

export class EmployeeRepository {
  static async findByEmail(email: string): Promise<IEmployee | null> {
    return Employee.findOne({ email: email.toLowerCase().trim() });
  }

  static async findById(id: string): Promise<IEmployee | null> {
    return Employee.findById(id);
  }

  static async create(employeeData: Partial<IEmployee>): Promise<IEmployee> {
    return Employee.create(employeeData);
  }

  static async updateByEmail(email: string, updateData: Partial<IEmployee>): Promise<IEmployee | null> {
    return Employee.findOneAndUpdate({ email: email.toLowerCase().trim() }, updateData, { new: true });
  }

  static async updateById(id: string, updateData: Partial<IEmployee>): Promise<IEmployee | null> {
    return Employee.findByIdAndUpdate(id, updateData, { new: true });
  }

  static async findAll(filter: any = {}): Promise<IEmployee[]> {
    return Employee.find(filter);
  }

  static async deleteById(id: string): Promise<IEmployee | null> {
    return Employee.findByIdAndDelete(id);
  }
}
