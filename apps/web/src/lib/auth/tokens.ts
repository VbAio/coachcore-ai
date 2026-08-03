import { randomBytes } from 'crypto';

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function tokenExpires(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function tokenExpiresHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function tokenExpiresDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
