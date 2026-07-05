import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { User } from '@/app/api/models/User';
import { DeletedEmployee } from '@/app/api/models/DeletedEmployee';
import { AuditLog } from '@/app/api/models/AuditLog';
import { UserSettings } from '@/app/api/models/UserSettings';
import { Employee } from '@/app/api/models/Employee';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '../../../utils/email';
import { OnboardingRequest } from '../../../models/OnboardingRequest';
import { Branch } from '../../../models/Branch';
import { Designation } from '../../../models/Designation';

export class EmployeeService {
  static async getEmployees(companyId: string, email?: string | null, companyCode?: string | null, branchId?: string | null, decoded?: any) {
    if (email) {
      const employee = await EmployeeRepository.findByEmail(email);
      if (!employee || employee.companyId !== companyId) {
        return { error: 'Employee not found', status: 404 };
      }

      // Branch Admin / HR branch access check
      if ((decoded?.role === 'Branch Admin' || decoded?.role === 'HR') && decoded.branchId && employee.branchId !== decoded.branchId) {
        return { error: 'Forbidden: You do not have permission to view employees of other branches', status: 403 };
      }

      const settings = await UserSettings.findOne({ email: (employee.email || '').toLowerCase().trim() });
      const userObj = await User.findOne({ email: (employee.email || '').toLowerCase().trim() });
      const empObj = employee.toObject ? employee.toObject() : employee;

      let reportingManager = null;
      if (empObj.reportingManagerId) {
        const mgr = await Employee.findById(empObj.reportingManagerId).lean();
        if (mgr) {
          reportingManager = {
            id: mgr._id,
            name: mgr.fullName,
            email: mgr.email,
            phone: mgr.phone || 'N/A',
            designation: mgr.designation || 'Manager',
            department: mgr.department || 'Management'
          };
        }
      }

      const directReportsCount = await Employee.countDocuments({
        companyId,
        reportingManagerId: empObj._id.toString(),
        isActive: true
      });
      const isManager = directReportsCount > 0;

      return { 
        data: { 
          ...empObj, 
          bio: settings?.bio || 'Senior Specialist', 
          role: userObj?.role || 'Employee',
          chatSettings: settings?.chatSettings || null,
          reportingManager,
          isManager
        }, 
        status: 200 
      };
    }

    console.log('[EmployeeService] getEmployees: filtering by companyId =', companyId);
    const query: any = { companyId, isActive: { $ne: false } };
    if ((decoded?.role === 'Branch Admin' || decoded?.role === 'HR') && decoded.branchId) {
      query.branchId = decoded.branchId;
    } else if (branchId) {
      query.branchId = branchId;
    }

    let employees = await EmployeeRepository.findAll(query);
    console.log('[EmployeeService] getEmployees: found', employees.length, 'employees');

    // Fallback: if no employees found by companyId, try by companyCode (migration scenario)
    if (employees.length === 0 && companyCode && !branchId && decoded?.role !== 'Branch Admin') {
      console.log('[EmployeeService] getEmployees: falling back to companyCode =', companyCode);
      employees = await EmployeeRepository.findAll({ companyCode, isActive: { $ne: false } });
      console.log('[EmployeeService] getEmployees: fallback found', employees.length, 'employees');
      // Auto-fix companyId for these employees
      if (employees.length > 0) {
        await Promise.all(employees.map(emp => 
          EmployeeRepository.updateById(emp._id.toString() as string, { companyId })
        ));
        console.log('[EmployeeService] getEmployees: auto-fixed companyId for', employees.length, 'employees');
      }
    }

    const emails = employees.map(emp => (emp.email || '').toLowerCase().trim()).filter(Boolean);
    const settingsList = await UserSettings.find({ email: { $in: emails } });
    const settingsMap = new Map(
      settingsList
        .filter(s => s && s.email)
        .map(s => [s.email.toLowerCase().trim(), s])
    );
    
    const usersList = await User.find({ email: { $in: emails } });
    const usersMap = new Map(
      usersList
        .filter(u => u && u.email)
        .map(u => [u.email.toLowerCase().trim(), u])
    );

    const employeesWithBio = employees.map(emp => {
      const emailKey = (emp.email || '').toLowerCase().trim();
      const settings = settingsMap.get(emailKey);
      const userObj = usersMap.get(emailKey);
      const empObj = emp.toObject ? emp.toObject() : emp;
      return {
        ...empObj,
        bio: settings?.bio || 'Senior Specialist',
        role: userObj?.role || 'Employee',
        chatSettings: settings?.chatSettings || null
      };
    });

    return { data: employeesWithBio, status: 200 };
  }

