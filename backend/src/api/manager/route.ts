import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../lib/mongodb';
import { Employee } from '../../models/Employee';
import { verifyAuth } from '../lib/auth';
import { Leave } from '../../models/Leave';
import { Attendance } from '../../models/Attendance';

export async function GET(req: NextRequest) {
  const decoded = verifyAuth(req as any);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const companyId = decoded.companyId || 'company_001';

  // Find the manager's own employee record to get their _id
  const managerEmployee = await Employee.findOne({
    companyId,
    email: decoded.email,
  }).lean();

  if (!managerEmployee) {
    return NextResponse.json({ error: 'Manager employee record not found' }, { status: 404 });
  }

  const managerId = (managerEmployee as any)._id.toString();

  // Find all employees reporting to this manager
  const teamMembers = await Employee.find({
    companyId,
    reportingManagerId: managerId,
    isActive: true,
  })
    .select('fullName email phone department designation profilePicture joinedDate status branchId empId')
    .lean();

  // Compute today's attendance stats
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const teamIds = teamMembers.map((e: any) => e._id.toString());

  // Count present today (attendance check-in today)
  const presentCount = await Attendance.countDocuments({
    companyId,
    employeeId: { $in: teamIds },
    date: { $gte: startOfDay, $lt: endOfDay },
    status: { $in: ['Present', 'Late'] },
  }).catch(() => 0);

  // Count on leave today (approved leaves covering today)
  const todayStr = today.toISOString().split('T')[0];
  const onLeaveCount = await Leave.countDocuments({
    companyId,
    employeeId: { $in: teamIds },
    status: 'Approved',
    startDate: { $lte: today },
    endDate: { $gte: startOfDay },
  }).catch(() => 0);

  // New joiners this month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const newJoiners = teamMembers.filter((e: any) =>
    e.joinedDate && new Date(e.joinedDate) >= firstOfMonth
  ).length;

  // Pending leave approvals for this manager
  const pendingLeaves = await Leave.countDocuments({
    companyId,
    employeeId: { $in: teamIds },
    status: 'Pending',
  }).catch(() => 0);

  const totalMembers = teamMembers.length;
  const absentCount = Math.max(0, totalMembers - onLeaveCount - presentCount);

  return NextResponse.json({
    stats: {
      totalMembers,
      present: presentCount,
      absent: absentCount,
      onLeave: onLeaveCount,
      newJoiners,
      pendingApprovals: pendingLeaves,
    },
    team: teamMembers,
    managerId,
  });
}
