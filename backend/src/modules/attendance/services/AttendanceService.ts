import { AttendanceRepository } from '../repositories/AttendanceRepository';
import { Employee } from '@/app/api/models/Employee';

export class AttendanceService {
  static async getAttendance(companyId: string, employeeName?: string, branchId?: string, decoded?: any) {
    const filter: any = { companyId };
    if (employeeName) {
      filter.name = employeeName;
    }
    if ((decoded?.role === 'Branch Admin' || decoded?.role === 'HR') && decoded.branchId) {
      filter.branchId = decoded.branchId;
    } else if (branchId) {
      filter.branchId = branchId;
    }
    const attendance = await AttendanceRepository.findAll(filter);
    const mapped = attendance.map(item => {
      const obj = item.toObject() as any;
      return {
        ...obj,
        employee: obj.name,
        checkIn: obj.timeIn,
        checkOut: obj.timeOut,
        hours: obj.duration,
        remarks: obj.remarks || ''
      };
    });
    return { data: mapped, status: 200 };
  }

  static async logAttendance(data: any, companyId: string) {
    const name = data.name || data.employee;
    const date = data.date;

    if (!name || !date) {
      return { error: 'Missing required fields (name/employee, date)', status: 400 };
    }

    // Check if the employee is archived or inactive
    const employee = await Employee.findOne({ fullName: name, companyId });
    if (employee && (employee.status === 'Archived' || employee.isActive === false)) {
      return { error: 'Employee is archived. Action locked.', status: 400 };
    }

    const attendanceRecord = await AttendanceRepository.findByNameAndDate(name, date, companyId);

    const timeIn = data.timeIn || data.checkIn || '-';
    const timeOut = data.timeOut || data.checkOut || '-';
    const duration = data.duration !== undefined ? data.duration : (data.hours !== undefined ? data.hours : null);
    const status = data.status || 'Present';
    const remarks = data.remarks || '';

    if (attendanceRecord) {
      if (timeIn !== '-') attendanceRecord.timeIn = timeIn;
      
      if (data.checkOut === '' || data.checkOut === '-') {
        attendanceRecord.timeOut = '-';
      } else if (timeOut !== '-') {
        attendanceRecord.timeOut = timeOut;
      }

      if (employee && !attendanceRecord.branchId) {
        attendanceRecord.branchId = employee.branchId || '';
      }

      if (duration !== null) {
        if (duration === '00:00:00' || duration === '0.0' || duration === '0h 00m') {
          attendanceRecord.duration = '00:00:00';
        } else {
          attendanceRecord.duration = duration;
        }
      }

      attendanceRecord.status = status;
      if (data.breaks !== undefined) {
        attendanceRecord.breaks = data.breaks;
      }
      if (data.remarks !== undefined) {
        attendanceRecord.remarks = remarks;
      }

      const updated = await attendanceRecord.save();
      const obj = updated.toObject() as any;
      const responsePayload = {
        ...obj,
        employee: obj.name,
        checkIn: obj.timeIn,
        checkOut: obj.timeOut,
        hours: obj.duration,
        breaks: obj.breaks || [],
        remarks: obj.remarks || ''
      };

      return { message: 'Attendance record updated successfully', attendance: responsePayload, status: 200 };
    } else {
      const newAttendance = await AttendanceRepository.create({
        name,
        date,
        timeIn,
        timeOut,
        duration: (duration === null || duration === '0.0' || duration === '0h 00m') ? '00:00:00' : duration,
        status,
        companyId,
        breaks: data.breaks || [],
        remarks: remarks,
        branchId: employee ? employee.branchId || '' : ''
      });

      const obj = newAttendance.toObject() as any;
      const responsePayload = {
        ...obj,
        employee: obj.name,
        checkIn: obj.timeIn,
        checkOut: obj.timeOut,
        hours: obj.duration,
        breaks: obj.breaks || [],
        remarks: obj.remarks || ''
      };

      return { message: 'Attendance record logged successfully', attendance: responsePayload, status: 201 };
    }
  }
}
