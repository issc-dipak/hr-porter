import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Resignation } from '../../../../models/Resignation';
import { ExperienceLetter } from '../../../../models/ExperienceLetter';
import { Employee } from '../../../../models/Employee';
import { User } from '../../../../models/User';
import { CompanyBranding } from '../../../../models/CompanyBranding';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '../../../../utils/email';
import { generateExperienceLetterPdf } from '../../../../utils/pdf';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const companyId = decoded.companyId || 'company_001';

    const resignation = await Resignation.findById(id);
    if (!resignation) {
      return NextResponse.json({ error: 'Resignation not found' }, { status: 404 });
    }
    if (resignation.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get employee details
    const employee = await Employee.findOne({ companyId, email: resignation.employeeEmail });
    if (!employee) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    const branding = await CompanyBranding.findOne({ companyId });
    const companyLogo = branding?.companyLogo || '';
    const companyName = branding?.companyName || 'HR Core Labs';
    const primaryColor = branding?.primaryColor || '#2563eb';

    const joinedDate = employee.joinedDate || new Date();
    const exitDate = resignation.lastWorkingDay || new Date();
    const designation = employee.designation || 'Software Engineer';

    // Generate letter HTML content
    const letterContent = `
      <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; color: #1e293b; position: relative;">
        <!-- Watermark / Background Styling -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.02; background: radial-gradient(circle, ${primaryColor} 10%, transparent 80%); pointer-events: none;"></div>
        
        <div style="text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
          ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; object-fit: contain; margin-bottom: 8px;" />` : ''}
          <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
          <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Enterprise Human Resource Management Systems</p>
        </div>

        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px;">TO WHOMSOEVER IT MAY CONCERN</h2>
        </div>

        <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
          This is to certify that <strong>${resignation.employeeName}</strong> was employed with us as a <strong>${designation}</strong> from <strong>${joinedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> to <strong>${exitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
        </p>

        <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
          During their tenure with us, they demonstrated exceptional professionalism, dedication, and technical competence. They have contributed significantly to key projects within the engineering department. Their conduct was exemplary, and we found them to be reliable, hardworking, and honest.
        </p>

        <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 40px;">
          We thank <strong>${resignation.employeeName}</strong> for their service and wish them the absolute best in their future professional endeavors.
        </p>

        <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <p style="margin: 0; font-size: 13px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
            <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Location: Mumbai, India</p>
          </div>
          <div style="text-align: center;">
            <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin-bottom: 5px;"></div>
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Authorized Signatory</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">HR Operations Team</p>
          </div>
        </div>
      </div>
    `;

    const pdfUrl = `/api/resignations/${id}/experience-letter`;

    let letter = await ExperienceLetter.findOne({ resignationId: id, companyId });
    if (letter) {
      letter.joinedDate = joinedDate;
      letter.exitDate = exitDate;
      letter.designation = designation;
      letter.letterContent = letterContent;
      letter.pdfUrl = pdfUrl;
      await letter.save();
    } else {
      letter = await ExperienceLetter.create({
        companyId,
        resignationId: id,
        employeeEmail: resignation.employeeEmail,
        employeeName: resignation.employeeName,
        joinedDate,
        exitDate,
        designation,
        pdfUrl,
        letterContent
      });
    }

    resignation.history.push({
      action: 'Experience Letter Generated',
      performedBy: decoded.email,
      performedByRole: decoded.role,
      details: 'Experience certificate template generated.'
    });
    await resignation.save();

    // Generate Experience Letter PDF
    let expPdfBuffer: Buffer | undefined;
    try {
      expPdfBuffer = await generateExperienceLetterPdf(resignation, employee, branding);
    } catch (pdfErr) {
      console.error('Failed to generate PDF for manual experience letter:', pdfErr);
    }

    // Send Experience Letter Email
    try {
      await sendEmail({
        to: resignation.employeeEmail,
        subject: `Experience Certificate - ${companyName}`,
        text: `Dear ${resignation.employeeName},\n\nPlease find below and attached your Experience Certificate from ${companyName}.\n\nRegards,\nHR Operations`,
        html: letterContent,
        attachments: expPdfBuffer ? [
          {
            filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Experience_Certificate.pdf`,
            content: expPdfBuffer
          }
        ] : undefined
      });
    } catch (emailErr) {
      console.error('Failed to send experience letter email:', emailErr);
    }

    return NextResponse.json({ message: 'Experience letter generated successfully', data: letter }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to generate experience letter:', error);
    return NextResponse.json({ error: 'Failed to generate experience letter', details: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const resignation = await Resignation.findById(id);
    if (!resignation) {
      return new Response('Resignation not found', { status: 404 });
    }

    const companyId = resignation.companyId;

    if (resignation.companyId !== decoded.companyId) {
      return new Response('Forbidden', { status: 403 });
    }

    if (decoded.role === 'Employee' && decoded.email.toLowerCase() !== resignation.employeeEmail.toLowerCase()) {
      return new Response('Forbidden', { status: 403 });
    }

    const branding = await CompanyBranding.findOne({ companyId });
    const companyLogo = branding?.companyLogo || '';
    const companyName = branding?.companyName || 'HR Core Labs';
    const primaryColor = branding?.primaryColor || '#2563eb';

    let letter = await ExperienceLetter.findOne({ resignationId: id, companyId });
    if (!letter) {
      // Auto-generate if not exists
      const employee = await Employee.findOne({ companyId, email: resignation.employeeEmail });
      const joinedDate = employee?.joinedDate || new Date();
      const exitDate = resignation.lastWorkingDay || new Date();
      const designation = employee?.designation || 'Software Engineer';

      const letterContent = `
        <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; color: #1e293b; position: relative;">
          <!-- Watermark / Background Styling -->
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.02; background: radial-gradient(circle, ${primaryColor} 10%, transparent 80%); pointer-events: none;"></div>
          
          <div style="text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
            ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; object-fit: contain; margin-bottom: 8px;" />` : ''}
            <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Enterprise Human Resource Management Systems</p>
          </div>

          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px;">TO WHOMSOEVER IT MAY CONCERN</h2>
          </div>

          <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
            This is to certify that <strong>${resignation.employeeName}</strong> was employed with us as a <strong>${designation}</strong> from <strong>${joinedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> to <strong>${exitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
          </p>

          <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
            During their tenure with us, they demonstrated exceptional professionalism, dedication, and technical competence. They have contributed significantly to key projects within the engineering department. Their conduct was exemplary, and we found them to be reliable, hardworking, and honest.
          </p>

          <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 40px;">
            We thank <strong>${resignation.employeeName}</strong> for their service and wish them the absolute best in their future professional endeavors.
          </p>

          <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="margin: 0; font-size: 13px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
              <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Location: Mumbai, India</p>
            </div>
            <div style="text-align: center;">
              <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin-bottom: 5px;"></div>
              <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Authorized Signatory</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">HR Operations Team</p>
            </div>
          </div>
        </div>
      `;

      const pdfUrl = `/api/resignations/${id}/experience-letter`;

      letter = await ExperienceLetter.create({
        companyId,
        resignationId: id,
        employeeEmail: resignation.employeeEmail,
        employeeName: resignation.employeeName,
        joinedDate,
        exitDate,
        designation,
        pdfUrl,
        letterContent
      });

      resignation.history.push({
        action: 'Experience Letter Auto-Generated',
        performedBy: decoded.email,
        performedByRole: decoded.role,
        details: 'Experience certificate template auto-generated on download request.'
      });
      await resignation.save();

      // Generate Experience Letter PDF
      let expPdfBuffer: Buffer | undefined;
      try {
        expPdfBuffer = await generateExperienceLetterPdf(resignation, employee, branding);
      } catch (pdfErr) {
        console.error('Failed to generate PDF for auto experience letter:', pdfErr);
      }

      // Send Experience Letter Email
      try {
        await sendEmail({
          to: resignation.employeeEmail,
          subject: `Experience Certificate - ${companyName}`,
          text: `Dear ${resignation.employeeName},\n\nPlease find below and attached your Experience Certificate from ${companyName}.\n\nRegards,\nHR Operations`,
          html: letterContent,
          attachments: expPdfBuffer ? [
            {
              filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Experience_Certificate.pdf`,
              content: expPdfBuffer
            }
          ] : undefined
        });
      } catch (emailErr) {
        console.error('Failed to send experience letter email:', emailErr);
      }
    }

    // Wrap the letter content in a clean, print-friendly HTML page
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Experience Certificate - ${letter.employeeName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
          }
          .print-container {
            background: #ffffff;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            box-sizing: border-box;
            position: relative;
          }
          @media print {
            body {
              background: none;
            }
            .print-container {
              box-shadow: none;
              padding: 10mm;
              margin: 0;
              width: 100%;
              min-height: auto;
            }
            .no-print {
              display: none !important;
            }
          }
          .no-print-bar {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
          }
          .print-btn {
            background-color: ${primaryColor};
            color: #ffffff;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            font-family: 'Outfit', sans-serif;
          }
          .print-btn:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar no-print">
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="print-container">
          <!-- Dynamic Header from Branding -->
          <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; position: relative;">
            <div style="text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 40px;">
              ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 60px; object-fit: contain; margin-bottom: 10px;" />` : ''}
              <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
              <p style="margin: 5px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">Enterprise Corporate Certificate</p>
            </div>

            <div style="text-align: center; margin-bottom: 50px;">
              <h2 style="margin: 0; font-size: 24px; color: #0f172a; font-weight: 800; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; display: inline-block; padding-bottom: 8px;">EXPERIENCE CERTIFICATE</h2>
            </div>

            <div style="font-size: 16px; line-height: 1.9; color: #334155; text-align: justify; margin-bottom: 30px; font-family: 'Inter', sans-serif;">
              <p>To Whomsoever It May Concern,</p>
              <br/>
              <p>
                This is to certify that <strong>${letter.employeeName}</strong> was employed with <strong>${companyName}</strong> as a <strong>${letter.designation}</strong>. Their period of service was from <strong>${new Date(letter.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> to <strong>${new Date(letter.exitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>
              <br/>
              <p>
                During their tenure with us, we found them to be highly competent, reliable, and extremely dedicated to their work. They played a key role in their team, collaborating productively and showing exceptional professionalism in all tasks.
              </p>
              <p>
                Their conduct during their tenure was exemplary. They exit our organization in good standing, and we wish them the absolute best of luck and success in all their future endeavors.
              </p>
            </div>

            <div style="margin-top: 100px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500;">Date: ${new Date(letter.generatedAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 2px 0 0; font-size: 14px; color: #64748b; font-weight: 500;">Place: Corporate Headquarters</p>
              </div>
              <div style="text-align: center;">
                <div style="width: 180px; border-bottom: 2px solid #94a3b8; margin-bottom: 8px;"></div>
                <p style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a;">Authorized Signatory</p>
                <p style="margin: 2px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">Human Resource Department</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(fullHtml, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error: any) {
    console.error('Failed to retrieve experience letter printout:', error);
    return new Response('Failed to retrieve experience letter printout: ' + error.message, { status: 500 });
  }
}
