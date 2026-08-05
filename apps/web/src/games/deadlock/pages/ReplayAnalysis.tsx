'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { uploadReplay, apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileVideo, CheckCircle, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamePath } from '@/shared/context/game-context';
import type { GamePageProps } from '@/games/types';

type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export function DeadlockReplayAnalysis(_props: GamePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status: authStatus } = useSession();
  const reportPath = useGamePath('replays');
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [replayId, setReplayId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string> | null>(null);
  const [subjectSteamId, setSubjectSteamId] = useState('');

  const signedIn = authStatus === 'authenticated' && !!session?.user?.id;

  const handleFile = useCallback(
    async (file: File) => {
      if (!signedIn) {
        setError('Sign in to upload replays and track your progress');
        setState('error');
        return;
      }
      if (!file.name.endsWith('.dem')) {
        setError('Only .dem replay files are supported');
        setState('error');
        return;
      }
      setError(null);
      setState('uploading');
      setProgress(0);
      try {
        const result = await uploadReplay(file, setProgress, {
          subjectSteamId: subjectSteamId || undefined,
        });
        setReplayId(result.replayId);
        setState('processing');
        setProcessingProgress(0);
        setProcessingMessage('Queued for analysis...');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setState('error');
      }
    },
    [subjectSteamId, signedIn]
  );

  useEffect(() => {
    if (state !== 'processing' || !replayId) return;
    const poll = setInterval(async () => {
      try {
        const status = await apiFetch<{
          stage: string;
          progress: number;
          message: string;
          error?: string;
        }>(`/api/replays/${replayId}/status`);
        setProcessingProgress(status.progress);
        setProcessingMessage(status.message ?? status.stage);
        if (status.stage === 'complete') {
          setState('complete');
          clearInterval(poll);
          void queryClient.invalidateQueries({ queryKey: ['deadlock-dashboard'] });
          const replay = await apiFetch<{
            hero?: string;
            map?: string;
            durationSeconds?: number;
            gameMode?: string;
            version?: string;
          }>(`/api/replays/${replayId}`);
          setMetadata({
            Hero: replay.hero ?? 'Parsing...',
            Map: replay.map ?? 'Unknown',
            Duration: replay.durationSeconds
              ? `${Math.floor(replay.durationSeconds / 60)}m ${replay.durationSeconds % 60}s`
              : 'Unknown',
            'Game Mode': replay.gameMode ?? 'Standard',
            Version: replay.version ?? 'Unknown',
          });
        }
        if (status.stage === 'failed') {
          setError(status.error ?? 'Processing failed');
          setState('error');
          clearInterval(poll);
        }
      } catch {
        /* ignore transient poll errors */
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [state, replayId, queryClient]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!signedIn) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, signedIn]
  );

  if (authStatus === 'loading') {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center text-zinc-400">Checking sign-in…</div>
    );
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold text-white">Replay Analysis</h1>
        <p className="mb-8 text-zinc-400">Sign in to upload .dem files and track progress from zero.</p>
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-10 text-center glass">
          <LogIn className="mx-auto mb-4 h-12 w-12 text-purple-400" />
          <p className="mb-2 text-lg font-medium text-white">Sign in required to upload</p>
          <p className="mb-6 text-sm text-zinc-400">
            Your dashboard stats stay at 0 until you upload completed analyses on your account.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/login?callbackUrl=${encodeURIComponent(reportPath)}`}>
              <Button variant="glow" className="w-full gap-2 sm:w-auto">
                <LogIn className="h-4 w-4" />
                Log in
              </Button>
            </Link>
            <Link href={`/signup?callbackUrl=${encodeURIComponent(reportPath)}`}>
              <Button variant="outline" className="w-full sm:w-auto">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold text-white">Replay Analysis</h1>
      <p className="mb-8 text-zinc-400">
        Upload a Deadlock .dem file for AI coaching — stats update after each completed analysis
      </p>
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl p-4 glass">
              <label className="mb-2 block text-sm text-zinc-400" htmlFor="subject-steam-id">
                Your Steam ID (optional)
              </label>
              <input
                id="subject-steam-id"
                type="text"
                value={subjectSteamId}
                onChange={(e) => setSubjectSteamId(e.target.value)}
                placeholder="SteamID64 or in-game name — defaults to first player"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                'cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all glass',
                dragOver ? 'border-purple-500 glow-purple' : 'border-white/10 hover:border-purple-500/50'
              )}
              onClick={() => document.getElementById('dl-file-input')?.click()}
            >
              <Upload className="mx-auto mb-4 h-12 w-12 text-purple-400" />
              <p className="mb-2 font-medium text-white">Drop your .dem replay here</p>
              <Button variant="glow">Select Replay File</Button>
              <input
                id="dl-file-input"
                type="file"
                accept=".dem"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </motion.div>
        )}
        {(state === 'uploading' || state === 'processing') && (
          <motion.div key="progress" className="rounded-2xl p-8 glass">
            <Loader2 className="mb-4 h-6 w-6 animate-spin text-purple-400" />
            <div className="h-2 w-full rounded-full bg-zinc-800">
              <div
                className="h-2 rounded-full gradient-purple transition-all"
                style={{ width: `${state === 'uploading' ? progress : processingProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-zinc-400">{processingMessage || 'Uploading...'}</p>
          </motion.div>
        )}
        {state === 'complete' && (
          <motion.div key="complete" className="rounded-2xl p-8 glass">
            <CheckCircle className="mb-4 h-8 w-8 text-green-400" />
            <p className="mb-4 text-sm text-zinc-400">
              Analysis complete — your dashboard stats have been updated from this upload.
            </p>
            {metadata && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                {Object.entries(metadata).map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-zinc-900/50 p-3">
                    <p className="text-xs text-zinc-500">{key}</p>
                    <p className="text-sm text-white">{val}</p>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="glow"
              className="w-full"
              onClick={() => router.push(`${reportPath}/${replayId}/report`)}
            >
              <FileVideo className="mr-2 h-4 w-4" /> View Coaching Report
            </Button>
          </motion.div>
        )}
        {state === 'error' && (
          <motion.div key="error" className="rounded-2xl p-8 text-center glass">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
            <p className="mb-6 text-zinc-400">{error}</p>
            <Button variant="outline" onClick={() => setState('idle')}>
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
