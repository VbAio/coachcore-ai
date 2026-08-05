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

function PageLoading() {
  return (
    <div className="space-y-4 py-10">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl bg-white/5 shimmer" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/5 shimmer" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-white/5 shimmer" />
      <p className="pt-4 text-center text-sm text-zinc-500">Loading page…</p>
    </div>
  );
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
        loading: () => <PageLoading />,
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
