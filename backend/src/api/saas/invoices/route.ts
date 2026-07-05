import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../database';
import { Invoice } from '../../../models/Invoice';
import { verifyAuth } from '../../lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download');
    const invoiceNumber = searchParams.get('invoiceNumber');

    // For file download verification, allow direct access if token is passed via query string
    const tokenQuery = searchParams.get('token');
    let decoded = verifyAuth(req);
    // If not found in headers, check query param (backwards compatibility for simple file downloads)
    if (!decoded && tokenQuery) {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET; // Must be set — enforced by config/index.ts at startup
      if (JWT_SECRET) {
        try {
          decoded = jwt.verify(tokenQuery, JWT_SECRET);
        } catch (err) {}
      }
    }

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Handle PDF Download Simulation
    if (download === 'true' && invoiceNumber) {
      const invoice = await Invoice.findOne({ invoiceNumber, companyId: decoded.companyId });
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const reportContent = `
==================================================
                 HR CORE INVOICE
==================================================
Invoice Number : ${invoice.invoiceNumber}
Date           : ${invoice.createdAt.toLocaleDateString()}
Billing Period : ${invoice.billingPeriod}
Payment Status : ${invoice.paymentStatus.toUpperCase()}
--------------------------------------------------
CLIENT DETAILS:
Company Name   : ${invoice.companyName}
GSTIN          : ${invoice.gstNumber || 'N/A'}
--------------------------------------------------
DESCRIPTION                      AMOUNT (INR)
--------------------------------------------------
Subscription to ${invoice.planName}      ₹${invoice.amount.toLocaleString()}
GST (18% inclusive/added)        ₹${invoice.taxAmount.toLocaleString()}
--------------------------------------------------
TOTAL DUE                        ₹${invoice.totalAmount.toLocaleString()}
==================================================
       Thank you for choosing HR Core!
==================================================
`;

      const response = new Response(reportContent.trim());
      response.headers.set('Content-Type', 'text/plain');
      response.headers.set(
        'Content-Disposition',
        `attachment; filename="Invoice-${invoiceNumber}.txt"`
      );
      return response;
    }

    // 2. Standard Invoice List
    let invoices = await Invoice.find({ companyId: decoded.companyId }).sort({ createdAt: -1 });

    if (invoices.length === 0) {
      // Seed two mock invoices for historical layout visibility
      console.log('Seeding mock historical invoices...');
      const now = new Date();
      const firstInvoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const secondInvoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const seedInvoices = [
        {
          invoiceNumber: firstInvoiceNum,
          companyId: decoded.companyId,
          companyName: decoded.companyName,
          gstNumber: decoded.companyCode + 'GST123',
          planName: 'Starter Plan',
          billingPeriod: `${new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}`,
          amount: 999,
          taxAmount: 180,
          totalAmount: 1179,
          paymentStatus: 'paid',
          pdfUrl: `/api/saas/invoices?download=true&invoiceNumber=${firstInvoiceNum}`
        },
        {
          invoiceNumber: secondInvoiceNum,
          companyId: decoded.companyId,
          companyName: decoded.companyName,
          gstNumber: decoded.companyCode + 'GST123',
          planName: 'Starter Plan',
          billingPeriod: `${new Date(now.getFullYear(), now.getMonth() - 2, 1).toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}`,
          amount: 999,
          taxAmount: 180,
          totalAmount: 1179,
          paymentStatus: 'paid',
          pdfUrl: `/api/saas/invoices?download=true&invoiceNumber=${secondInvoiceNum}`
        }
      ];

      await Invoice.insertMany(seedInvoices);
      invoices = await Invoice.find({ companyId: decoded.companyId }).sort({ createdAt: -1 });
    }

    return NextResponse.json(invoices, { status: 200 });
  } catch (error: any) {
    console.error('Failed to query invoices:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invoices', details: error.message },
      { status: 500 }
    );
  }
}
