/**
 * Input Validation Schemas — Zod
 * Centralized schema validation for all auth and critical API inputs.
 * Use these in controllers/routes to validate request bodies before processing.
 *
 * Usage:
 *   import { loginSchema, validate } from '../../middleware/validate';
 *   const [body, err] = validate(loginSchema, rawBody);
 *   if (err) return NextResponse.json({ error: err }, { status: 400 });
 */

// Using built-in validation without external zod dependency
// (zod is in frontend package.json but not backend — using manual validation)

export interface ValidationResult<T> {
  data: T | null;
  error: string | null;
}

// ─────────────────────────────────────────────
// Utility: validate email format
// ─────────────────────────────────────────────
function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// ─────────────────────────────────────────────
// Utility: sanitize string input
// ─────────────────────────────────────────────
export function sanitizeString(value: unknown, fieldName: string, maxLength = 255): ValidationResult<string> {
  if (value === undefined || value === null || value === '') {
    return { data: null, error: `${fieldName} is required.` };
  }
  if (typeof value !== 'string') {
    return { data: null, error: `${fieldName} must be a string.` };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { data: null, error: `${fieldName} cannot be empty.` };
  }
  if (trimmed.length > maxLength) {
    return { data: null, error: `${fieldName} must be ${maxLength} characters or less.` };
  }
  // Strip potentially dangerous characters for log injection
  const sanitized = trimmed.replace(/[\r\n\t]/g, ' ');
  return { data: sanitized, error: null };
}

// ─────────────────────────────────────────────
// Login Validation
// ─────────────────────────────────────────────
export interface LoginInput {
  email: string;
  password: string;
}

export function validateLogin(body: any): ValidationResult<LoginInput> {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Request body is required.' };
  }

  const emailResult = sanitizeString(body.email, 'Email', 254);
  if (emailResult.error) return { data: null, error: emailResult.error };
  if (!isEmail(emailResult.data!)) {
    return { data: null, error: 'Invalid email format.' };
  }

  const passResult = sanitizeString(body.password, 'Password', 128);
  if (passResult.error) return { data: null, error: passResult.error };
  if (passResult.data!.length < 6) {
    return { data: null, error: 'Password must be at least 6 characters.' };
  }

  return {
    data: { email: emailResult.data!.toLowerCase(), password: passResult.data! },
    error: null
  };
}

// ─────────────────────────────────────────────
// Company Registration Validation
// ─────────────────────────────────────────────
export interface CompanyRegisterInput {
  companyName: string;
  slug: string;
  workEmail: string;
  companySize?: string;
  industry?: string;
  country?: string;
  timezone?: string;
  phoneNumber?: string;
  gstNumber?: string;
  website?: string;
  companyDomain?: string;
}

export function validateCompanyRegister(body: any): ValidationResult<CompanyRegisterInput> {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Request body is required.' };
  }

  const companyNameResult = sanitizeString(body.companyName, 'Company name', 100);
  if (companyNameResult.error) return { data: null, error: companyNameResult.error };

  const slugResult = sanitizeString(body.slug, 'Subdomain / Slug', 100);
  if (slugResult.error) return { data: null, error: slugResult.error };

  const emailResult = sanitizeString(body.workEmail, 'Email', 254);
  if (emailResult.error) return { data: null, error: emailResult.error };
  if (!isEmail(emailResult.data!)) {
    return { data: null, error: 'Invalid email format.' };
  }

  return {
    data: {
      companyName: companyNameResult.data!,
      slug: slugResult.data!,
      workEmail: emailResult.data!.toLowerCase(),
      companySize: body.companySize ? String(body.companySize).slice(0, 50) : undefined,
      industry: body.industry ? String(body.industry).slice(0, 50) : undefined,
      country: body.country ? String(body.country).slice(0, 50) : undefined,
      timezone: body.timezone ? String(body.timezone).slice(0, 50) : undefined,
      phoneNumber: body.phoneNumber ? String(body.phoneNumber).slice(0, 30) : undefined,
      gstNumber: body.gstNumber ? String(body.gstNumber).slice(0, 30) : undefined,
      website: body.website ? String(body.website).slice(0, 200) : undefined,
      companyDomain: body.companyDomain ? String(body.companyDomain).slice(0, 100) : undefined
    },
    error: null
  };
}

// ─────────────────────────────────────────────
// Forgot Password Validation
// ─────────────────────────────────────────────
export function validateForgotPassword(body: any): ValidationResult<{ email: string }> {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Request body is required.' };
  }
  const emailResult = sanitizeString(body.email, 'Email', 254);
  if (emailResult.error) return { data: null, error: emailResult.error };
  if (!isEmail(emailResult.data!)) {
    return { data: null, error: 'Invalid email format.' };
  }
  return { data: { email: emailResult.data!.toLowerCase() }, error: null };
}

// ─────────────────────────────────────────────
// Reset Password Validation
// ─────────────────────────────────────────────
export interface ResetPasswordInput {
  token: string;
  password: string;
}

export function validateResetPassword(body: any): ValidationResult<ResetPasswordInput> {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Request body is required.' };
  }
  const tokenResult = sanitizeString(body.token, 'Token', 512);
  if (tokenResult.error) return { data: null, error: tokenResult.error };

  const passResult = sanitizeString(body.password, 'Password', 128);
  if (passResult.error) return { data: null, error: passResult.error };
  if (passResult.data!.length < 8) {
    return { data: null, error: 'New password must be at least 8 characters.' };
  }
  if (!/[a-zA-Z]/.test(passResult.data!) || !/[0-9]/.test(passResult.data!)) {
    return { data: null, error: 'Password must contain at least one letter and one number.' };
  }

  return { data: { token: tokenResult.data!, password: passResult.data! }, error: null };
}

// ─────────────────────────────────────────────
// Invite User Validation
// ─────────────────────────────────────────────
export interface InviteUserInput {
  email: string;
  role: string;
  fullName?: string;
}

const ALLOWED_INVITE_ROLES = ['HR', 'Employee', 'Manager'];

export function validateInviteUser(body: any): ValidationResult<InviteUserInput> {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Request body is required.' };
  }
  const emailResult = sanitizeString(body.email, 'Email', 254);
  if (emailResult.error) return { data: null, error: emailResult.error };
  if (!isEmail(emailResult.data!)) {
    return { data: null, error: 'Invalid email format.' };
  }
  const roleResult = sanitizeString(body.role, 'Role', 50);
  if (roleResult.error) return { data: null, error: roleResult.error };
  if (!ALLOWED_INVITE_ROLES.includes(roleResult.data!)) {
    return { data: null, error: `Role must be one of: ${ALLOWED_INVITE_ROLES.join(', ')}.` };
  }

  return {
    data: {
      email: emailResult.data!.toLowerCase(),
      role: roleResult.data!,
      fullName: body.fullName ? String(body.fullName).slice(0, 100) : undefined
    },
    error: null
  };
}
