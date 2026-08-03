'use client';

import Link from 'next/link';
import { useGamePath } from '@/shared/context/game-context';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';

export function ComingSoonPage({ feature }: { feature: string }) {
  const basePath = useGamePath();

  return (
    <div className="glass rounded-2xl p-12 text-center max-w-lg mx-auto mt-12">
      <Construction className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">{feature}</h1>
      <p className="text-zinc-400 text-sm mb-6">This feature is coming soon for this game.</p>
      <Link href={basePath}>
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}

export function GameUnavailablePage({ gameName }: { gameName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-12 text-center max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">{gameName}</h1>
        <p className="text-zinc-400 mb-6">Coaching for {gameName} is coming soon.</p>
        <Link href="/deadlock">
          <Button variant="glow">Try Deadlock</Button>
        </Link>
      </div>
    </div>
  );
}
