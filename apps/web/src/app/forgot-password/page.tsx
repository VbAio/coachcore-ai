'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import {
  FormField,
  TextInput,
  SubmitButton,
  FormAlert,
} from '@/components/auth/form-fields';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Request failed');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a secure link to your email"
    >
      {success ? (
        <FormAlert
          type="success"
          message="If an account exists with that email, a reset link has been sent. Check your inbox."
        />
      ) : (
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

          <SubmitButton loading={loading}>Send reset link</SubmitButton>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="text-purple-400 hover:text-purple-300">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
