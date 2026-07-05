import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Resignation } from '../../../../models/Resignation';
import { RelievingLetter } from '../../../../models/RelievingLetter';
import { Employee } from '../../../../models/Employee';
import { User } from '../../../../models/User';
import { CompanyBranding } from '../../../../models/CompanyBranding';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '../../../../utils/email';
import { generateRelievingLetterPdf } from '../../../../utils/pdf';

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
    const primaryColor = branding?.primaryColor || '#10b981';

    const joinedDate = employee.joinedDate || new Date();
    const exitDate = resignation.lastWorkingDay || new Date();
    const designation = employee.designation || 'Software Engineer';

    // Generate relieving letter HTML content
    const letterContent = `
      <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; color: #1e293b; position: relative;">
        <div style="text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
          ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; object-fit: contain; margin-bottom: 8px;" />` : ''}
          <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
          <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Enterprise Human Resource Management Systems</p>
        </div>

        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px;">RELIEVING LETTER</h2>
        </div>

        <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
          Dear <strong>${resignation.employeeName}</strong>,
        </p>

        <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
          We reference your resignation request dated <strong>${new Date(resignation.createdAt).toLocaleDateString()}</strong> from the services of the Company. We wish to inform you that your resignation has been accepted and you are officially relieved from the services of the Company at the close of working hours on <strong>${exitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
        </p>

        <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
          We confirm that your Full & Final Settlement has been successfully calculated and processed. All company credentials, assets, and documentation checklists have been verified and cleared by the HR and Finance departments.
        </p>

        <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 40px;">
          We appreciate the contributions made by you during your period of association with us and wish you the very best in all your future endeavors.
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

    const pdfUrl = `/api/resignations/${id}/relieving-letter`;

    let letter = await RelievingLetter.findOne({ resignationId: id, companyId });
    if (letter) {
      letter.joinedDate = joinedDate;
      letter.exitDate = exitDate;
      letter.designation = designation;
      letter.letterContent = letterContent;
      letter.pdfUrl = pdfUrl;
      await letter.save();
    } else {
      letter = await RelievingLetter.create({
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
      action: 'Relieving Letter Generated',
      performedBy: decoded.email,
      performedByRole: decoded.role,
      details: 'Relieving letter template generated.'
    });
    await resignation.save();

    // Generate Relieving Letter PDF
    let relPdfBuffer: Buffer | undefined;
    try {
      relPdfBuffer = await generateRelievingLetterPdf(resignation, employee, branding);
    } catch (pdfErr) {
      console.error('Failed to generate PDF for manual relieving letter:', pdfErr);
    }

    // Send Relieving Letter Email
    try {
      await sendEmail({
        to: resignation.employeeEmail,
        subject: `Relieving Letter & Exit Confirmation - ${companyName}`,
        text: `Dear ${resignation.employeeName},\n\nPlease find below and attached your Relieving Letter from ${companyName}.\n\nRegards,\nHR Operations`,
        html: letterContent,
        attachments: relPdfBuffer ? [
          {
            filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Relieving_Letter.pdf`,
            content: relPdfBuffer
          }
        ] : undefined
      });
    } catch (emailErr) {
      console.error('Failed to send relieving letter email:', emailErr);
    }

    return NextResponse.json({ message: 'Relieving letter generated successfully', data: letter }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to generate relieving letter:', error);
    return NextResponse.json({ error: 'Failed to generate relieving letter', details: error.message }, { status: 500 });
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
    const primaryColor = branding?.primaryColor || '#10b981';

    let letter = await RelievingLetter.findOne({ resignationId: id, companyId });
    if (!letter) {
      // Auto-generate if not exists
      const employee = await Employee.findOne({ companyId, email: resignation.employeeEmail });
      const joinedDate = employee?.joinedDate || new Date();
      const exitDate = resignation.lastWorkingDay || new Date();
      const designation = employee?.designation || 'Software Engineer';

      const letterContent = `
        <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; color: #1e293b; position: relative;">
          <div style="text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
            ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; object-fit: contain; margin-bottom: 8px;" />` : ''}
            <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Enterprise Human Resource Management Systems</p>
          </div>

          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px;">RELIEVING LETTER</h2>
          </div>

          <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
            Dear <strong>${resignation.employeeName}</strong>,
          </p>

          <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
            We reference your resignation request dated <strong>${new Date(resignation.createdAt).toLocaleDateString()}</strong> from the services of the Company. We wish to inform you that your resignation has been accepted and you are officially relieved from the services of the Company at the close of working hours on <strong>${exitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
          </p>

          <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
            We confirm that your Full & Final Settlement has been successfully calculated and processed. All company credentials, assets, and documentation checklists have been verified and cleared by the HR and Finance departments.
          </p>

          <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 40px;">
            We appreciate the contributions made by you during your period of association with us and wish you the very best in all your future endeavors.
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

      const pdfUrl = `/api/resignations/${id}/relieving-letter`;

      letter = await RelievingLetter.create({
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
        action: 'Relieving Letter Auto-Generated',
        performedBy: decoded.email,
        performedByRole: decoded.role,
        details: 'Relieving letter auto-generated on download request.'
      });
      await resignation.save();

      // Generate Relieving Letter PDF
      let relPdfBuffer: Buffer | undefined;
      try {
        relPdfBuffer = await generateRelievingLetterPdf(resignation, employee, branding);
      } catch (pdfErr) {
        console.error('Failed to generate PDF for auto relieving letter:', pdfErr);
      }

      // Send Relieving Letter Email
      try {
        await sendEmail({
          to: resignation.employeeEmail,
          subject: `Relieving Letter & Exit Confirmation - ${companyName}`,
          text: `Dear ${resignation.employeeName},\n\nPlease find below and attached your Relieving Letter from ${companyName}.\n\nRegards,\nHR Operations`,
          html: letterContent,
          attachments: relPdfBuffer ? [
            {
              filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Relieving_Letter.pdf`,
              content: relPdfBuffer
            }
          ] : undefined
        });
      } catch (emailErr) {
        console.error('Failed to send relieving letter email:', emailErr);
      }
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Relieving Certificate - ${letter.employeeName}</title>
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
              <h2 style="margin: 0; font-size: 24px; color: #0f172a; font-weight: 800; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; display: inline-block; padding-bottom: 8px;">RELIEVING LETTER & EXIT CONFIRMATION</h2>
            </div>

            <div style="font-size: 16px; line-height: 1.9; color: #334155; text-align: justify; margin-bottom: 30px; font-family: 'Inter', sans-serif;">
              <p>Date: ${new Date(letter.generatedAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <br/>
              <p>To,</p>
              <p><strong>${letter.employeeName}</strong></p>
              <p>Designation: ${letter.designation}</p>
              <br/>
              <p>Dear ${letter.employeeName.split(' ')[0]},</p>
              <br/>
              <p>
                This has reference to your resignation from the services of <strong>${companyName}</strong>.
              </p>
              <p>
                We are pleased to inform you that your resignation has been accepted and you are officially relieved from the services of the company with effect from the close of business hours on <strong>${new Date(letter.exitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>
              <p>
                We confirm that your Full & Final Settlement has been completed, and there are no outstanding dues, assets, or access issues remaining between you and the company.
              </p>
              <p>
                We thank you for the efforts and services rendered during your tenure with us, and we wish you success and happiness in your future endeavors.
              </p>
            </div>

            <div style="margin-top: 100px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500;">Status: Relieved & Settled</p>
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
    console.error('Failed to retrieve relieving letter printout:', error);
    return new Response('Failed to retrieve relieving letter printout: ' + error.message, { status: 500 });
  }
}
