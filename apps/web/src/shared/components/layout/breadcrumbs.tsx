'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getRouteHref } from '@/games/registry';
import { useGameContext } from '@/shared/context/game-context';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  currentTitle: string;
  slug?: string[];
}

export function Breadcrumbs({ currentTitle, slug }: BreadcrumbsProps) {
  const { game, gameId } = useGameContext();
  const pathname = usePathname();

  const crumbs: { label: string; href: string }[] = [
    { label: game.name, href: `/${gameId}` },
  ];

  if (slug?.length) {
    let built = '';
    for (let i = 0; i < slug.length - 1; i++) {
      built += (built ? '/' : '') + slug[i];
      const navItem = game.navigation.find((n) => n.path === built);
      crumbs.push({
        label: navItem?.label ?? slug[i],
        href: getRouteHref(gameId, built),
      });
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-zinc-500 mb-6">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <Link href={crumb.href} className="hover:text-purple-400 transition-colors">
            {crumb.label}
          </Link>
        </span>
      ))}
      {crumbs.length > 0 && <ChevronRight className="h-3 w-3" />}
      <span className="text-zinc-300">{currentTitle}</span>
    </nav>
  );
}
