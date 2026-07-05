/**
 * Security Middleware — HTTP Security Headers
 * Adds industry-standard security headers to every response.
 * Place this as the FIRST middleware in server.ts after compression.
 */
import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent browsers from MIME-sniffing content type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking — deny embedding in iframes
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filter in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Only allow HTTPS connections (6 months, include subdomains)
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');

  // Control which browser features can be used
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Prevent referrer leakage on cross-origin requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy — restrict resource loading
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for Next.js hydration
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://res.cloudinary.com https://ui-avatars.com https://api.dicebear.com",
      "connect-src 'self' wss: ws:",  // allow WebSocket connections
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  // Remove server fingerprint header
  res.removeHeader('X-Powered-By');

  next();
}
