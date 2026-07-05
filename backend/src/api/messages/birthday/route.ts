import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { Message } from '@/app/api/models/Message';
import { User } from '@/app/api/models/User';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '@/app/api/lib/email';

function buildBirthdayEmailHTML(recipientName: string, messageBody: string) {
  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #fdf2f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #fdf2f8;">
    <tr>
      <td align="center" style="padding: 30px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #fbcfe8; box-shadow: 0 10px 15px -3px rgba(219, 39, 119, 0.05), 0 4px 6px -4px rgba(219, 39, 119, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td align="center" style="padding: 40px 40px; background: linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f43f5e 100%); text-align: center;">
              <span style="font-size: 32px;">🎉🎂🎈</span>
              <h1 style="margin: 12px 0 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; text-transform: uppercase;">Happy Birthday!</h1>
              <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #fce7f3; letter-spacing: 1.5px;">WISHING YOU A WONDERFUL YEAR AHEAD</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td align="left" style="padding: 40px; background-color: #ffffff;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #0f172a; line-height: 1.6;">Dear <strong>${recipientName}</strong>,</p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #334155; line-height: 1.6;">
                ${messageBody.replace(/\n/g, '<br/>')}
              </p>

              <!-- Quote card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff1f2; border: 1px dashed #fecdd3; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <tr>
                  <td>
                    <span style="font-size: 24px; display: block; margin-bottom: 8px;">✨🎁🧁✨</span>
                    <p style="margin: 0; font-size: 13px; font-style: italic; color: #be123c; font-weight: 600; line-height: 1.5;">
                      "Count your life by smiles, not tears. Count your age by friends, not years."
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 13px; color: #64748b; line-height: 1.6;">Warmest wishes,<br/><strong style="color: #db2777; font-size: 14px;">The Entire HR & Corporate Family</strong></p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 40px; background-color: #fff1f2; border-top: 1px solid #ffe4e6;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #9f1239; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">HR Core Corporation</p>
              <p style="margin: 0; font-size: 10px; color: #fda4af; line-height: 1.5;">This email is sent on behalf of HR Department to celebrate team member milestones.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// GET: List employees with today's birthday (or upcoming within 30 days)
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const employees = await Employee.find({ companyId: decoded.companyId, dateOfBirth: { $ne: '', $exists: true } });

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const upcomingDays = 30; // show birthdays within next 30 days

    const birthdayEmployees = employees
      .map(emp => {
        if (!emp.dateOfBirth) return null;
        const dob = new Date(emp.dateOfBirth);
        if (isNaN(dob.getTime())) return null;
        const empMonth = dob.getMonth() + 1;
        const empDay = dob.getDate();

        // Calculate birthday in current year
        let birthdayDate = new Date(today.getFullYear(), empMonth - 1, empDay);
        
        // If the birthday has already passed this year (and is not today),
        // we should look at next year's birthday
        if (birthdayDate.getTime() < todayDate.getTime()) {
          birthdayDate = new Date(today.getFullYear() + 1, empMonth - 1, empDay);
        }

        const diff = Math.round((birthdayDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          _id: emp._id,
          name: emp.fullName,
          email: emp.email,
          department: emp.department,
          profilePicture: emp.profilePicture || '',
          dateOfBirth: emp.dateOfBirth,
          daysUntil: diff,
          isToday: diff === 0,
          birthdayDisplay: birthdayDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        };
      })
      .filter((emp): emp is NonNullable<typeof emp> => emp !== null && emp.daysUntil <= upcomingDays)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json(birthdayEmployees, { status: 200 });
  } catch (error: any) {
    console.error('Birthday GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch birthdays' }, { status: 500 });
  }
}

// POST: Send birthday wishes to specified employees (or all today's birthdays)
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as any;
    const { employeeEmails, customMessage } = body; // array of emails to wish, optional custom message

    await connectToDatabase();

    // Fetch sender info
    const sender = await User.findById(decoded.userId);
    const senderName = sender?.fullName || decoded.email;

    let targets: { email: string; name: string }[] = [];

    if (employeeEmails && employeeEmails.length > 0) {
      // Wish specific employees belonging to this company
      const employees = await Employee.find({ companyId: decoded.companyId, email: { $in: employeeEmails } });
      targets = employees.map(e => ({ email: e.email, name: e.fullName }));
    } else {
      // Auto-detect today's birthday employees belonging to this company
      const today = new Date();
      const employees = await Employee.find({ companyId: decoded.companyId, dateOfBirth: { $ne: '', $exists: true } });
      for (const emp of employees) {
        if (!emp.dateOfBirth) continue;
        const dob = new Date(emp.dateOfBirth);
        if (isNaN(dob.getTime())) continue;
        if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
          targets.push({ email: emp.email, name: emp.fullName });
        }
      }
    }

    if (targets.length === 0) {
      return NextResponse.json({ message: 'No birthday employees found for today', sent: 0 }, { status: 200 });
    }

    // Send a birthday wish message to each target
    const messages = targets.map(t => ({
      fromEmail: decoded.email,
      fromName: senderName,
      fromRole: decoded.role || 'HR',
      toEmail: t.email,
      toName: t.name,
      subject: `🎂 Happy Birthday, ${t.name.split(' ')[0]}!`,
      body: customMessage ||
        `Wishing you a very Happy Birthday, ${t.name.split(' ')[0]}! 🎉🎂\n\nMay this special day bring you joy, happiness, and all the success you deserve. Your contribution to the team has been truly valuable.\n\nHappy Birthday from all of us at the team! 🥳`,
      type: 'birthday_wish',
      isRead: false,
      sentAt: new Date(),
    }));

    await Message.insertMany(messages);

    // Send professional festive email to each target
    for (const t of targets) {
      const emailBody = customMessage ||
        `Wishing you a very Happy Birthday, ${t.name.split(' ')[0]}! 🎉🎂\n\nMay this special day bring you joy, happiness, and all the success you deserve. Your contribution to the team has been truly valuable.\n\nHappy Birthday from all of us at the team! 🥳`;

      const htmlContent = buildBirthdayEmailHTML(t.name, emailBody);

      sendEmail({
        to: t.email,
        subject: `🎂 Happy Birthday, ${t.name}!`,
        text: emailBody,
        html: htmlContent
      }).catch(err => {
        console.error(`Failed to send birthday email to ${t.email}:`, err);
      });
    }

    return NextResponse.json({
      message: `Birthday wishes sent to ${targets.length} employee(s)!`,
      sent: targets.length,
      recipients: targets.map(t => t.name)
    }, { status: 201 });
  } catch (error: any) {
    console.error('Birthday POST error:', error);
    return NextResponse.json({ error: 'Failed to send birthday wishes' }, { status: 500 });
  }
}

