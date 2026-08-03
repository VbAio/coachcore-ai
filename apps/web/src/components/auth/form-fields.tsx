'use client';

import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">{error}</p>
      )}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30',
        className
      )}
      {...props}
    />
  );
}

export function PasswordInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={cn(
          'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pr-12 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30',
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
  className,
  type = 'submit',
  onClick,
}: {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: 'submit' | 'button';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-xl gradient-purple py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50',
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function FormAlert({ type, message }: { type: 'error' | 'success'; message: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm animate-in fade-in slide-in-from-top-1',
        type === 'error'
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      )}
    >
      {message}
    </div>
  );
}