  static async createEmployee(data: any, decodedOrCompanyId: any) {
    if (!data.fullName || !data.email || !data.designation || !data.department) {
      return { error: 'Missing required fields (fullName, email, designation, department)', status: 400 };
    }

    const existingEmployee = await EmployeeRepository.findByEmail(data.email);
    if (existingEmployee) {
      return { error: 'An employee with this email already exists', status: 409 };
    }

    let companyId: string;
    let decoded: any = null;
    if (typeof decodedOrCompanyId === 'string') {
      companyId = decodedOrCompanyId;
    } else {
      decoded = decodedOrCompanyId;
      companyId = decoded.companyId;
    }

    // Quota enforcement: Check plan limits
    try {
      const { Subscription } = await import('../../../models/Subscription');
      const sub = await Subscription.findOne({ companyId });
      if (sub) {
        // Starter Plan limit: 25, Professional: 250, Enterprise: unlimited
        const activeCount = await Employee.countDocuments({ companyId, isActive: { $ne: false } });
        const limit = sub.planCode === 'starter' ? 25 : sub.planCode === 'professional' ? 250 : 999999;
        
        if (activeCount >= limit) {
          return { 
            error: `Subscription Limit Reached: Your current ${sub.planCode.toUpperCase()} Plan allows a maximum of ${limit} active employees. Please upgrade your plan in the Billing section to add more.`, 
            status: 402 
          };
        }
      }
    } catch (quotaErr: any) {
      console.error('[EmployeeService] Quota check failed:', quotaErr);
    }

    const companyCode = decoded?.companyCode || data.companyCode || 'hrcore';
    const companyName = decoded?.companyName || data.companyName || 'HR Core Labs';

    // Generate secure onboarding token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const joiningDateVal = data.joinedDate || data.joining || new Date();

    let branchId = data.branchId || '';
    if ((decoded?.role === 'Branch Admin' || decoded?.role === 'HR') && decoded.branchId) {
      branchId = decoded.branchId;
    } else if (!branchId) {
      const defaultBranch = await Branch.findOne({ companyId, branchCode: 'MUM001' });
      branchId = defaultBranch ? defaultBranch._id.toString() : '';
    }

    // Create OnboardingRequest
    const personalEmail = data.personalEmail?.toLowerCase().trim() || data.email.toLowerCase().trim();
    const workEmail = data.email.toLowerCase().trim();

    const onboardingRequest = await OnboardingRequest.create({
      companyId,
      inviteEmail: workEmail,
      invitePersonalEmail: personalEmail,
      inviteName: data.fullName,
      designation: data.designation,
      department: data.department || data.dept || '',
      joiningDate: new Date(joiningDateVal),
      inviteToken,
      status: 'Invited',
      employmentType: data.employmentType || 'Full-Time',
      workEmailPasswordPlain: data.workEmailPassword || data.workEmailPasswordPlain || '',
      branchId
    });

    // Resolve designationId if it exists
    let designationId = '';
    if (data.designation) {
      try {
        const matchedDesig = await Designation.findOne({ companyId, designationName: data.designation });
        if (matchedDesig) {
          designationId = matchedDesig._id.toString();
        }
      } catch (desigErr) {
        console.error('Failed to resolve designationId on employee create:', desigErr);
      }
    }

    // Create Employee record withstatus 'Invited' and isActive = false
    const newEmployee = await EmployeeRepository.create({
      companyId,
      fullName: data.fullName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone || '',
      department: data.department || data.dept || '',
      designation: data.designation,
      designationId,
      status: 'Invited',
      joinedDate: new Date(joiningDateVal),
      location: data.location || 'Remote',
      isActive: false,
      onboardingProgress: 0,
      employmentType: data.employmentType || 'Full-Time',
      companyName,
      companyCode,
      branchId
    });

    // Send invitation email to PERSONAL email (not work email — employee hasn't joined yet)
    const setupLink = `http://localhost:3000/onboarding/${inviteToken}`;
    try {
      await sendEmail({
        to: personalEmail,  // ✅ Personal email pe jaayegi — work email abhi unke paas nahi hai
        subject: `You're invited! Complete your onboarding setup`,
        text: `Hello ${data.fullName},\n\nYou have been invited to join our company as a ${data.designation} in the ${data.department} department.\n\nPlease complete your onboarding profile setup here: ${setupLink}\n\nWelcome aboard!`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
            <h2 style="color: #2563eb; font-size: 20px; font-weight: bold; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px;">Welcome Aboard!</h2>
            <p style="font-size: 15px; font-weight: bold;">Hello ${data.fullName},</p>
            <p style="font-size: 14px; color: #475569;">
              We are absolutely thrilled to welcome you to our team as a <strong>${data.designation}</strong> within the <strong>${data.department}</strong> department!
            </p>
            <p style="font-size: 14px; color: #475569; margin-top: 15px;">
              Before your joining date, please complete your onboarding forms, bank details, and document setup.
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${setupLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block;">Start Onboarding Setup</a>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 8px;">
              If you have any queries, please get in touch with your HR representative.
            </p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Failed to send onboarding email:', mailErr);
    }

    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      await SystemNotificationService.notifyRoles(companyId, ['Admin', 'HR'], {
        companyId,
        title: 'New Candidate Invited',
        content: `Onboarding invitation sent to ${newEmployee.fullName} (${newEmployee.email}).`,
        type: 'other',
        targetPage: 'onboarding'
      });
    } catch (notifErr) {
      console.error('Failed to trigger employee creation notification:', notifErr);
    }

    return { 
      message: 'Employee created and invitation sent successfully', 
      employee: newEmployee, 
      status: 201 
    };
  }

  static async updateEmployee(id: string, data: any, companyId: string) {
    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return { error: 'Employee not found', status: 404 };
    }
    if (employee.companyId !== companyId) {
      return { error: 'Forbidden: You do not own this record', status: 403 };
    }

    // Resolve designationId if designation is provided
    if (data.designation) {
      try {
        const matchedDesig = await Designation.findOne({ companyId, designationName: data.designation });
        if (matchedDesig) {
          data.designationId = matchedDesig._id.toString();
        } else {
          data.designationId = '';
        }
      } catch (desigErr) {
        console.error('Failed to resolve designationId on employee update:', desigErr);
      }
    }

    const updatedEmployee = await EmployeeRepository.updateById(id, { $set: data });
    if (!updatedEmployee) {
      return { error: 'Employee not found', status: 404 };
    }
    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      if (updatedEmployee.email) {
        await SystemNotificationService.createNotification({
          companyId: updatedEmployee.companyId,
          userId: updatedEmployee.email,
          title: 'Profile Updated',
          content: 'Your employee profile details have been updated.',
          type: 'other',
          targetPage: 'employees'
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger employee update notification:', notifErr);
    }

    return { 
      message: 'Employee updated successfully', 
      employee: updatedEmployee, 
      status: 200 
    };
  }

  static async deleteEmployee(id: string, decodedOrCompanyId: any) {
    let companyId: string;
    let isAdmin = false;
    let deletedByEmail = 'Admin';
    if (typeof decodedOrCompanyId === 'string') {
      companyId = decodedOrCompanyId;
    } else {
      companyId = decodedOrCompanyId.companyId;
      isAdmin = decodedOrCompanyId.role === 'Admin';
      deletedByEmail = decodedOrCompanyId.email || decodedOrCompanyId.fullName || 'Admin';
    }

    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return { error: 'Employee not found', status: 404 };
    }

    // Bypass companyId ownership checks for Admins
    if (!isAdmin && employee.companyId !== companyId) {
      return { error: 'Forbidden: You do not own this record', status: 403 };
    }

    // Soft delete the employee
    employee.isActive = false;
    employee.status = 'Terminated';
    employee.terminatedAt = new Date();
    employee.terminatedBy = deletedByEmail;
    employee.terminationReason = 'Record soft-deleted/terminated by HR or Admin via workforce console.';
    
    // Progress exit workflow
    employee.exitWorkflow = {
      stage: 'Archived',
      deactivatedAt: new Date(),
      deactivatedBy: deletedByEmail,
      archivedAt: new Date(),
      archivedBy: deletedByEmail
    };
    
    await employee.save();

    // Deactivate the user login account
    if (employee.email) {
      const emailLower = employee.email.toLowerCase().trim();
      await User.updateMany(
        { email: emailLower },
        { 
          $set: { 
            isActive: false, 
            status: 'Terminated' 
          } 
        }
      );
    }

    // Create a history record of deletion for backward compatibility
    await DeletedEmployee.create({
      companyId: employee.companyId || companyId,
      fullName: employee.fullName,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      deletedBy: deletedByEmail
    });

    // Log action in audit log
    await AuditLog.create({
      companyId: employee.companyId || companyId,
      action: 'Employee Terminated',
      performedBy: deletedByEmail,
      details: `Employee ${employee.fullName} (${employee.email}) was soft-deleted/terminated.`,
      ipAddress: '127.0.0.1'
    });

    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      await SystemNotificationService.notifyRoles(employee.companyId || companyId, ['Admin', 'HR'], {
        companyId: employee.companyId || companyId,
        title: 'Employee Terminated',
        content: `${employee.fullName} (${employee.email}) has been deactivated/terminated.`,
        type: 'other',
        targetPage: 'employees'
      });
    } catch (notifErr) {
      console.error('Failed to trigger employee termination notification:', notifErr);
    }

    return { 
      message: 'Employee deleted/terminated successfully', 
      status: 200 
    };
  }

  static async getDeletedEmployees(companyId: string) {
    const archivedList = await Employee.find({ companyId, isActive: false }).sort({ updatedAt: -1 });
    return { data: archivedList, status: 200 };
  }

  static async lifecycleEmployee(id: string, actionData: any, decoded: any) {
    const { action, reason, stage } = actionData;
    const companyId = decoded.companyId;
    const performedBy = decoded.email || decoded.fullName || 'Admin';
    const userRole = decoded.role;

    // Permissions check
    if (userRole !== 'Admin' && userRole !== 'Company Admin') {
      if (['resign', 'terminate', 'progress-exit'].includes(action)) {
        return { error: 'Forbidden: Admin permissions required for this lifecycle action', status: 403 };
      }
      if (!['deactivate', 'suspend', 'reactivate'].includes(action)) {
        return { error: 'Invalid lifecycle action', status: 400 };
      }
    }

    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return { error: 'Employee not found', status: 404 };
    }

    if (employee.companyId !== companyId) {
      return { error: 'Forbidden: You do not own this employee record', status: 403 };
    }

    const emailLower = employee.email.toLowerCase().trim();

    if (!employee.exitWorkflow) {
      employee.exitWorkflow = { stage: 'None' };
    }

    let auditAction = '';
    let auditDetails = '';

    switch (action) {
      case 'deactivate':
        employee.isActive = false;
        employee.status = 'Inactive';
        employee.exitWorkflow.stage = 'Account Deactivated';
        employee.exitWorkflow.deactivatedAt = new Date();
        employee.exitWorkflow.deactivatedBy = performedBy;

        await User.updateMany({ email: emailLower }, { $set: { isActive: false, status: 'Inactive' } });
        auditAction = 'Employee Deactivated';
        auditDetails = `Employee ${employee.fullName} (${employee.email}) was deactivated. Reason: ${reason || 'N/A'}`;
        break;

      case 'suspend':
        employee.isActive = false;
        employee.status = 'Suspended';
        employee.suspendedAt = new Date();
        employee.suspendedBy = performedBy;
        employee.suspensionReason = reason || 'N/A';

        await User.updateMany({ email: emailLower }, { $set: { isActive: false, status: 'Suspended' } });
        auditAction = 'Employee Suspended';
        auditDetails = `Employee ${employee.fullName} (${employee.email}) was suspended. Reason: ${reason || 'N/A'}`;
        break;

      case 'resign':
        employee.isActive = false;
        employee.status = 'Resigned';
        employee.resignedAt = new Date();
        employee.resignationReason = reason || 'N/A';
        employee.exitWorkflow.stage = 'Resignation Submitted';
        employee.exitWorkflow.resignationSubmittedAt = new Date();
        employee.exitWorkflow.resignationReason = reason || 'N/A';

        await User.updateMany({ email: emailLower }, { $set: { isActive: false, status: 'Resigned' } });
        auditAction = 'Employee Resigned';
        auditDetails = `Employee ${employee.fullName} (${employee.email}) submitted resignation. Reason: ${reason || 'N/A'}`;
        break;

      case 'terminate':
        employee.isActive = false;
        employee.status = 'Terminated';
        employee.terminatedAt = new Date();
        employee.terminatedBy = performedBy;
        employee.terminationReason = reason || 'N/A';
        employee.exitWorkflow.stage = 'Archived';
        employee.exitWorkflow.archivedAt = new Date();
        employee.exitWorkflow.archivedBy = performedBy;

        await User.updateMany({ email: emailLower }, { $set: { isActive: false, status: 'Terminated' } });
        auditAction = 'Employee Terminated';
        auditDetails = `Employee ${employee.fullName} (${employee.email}) was terminated. Reason: ${reason || 'N/A'}`;
        break;

      case 'reactivate':
        employee.isActive = true;
        employee.status = 'Active';
        employee.exitWorkflow = { stage: 'None' };
        employee.terminatedAt = undefined;
        employee.terminatedBy = undefined;
        employee.terminationReason = undefined;
        employee.suspendedAt = undefined;
        employee.suspendedBy = undefined;
        employee.suspensionReason = undefined;
        employee.resignedAt = undefined;
        employee.resignationReason = undefined;

        await User.updateMany({ email: emailLower }, { $set: { isActive: true, status: 'Active' } });
        auditAction = 'Employee Reactivated';
        auditDetails = `Employee ${employee.fullName} (${employee.email}) was reactivated. Reason: ${reason || 'N/A'}`;
        break;

      case 'progress-exit':
        if (!stage) {
          return { error: 'Stage parameter is required to progress exit workflow', status: 400 };
        }
        employee.exitWorkflow.stage = stage;

        if (stage === 'HR Review') {
          employee.exitWorkflow.hrReviewedAt = new Date();
          employee.exitWorkflow.hrReviewedBy = performedBy;
        } else if (stage === 'Manager Approval') {
          employee.exitWorkflow.managerApprovedAt = new Date();
          employee.exitWorkflow.managerApprovedBy = performedBy;
        } else if (stage === 'Exit Clearance') {
          employee.exitWorkflow.clearanceCompletedAt = new Date();
          employee.exitWorkflow.clearanceCompletedBy = performedBy;
        } else if (stage === 'Account Deactivated') {
          employee.exitWorkflow.deactivatedAt = new Date();
          employee.exitWorkflow.deactivatedBy = performedBy;
          employee.isActive = false;
          await User.updateMany({ email: emailLower }, { $set: { isActive: false, status: 'Inactive' } });
        } else if (stage === 'Archived') {
          employee.exitWorkflow.archivedAt = new Date();
          employee.exitWorkflow.archivedBy = performedBy;
          employee.isActive = false;
        }

        auditAction = 'Employee Exit Workflow Updated';
        auditDetails = `Exit workflow for ${employee.fullName} (${employee.email}) advanced to: ${stage}`;
        break;

      default:
        return { error: 'Invalid lifecycle action', status: 400 };
    }

    await employee.save();

    // Log action in audit log
    await AuditLog.create({
      companyId,
      action: auditAction,
      performedBy,
      details: auditDetails,
      ipAddress: '127.0.0.1'
    });

    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      if (emailLower) {
        await SystemNotificationService.createNotification({
          companyId,
          userId: emailLower,
          title: `Status: ${employee.status}`,
          content: `Your employee status has been updated to ${employee.status}.`,
          type: 'other',
          targetPage: 'employees'
        });
      }

      if (['resign', 'terminate', 'deactivate'].includes(action)) {
        await SystemNotificationService.notifyRoles(companyId, ['Admin', 'HR'], {
          companyId,
          title: `Employee Lifecycle Action`,
          content: `Action '${action}' was performed on ${employee.fullName} (${employee.email}).`,
          type: 'other',
          targetPage: 'employees'
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger employee lifecycle notification:', notifErr);
    }

    return {
      message: `Employee lifecycle action '${action}' processed successfully.`,
      employee,
      status: 200
    };
  }
}
