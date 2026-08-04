import { NextResponse } from 'next/server';
import { isDiscordOAuthConfigured, isGoogleOAuthConfigured } from '@/lib/auth/oauth';

export async function GET() {
  return NextResponse.json({
    authSecret: !!process.env.AUTH_SECRET,
    authUrl: process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null,
    google: isGoogleOAuthConfigured(),
    discord: isDiscordOAuthConfigured(),
  });
}
