export function getAuthErrorMessage(error?: string | null): string {
  switch (error) {
    case 'CredentialsSignin':
      return 'Invalid email or password.';
    case 'Configuration':
      return 'Sign-in failed while saving your account after Google/Discord redirected back. Try again in a private window. If it persists, use email/password or check Vercel logs for [auth][error].';
    case 'OAuthCallbackError':
      return 'Google/Discord returned an invalid response. Confirm the redirect URI in Google/Discord matches https://clutchcore-web.vercel.app/api/auth/callback/google (or discord).';
    case 'AdapterError':
      return 'Could not save your social login to the database. Try email/password sign-in, or retry after a minute.';
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
