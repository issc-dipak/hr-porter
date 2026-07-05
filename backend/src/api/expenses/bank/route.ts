import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { User } from '@/app/api/models/User';
import { verifyAuth } from '@/app/api/lib/auth';
import { encryptText, decryptText } from '../../../utils/encryption';
import { ExpenseAudit } from '@/app/api/models/ExpenseAudit';

// GET decrypted bank details of the current logged-in employee
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const targetEmail = url.searchParams.get('email');
    let emailToQuery = decoded.email.toLowerCase();
    
    // Check if user is HR/Admin and requesting other employee's bank details
    if (targetEmail && (decoded.role === 'HR' || decoded.role === 'Admin' || decoded.role === 'Super Admin')) {
      emailToQuery = targetEmail.toLowerCase();
    }

    const user = await User.findOne({ email: emailToQuery });
    if (!user) {
      return NextResponse.json({ error: 'Employee user profile not found' }, { status: 404 });
    }

    // Default response if no details exist
    if (!user.bankDetails || (!user.bankDetails.accountNumber && !user.bankDetails.bankName)) {
      return NextResponse.json({
        exists: false,
        bankDetails: {
          accountHolderName: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          upiId: '',
          isVerified: false,
          verificationStatus: 'unverified'
        }
      }, { status: 200 });
    }

    const bank = user.bankDetails;
    const decrypted = {
      accountHolderName: decryptText(bank.accountHolderName),
      bankName: decryptText(bank.bankName),
      accountNumber: decryptText(bank.accountNumber),
      ifscCode: decryptText(bank.ifscCode),
      upiId: bank.upiId ? decryptText(bank.upiId) : '',
      isVerified: bank.isVerified || false,
      verificationStatus: bank.verificationStatus || 'unverified',
      verifiedBy: bank.verifiedBy || 'HR Operations (RazorpayX)',
      verifiedAt: bank.verifiedAt || user.updatedAt || new Date()
    };

    // Generate masked account number for general UI display safety
    const maskedAccountNumber = decrypted.accountNumber 
      ? decrypted.accountNumber.slice(0, -4).replace(/./g, '*') + decrypted.accountNumber.slice(-4)
      : '';

    return NextResponse.json({
      exists: true,
      bankDetails: decrypted,
      maskedAccountNumber
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to get bank details:', error);
    return NextResponse.json({ error: 'Failed to retrieve banking details', details: error.message }, { status: 500 });
  }
}

// POST/SAVE bank details
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
      return NextResponse.json({ error: 'Forbidden: Employee profiles are read-only. Updates must be managed by HR/Admin.' }, { status: 403 });
    }

    let emailToUpdate = decoded.email.toLowerCase();
    if (targetEmail && (decoded.role === 'HR' || decoded.role === 'Admin' || decoded.role === 'Super Admin')) {
      emailToUpdate = targetEmail.toLowerCase();
    }

    // 1. Validations before saving
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
      return NextResponse.json({ error: 'Invalid UPI ID format (e.g. name@bank)' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: emailToUpdate });
    if (!user) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    // Encrypt sensitive details
    const encryptedBankName = encryptText(bankName.trim());
    const encryptedAccountHolderName = encryptText(accountHolderName.trim());
    const encryptedAccountNumber = encryptText(accountNumber.trim());
    const encryptedIfscCode = encryptText(ifscCode.trim().toUpperCase());
    const encryptedUpiId = upiId ? encryptText(upiId.trim().toLowerCase()) : '';

    // Save details. Reset verification status if details changed!
    // For safety, anytime details are updated, force re-verification.
    user.bankDetails = {
      bankName: encryptedBankName,
      accountHolderName: encryptedAccountHolderName,
      accountNumber: encryptedAccountNumber,
      ifscCode: encryptedIfscCode,
      upiId: encryptedUpiId,
      isVerified: false, // Must verify again
      verificationStatus: 'unverified',
      verifiedBy: '',
      verifiedAt: null,
      pennyDropResponse: null
    };

    await user.save();

    // Audit Trail
    await ExpenseAudit.create({
      companyId: decoded.companyId || 'company_001',
      performedBy: decoded.email,
      action: 'BANK_DETAILS_UPDATED',
      details: `Updated banking credentials. Forced verification reset. IFSC: ${ifscCode.toUpperCase()}`
    });

    return NextResponse.json({
      success: true,
      message: 'Bank details saved securely. Penny drop verification is required next.',
      bankDetails: {
        isVerified: false,
        verificationStatus: 'unverified'
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to save bank details:', error);
    return NextResponse.json({ error: 'Failed to save banking details', details: error.message }, { status: 500 });
  }
}
