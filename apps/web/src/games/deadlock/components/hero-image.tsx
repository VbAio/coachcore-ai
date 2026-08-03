'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ROLE_GRADIENTS } from '@/data/heroes';

interface HeroImageProps {
  src: string;
  alt: string;
  role: string;
  name: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function HeroImage({
  src,
  alt,
  role,
  name,
  className,
  sizes,
  priority,
}: HeroImageProps) {
  const [failed, setFailed] = useState(false);
  const gradient = ROLE_GRADIENTS[role] ?? 'from-purple-600 to-indigo-700';
  const initial = name.charAt(0).toUpperCase();

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br text-white font-bold',
          gradient,
          className
        )}
        aria-label={alt}
      >
        <span className="text-3xl opacity-90">{initial}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
      onError={() => setFailed(true)}
    />
  );
}
