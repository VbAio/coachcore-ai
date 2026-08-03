'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { OAuthButtons, AuthDivider } from '@/components/auth/oauth-buttons';
import { PasswordStrength } from '@/components/auth/password-strength';
import {
  FormField,
  TextInput,
  PasswordInput,
  SubmitButton,
  FormAlert,
} from '@/components/auth/form-fields';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
          acceptTerms,
          acceptPrivacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Signup failed');
        return;
      }

      router.push('/verify-email?registered=1');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join CoachCore AI and level up your Deadlock game">
      <OAuthButtons callbackUrl="/dashboard" />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert type="error" message={error} />}

        <FormField label="Username">
          <TextInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ProPlayer_99"
            required
            autoComplete="username"
          />
        </FormField>

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
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </FormField>

        <FormField label="Confirm Password">
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </FormField>

        <div className="space-y-2 text-sm text-zinc-400">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-black/40 text-purple-500"
              required
            />
            <span>
              I accept the{' '}
              <Link href="/terms" className="text-purple-400 hover:underline">
                Terms of Service
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-black/40 text-purple-500"
              required
            />
            <span>
              I accept the{' '}
              <Link href="/privacy" className="text-purple-400 hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-purple-400 hover:text-purple-300">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
