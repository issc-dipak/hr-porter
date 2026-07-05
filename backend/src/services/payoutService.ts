import { Reimbursement, IReimbursement } from '../models/Reimbursement';
import { User } from '../models/User';
import { SystemSettings } from '../models/SystemSettings';
import { PayoutTransaction } from '../models/PayoutTransaction';
import { ExpenseAudit } from '../models/ExpenseAudit';
import { SystemNotificationService } from './systemNotificationService';
import { decryptText } from '../utils/encryption';
import { sendEmail } from '../utils/email';
import { Wallet } from '../models/Wallet';

export class PayoutService {
  /**
   * Triggers an automated payout for an approved expense claim.
   */
  static async triggerPayout(claimId: string, performedBy: string): Promise<{ success: boolean; message: string; transaction?: any }> {
    try {
      const claim = await Reimbursement.findById(claimId);
      if (!claim) {
        return { success: false, message: 'Claim not found' };
      }

      // Check if already processed or processing
      const existingTx = await PayoutTransaction.findOne({ expenseId: claimId });
      if (existingTx && ['Processing', 'Paid'].includes(existingTx.status)) {
        return { success: false, message: 'Payout already initiated or completed for this claim.' };
      }

      const companyId = claim.companyId || 'company_001';

      // 1. Fetch system/company settings
      let settings = await SystemSettings.findOne({ companyId });
      if (!settings) {
        settings = await SystemSettings.create({ companyId });
      }

      const primaryProvider = settings.payout?.primaryProvider || 'RazorpayX';
      const isSimulator = settings.payout?.isSimulator !== false;

      // 2. Fetch employee banking details
      const employee = await User.findOne({ email: claim.employee.toLowerCase() });
      if (!employee || !employee.bankDetails) {
        await this.handlePayoutFailure(
          claim,
          'MISSING_BANK_DETAILS',
          'Employee banking details are not set. Payout blocked.',
          performedBy
        );
        return { success: false, message: 'Employee bank details not set.' };
      }

      const bank = employee.bankDetails;

      // Check verification
      if (!bank.isVerified || bank.verificationStatus !== 'verified') {
        await this.handlePayoutFailure(
          claim,
          'UNVERIFIED_BANK_ACCOUNT',
          'Payout failed: Bank account is not verified. Penny drop verification is required.',
          performedBy
        );
        return { success: false, message: 'Bank details are not verified.' };
      }

      // Decrypt details
      const accountHolderName = decryptText(bank.accountHolderName);
      const bankName = decryptText(bank.bankName);
      const accountNumber = decryptText(bank.accountNumber);
      const ifscCode = decryptText(bank.ifscCode);
      const upiId = bank.upiId ? decryptText(bank.upiId) : '';

      if (!accountNumber || !ifscCode) {
        await this.handlePayoutFailure(
          claim,
          'DECRYPTION_FAILED',
          'Payout failed: Decrypted account credentials are empty or corrupted.',
          performedBy
        );
        return { success: false, message: 'Decryption of bank credentials failed.' };
      }

      const amount = claim.amount;
      const payoutReference = `pay_ref_${Date.now()}_${claim._id.toString().slice(-6)}`;
      const paymentMethod = upiId ? 'UPI' : 'IMPS';

      // Verify sufficient balance in Company Payout Vault (Wallet)
      let wallet = await Wallet.findOne({ companyId });
      if (!wallet) {
        wallet = await Wallet.create({ companyId, balance: 0, transactions: [] });
      }

      if (wallet.balance < amount) {
        await this.handlePayoutFailure(
          claim,
          'INSUFFICIENT_VAULT_BALANCE',
          `Payout failed: Insufficient balance in Company Payout Vault. Required: ₹${amount.toLocaleString()}, Available: ₹${wallet.balance.toLocaleString()}.`,
          performedBy
        );
        return { success: false, message: `Insufficient vault balance. Required: ₹${amount}, Available: ₹${wallet.balance}.` };
      }

      // Update claim status to payout processing
      claim.status = 'Approved'; // Remains Approved or can show "Processing"
      await claim.save();

      if (isSimulator) {
        // --- SIMULATED PAYOUT ENGINE ---
        console.log(`[Simulator Payout] Initiating simulated ${primaryProvider} payout of ₹${amount} for claim ${claim._id}`);

        // Deduct from wallet immediately
        wallet.balance -= amount;
        wallet.transactions.push({
          companyId,
          transactionId: payoutReference,
          amount,
          type: 'Debit',
          description: `Expense Reimbursement: ${claim.description || claim.type || 'Reimbursement Payout'}`
        });
        await wallet.save();

        const transactionId = `tx_sim_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

        const transaction = await PayoutTransaction.create({
          companyId,
          employeeId: employee._id.toString(),
          expenseId: claim._id.toString(),
          amount,
          payoutProvider: primaryProvider,
          payoutReference,
          transactionId,
          paymentMethod,
          status: 'Processing',
          processedAt: new Date()
        });

        await ExpenseAudit.create({
          companyId,
          expenseId: claim._id,
          action: 'PAYOUT_INITIATED',
          performedBy,
          details: `Automated payout of ₹${amount} initiated via ${primaryProvider} Simulator. Ref: ${payoutReference}`
        });

        // Send Processing notification
        await this.notifyEmployee(employee, claim, 'Processing', payoutReference);

        // Async resolve the payout after 2.5 seconds to simulate bank gateway time
        setTimeout(async () => {
          try {
            const tx = await PayoutTransaction.findOne({ payoutReference });
            if (tx && tx.status === 'Processing') {
              tx.status = 'Paid';
              tx.processedAt = new Date();
              await tx.save();

              const resolvedClaim = await Reimbursement.findById(claimId);
              if (resolvedClaim) {
                resolvedClaim.status = 'Paid';
                resolvedClaim.paidDate = new Date();
                if (!resolvedClaim.comments) resolvedClaim.comments = [];
                resolvedClaim.comments.push({
                  user: 'system@hrcore.com',
                  role: 'Admin',
                  text: `Automated payout settled successfully via ${primaryProvider} Simulator. Transac ID: ${transactionId}`,
                  timestamp: new Date()
                });
                await resolvedClaim.save();

                await ExpenseAudit.create({
                  companyId,
                  expenseId: resolvedClaim._id,
                  action: 'PAYOUT_SETTLED',
                  performedBy: 'system@hrcore.com',
                  details: `Payout settled successfully. Amount: ₹${amount}. Ref: ${payoutReference}`
                });

                await this.notifyEmployee(employee, resolvedClaim, 'Paid', payoutReference, transactionId);
              }
            }
          } catch (err) {
            console.error('Async payout resolution failed:', err);
          }
        }, 2500);

        return { success: true, message: 'Payout processing (Simulator)', transaction };

      } else {
        // --- LIVE INTEGRATIONS (RazorpayX as Primary) ---
        if (primaryProvider === 'RazorpayX') {
          const rzpKey = settings.payout?.razorpayxKey || process.env.RAZORPAYX_KEY_ID;
          const rzpSecret = settings.payout?.razorpayxSecret || process.env.RAZORPAYX_KEY_SECRET;

          if (!rzpKey || !rzpSecret) {
            await this.handlePayoutFailure(
              claim,
              'PROVIDER_KEYS_MISSING',
              'RazorpayX API keys are not configured in system settings.',
              performedBy
            );
            return { success: false, message: 'Provider keys not set.' };
          }

          console.log(`[RazorpayX Payout] Dispatching live payout of ₹${amount} to ${accountHolderName}...`);

          try {
            // 1. Create Razorpay Contact
            const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${rzpKey}:${rzpSecret}`).toString('base64')
              },
              body: JSON.stringify({
                name: accountHolderName,
                email: employee.email,
                contact: employee.phoneNumber || employee.mobile || '9999999999',
                type: 'employee',
                reference_id: employee._id.toString()
              })
            });

            if (!contactRes.ok) {
              const contactErr = await contactRes.text();
              throw new Error(`Razorpay contact creation failed: ${contactErr}`);
            }

            const contactData = await contactRes.json() as any;
            const contactId = contactData.id;

            // 2. Create Fund Account
            const fundRes = await fetch('https://api.razorpay.com/v1/fund_accounts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${rzpKey}:${rzpSecret}`).toString('base64')
              },
              body: JSON.stringify({
                contact_id: contactId,
                account_type: 'bank_account',
                bank_account: {
                  name: accountHolderName,
                  ifsc: ifscCode,
                  account_number: accountNumber
                }
              })
            });

            if (!fundRes.ok) {
              const fundErr = await fundRes.text();
              throw new Error(`Razorpay fund account creation failed: ${fundErr}`);
            }

            const fundData = await fundRes.json() as any;
            const fundAccountId = fundData.id;

            // 3. Initiate Payout
            const payoutRes = await fetch('https://api.razorpay.com/v1/payouts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${rzpKey}:${rzpSecret}`).toString('base64')
              },
              body: JSON.stringify({
                account_number: process.env.RAZORPAYX_MERCHANT_ACCOUNT || '456456456456456', // Merchant payout account
                amount: Math.round(amount * 100), // convert to paise
                currency: 'INR',
                mode: paymentMethod,
                purpose: 'reimbursement',
                fund_account_id: fundAccountId,
                reference_id: payoutReference
              })
            });

            if (!payoutRes.ok) {
              const payoutErr = await payoutRes.text();
              throw new Error(`Razorpay payout creation failed: ${payoutErr}`);
            }

            const payoutData = await payoutRes.json() as any;
            const transactionId = payoutData.id;
            const payoutStatus = payoutData.status; // processing, queued, created, details_under_progress

            // Deduct from wallet
            wallet.balance -= amount;
            wallet.transactions.push({
              companyId,
              transactionId: transactionId || payoutReference,
              amount,
              type: 'Debit',
              description: `Expense Reimbursement: ${claim.description || claim.type || 'Reimbursement Payout'}`
            });
            await wallet.save();

            const transaction = await PayoutTransaction.create({
              companyId,
              employeeId: employee._id.toString(),
              expenseId: claim._id.toString(),
              amount,
              payoutProvider: 'RazorpayX',
              payoutReference,
              transactionId,
              paymentMethod,
              status: payoutStatus === 'processed' ? 'Paid' : 'Processing',
              processedAt: new Date()
            });

            await ExpenseAudit.create({
              companyId,
              expenseId: claim._id,
              action: 'PAYOUT_INITIATED',
              performedBy,
              details: `Live RazorpayX payout triggered. RzpId: ${transactionId}. Status: ${payoutStatus}`
            });

            await this.notifyEmployee(employee, claim, 'Processing', payoutReference, transactionId);

            return { success: true, message: `Live payout initiated: ${payoutStatus}`, transaction };

          } catch (liveErr: any) {
            console.error('Live payout API exception:', liveErr);
            await this.handlePayoutFailure(claim, 'API_EXCEPTION', liveErr.message, performedBy);
            return { success: false, message: liveErr.message };
          }

        } else {
          // Fallback placeholders for Decentro/Cashfree live integrations
          await this.handlePayoutFailure(
            claim,
            'PROVIDER_UNSUPPORTED',
            `Integration with ${primaryProvider} is future-ready. Use simulator or RazorpayX.`,
            performedBy
          );
          return { success: false, message: `Provider ${primaryProvider} not implemented.` };
        }
      }

    } catch (err: any) {
      console.error('Fatal Payout error:', err);
      return { success: false, message: err.message };
    }
  }

  private static async handlePayoutFailure(claim: IReimbursement, errorCode: string, message: string, performedBy: string) {
    claim.status = 'Approved'; // keeps in finance console so they can retry after updating bank details
    if (!claim.comments) claim.comments = [];
    claim.comments.push({
      user: 'system@hrcore.com',
      role: 'Admin',
      text: `Automated Payout Failed: ${message}`,
      timestamp: new Date()
    });
    await claim.save();

    await ExpenseAudit.create({
      companyId: claim.companyId || 'company_001',
      expenseId: claim._id,
      action: 'PAYOUT_FAILED',
      performedBy,
      details: `${errorCode} - ${message}`
    });

    // Notify employee about payout failure
    try {
      const employee = await User.findOne({ email: claim.employee.toLowerCase() });
      if (employee) {
        await SystemNotificationService.createNotification({
          companyId: claim.companyId || 'company_001',
          userId: employee.email,
          title: 'Automated Payout Failed',
          content: `Reimbursement of ₹${claim.amount.toLocaleString()} for "${claim.description}" failed: ${message}`,
          type: 'payroll',
          targetPage: 'payroll'
        });

        // Email alert
        await sendEmail({
          to: employee.email,
          subject: 'Action Required: Reimbursement Payout Failed',
          text: `Hi ${employee.fullName},\n\nYour reimbursement payout of INR ${claim.amount} has failed.\nReason: ${message}\n\nPlease check your bank account settings under Expenses & Reimbursements.\n\nHR System`,
          html: `<p>Hi ${employee.fullName},</p><p>Your automated reimbursement payout of <strong>INR ${claim.amount}</strong> has failed.</p><p><strong>Reason:</strong> ${message}</p><p>Please verify or update your bank account details under the <strong>Bank Details</strong> tab in the Expenses & Reimbursements module.</p>`
        });
      }
    } catch (err) {
      console.error('Failed to notify payout failure:', err);
    }
  }

  /**
   * Send notification alerts for payout lifecycle events.
   */
  private static async notifyEmployee(employee: any, claim: IReimbursement, state: 'Processing' | 'Paid', ref: string, txId?: string) {
    const isPaid = state === 'Paid';
    const statusText = isPaid ? 'Successful' : 'Processing';
    const title = isPaid ? 'Reimbursement Successful!' : 'Reimbursement Processing';
    const content = isPaid 
      ? `Reimbursement of ₹${claim.amount.toLocaleString()} for "${claim.description}" has been credited to your bank account. Tx ID: ${txId || 'N/A'}`
      : `Reimbursement of ₹${claim.amount.toLocaleString()} is processing. Ref ID: ${ref}`;

    try {
      await SystemNotificationService.createNotification({
        companyId: claim.companyId || 'company_001',
        userId: employee.email,
        title,
        content,
        type: 'payroll',
        targetPage: 'payroll'
      });

      // Email
      await sendEmail({
        to: employee.email,
        subject: title,
        text: `Hi ${employee.fullName},\n\nYour reimbursement payout is: ${statusText}.\nAmount: INR ${claim.amount}\nReference ID: ${ref}\n\nHR System`,
        html: `<p>Hi ${employee.fullName},</p><p>Your automated reimbursement payout is: <strong>${statusText}</strong>.</p><p><strong>Amount:</strong> INR ${claim.amount}</p><p><strong>Reference ID:</strong> ${ref}</p>${txId ? `<p><strong>Transaction ID:</strong> ${txId}</p>` : ''}<p>Thank you!</p>`
      });
    } catch (err) {
      console.error('Failed to notify employee:', err);
    }
  }
}
