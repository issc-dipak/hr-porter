import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { User } from '@/app/api/models/User';
import { verifyAuth } from '@/app/api/lib/auth';
import { encryptText } from '../../../../utils/encryption';
import { ExpenseAudit } from '@/app/api/models/ExpenseAudit';
import { SystemSettings } from '@/app/api/models/SystemSettings';

// POST Penny Drop Verification
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json() as any;
    const { accountHolderName, bankName, accountNumber, ifscCode, upiId, email: targetEmail } = data;

    // Reject if actual role is Employee (read-only for all employees)
    if (decoded.role === 'Employee') {
      return NextResponse.json({ error: 'Forbidden: Employees are not allowed to trigger bank account verification.' }, { status: 403 });
    }

    let emailToVerify = decoded.email.toLowerCase();
    if (targetEmail && (decoded.role === 'HR' || decoded.role === 'Admin' || decoded.role === 'Super Admin')) {
      emailToVerify = targetEmail.toLowerCase();
    }

    // 1. Basic Format Validations
    if (!accountHolderName || !accountHolderName.trim()) {
      return NextResponse.json({ error: 'Account Holder Name is required' }, { status: 400 });
    }
    if (!bankName || !bankName.trim()) {
      return NextResponse.json({ error: 'Bank Name is required' }, { status: 400 });
    }
    if (!accountNumber || !/^\d{9,18}$/.test(accountNumber)) {
      return NextResponse.json({ error: 'Account Number must be between 9 and 18 digits' }, { status: 400 });
    }
    if (!ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return NextResponse.json({ error: 'Invalid IFSC Code format. Must be 11 characters (e.g., SBIN0001234)' }, { status: 400 });
    }
    if (upiId && !/^[\w.-]+@[\w.-]+$/.test(upiId)) {
      return NextResponse.json({ error: 'Invalid UPI ID format' }, { status: 400 });
    }

    await connectToDatabase();

    const companyId = decoded.companyId || 'company_001';
    let settings = await SystemSettings.findOne({ companyId });
    if (!settings) {
      settings = await SystemSettings.create({ companyId });
    }

    const isSimulator = settings.payout?.isSimulator !== false;

    // Log Penny Drop execution attempt
    console.log(`[Penny Drop] Initiating verification for ${accountHolderName} IFSC: ${ifscCode}...`);

    let verificationResult = null;

    if (isSimulator) {
      // Wait 1.2s to simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Mock successful penny drop response
      verificationResult = {
        success: true,
        status: 'verified',
        payeeName: accountHolderName.trim().toUpperCase(),
        utr: `UTR${Date.now().toString().slice(-10)}`,
        referenceId: `verify_ref_${Math.random().toString(36).substring(2, 12)}`,
        message: 'Account verified successfully via Penny Drop Simulator'
      };

    } else {
      // Live RazorpayX validation integration
      const rzpKey = settings.payout?.razorpayxKey || process.env.RAZORPAYX_KEY_ID;
      const rzpSecret = settings.payout?.razorpayxSecret || process.env.RAZORPAYX_KEY_SECRET;

      if (!rzpKey || !rzpSecret) {
        return NextResponse.json({ error: 'Live RazorpayX credentials are not configured in company settings' }, { status: 400 });
      }

      try {
        // 1. Create a contact first
        const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${rzpKey}:${rzpSecret}`).toString('base64')
          },
          body: JSON.stringify({
            name: accountHolderName.trim(),
            email: decoded.email,
            type: 'employee'
          })
        });

        if (!contactRes.ok) {
          const errText = await contactRes.text();
          throw new Error(`Razorpay contact failed: ${errText}`);
        }

        const contactData = await contactRes.json() as any;

        // 2. Perform Fund Account Validation (Penny Drop)
        const validateRes = await fetch('https://api.razorpay.com/v1/fund_accounts/validations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${rzpKey}:${rzpSecret}`).toString('base64')
          },
          body: JSON.stringify({
            account_number: process.env.RAZORPAYX_MERCHANT_ACCOUNT || '456456456456456',
            fund_account: {
              contact_id: contactData.id,
              account_type: 'bank_account',
              bank_account: {
                name: accountHolderName.trim(),
                ifsc: ifscCode.trim().toUpperCase(),
                account_number: accountNumber.trim()
              }
            },
            amount: 100 // 100 paise = ₹1 penny drop
          })
        });

        if (!validateRes.ok) {
          const errText = await validateRes.text();
          throw new Error(`Razorpay validation call failed: ${errText}`);
        }

        const validationData = await validateRes.json() as any;

        if (validationData.status === 'completed' && validationData.results?.account_status === 'active') {
          verificationResult = {
            success: true,
            status: 'verified',
            payeeName: validationData.results.registered_name || accountHolderName.trim().toUpperCase(),
            utr: validationData.utr || `UTR${Date.now()}`,
            referenceId: validationData.id,
            message: 'Live validation completed: Bank account is active.'
          };
        } else {
          verificationResult = {
            success: false,
            status: 'failed',
            message: `Account status: ${validationData.results?.account_status || 'unknown'}`
          };
        }

      } catch (err: any) {
        console.error('Live penny drop API failure:', err);
        return NextResponse.json({ error: `Penny drop API error: ${err.message}` }, { status: 502 });
      }
    }

    if (verificationResult && verificationResult.success) {
      // 3. Save and encrypt the verified bank details
      const user = await User.findOne({ email: emailToVerify });
      if (user) {
        user.bankDetails = {
          bankName: encryptText(bankName.trim()),
          accountHolderName: encryptText(accountHolderName.trim()),
          accountNumber: encryptText(accountNumber.trim()),
          ifscCode: encryptText(ifscCode.trim().toUpperCase()),
          upiId: upiId ? encryptText(upiId.trim().toLowerCase()) : '',
          isVerified: true,
          verificationStatus: 'verified',
          verifiedBy: decoded.email || 'HR Operations (RazorpayX)',
          verifiedAt: new Date(),
          pennyDropResponse: verificationResult
        };
        await user.save();
      }

      // Log Audit Trail
      await ExpenseAudit.create({
        companyId,
        performedBy: decoded.email,
        action: 'BANK_ACCOUNT_VERIFIED',
        details: `Penny Drop verification successful. Payee Name matched: ${verificationResult.payeeName}. UTR: ${verificationResult.utr}`
      });

      return NextResponse.json({
        success: true,
        verified: true,
        payeeName: verificationResult.payeeName,
        referenceId: verificationResult.referenceId,
        utr: verificationResult.utr,
        message: verificationResult.message
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        message: verificationResult?.message || 'Penny drop validation failed. Please check details and try again.'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Penny drop routing error:', error);
    return NextResponse.json({ error: 'Failed to verify banking details', details: error.message }, { status: 500 });
  }
}
