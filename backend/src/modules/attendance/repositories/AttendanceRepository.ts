import { Attendance, IAttendance } from '@/app/api/models/Attendance';

export class AttendanceRepository {
  static async findAll(filter: any = {}): Promise<IAttendance[]> {
    return Attendance.find(filter).sort({ date: -1, name: 1 });
  }

  static async findByNameAndDate(name: string, date: string, companyId: string): Promise<IAttendance | null> {
    return Attendance.findOne({ name, date, companyId });
  }

  static async create(attendanceData: Partial<IAttendance>): Promise<IAttendance> {
    return Attendance.create(attendanceData);
  }

  static async update(id: any, updateData: any): Promise<IAttendance | null> {
    return Attendance.findByIdAndUpdate(id, updateData, { new: true });
  }
}
