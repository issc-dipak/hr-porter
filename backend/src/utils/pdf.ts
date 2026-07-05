import PDFDocument from 'pdfkit';

interface BrandingData {
  companyName: string;
  companyLogo?: string;
  primaryColor?: string;
}

export function generateExperienceLetterPdf(
  resignation: any,
  employee: any,
  branding: BrandingData | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const companyName = branding?.companyName || 'HR Core Labs';
      const companyLogo = branding?.companyLogo || '';
      const primaryColor = branding?.primaryColor || '#2563eb';
      const designation = employee?.designation || 'Software Engineer';
      const joinedDate = employee?.joinedDate || new Date();
      const exitDate = resignation.lastWorkingDay || new Date();

      // Top spacing
      doc.moveDown(1);

      // Header Branding Logo (Base64)
      if (companyLogo && companyLogo.startsWith('data:image/')) {
        try {
          const base64Data = companyLogo.split(',')[1];
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, { fit: [150, 50], align: 'center' });
          doc.moveDown(0.5);
        } catch (imgErr) {
          console.error('Failed to render company logo in PDF:', imgErr);
        }
      }

      // Company Name
      doc.fillColor(primaryColor)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(companyName.toUpperCase(), { align: 'center' });

      // Subtitle
      doc.fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('Enterprise Human Resource Management Systems', { align: 'center' })
        .moveDown(1);

      // Border Line
      const yVal = doc.y;
      doc.moveTo(50, yVal)
        .lineTo(doc.page.width - 50, yVal)
        .strokeColor(primaryColor)
        .lineWidth(1.5)
        .stroke()
        .moveDown(2);

      // Certificate Title
      doc.fillColor('#0f172a')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('EXPERIENCE CERTIFICATE', { align: 'center' })
        .moveDown(2.5);

      // To Whomsoever It May Concern
      doc.fillColor('#334155')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('To Whomsoever It May Concern,', { align: 'left' })
        .moveDown(1.5);

      // Paragraph 1
      const bodyText1 = `This is to certify that ${resignation.employeeName} was employed with ${companyName} as a ${designation}. Their period of service was from ${new Date(joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to ${new Date(exitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`;
      doc.font('Helvetica')
        .text(bodyText1, { align: 'justify', lineGap: 6 })
        .moveDown(1.5);

      // Paragraph 2
      const bodyText2 = `During their tenure with us, they demonstrated exceptional professionalism, dedication, and technical competence. They have contributed significantly to key projects within the engineering department. Their conduct was exemplary, and we found them to be reliable, hardworking, and honest.`;
      doc.text(bodyText2, { align: 'justify', lineGap: 6 })
        .moveDown(1.5);

      // Paragraph 3
      const bodyText3 = `We thank ${resignation.employeeName} for their service and wish them the absolute best of luck and success in all their future professional endeavors.`;
      doc.text(bodyText3, { align: 'justify', lineGap: 6 })
        .moveDown(4);

      // Signatures
      const currentY = doc.y;
      
      // Date and Place
      doc.fillColor('#64748b')
        .fontSize(10)
        .text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, currentY)
        .text('Place: Corporate Headquarters', 50, currentY + 15);

      // HR Auth Signatory
      doc.fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Authorized Signatory', doc.page.width - 250, currentY, { align: 'right', width: 200 });
      
      doc.fillColor('#64748b')
        .fontSize(10)
        .font('Helvetica')
        .text('Human Resource Department', doc.page.width - 250, currentY + 15, { align: 'right', width: 200 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateRelievingLetterPdf(
  resignation: any,
  employee: any,
  branding: BrandingData | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const companyName = branding?.companyName || 'HR Core Labs';
      const companyLogo = branding?.companyLogo || '';
      const primaryColor = branding?.primaryColor || '#10b981';
      const designation = employee?.designation || 'Software Engineer';
      const exitDate = resignation.lastWorkingDay || new Date();

      // Top spacing
      doc.moveDown(1);

      // Header Branding Logo (Base64)
      if (companyLogo && companyLogo.startsWith('data:image/')) {
        try {
          const base64Data = companyLogo.split(',')[1];
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, { fit: [150, 50], align: 'center' });
          doc.moveDown(0.5);
        } catch (imgErr) {
          console.error('Failed to render company logo in PDF:', imgErr);
        }
      }

      // Company Name
      doc.fillColor(primaryColor)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(companyName.toUpperCase(), { align: 'center' });

      // Subtitle
      doc.fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('Enterprise Human Resource Management Systems', { align: 'center' })
        .moveDown(1);

      // Border Line
      const yVal = doc.y;
      doc.moveTo(50, yVal)
        .lineTo(doc.page.width - 50, yVal)
        .strokeColor(primaryColor)
        .lineWidth(1.5)
        .stroke()
        .moveDown(2);

      // Relieving Letter Title
      doc.fillColor('#0f172a')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('RELIEVING LETTER & EXIT CONFIRMATION', { align: 'center' })
        .moveDown(2.5);

      // Date Left Aligned
      doc.fillColor('#64748b')
        .fontSize(10)
        .font('Helvetica')
        .text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'left' })
        .moveDown(1.5);

      // Employee Address block
      doc.fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('To,')
        .text(resignation.employeeName)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`Designation: ${designation}`)
        .moveDown(1.5);

      // Dear Employee
      doc.fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text(`Dear ${resignation.employeeName.split(' ')[0]},`)
        .moveDown(1.5);

      // Body text paragraph 1
      const text1 = `This has reference to your resignation from the services of ${companyName}. We are pleased to inform you that your resignation has been accepted and you are officially relieved from the services of the company with effect from the close of business hours on ${new Date(exitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`;
      doc.font('Helvetica')
        .fillColor('#334155')
        .text(text1, { align: 'justify', lineGap: 6 })
        .moveDown(1.5);

      // Body text paragraph 2
      const text2 = `We confirm that your Full & Final Settlement has been completed, and all company credentials, assets, and documentation checklists have been verified and cleared by the HR and Finance departments. There are no outstanding dues or assets pending.`;
      doc.text(text2, { align: 'justify', lineGap: 6 })
        .moveDown(1.5);

      // Body text paragraph 3
      const text3 = `We appreciate the contributions made by you during your period of association with us and wish you the very best of luck and success in all your future professional endeavors.`;
      doc.text(text3, { align: 'justify', lineGap: 6 })
        .moveDown(4);

      // Signatures
      const currentY = doc.y;
      
      // Place and Status
      doc.fillColor('#64748b')
        .fontSize(10)
        .text('Status: Relieved & Settled', 50, currentY)
        .text('Place: Corporate Headquarters', 50, currentY + 15);

      // HR Auth Signatory
      doc.fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Authorized Signatory', doc.page.width - 250, currentY, { align: 'right', width: 200 });
      
      doc.fillColor('#64748b')
        .fontSize(10)
        .font('Helvetica')
        .text('Human Resource Department', doc.page.width - 250, currentY + 15, { align: 'right', width: 200 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
