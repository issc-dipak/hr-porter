import { Employee } from '../models/Employee';
import { Attendance } from '../models/Attendance';
import { Leave } from '../models/Leave';
import { Payroll } from '../models/Payroll';
import { Job } from '../models/Job';
import { sendEmail } from '../utils/email';
import { ReportSchedule } from '../models/ReportSchedule';

export class ReportSchedulerService {
  private static checkTimeout: NodeJS.Timeout | null = null;
  private static active: boolean = false;

  public static start() {
    console.log('[Scheduler] Initializing Scheduled Report Digest runner loop...');
    this.active = true;
    this.scheduleNextRun();
  }

  public static stop() {
    this.active = false;
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
      this.checkTimeout = null;
      console.log('[Scheduler] Stopped background runner check loop.');
    }
  }

  private static scheduleNextRun() {
    if (!this.active) return;
    
    const now = new Date();
    // Delay until the start of the next exact minute
    const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    this.checkTimeout = setTimeout(() => {
      this.runAndReschedule().catch((err) => {
        console.error('[Scheduler_ERROR] Error running schedules check:', err);
      });
    }, delay);
  }

  private static async runAndReschedule() {
    try {
      await this.checkSchedules();
    } finally {
      this.scheduleNextRun();
    }
  }

  private static async checkSchedules() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const hourStr = String(currentHour).padStart(2, '0');
    const minStr = String(currentMinute).padStart(2, '0');
    const timeMatch = `${hourStr}:${minStr}`;

    // Find schedules that match the current time
    const dueSchedules = await ReportSchedule.find({ time: timeMatch });
    
    if (dueSchedules.length > 0) {
      console.log(`[Scheduler] Found ${dueSchedules.length} schedules due at ${timeMatch}`);
    }

    for (const schedule of dueSchedules) {
      let threshold = 0;
      if (schedule.frequency === 'Daily') {
        threshold = 23 * 60 * 60 * 1000;
      } else if (schedule.frequency === 'Weekly') {
        threshold = 6 * 24 * 60 * 60 * 1000;
      } else if (schedule.frequency === 'Monthly') {
        threshold = 28 * 24 * 60 * 60 * 1000;
      }

      if (schedule.lastSentAt && (now.getTime() - schedule.lastSentAt.getTime() < threshold)) {
        console.log(`[Scheduler] Schedule ${schedule._id} already sent within threshold. Skipping.`);
        continue;
      }

      try {
        console.log(`[Scheduler] Processing schedule ${schedule._id} for ${schedule.email}...`);
        await this.generateAndSendReport(schedule);
        
        schedule.lastSentAt = now;
        await schedule.save();
        console.log(`[Scheduler] Schedule ${schedule._id} completed and updated successfully.`);
      } catch (err) {
        console.error(`[Scheduler_CRITICAL] Failed to execute schedule ${schedule._id}:`, err);
      }
    }
  }

  private static async generateAndSendReport(schedule: any) {
    const companyId = schedule.companyId;
    const email = schedule.email;
    const type = schedule.reportType;

    // Load data from models
    const activeEmployees = await Employee.find({ companyId, status: 'Active' });
    const headcount = activeEmployees.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.find({ companyId, date: todayStr });
    const presentCount = todayAttendance.filter(r => ['Present', 'On Time', 'Late'].includes(r.status)).length;
    const lateCount = todayAttendance.filter(r => r.status === 'Late').length;

    const approvedLeaves = await Leave.find({ companyId, status: 'Approved' });
    const pendingLeaves = await Leave.find({ companyId, status: 'Pending' });

    const totalPayroll = await Payroll.find({ companyId });
    let payrollTotal = 0;
    totalPayroll.forEach(p => payrollTotal += p.net);

    const activeJobs = await Job.find({ companyId, status: 'Published' });
    let applicantCount = 0;
    activeJobs.forEach(j => {
      if (j.applicants) applicantCount += j.applicants.length;
    });

    let reportTitle = 'Enterprise Summary Report';
    let contentHtml = '';

    if (type === 'attendance') {
      reportTitle = 'Scheduled Attendance Status Digest';
      contentHtml = `
        <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Attendance Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: sans-serif; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Active Headcount</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${headcount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Present Today</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; color: #16a34a;">${presentCount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Late Arrivals</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; color: #d97706;">${lateCount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Absent Today</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; color: #dc2626;">${Math.max(0, headcount - presentCount)}</td>
          </tr>
        </table>
      `;
    } else if (type === 'leaves') {
      reportTitle = 'Scheduled Leaves Tracker Digest';
      contentHtml = `
        <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Leaves Ledger Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: sans-serif; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Approved Active Leaves</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; color: #16a34a;">${approvedLeaves.length}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Pending Approvals Queue</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; color: #d97706;">${pendingLeaves.length}</td>
          </tr>
        </table>
      `;
    } else if (type === 'payroll') {
      reportTitle = 'Scheduled Payroll Finance Digest';
      contentHtml = `
        <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Payroll Cost Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: sans-serif; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Net Paid Cost (All-time)</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; color: #16a34a; font-weight: bold;">₹${payrollTotal.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Total Slips Processed</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${totalPayroll.length}</td>
          </tr>
        </table>
      `;
    } else if (type === 'recruitment') {
      reportTitle = 'Scheduled Recruitment ATS Digest';
      contentHtml = `
        <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">ATS Pipeline Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: sans-serif; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Active Job Openings</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${activeJobs.length}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Total Candidates Sourced</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; color: #2563eb;">${applicantCount}</td>
          </tr>
        </table>
      `;
    } else {
      // Default: All sections combined
      reportTitle = 'Scheduled Full Enterprise Report Digest';
      contentHtml = `
        <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Enterprise Performance Summary</h3>
        
        <h4 style="margin: 15px 0 5px 0; color: #334155;">1. Workforce Headcount</h4>
        <p style="font-size: 14px; margin: 0 0 15px 0;">Total active staff directory count: <strong>${headcount} employees</strong>.</p>
        
        <h4 style="margin: 15px 0 5px 0; color: #334155;">2. Today's Attendance</h4>
        <p style="font-size: 14px; margin: 0 0 15px 0;">Present: <strong>${presentCount}</strong> | Late: <strong>${lateCount}</strong> | Absent: <strong>${Math.max(0, headcount - presentCount)}</strong></p>

        <h4 style="margin: 15px 0 5px 0; color: #334155;">3. Leave Requests</h4>
        <p style="font-size: 14px; margin: 0 0 15px 0;">Approved: <strong>${approvedLeaves.length}</strong> | Pending operational review: <strong>${pendingLeaves.length}</strong></p>

        <h4 style="margin: 15px 0 5px 0; color: #334155;">4. Financial Payroll Cost</h4>
        <p style="font-size: 14px; margin: 0 0 15px 0;">Total net salary payout: <strong>₹${payrollTotal.toLocaleString('en-IN')}</strong> (${totalPayroll.length} payslips)</p>

        <h4 style="margin: 15px 0 5px 0; color: #334155;">5. Recruitment Pipeline</h4>
        <p style="font-size: 14px; margin: 0 0 15px 0;">Active vacancies published: <strong>${activeJobs.length} openings</strong> with <strong>${applicantCount} sourced candidates</strong>.</p>
      `;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1e3a8a;">HR System Operations Digest</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Automated scheduled delivery (${schedule.frequency})</p>
        </div>
        
        <p style="font-size: 14px;">Hello Admin,</p>
        <p style="font-size: 14px;">Here is your scheduled compliance and operations data report for <strong>${new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</strong>.</p>
        
        <div style="margin: 25px 0;">
          ${contentHtml}
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0;">This email is auto-generated by your HR Command Center.</p>
          <p style="margin: 5px 0 0 0;">Recipient: ${email} • Scheduled Time: ${schedule.time} (${schedule.frequency})</p>
        </div>
      </div>
    `;

    console.log(`[Scheduler] Sending email using Brevo/SMTP to ${email} for schedule ${schedule._id}...`);
    
    await sendEmail({
      to: email,
      subject: `[HR System] ${reportTitle}`,
      text: `Scheduled HR Operations report for ${new Date().toLocaleDateString()}`,
      html: emailHtml
    });
  }
}
