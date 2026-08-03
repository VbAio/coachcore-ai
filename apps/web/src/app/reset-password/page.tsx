'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { PasswordStrength } from '@/components/auth/password-strength';
import {
  FormField,
  PasswordInput,
  SubmitButton,
  FormAlert,
} from '@/components/auth/form-fields';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Reset failed');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <FormAlert type="error" message="Invalid or missing reset token. Request a new link." />
    );
  }

  if (success) {
    return (
      <FormAlert
        type="success"
        message="Password updated! Redirecting to sign in..."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <FormAlert type="error" message={error} />}

      <FormField label="New Password">
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <PasswordStrength password={password} />
      </FormField>

      <FormField label="Confirm Password">
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </FormField>

      <SubmitButton loading={loading}>Update password</SubmitButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/5" />}>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="text-purple-400 hover:text-purple-300">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
