import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { Attendance } from '@/app/api/models/Attendance';
import { Leave } from '@/app/api/models/Leave';
import { Payroll } from '@/app/api/models/Payroll';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HR')) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const companyId = decoded.companyId || 'company_001';
    
    // Load company branding dynamically
    let branding: any = null;
    try {
      const { CompanyBranding } = await import('@/app/api/models/CompanyBranding');
      branding = await CompanyBranding.findOne({ companyId });
    } catch (err) {
      console.error('Failed to load branding in PDF exporter:', err);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'workforce';
    let branchId = searchParams.get('branchId');
    if (decoded.role === 'HR' && decoded.branchId) {
      branchId = decoded.branchId;
    }

    const filter: any = { companyId };
    if (branchId) {
      filter.branchId = branchId;
    }

    let title = 'Workforce Directory Summary';
    let tableHeaders = '';
    let tableRows = '';

    if (type === 'payroll') {
      title = 'Payroll Cost & Salary Summary';
      const records = await Payroll.find(filter);
      tableHeaders = `
        <th>Employee</th>
        <th class="text-center">Month</th>
        <th class="text-right">Basic</th>
        <th class="text-right">Bonus</th>
        <th class="text-right">Deductions</th>
        <th class="text-right">Net Paid</th>
        <th class="text-center">Status</th>
      `;
      records.forEach(p => {
        const deduct = (p.pf || 0) + (p.esi || 0) + (p.tax || 0) + (p.otherDeductions || 0) + (p.leaveDeductions || 0);
        tableRows += `
          <tr>
            <td><strong>${p.employeeName || ''}</strong><br><small style="color: #64748b;">${p.employee}</small></td>
            <td class="text-center">${p.month}</td>
            <td class="text-right">₹${p.basic.toLocaleString('en-IN')}</td>
            <td class="text-right">₹${(p.bonus || 0).toLocaleString('en-IN')}</td>
            <td class="text-right">₹${deduct.toLocaleString('en-IN')}</td>
            <td class="text-right"><strong>₹${p.net.toLocaleString('en-IN')}</strong></td>
            <td class="text-center"><span class="badge ${p.status.toLowerCase()}">${p.status}</span></td>
          </tr>
        `;
      });
    } 
    
    else if (type === 'attendance') {
      title = 'Workforce Attendance Report';
      const records = await Attendance.find(filter).sort({ date: -1 });
      tableHeaders = `
        <th>Employee Name</th>
        <th class="text-center">Date</th>
        <th class="text-center">Check In</th>
        <th class="text-center">Check Out</th>
        <th class="text-center">Status</th>
        <th class="text-center">Duration</th>
      `;
      records.forEach(r => {
        tableRows += `
          <tr>
            <td><strong>${r.name}</strong></td>
            <td class="text-center">${r.date}</td>
            <td class="text-center">${r.timeIn}</td>
            <td class="text-center">${r.timeOut}</td>
            <td class="text-center"><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
            <td class="text-center">${r.duration}</td>
          </tr>
        `;
      });
    } 
    
    else if (type === 'leaves') {
      title = 'Employee Leave Log Report';
      const records = await Leave.find(filter).sort({ createdAt: -1 });
      tableHeaders = `
        <th>Employee</th>
        <th>Department</th>
        <th>Leave Type</th>
        <th>Date Range</th>
        <th>Reason</th>
        <th class="text-center">Status</th>
      `;
      records.forEach(l => {
        tableRows += `
          <tr>
            <td><strong>${l.name}</strong></td>
            <td>${l.dept}</td>
            <td>${l.type}</td>
            <td>${l.date}</td>
            <td>${l.reason}</td>
            <td class="text-center"><span class="badge ${l.status.toLowerCase()}">${l.status}</span></td>
          </tr>
        `;
      });
    } 
    
    else {
      // Default: Workforce
      title = 'Enterprise Workforce Directory';
      const records = await Employee.find(filter);
      tableHeaders = `
        <th>Employee Name</th>
        <th>Department</th>
        <th>Designation</th>
        <th>Email / Phone</th>
        <th class="text-center">Joined Date</th>
        <th>Location</th>
        <th class="text-center">Status</th>
      `;
      records.forEach(e => {
        tableRows += `
          <tr>
            <td><strong>${e.fullName}</strong></td>
            <td>${e.department}</td>
            <td>${e.designation}</td>
            <td>${e.email}<br><small style="color: #64748b;">${e.phone}</small></td>
            <td class="text-center">${e.joinedDate ? new Date(e.joinedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
            <td>${e.location}</td>
            <td class="text-center"><span class="badge ${e.status.toLowerCase()}">${e.status}</span></td>
          </tr>
        `;
      });
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - Export Sheet</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1e293b;
      margin: 30px;
      padding: 0;
      background-color: #ffffff;
    }
    .header {
      border-bottom: 2px solid ${branding?.primaryColor || '#3b82f6'};
      padding-bottom: 15px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${branding?.primaryColor || '#1e3a8a'};
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 12px;
      color: #64748b;
    }
    .meta-box {
      font-size: 11px;
      text-align: right;
      color: #475569;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      text-align: left;
      padding: 10px 12px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      background-color: #e2e8f0;
      color: #475569;
    }
    .badge.present, .badge.approved, .badge.paid, .badge.active {
      background-color: #dcfce7;
      color: #15803d;
    }
    .badge.absent, .badge.rejected, .badge.unpaid, .badge.inactive, .badge.suspended {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .badge.late, .badge.pending {
      background-color: #fef3c7;
      color: #b45309;
    }
    @media print {
      body {
        margin: 15px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; align-items: center; gap: 15px;">
      ${branding?.companyLogo ? `<img src="${branding.companyLogo}" alt="Logo" style="max-height: 40px; max-width: 150px; object-fit: contain;" />` : ''}
      <div style="text-align: left;">
        <h1>${branding?.companyName || 'HR Core Systems'}</h1>
        <p>${title}</p>
      </div>
    </div>
    <div class="meta-box">
      ${branding?.companyAddress ? `<strong>Address:</strong> ${branding.companyAddress}<br>` : ''}
      <strong>Generated By:</strong> ${decoded.fullName || decoded.email}<br>
      <strong>Date:</strong> ${new Date().toLocaleString()}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        ${tableHeaders}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `;

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error: any) {
    console.error('Failed to export PDF report:', error);
    return new Response(`Failed to export PDF report: ${error.message}`, { status: 500 });
  }
}

