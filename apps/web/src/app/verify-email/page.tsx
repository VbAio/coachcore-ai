'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { SubmitButton, FormAlert, FormField, TextInput } from '@/components/auth/form-fields';
import { Mail, CheckCircle2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const token = searchParams.get('token');
  const justRegistered = searchParams.get('registered');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const resendEmail = session?.user?.email ?? emailInput.trim();

  useEffect(() => {
    if (!token) return;

    async function verify() {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage('Email verified! You now have full access.');
          await update();
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error ?? 'Verification failed');
        }
      } catch {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token, router, update]);

  async function resend() {
    if (!resendEmail) {
      setMessage('Enter your email address to resend the verification link.');
      setStatus('error');
      return;
    }

    setResending(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setMessage(res.ok ? data.message : data.error);
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setMessage('Failed to resend email');
      setStatus('error');
    } finally {
      setResending(false);
    }
  }

  if (token && loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="mt-4 text-zinc-400">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success' && token) {
    return (
      <div className="py-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <p className="mt-4 text-emerald-300">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <Mail className="mx-auto h-12 w-12 text-purple-400" />
      <div>
        <p className="text-zinc-300">
          {justRegistered
            ? 'Account created! Check your inbox for a verification link.'
            : 'Verify your email to unlock saving heroes, replays, and synced settings.'}
        </p>
        {session?.user?.email && (
          <p className="mt-2 text-sm text-zinc-500">Sent to {session.user.email}</p>
        )}
      </div>

      {!session?.user?.email && (
        <FormField label="Email">
          <TextInput
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </FormField>
      )}

      {message && (
        <FormAlert type={status === 'error' ? 'error' : 'success'} message={message} />
      )}

      <SubmitButton type="button" loading={resending} onClick={resend}>
        Resend verification email
      </SubmitButton>

      <p className="text-sm text-zinc-500">
        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">
          Continue to dashboard
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Verify your email" subtitle="One more step to unlock full access">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/5" />}>
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}
