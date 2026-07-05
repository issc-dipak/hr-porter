import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { Department } from '@/app/api/models/Department';
import { Designation } from '@/app/api/models/Designation';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';

// Dynamically seed departments/designations based on active employees if collections are empty
async function ensureDepartmentsAndDesignations(companyId: string) {
  const deptCount = await Department.countDocuments({ companyId });
  const desCount = await Designation.countDocuments({ companyId });
  
  if (deptCount === 0 || desCount === 0) {
    const activeEmployees = await Employee.find({ companyId, status: 'Active' });
    
    // Seed Departments
    if (deptCount === 0) {
      const depts = Array.from(new Set(activeEmployees.map(emp => emp.department).filter(Boolean)));
      if (depts.length > 0) {
        for (const name of depts) {
          await Department.updateOne(
            { companyId, departmentName: name },
            { $setOnInsert: { description: `Seeded ${name} Department` } },
            { upsert: true }
          );
        }
      } else {
        const defaultDepts = [
          { departmentName: 'Engineering', description: 'Engineering and Development' },
          { departmentName: 'HR', description: 'Human Resources' },
          { departmentName: 'Sales', description: 'Sales and Marketing' }
        ];
        for (const d of defaultDepts) {
          await Department.updateOne(
            { companyId, departmentName: d.departmentName },
            { $setOnInsert: { description: d.description } },
            { upsert: true }
          );
        }
      }
    }
    
    // Seed Designations
    if (desCount === 0) {
      const desigs = Array.from(new Set(activeEmployees.map(emp => emp.designation).filter(Boolean)));
      if (desigs.length > 0) {
        for (const name of desigs) {
          let level = 3;
          const lowerName = name.toLowerCase();
          if (lowerName.includes('ceo') || lowerName.includes('founder') || lowerName.includes('president') || lowerName.includes('chief executive')) {
            level = 1;
          } else if (lowerName.includes('manager') || lowerName.includes('director') || lowerName.includes('head') || lowerName.includes('vp')) {
            level = 2;
          } else if (lowerName.includes('lead') || lowerName.includes('senior') || lowerName.includes('sr')) {
            level = 3;
          } else {
            level = 4;
          }
          await Designation.updateOne(
            { companyId, designationName: name },
            { $setOnInsert: { level } },
            { upsert: true }
          );
        }
      } else {
        const defaultDesigs = [
          { designationName: 'CEO', level: 1 },
          { designationName: 'Engineering Manager', level: 2 },
          { designationName: 'Senior Software Engineer', level: 3 },
          { designationName: 'Developer', level: 4 }
        ];
        for (const d of defaultDesigs) {
          await Designation.updateOne(
            { companyId, designationName: d.designationName },
            { $setOnInsert: { level: d.level } },
            { upsert: true }
          );
        }
      }
    }

    // Connect employees to their seeded categories by matching names
    const seededDepts = await Department.find({ companyId });
    const seededDesigs = await Designation.find({ companyId });
    
    for (const emp of activeEmployees) {
      const matchedDept = seededDepts.find(d => d.departmentName === emp.department);
      const matchedDesig = seededDesigs.find(d => d.designationName === emp.designation);
      
      let updated = false;
      if (matchedDept && !emp.departmentId) {
        emp.departmentId = matchedDept._id.toString();
        updated = true;
      }
      if (matchedDesig && !emp.designationId) {
        emp.designationId = matchedDesig._id.toString();
        updated = true;
      }
      if (updated) {
        await emp.save();
      }
    }
  }
}

// GET configurations, categories list, and stats metrics
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = decoded;
    await connectToDatabase();

    // Ensure departments and designations exist
    await ensureDepartmentsAndDesignations(companyId);

    const departments = await Department.find({ companyId }).sort({ departmentName: 1 });
    const designations = await Designation.find({ companyId }).sort({ level: 1, designationName: 1 });
    const activeEmployees = await Employee.find({ companyId, status: 'Active' });

    // Calculate analytics counters
    const totalEmployees = activeEmployees.length;
    const totalDepartments = departments.length;
    
    // Count managers (employees who are assigned to managerId by someone else)
    const managerIds = Array.from(new Set(activeEmployees.map(emp => emp.managerId).filter(Boolean)));
    const managersCount = activeEmployees.filter(emp => managerIds.includes(emp._id.toString())).length;

    // Count employees without managers
    const employeesWithoutManagers = activeEmployees.filter(emp => !emp.managerId).length;

    // Department wise employee distribution
    const deptDistributionMap: Record<string, number> = {};
    activeEmployees.forEach(emp => {
      const deptName = emp.department || 'Unassigned';
      deptDistributionMap[deptName] = (deptDistributionMap[deptName] || 0) + 1;
    });
    const departmentDistribution = Object.entries(deptDistributionMap).map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      departments,
      designations,
      stats: {
        totalEmployees,
        totalDepartments,
        managersCount,
        employeesWithoutManagers,
        departmentDistribution
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to load org chart config & stats:', error);
    return NextResponse.json({ error: 'Failed to load org chart configs', details: error.message }, { status: 500 });
  }
}

// POST: Admin create department or designation
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role, email } = decoded;
    if (role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied: Admin only' }, { status: 403 });
    }

    const body = await req.json() as any;
    const { action } = body;

    await connectToDatabase();

    if (action === 'create-department') {
      const { departmentName, description } = body;
      if (!departmentName) {
        return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
      }

      // Check duplicates
      const exist = await Department.findOne({ companyId, departmentName: { $regex: new RegExp(`^${departmentName.trim()}$`, 'i') } });
      if (exist) {
        return NextResponse.json({ error: 'Department already exists' }, { status: 409 });
      }

      const newDept = await Department.create({
        companyId,
        departmentName: departmentName.trim(),
        description: description || ''
      });

      await AuditLog.create({
        companyId,
        action: 'Department Created',
        performedBy: email,
        details: `Department "${departmentName}" created by Admin ${email}`,
        ipAddress: '127.0.0.1'
      });

      return NextResponse.json(newDept, { status: 201 });

    } else if (action === 'create-designation') {
      const { designationName, level } = body;
      if (!designationName) {
        return NextResponse.json({ error: 'Designation name is required' }, { status: 400 });
      }

      const levelVal = typeof level === 'number' ? level : Number(level || 3);

      const exist = await Designation.findOne({ companyId, designationName: { $regex: new RegExp(`^${designationName.trim()}$`, 'i') } });
      if (exist) {
        return NextResponse.json({ error: 'Designation already exists' }, { status: 409 });
      }

      const newDesig = await Designation.create({
        companyId,
        designationName: designationName.trim(),
        level: levelVal
      });

      await AuditLog.create({
        companyId,
        action: 'Designation Created',
        performedBy: email,
        details: `Designation "${designationName}" (Level ${levelVal}) created by Admin ${email}`,
        ipAddress: '127.0.0.1'
      });

      return NextResponse.json(newDesig, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to create configuration:', error);
    return NextResponse.json({ error: 'Failed to create configuration', details: error.message }, { status: 500 });
  }
}
