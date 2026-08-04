'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { connectOAuth } from '@/components/auth/oauth-buttons';
import { PlatformNavbar } from '@/shared/components/layout/platform-navbar';
import {
  FormField,
  TextInput,
  PasswordInput,
  SubmitButton,
  FormAlert,
} from '@/components/auth/form-fields';
import { Shield, Link2, Trash2, Monitor } from 'lucide-react';

interface AuthMethods {
  hasPassword: boolean;
  hasGoogle: boolean;
  hasDiscord: boolean;
  count: number;
}

export default function AccountSettingsPage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState({
    username: '',
    displayName: '',
    avatar: '',
    language: 'en',
    theme: 'dark',
    timezone: 'UTC',
  });
  const [authMethods, setAuthMethods] = useState<AuthMethods | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          username: data.user.username,
          displayName: data.user.displayName ?? '',
          avatar: data.user.avatar ?? '',
          language: data.user.language ?? 'en',
          theme: data.user.theme ?? 'dark',
          timezone: data.user.timezone ?? 'UTC',
        });
        setAuthMethods(data.authMethods);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
        return;
      }
      setMessage({ type: 'success', text: 'Profile updated' });
      await update();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changePassword',
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      setMessage({
        type: res.ok ? 'success' : 'error',
        text: res.ok ? data.message : data.error,
      });
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setSaving(false);
    }
  }

  async function disconnectProvider(provider: string) {
    const res = await fetch(`/api/user/connected-accounts?provider=${provider}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    setMessage({ type: res.ok ? 'success' : 'error', text: res.ok ? 'Disconnected' : data.error });
    if (res.ok) {
      const me = await fetch('/api/user/me');
      if (me.ok) setAuthMethods((await me.json()).authMethods);
    }
  }

  async function logoutAllDevices() {
    await fetch('/api/user/sessions?scope=all', { method: 'DELETE' });
    setMessage({ type: 'success', text: 'Logged out from all other devices' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <PlatformNavbar />
        <div className="mx-auto max-w-3xl px-6">
          <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <PlatformNavbar />
      <div className="mx-auto max-w-3xl px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="mt-2 text-zinc-400">Manage your profile, security, and connected accounts</p>
        </div>

        {message && <FormAlert type={message.type} message={message.text} />}

        {!session?.user?.emailVerified && (
          <div className="glass rounded-2xl border border-amber-500/30 p-4">
            <p className="text-sm text-amber-200">
              Verify your email to unlock saving data and syncing across devices.{' '}
              <Link href="/verify-email" className="underline">
                Verify now
              </Link>
            </p>
          </div>
        )}

        <section className="glass rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Shield className="h-5 w-5 text-purple-400" />
            Profile
          </h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <FormField label="Username">
              <TextInput
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              />
            </FormField>
            <FormField label="Display Name">
              <TextInput
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              />
            </FormField>
            <FormField label="Avatar URL">
              <TextInput
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                placeholder="https://..."
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Language">
                <TextInput
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                />
              </FormField>
              <FormField label="Theme">
                <select
                  value={profile.theme}
                  onChange={(e) => setProfile({ ...profile, theme: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </FormField>
              <FormField label="Timezone">
                <TextInput
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                />
              </FormField>
            </div>
            <SubmitButton loading={saving}>Save changes</SubmitButton>
          </form>
        </section>

        {authMethods?.hasPassword && (
          <section className="glass rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <FormField label="Current Password">
                <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </FormField>
              <FormField label="New Password">
                <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </FormField>
              <FormField label="Confirm Password">
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </FormField>
              <SubmitButton loading={saving}>Update password</SubmitButton>
            </form>
          </section>
        )}

        <section className="glass rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Link2 className="h-5 w-5 text-purple-400" />
            Connected Accounts
          </h2>
          <div className="space-y-3">
            <ProviderRow
              name="Google"
              connected={authMethods?.hasGoogle}
              onConnect={() => connectOAuth('google', '/settings/account')}
              onDisconnect={() => disconnectProvider('google')}
              canDisconnect={(authMethods?.count ?? 0) > 1}
            />
            <ProviderRow
              name="Discord"
              connected={authMethods?.hasDiscord}
              onConnect={() => connectOAuth('discord', '/settings/account')}
              onDisconnect={() => disconnectProvider('discord')}
              canDisconnect={(authMethods?.count ?? 0) > 1}
            />
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Monitor className="h-5 w-5 text-purple-400" />
            Sessions
          </h2>
          <p className="mb-4 text-sm text-zinc-400">Sign out from all devices except this one.</p>
          <button
            type="button"
            onClick={logoutAllDevices}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Log out all devices
          </button>
        </section>

        <section className="glass rounded-2xl border border-red-500/20 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-400">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </h2>
          <p className="mb-4 text-sm text-zinc-400">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <DeleteAccountButton hasPassword={authMethods?.hasPassword ?? false} />
        </section>
      </div>
    </div>
  );
}

function ProviderRow({
  name,
  connected,
  onConnect,
  onDisconnect,
  canDisconnect,
}: {
  name: string;
  connected?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  canDisconnect: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-white">{name}</span>
      {connected ? (
        <button
          type="button"
          disabled={!canDisconnect}
          onClick={onDisconnect}
          className="text-sm text-red-400 hover:text-red-300 disabled:opacity-40"
        >
          Disconnect
        </button>
      ) : (
        <button type="button" onClick={onConnect} className="text-sm text-purple-400 hover:text-purple-300">
          Connect
        </button>
      )}
    </div>
  );
}

function DeleteAccountButton({ hasPassword }: { hasPassword: boolean }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure? This permanently deletes your account.')) return;
    setLoading(true);
    const res = await fetch('/api/user/settings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: hasPassword ? password : undefined }),
    });
    if (res.ok) {
      window.location.href = '/';
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {hasPassword && (
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password to confirm"
        />
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
      >
        Delete my account
      </button>
    </div>
  );
}
