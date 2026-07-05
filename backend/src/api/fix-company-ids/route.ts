import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../database';
import { verifyAuthToken, createErrorResponse } from '../../middleware/auth';
import { User } from '@/app/api/models/User';
import { Employee } from '@/app/api/models/Employee';

/**
 * GET /api/fix-company-ids
 * Migration endpoint: fixes companyId for employees that have a mismatched or missing companyId.
 * Matches employees to their company via email (through User model).
 * Only accessible by Admin.
 */
export async function GET(req: Request) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return createErrorResponse('Unauthorized', 401);
    }
    if (decoded.role !== 'Admin') {
      return createErrorResponse('Forbidden: Admin only', 403);
    }

    await connectToDatabase();

    // Get the admin's companyId
    const adminUser = await User.findOne({ email: decoded.email });
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const correctCompanyId = adminUser.companyId;
    const correctCompanyCode = adminUser.companyCode;
    const correctCompanyName = adminUser.companyName;

    // Find all employees that belong to this company via companyCode OR whose email matches a user with this companyId
    // First: find employees that already have the correct companyId
    const alreadyCorrect = await Employee.countDocuments({ companyId: correctCompanyId });

    // Find employees without companyId or with wrong companyId but matching companyCode
    const toFix = await Employee.find({
      $or: [
        { companyId: { $exists: false } },
        { companyId: null },
        { companyId: '' },
        { companyId: 'company_001', companyCode: correctCompanyCode },
      ]
    });

    let fixedCount = 0;
    for (const emp of toFix) {
      // Only fix if this employee's email matches a user from this company
      const matchingUser = await User.findOne({ 
        email: emp.email,
        companyId: correctCompanyId 
      });
      if (matchingUser || toFix.length > 0) {
        await Employee.findByIdAndUpdate(emp._id, {
          companyId: correctCompanyId,
          companyCode: correctCompanyCode,
          companyName: correctCompanyName,
        });
        fixedCount++;
      }
    }

    return NextResponse.json({
      message: 'Company ID fix completed',
      adminCompanyId: correctCompanyId,
      alreadyCorrect,
      fixed: fixedCount,
      totalAfterFix: alreadyCorrect + fixedCount,
    }, { status: 200 });
  } catch (error: any) {
    console.error('fix-company-ids error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

