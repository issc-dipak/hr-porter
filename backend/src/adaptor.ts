import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { verifyAuth } from './api/lib/auth';
import { checkUserPermission } from './api/lib/rbac';
import { NextResponse } from 'next/server';

function getRequiredPermission(pathname: string, method: string): string | null {
  // Public routes
  if (
    pathname.startsWith('/api/auth') || 
    pathname === '/api/hello' || 
    pathname === '/api/rbac/me' ||
    pathname.startsWith('/api/rbac/roles') ||
    pathname.startsWith('/api/rbac/permissions') ||
    pathname.startsWith('/api/rbac/users') ||
    pathname === '/api/onboarding-upload'
  ) {
    return null;
  }
  
  // Public careers endpoints
  if (pathname.startsWith('/api/careers') && method === 'GET') {
    return null;
  }

  // Employees Management
  if (pathname.startsWith('/api/employees')) {
    if (method === 'GET') return 'employee.view';
    if (method === 'POST') return 'employee.create';
    if (method === 'PUT' || method === 'PATCH') {
      if (pathname.includes('/lifecycle')) return 'employee.archive';
      return 'employee.edit';
    }
    if (method === 'DELETE') return 'employee.delete';
  }

  // Attendance
  if (pathname.startsWith('/api/attendance')) {
    if (method === 'GET') return 'attendance.view';
    if (method === 'POST') return 'attendance.mark';
    return 'attendance.edit';
  }

  // Leaves
  if (pathname.startsWith('/api/leaves')) {
    if (method === 'GET') return 'leave.view';
    if (method === 'POST') return 'leave.apply';
    return 'leave.approve';
  }

  // Onboarding
  if (pathname.startsWith('/api/onboarding')) {
    // Exclude public candidate self-setup routes from authentication/permissions
    if (
      (pathname.startsWith('/api/onboarding/invite/') && method === 'GET') ||
      (pathname.startsWith('/api/onboarding/') && (
        pathname.endsWith('/profile') ||
        pathname.endsWith('/documents') ||
        pathname.endsWith('/bank') ||
        pathname.endsWith('/professional')
      ) && method === 'PUT')
    ) {
      return null;
    }

    if (method === 'GET' || method === 'POST') return 'onboarding.create';
    return 'onboarding.edit';
  }

  // Payroll
  if (pathname.startsWith('/api/payroll')) {
    if (method === 'GET') return 'payroll.view';
    if (pathname.includes('/generate')) return 'payroll.generate';
    if (pathname.includes('/bank')) return 'payroll.configure_structure';
    return 'payroll.process_salary';
  }

  // Salary
  if (pathname.startsWith('/api/salary')) {
    if (method === 'GET') return 'payroll.view';
    if (pathname.includes('/revision') && method === 'PUT') return 'payroll.release_salary';
    return 'payroll.process_salary';
  }

  // Recruitment
  if (pathname.startsWith('/api/jobs')) {
    if (method === 'GET') return null; // View public listings
    if (method === 'POST') return 'recruitment.create_job';
    return 'recruitment.edit_job';
  }
  if (pathname.startsWith('/api/applications')) {
    if (pathname.includes('/stage') && (method === 'PUT' || method === 'PATCH')) return 'recruitment.hire';
    return 'recruitment.candidate_pipeline';
  }
  if (pathname.startsWith('/api/interviews')) {
    return 'recruitment.schedule_interview';
  }

  // Assets
  if (pathname.startsWith('/api/assets')) {
    if (method === 'GET') return 'assets.view';
    if (method === 'POST') return 'assets.add';
    if (method === 'DELETE') return 'assets.delete';
    return 'assets.edit';
  }

  // Policies
  if (pathname.startsWith('/api/policies')) {
    if (pathname.includes('/acknowledge')) return 'policy.acknowledgement';
    if (method === 'GET') return 'policy.acknowledgement';
    if (method === 'POST') return 'policy.create';
    if (method === 'DELETE') return 'policy.delete';
    return 'policy.edit';
  }

  // Helpdesk
  if (pathname.startsWith('/api/tickets')) {
    if (pathname.includes('/my')) return 'helpdesk.raise';
    if (method === 'POST') return 'helpdesk.raise';
    if (pathname.includes('/assign') || pathname.includes('/status')) return 'helpdesk.resolve';
    return 'helpdesk.raise';
  }

  // Announcements
  if (pathname.startsWith('/api/announcements')) {
    if (method === 'GET') return 'announcement.view';
    return 'announcement.create';
  }

  // Reports & Analytics
  if (pathname.startsWith('/api/reports') || pathname.startsWith('/api/analytics')) {
    return 'reports.dashboard';
  }

  // Audit Logs
  if (pathname.startsWith('/api/auditlogs')) {
    return 'audit.view';
  }

  // Organization structures
  if (pathname.startsWith('/api/branches')) {
    if (method === 'GET') return 'branch.view';
    return 'branch.create';
  }
  if (pathname.startsWith('/api/departments')) {
    if (method === 'GET') return 'employee.view';
    return 'department.create';
  }
  if (pathname.startsWith('/api/designations')) {
    if (method === 'GET') return 'employee.view';
    return 'designation.create';
  }

  return null;
}

export function handleWebRoute(
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const protocol = req.protocol;
      const host = req.get('host');
      const url = `${protocol}://${host}${req.originalUrl}`;

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      // Convert Express req stream to Web Request body
      const method = req.method;
      const hasBody = !['GET', 'HEAD'].includes(method);

      let body: any = undefined;
      if (hasBody) {
        const chunks: any[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
      }

      const webReq = new Request(url, {
        method,
        headers,
        body: hasBody ? body : undefined,
      });

      // ── Enforce RBAC Permission checks ──
      const pathname = new URL(url).pathname;
      const requiredPerm = getRequiredPermission(pathname, method);
      if (requiredPerm) {
        const decoded = verifyAuth(webReq);
        if (!decoded) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        const hasAccess = await checkUserPermission(
          decoded.companyId,
          decoded.userId,
          decoded.role,
          requiredPerm
        );
        if (!hasAccess) {
          res.status(403).json({ error: `Forbidden: Insufficient permissions (${requiredPerm})` });
          return;
        }
      }

      const context = {
        params: Promise.resolve(req.params),
      };

      const webRes = await handler(webReq, context);

      // Send status code
      res.status(webRes.status);

      // Send headers
      webRes.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      });

      // Send body
      const text = await webRes.text();
      res.send(text);
    } catch (error: any) {
      console.error('Express Web Route Adaptor Error:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  };
}

