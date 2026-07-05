import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Resignation } from '../models/Resignation';
import { Employee } from '../models/Employee';
import { CompanyBranding } from '../models/CompanyBranding';
import { generateExperienceLetterPdf, generateRelievingLetterPdf } from '../utils/pdf';
import { sendEmail } from '../utils/email';

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is not set in .env file!");
    process.exit(1);
  }

  console.log("Connecting to MongoDB at:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected successfully!");

  const testEmail = "test_offboarding_emp@hrcore.com";
  const testCompanyId = "company_test_001";
  const testName = "Test Exit Employee";

  // Clean up
  await Resignation.deleteMany({ employeeEmail: testEmail });
  await Employee.deleteMany({ email: testEmail });
  await CompanyBranding.deleteMany({ companyId: testCompanyId });

  // Create branding data
  const branding = await CompanyBranding.create({
    companyId: testCompanyId,
    companyName: "HR Core Labs Test Corp",
    primaryColor: "#2563eb",
    emailHeaderLogoVisible: true
  });
  console.log("Seeded CompanyBranding:", branding.companyName);

  // Create employee
  const employee = await Employee.create({
    fullName: testName,
    email: testEmail,
    department: "Engineering",
    designation: "Principal Staff Engineer",
    status: "Active",
    phone: "+91 98765 43210",
    joinedDate: new Date("2020-01-15"),
    location: "Mumbai",
    companyId: testCompanyId,
    companyCode: "hrcore",
    isActive: true
  });
  console.log("Seeded Employee:", employee.fullName);

  // Create resignation
  const resignation = await Resignation.create({
    companyId: testCompanyId,
    employeeEmail: testEmail,
    employeeName: testName,
    reason: "Career Growth",
    lastWorkingDay: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // LWD in 30 days
    status: "Approved",
    noticePeriodDays: 30,
    exitChecklist: {
      laptopReturned: true,
      idCardReturned: true,
      companyAssetsReturned: true,
      accessRevoked: true,
      knowledgeTransferCompleted: true,
      documentsSubmitted: true,
      payrollClearance: true,
      financeClearance: true
    },
    history: [{
      action: "Resignation Approved",
      performedBy: "hr_admin@hrcore.com",
      performedByRole: "HR",
      details: "Notice period started."
    }]
  });
  console.log("Seeded Resignation status:", resignation.status);

  // Generate experience letter PDF
  console.log("Generating Experience Letter PDF...");
  const expPdfBuffer = await generateExperienceLetterPdf(resignation, employee, branding);
  console.log("Experience Letter PDF generated. Size in bytes:", expPdfBuffer.length);

  // Generate relieving letter PDF
  console.log("Generating Relieving Letter PDF...");
  const relPdfBuffer = await generateRelievingLetterPdf(resignation, employee, branding);
  console.log("Relieving Letter PDF generated. Size in bytes:", relPdfBuffer.length);

  // Ensure scratch directory exists
  const scratchDir = path.resolve(__dirname, '../../scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const expPath = path.join(scratchDir, 'test_experience_letter.pdf');
  const relPath = path.join(scratchDir, 'test_relieving_letter.pdf');

  fs.writeFileSync(expPath, expPdfBuffer);
  fs.writeFileSync(relPath, relPdfBuffer);
  console.log("PDF files written to scratch folder:");
  console.log("- Experience Letter:", expPath);
  console.log("- Relieving Letter:", relPath);

  // Send Experience Letter Email
  console.log("Sending Experience Certificate Email...");
  const expMailRes = await sendEmail({
    to: testEmail,
    subject: `Experience Certificate - ${branding.companyName}`,
    text: `Dear ${resignation.employeeName},\n\nPlease find attached your Experience Certificate.\n\nRegards,\nHR Operations`,
    html: `<p>Dear <strong>${resignation.employeeName}</strong>,</p><p>Please find attached your Experience Certificate.</p><p>Regards,<br/>HR Operations</p>`,
    attachments: [
      {
        filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Experience_Certificate.pdf`,
        content: expPdfBuffer
      }
    ]
  });
  console.log("Experience Certificate Email Result:", expMailRes);

  // Send Relieving Letter Email
  console.log("Sending Relieving Letter Email...");
  const relMailRes = await sendEmail({
    to: testEmail,
    subject: `Relieving Letter & Exit Confirmation - ${branding.companyName}`,
    text: `Dear ${resignation.employeeName},\n\nPlease find attached your Relieving Letter.\n\nRegards,\nHR Operations`,
    html: `<p>Dear <strong>${resignation.employeeName}</strong>,</p><p>Please find attached your Relieving Letter & Exit Confirmation.</p><p>Regards,<br/>HR Operations</p>`,
    attachments: [
      {
        filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Relieving_Letter.pdf`,
        content: relPdfBuffer
      }
    ]
  });
  console.log("Relieving Letter Email Result:", relMailRes);

  // Clean up DB test records
  await Resignation.deleteMany({ employeeEmail: testEmail });
  await Employee.deleteMany({ email: testEmail });
  await CompanyBranding.deleteMany({ companyId: testCompanyId });
  console.log("Database cleaned up successfully.");

  await mongoose.disconnect();
  console.log("Disconnected successfully!");
}

main().catch(async (err) => {
  console.error("Test execution failed:", err);
  await mongoose.disconnect();
});
