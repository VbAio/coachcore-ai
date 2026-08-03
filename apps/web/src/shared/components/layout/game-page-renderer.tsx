'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { getGameModule } from '@/games/registry';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import type { GamePageProps } from '@/games/types';

interface GamePageRendererProps {
  gameId: string;
  routePath: string;
  routeTitle: string;
  params: Record<string, string>;
  slug?: string[];
}

export function GamePageRenderer({
  gameId,
  routePath,
  routeTitle,
  params,
  slug,
}: GamePageRendererProps) {
  const Page = useMemo(() => {
    const module = getGameModule(gameId);
    const route = module?.routes.find((r) => r.path === routePath);
    if (!route) {
      return () => <div className="text-zinc-400">Page not found</div>;
    }

    return dynamic(
      () => route.load().then((mod) => mod.default),
      {
        loading: () => (
          <div className="flex items-center justify-center py-24 text-zinc-400">Loading...</div>
        ),
        ssr: false,
      }
    );
  }, [gameId, routePath]);

  const pageProps: GamePageProps = { params };

  return (
    <>
      <Breadcrumbs currentTitle={routeTitle} slug={slug} />
      <Page {...pageProps} />
    </>
  );
}
