import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { config } from '../config';

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  companyName: string;
  companyCode: string;
  companyId: string;
  fullName?: string;
  branchId?: string;
}

/**
 * Verifies a Bearer JWT token from a Web API Request object.
 * Used by Next.js-style route handlers inside the backend adapter.
 * @returns DecodedToken if valid, null if invalid or missing
 */
export function verifyAuthToken(req: Request): DecodedToken | null {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as any;
    } catch (err: any) {
      // Log only error type — never log the token or full auth header
      console.error('verifyAuthToken: JWT verification failed —', err.name);
      return null;
    }

    if (decoded) {
      // Backwards compatibility for existing tokens
      if (!decoded.companyName) decoded.companyName = 'HR Core Labs';
      if (!decoded.companyCode) decoded.companyCode = 'hrcore';
      if (!decoded.companyId)   decoded.companyId = decoded.companyCode;
      if (!decoded.fullName)    decoded.fullName = decoded.email.split('@')[0];
    }

    return decoded as DecodedToken;
  } catch (error) {
    console.error('verifyAuthToken: Unexpected error during JWT verification');
    return null;
  }
}

export function checkRole(decoded: DecodedToken, allowedRoles: string[]): boolean {
  return allowedRoles.includes(decoded.role);
}

export function createErrorResponse(message: string, status: number = 401): Response {
  return NextResponse.json({ error: message }, { status });
}
