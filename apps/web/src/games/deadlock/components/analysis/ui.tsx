import { cn } from '@/lib/utils';

export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200/90">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
    </div>
  );
}
