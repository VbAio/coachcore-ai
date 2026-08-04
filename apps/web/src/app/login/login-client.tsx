'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { OAuthButtons, AuthDivider } from '@/components/auth/oauth-buttons';
import {
  FormField,
  TextInput,
  PasswordInput,
  SubmitButton,
  FormAlert,
} from '@/components/auth/form-fields';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorParam === 'CredentialsSignin'
      ? 'Invalid email or password'
      : errorParam === 'Configuration'
        ? 'Social sign-in is not configured. Contact support or use email/password.'
        : errorParam
          ? 'Sign-in failed. Please try again.'
          : ''
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password, or account is temporarily locked.');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to sync your coaching data across devices">
      <OAuthButtons callbackUrl={callbackUrl} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert type="error" message={error} />}

        <FormField label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </FormField>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-zinc-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-white/20 bg-black/40 text-purple-500 focus:ring-purple-500/30"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300">
            Forgot password?
          </Link>
        </div>

        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-purple-400 hover:text-purple-300">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
