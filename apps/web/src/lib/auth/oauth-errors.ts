export function getAuthErrorMessage(error?: string | null): string {
  switch (error) {
    case 'CredentialsSignin':
      return 'Invalid email or password.';
    case 'Configuration':
      return 'Social sign-in is not configured on the server. Add AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_DISCORD_ID, and AUTH_DISCORD_SECRET in Vercel, then redeploy.';
    case 'OAuthAccountNotLinked':
      return 'An account with this email already exists. Sign in with email/password first, then connect Google or Discord in Settings.';
    case 'OAuthCallback':
      return 'Sign-in callback failed. Make sure AUTH_URL in Vercel matches your live site URL exactly, then redeploy.';
    case 'OAuthSignin':
      return 'Could not start social sign-in. Please try again.';
    case 'AccessDenied':
      return 'Sign-in was cancelled or denied.';
    case 'Callback':
      return 'Sign-in callback error. Please try again.';
    default:
      return error ? `Sign-in failed (${error}). Please try again or use email/password.` : '';
  }
}
