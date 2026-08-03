'use client';

import { cn } from '@/lib/utils';
import { getPasswordStrength } from '@/lib/auth/password-strength';

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, checks } = getPasswordStrength(password);
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= score ? colors[score] : 'bg-white/10'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">{label}</p>
      <ul className="grid grid-cols-2 gap-1 text-[11px] text-zinc-600">
        <li className={checks.length ? 'text-emerald-400' : ''}>8+ characters</li>
        <li className={checks.uppercase ? 'text-emerald-400' : ''}>Uppercase</li>
        <li className={checks.lowercase ? 'text-emerald-400' : ''}>Lowercase</li>
        <li className={checks.number ? 'text-emerald-400' : ''}>Number</li>
        <li className={checks.special ? 'text-emerald-400' : ''}>Special char</li>
      </ul>
    </div>
  );
}
