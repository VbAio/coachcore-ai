import { cn } from '@/lib/utils';

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'glow';
  size?: 'default' | 'lg' | 'sm';
}) {
  const variants = {
    default: 'gradient-purple text-white hover:opacity-90',
    outline: 'border border-purple-500/50 text-purple-300 hover:bg-purple-500/10',
    ghost: 'text-purple-300 hover:bg-white/5',
    glow: 'gradient-purple text-white glow-purple hover:scale-105 transition-transform',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    lg: 'h-14 px-8 text-lg',
    sm: 'h-8 px-3 text-sm',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
