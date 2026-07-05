import { NextResponse } from 'next/server';

const rateLimitStore = new Map<string, number[]>();

export function rateLimiter(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): { blocked: boolean; response?: Response } {
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, [now]);
    return { blocked: false };
  }

  const timestamps = rateLimitStore.get(key) || [];
  // Filter timestamps that occurred within the current window
  const activeTimestamps = timestamps.filter(t => now - t < windowMs);
  activeTimestamps.push(now);
  rateLimitStore.set(key, activeTimestamps);

  if (activeTimestamps.length > limit) {
    return {
      blocked: true,
      response: NextResponse.json(
        { error: 'Too many verification or access attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    };
  }

  return { blocked: false };
}
