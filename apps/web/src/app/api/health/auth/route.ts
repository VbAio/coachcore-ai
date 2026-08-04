import { NextResponse } from 'next/server';
import { isDiscordOAuthConfigured, isGoogleOAuthConfigured } from '@/lib/auth/oauth';
import { getConfiguredAppUrl, isMalformedAppUrl } from '@/lib/auth/app-url';

export async function GET() {
  const rawAuthUrl = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;

  return NextResponse.json({
    authSecret: !!process.env.AUTH_SECRET,
    authUrl: rawAuthUrl,
    normalizedAuthUrl: rawAuthUrl ? getConfiguredAppUrl() : null,
    authUrlMalformed: rawAuthUrl ? isMalformedAppUrl(rawAuthUrl) : false,
    google: isGoogleOAuthConfigured(),
    discord: isDiscordOAuthConfigured(),
  });
}
