'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PlatformNavbar } from '@/shared/components/layout/platform-navbar';
import { Calendar, Trophy, Swords } from 'lucide-react';

interface ProfileData {
  username: string;
  displayName: string;
  avatar: string | null;
  joinDate: string;
  favoriteHeroes: unknown[];
  savedHeroes: unknown[];
  savedMatches: unknown[];
  role: string;
}

export default function ProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const username = params.username as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/user/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
      } else {
        setError('User not found');
      }
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <PlatformNavbar />
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <PlatformNavbar />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center text-zinc-400">{error}</div>
      </div>
    );
  }

  const initials = profile.displayName.slice(0, 2).toUpperCase();
  const joinDate = new Date(profile.joinDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const isOwnProfile = session?.user?.username === profile.username;

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <PlatformNavbar />
      <div className="mx-auto max-w-4xl px-6">
        <div className="glass overflow-hidden rounded-2xl">
          <div className="h-32 gradient-purple opacity-80" />
          <div className="relative px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt=""
                  className="h-24 w-24 rounded-2xl border-4 border-black object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-black gradient-purple text-2xl font-bold">
                  {initials}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
                <p className="text-zinc-400">@{profile.username}</p>
              </div>
              {isOwnProfile && (
                <Link
                  href="/settings/account"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {joinDate}
              </span>
              <span className="flex items-center gap-1.5 capitalize">
                <Trophy className="h-4 w-4" />
                {profile.role}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <ProfileSection
            title="Favorite Heroes"
            icon={Swords}
            items={profile.favoriteHeroes as unknown[]}
            empty="No favorite heroes yet"
          />
          <ProfileSection
            title="Saved Builds"
            icon={Trophy}
            items={profile.savedHeroes as unknown[]}
            empty="No saved builds yet"
          />
          <ProfileSection
            title="Saved Matches"
            icon={Calendar}
            items={profile.savedMatches as unknown[]}
            empty="No saved matches yet"
          />
        </div>

        <div className="mt-8 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <p className="mt-4 text-sm text-zinc-500">Activity feed coming soon — replays, coaching reports, and leaderboard updates.</p>
        </div>

        <div className="mt-6 flex gap-4">
          <div className="glass flex-1 rounded-xl p-4 text-center opacity-60">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Account Level</p>
            <p className="mt-1 text-2xl font-bold text-white">—</p>
            <p className="text-xs text-zinc-600">Coming soon</p>
          </div>
          <div className="glass flex-1 rounded-xl p-4 text-center opacity-60">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Badges</p>
            <p className="mt-1 text-2xl font-bold text-white">—</p>
            <p className="text-xs text-zinc-600">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  title,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: unknown[];
  empty: string;
}) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
        <Icon className="h-4 w-4 text-purple-400" />
        {title}
      </h3>
      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="space-y-2 text-sm text-zinc-300">
          {list.slice(0, 5).map((item, i) => (
            <li key={i} className="truncate">
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
