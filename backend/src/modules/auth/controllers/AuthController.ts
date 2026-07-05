import { NextResponse } from 'next/server';
import { AuthService } from '../services/AuthService';
import { connectToDatabase } from '../../../database';
import { rateLimiter } from '../../../middleware/rateLimiter';
import { verifyAuth } from '../../../api/lib/auth';
import {
  validateLogin,
  validateCompanyRegister,
  validateForgotPassword,
  validateResetPassword,
  validateInviteUser,
  sanitizeString
} from '../../../middleware/validate';

export class AuthController {
  static async login(req: Request) {
    try {
      await connectToDatabase();
      const rawBody = await req.json().catch(() => null);

      // ── Server-side input validation ──
      const { data: body, error: validationError } = validateLogin(rawBody);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      // ── Per-IP brute force protection (10 attempts per 5 mins) ──
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:login`, 10, 5 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.login(body!);

      if (result.error) {
        return NextResponse.json({ error: result.error, requiresVerification: result.requiresVerification }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController Login Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async companyRegister(req: Request) {
    try {
      await connectToDatabase();
      const rawBody = await req.json().catch(() => null);

      // ── Server-side input validation ──
      const { data: body, error: validationError } = validateCompanyRegister(rawBody);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      // ── Per-IP rate limiting (5 registrations per 15 mins) ──
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:company-register`, 5, 15 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.companyRegister(body!, ip);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController Company Register Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async verifyEmail(req: Request) {
    try {
      await connectToDatabase();
      const rawBody: any = await req.json().catch(() => null);

      if (!rawBody?.email || !rawBody?.otp) {
        return NextResponse.json({ error: 'Email and verification OTP are required.' }, { status: 400 });
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:verify-email`, 5, 15 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.verifyEmail(rawBody, ip);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController Verify Email Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async sendOtp(req: Request) {
    try {
      await connectToDatabase();
      const rawBody: any = await req.json().catch(() => null);

      // Validate email
      if (!rawBody?.email || typeof rawBody.email !== 'string') {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
      }
      const emailClean = rawBody.email.trim().toLowerCase().slice(0, 254);

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:send-otp`, 10, 10 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.sendOtp(emailClean, rawBody.type || 'email', ip);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController Send OTP Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async setupAdminProfile(req: Request) {
    try {
      await connectToDatabase();
      const rawBody = await req.json().catch(() => null);

      if (!rawBody || typeof rawBody !== 'object') {
        return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:setup-admin-profile`, 5, 15 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.setupAdminProfile(rawBody, ip);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController setupAdminProfile Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async verifyMobileOtp(req: Request) {
    try {
      await connectToDatabase();
      const rawBody: any = await req.json().catch(() => null);

      if (!rawBody?.otp || typeof rawBody.otp !== 'string') {
        return NextResponse.json({ error: 'OTP is required.' }, { status: 400 });
      }
      // Sanitize OTP — must be 4-8 numeric digits only
      if (!/^\d{4,8}$/.test(rawBody.otp)) {
        return NextResponse.json({ error: 'Invalid OTP format.' }, { status: 400 });
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:verify-mobile-otp`, 5, 15 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.verifyMobileOtp(rawBody, ip);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController verifyMobileOtp Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async inviteUser(req: Request) {
    try {
      const decoded = verifyAuth(req);
      if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HR')) {
        return NextResponse.json({ error: 'Unauthorized. Only Admin and HR can invite users.' }, { status: 401 });
      }

      await connectToDatabase();
      const rawBody = await req.json().catch(() => null);

      // ── Server-side input validation ──
      const { data: body, error: validationError } = validateInviteUser(rawBody);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const result = await AuthService.inviteUser({
        ...body!,
        senderEmail: decoded.email,
        senderCompanyId: decoded.companyId,
        senderCompanyCode: decoded.companyCode,
        senderCompanyName: decoded.companyName
      }, ip);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController Invite User Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async acceptInvite(req: Request) {
    try {
      await connectToDatabase();
      const rawBody: any = await req.json().catch(() => null);

      if (!rawBody?.token || typeof rawBody.token !== 'string') {
        return NextResponse.json({ error: 'Invite token is required.' }, { status: 400 });
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:accept-invite`, 5, 15 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.acceptInvite(rawBody, ip);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController Accept Invite Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async forgotPassword(req: Request) {
    try {
      await connectToDatabase();
      const rawBody = await req.json().catch(() => null);

      // ── Server-side input validation ──
      const { data: body, error: validationError } = validateForgotPassword(rawBody);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:forgot-password`, 3, 15 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.forgotPassword(body!.email);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController ForgotPassword Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async resetPassword(req: Request) {
    try {
      await connectToDatabase();
      const rawBody = await req.json().catch(() => null);

      // ── Server-side input validation ──
      const { data: body, error: validationError } = validateResetPassword(rawBody);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const limiter = rateLimiter(`${ip}:reset-password`, 5, 15 * 60 * 1000);
      if (limiter.blocked) return limiter.response!;

      const result = await AuthService.resetPassword(body!);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AuthController ResetPassword Error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  static async signup(req: Request) {
    // Redirect standard signup to companyRegister
    return this.companyRegister(req);
  }
}
