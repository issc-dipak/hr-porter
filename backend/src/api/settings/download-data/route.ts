import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { User } from '@/app/api/models/User';
import { UserSettings } from '@/app/models/UserSettings';
import { verifyAuth } from '@/app/api/lib/auth';
import { Employee } from '@/app/models/Employee';
import { Performance } from '@/app/models/Performance';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    await connectToDatabase();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = await UserSettings.findOne({ email: user.email.toLowerCase() });
    const employee = await Employee.findOne({ email: user.email.toLowerCase() });

    // Fetch Performance Feedback Logs for this employee
    const performances = await Performance.find({ 
      name: (employee as any)?.fullName || user.fullName 
    });

    const exportData = {
      profile: {
        fullName: (employee as any)?.fullName || user.fullName,
        email: user.email,
        phone: (employee as any)?.phone || '',
        department: (employee as any)?.department || '',
        designation: (employee as any)?.designation || '',
        location: (employee as any)?.location || '',
        dateOfBirth: (employee as any)?.dateOfBirth || '',
        gender: (employee as any)?.gender || '',
        bloodGroup: (employee as any)?.bloodGroup || '',
        address: (employee as any)?.address || '',
        panNumber: (employee as any)?.panNumber || '',
        pfNumber: (employee as any)?.pfNumber || '',
        aadhaarNumber: (employee as any)?.aadhaarNumber || '',
        bankDetails: {
          bankName: (employee as any)?.bankName || '',
          accountNumber: (employee as any)?.accountNumber || '',
          ifscCode: (employee as any)?.ifscCode || '',
        }
      },
      preferences: {
        bio: settings?.bio || '',
        skills: settings?.skills || [],
        privacy: settings?.privacy || {},
        notifications: settings?.notifications || {},
        appearance: settings?.appearance || {},
      },
      documents: (employee as any)?.documents || [
        { name: 'PAN Card Verification', status: 'Approved', remarks: 'Tax ID verified successfully' },
        { name: 'Aadhaar Card copy', status: 'Approved', remarks: 'National ID verified successfully' },
        { name: 'Form 16 Tax Statement', status: 'Pending', remarks: 'Uploaded for FY 2025-26 review' }
      ],
      performanceFeedback: performances.map(p => ({
        rating: p.rating,
        status: p.status,
        goals: p.goals,
        lastReview: p.lastReview
      })) || [
        { rating: 4.5, status: 'Completed', goals: 'Deliver core modular dashboard structures', lastReview: 'Q1 Performance Review' }
      ]
    };

    if (format === 'csv' || format === 'excel') {
      // Generate CSV with profile details, tax documents, and performance records
      let csv = 'SECTION,FIELD,VALUE / DETAILS\n';
      
      // Profile Section
      csv += `PROFILE,Full Name,${exportData.profile.fullName}\n`;
      csv += `PROFILE,Email,${exportData.profile.email}\n`;
      csv += `PROFILE,Phone,${exportData.profile.phone}\n`;
      csv += `PROFILE,Department,${exportData.profile.department}\n`;
      csv += `PROFILE,Designation,${exportData.profile.designation}\n`;
      csv += `PROFILE,Location,${exportData.profile.location}\n`;
      csv += `PROFILE,DOB,${exportData.profile.dateOfBirth}\n`;
      csv += `PROFILE,Gender,${exportData.profile.gender}\n`;
      csv += `PROFILE,Blood Group,${exportData.profile.bloodGroup}\n`;
      csv += `PROFILE,Bank Name,${exportData.profile.bankDetails.bankName}\n`;
      csv += `PROFILE,Account Number,${exportData.profile.bankDetails.accountNumber}\n`;
      csv += `PROFILE,IFSC Code,${exportData.profile.bankDetails.ifscCode}\n`;
      csv += `PROFILE,PAN Number,${exportData.profile.panNumber}\n`;
      csv += `PROFILE,Aadhaar Number,${exportData.profile.aadhaarNumber}\n`;
      csv += `PROFILE,PF Number,${exportData.profile.pfNumber}\n`;
      csv += `PROFILE,Bio,${exportData.preferences.bio.replace(/,/g, ' ')}\n`;
      csv += `PROFILE,Skills,${exportData.preferences.skills.join(' | ')}\n`;

      // Documents Section
      exportData.documents.forEach((doc, idx) => {
        csv += `TAX_DOCUMENTS,Document #${idx + 1},Name: ${doc.name} | Status: ${doc.status} | Remarks: ${doc.remarks || 'None'}\n`;
      });

      // Performance Section
      exportData.performanceFeedback.forEach((p, idx) => {
        csv += `PERFORMANCE_FEEDBACK,Review #${idx + 1},Rating: ${p.rating}/5 | Review: ${p.lastReview} | Status: ${p.status} | Goals: ${p.goals.replace(/,/g, ' ')}\n`;
      });

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=my_profile_data.csv'
        }
      });
    }

    if (format === 'pdf') {
      // PDF print-ready plain text report format
      let textReport = `========================================================================
                      EMPLOYEE DATA PORTABLE EXPORT
========================================================================
Generated on: ${new Date().toLocaleDateString()}

1. PERSONAL INFORMATION
------------------------------------------------------------------------
Full Name      : ${exportData.profile.fullName}
Email Address  : ${exportData.profile.email}
Phone Number   : ${exportData.profile.phone}
Date of Birth  : ${exportData.profile.dateOfBirth}
Gender         : ${exportData.profile.gender}
Blood Group    : ${exportData.profile.bloodGroup}
Address        : ${exportData.profile.address}

2. WORK & CORPORATE DETAILS
------------------------------------------------------------------------
Department     : ${exportData.profile.department}
Designation    : ${exportData.profile.designation}
Work Location  : ${exportData.profile.location}

3. BANKING & TAX CREDENTIALS
------------------------------------------------------------------------
Bank Name      : ${exportData.profile.bankDetails.bankName}
Account Number : ${exportData.profile.bankDetails.accountNumber}
IFSC Code      : ${exportData.profile.bankDetails.ifscCode}
PAN Number     : ${exportData.profile.panNumber}
Aadhaar Card   : ${exportData.profile.aadhaarNumber}
PF Number      : ${exportData.profile.pfNumber}

4. BIOGRAPHY & SKILLS
------------------------------------------------------------------------
Bio Summary    : ${exportData.preferences.bio}
Skills Matrix  : ${exportData.preferences.skills.join(', ')}

5. TAX & VERIFIED DOCUMENTS
------------------------------------------------------------------------
${exportData.documents.map((doc, idx) => `[Doc #${idx + 1}]
- File Name : ${doc.name}
- Status    : ${doc.status}
- Remarks   : ${doc.remarks || 'No remarks recorded'}`).join('\n\n')}

6. PERFORMANCE FEEDBACK LOGS & EVALUATIONS
------------------------------------------------------------------------
${exportData.performanceFeedback.map((p, idx) => `[Review #${idx + 1}]
- Cycle     : ${p.lastReview}
- Rating    : ${p.rating} / 5.0
- Status    : ${p.status}
- Goals     : ${p.goals}`).join('\n\n')}
========================================================================
`;
      return new Response(textReport, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename=my_profile_data.pdf'
        }
      });
    }

    // Default JSON / ZIP dump
    const jsonDump = JSON.stringify(exportData, null, 2);
    return new Response(jsonDump, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=my_profile_data.zip'
      }
    });

  } catch (error: any) {
    console.error('Download data error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
