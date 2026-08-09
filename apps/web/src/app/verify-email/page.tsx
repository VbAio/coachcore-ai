'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { SubmitButton, FormAlert, FormField, TextInput } from '@/components/auth/form-fields';
import { Mail, CheckCircle2 } from 'lucide-react';
import { isEmailVerified } from '@/lib/auth/is-email-verified';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const token = searchParams.get('token');
  const justRegistered = searchParams.get('registered');
  const verifyingRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifiedOk, setVerifiedOk] = useState(false);
  const [statusUi, setStatusUi] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const resendEmail = session?.user?.email ?? emailInput.trim();
  const alreadyVerified = isEmailVerified(session?.user?.emailVerified);

  useEffect(() => {
    // Already verified (e.g. returned here) — banner can clear; send to replays
    if (!token && alreadyVerified && status === 'authenticated') {
      router.replace('/rocket-league/replays');
    }
  }, [token, alreadyVerified, status, router]);

  useEffect(() => {
    if (!token || verifyingRef.current) return;
    verifyingRef.current = true;

    async function verify() {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.emailVerified) {
          setVerifiedOk(true);
          setStatusUi('success');
          setMessage('Email verified! Replay analysis is unlocked.');

          // Only clear the top banner after a real successful verify
          if (status === 'authenticated' || data.sessionRefreshed) {
            await update({ emailVerified: data.emailVerified });
          } else {
            await update().catch(() => undefined);
          }

          router.refresh();
          const next =
            typeof data.redirectTo === 'string' ? data.redirectTo : '/rocket-league/replays';
          setTimeout(() => {
            router.push(next);
          }, 1200);
        } else {
          setVerifiedOk(false);
          setStatusUi('error');
          setMessage(data.error ?? 'Verification failed');
        }
      } catch {
        setVerifiedOk(false);
        setStatusUi('error');
        setMessage('Verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    void verify();
  }, [token, router, update, status]);

  async function resend() {
    if (!resendEmail) {
      setMessage('Enter your email address to resend the verification link.');
      setStatusUi('error');
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
      // Resend must NOT clear the banner or unlock replays — only the email link does
      setMessage(res.ok ? data.message : data.error);
      setStatusUi(res.ok ? 'success' : 'error');
    } catch {
      setMessage('Failed to resend email');
      setStatusUi('error');
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

  if (verifiedOk && token) {
    return (
      <div className="py-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <p className="mt-4 text-emerald-300">{message}</p>
        <p className="mt-2 text-sm text-zinc-500">Taking you to Replay Analysis…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <Mail className="mx-auto h-12 w-12 text-purple-400" />
      <div>
        <p className="text-zinc-300">
          {justRegistered
            ? 'Account created! Check your inbox for a verification link — then you can upload replays and sync settings.'
            : 'You must verify your email before using Replay Analysis and synced settings.'}
        </p>
        {(session?.user?.email || emailInput) && (
          <p className="mt-2 text-sm text-zinc-500">
            {session?.user?.email
              ? `Sent to ${session.user.email}`
              : 'Enter the email you signed up with to resend the link.'}
          </p>
        )}
      </div>

      <p
        className="rounded-xl border-2 border-amber-400/50 bg-amber-500/15 px-4 py-4 text-base font-semibold leading-snug text-amber-100 sm:text-lg"
        role="status"
      >
        Can&apos;t find it? Check your spam / junk folder — verification emails often land there.
      </p>

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
        <FormAlert type={statusUi === 'error' ? 'error' : 'success'} message={message} />
      )}

      <SubmitButton type="button" loading={resending} onClick={resend}>
        Resend verification email
      </SubmitButton>

      <p className="text-xs text-zinc-600">Link expires in 24 hours.</p>

      <p className="text-sm text-zinc-500">
        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">
          Back to dashboard
        </Link>
        <span className="mx-2 text-zinc-600">·</span>
        <span className="text-zinc-600">Replay Analysis unlocks after you verify</span>
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
