'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { uploadReplay, apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileVideo, CheckCircle, Loader2, AlertCircle, LogIn, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamePath } from '@/shared/context/game-context';
import type { GamePageProps } from '@/games/types';

type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export function RocketLeagueReplayAnalysis(_props: GamePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [subjectName, setSubjectName] = useState('');

  const signedIn = authStatus === 'authenticated' && !!session?.user?.id;

  useEffect(() => {
    if (searchParams?.get('demo') === '1') {
      router.replace(`${reportPath}/demo/report`);
    }
  }, [searchParams, router, reportPath]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!signedIn) {
        setError('Sign in to upload replays and track your progress');
        setState('error');
        return;
      }
      if (!file.name.toLowerCase().endsWith('.replay')) {
        setError('Only .replay files are supported for Rocket League');
        setState('error');
        return;
      }
      setError(null);
      setState('uploading');
      setProgress(0);
      try {
        const result = await uploadReplay(file, setProgress, {
          subjectSteamId: subjectName || undefined,
        });
        setReplayId(result.replayId);
        setState('processing');
        setProcessingProgress(0);
        setProcessingMessage('Queued for Rocket League analysis...');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setState('error');
      }
    },
    [subjectName, signedIn]
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
          void queryClient.invalidateQueries({ queryKey: ['rl-replays'] });
          const replay = await apiFetch<{
            hero?: string;
            map?: string;
            durationSeconds?: number;
            gameMode?: string;
            version?: string;
          }>(`/api/replays/${replayId}`);
          setMetadata({
            Player: replay.hero ?? 'You',
            Map: replay.map ?? 'Unknown',
            Duration: replay.durationSeconds
              ? `${Math.floor(replay.durationSeconds / 60)}m ${replay.durationSeconds % 60}s`
              : 'Unknown',
            Playlist: replay.gameMode ?? 'ranked',
            Source: replay.version ?? 'rl',
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
        <p className="mb-8 text-zinc-400">Sign in to upload .replay files for SSL coaching.</p>
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-10 text-center backdrop-blur-xl">
          <LogIn className="mx-auto mb-4 h-12 w-12 text-sky-400" />
          <p className="mb-2 text-lg font-medium text-white">Sign in required to upload</p>
          <p className="mb-6 text-sm text-zinc-400">
            Or open the fixture demo report without an upload.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/login?callbackUrl=${encodeURIComponent(reportPath)}`}>
              <Button className="w-full gap-2 bg-sky-500 hover:bg-sky-400 sm:w-auto">
                <LogIn className="h-4 w-4" />
                Log in
              </Button>
            </Link>
            <Link href={`${reportPath}/demo/report`}>
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <Sparkles className="h-4 w-4" />
                Open demo report
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
        Upload a Rocket League .replay for evidence-bound SSL coaching
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              <label className="mb-2 block text-sm text-zinc-400" htmlFor="rl-subject-name">
                Your in-game name (optional)
              </label>
              <input
                id="rl-subject-name"
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Defaults to first blue player / fixture subject"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none"
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
                'cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all backdrop-blur-xl',
                dragOver
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-sky-500/50'
              )}
              onClick={() => document.getElementById('rl-file-input')?.click()}
            >
              <Upload className="mx-auto mb-4 h-12 w-12 text-sky-400" />
              <p className="mb-2 font-medium text-white">Drop your .replay file here</p>
              <Button className="bg-orange-500 hover:bg-orange-400">Select Replay File</Button>
              <input
                id="rl-file-input"
                type="file"
                accept=".replay"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            <p className="text-center text-xs text-zinc-500">
              Without <code className="text-zinc-400">BALLCHASING_API_KEY</code>, analysis uses the
              high-fidelity demo fixture.{' '}
              <Link href={`${reportPath}/demo/report`} className="text-sky-400 hover:underline">
                Preview demo report
              </Link>
            </p>
          </motion.div>
        )}
        {(state === 'uploading' || state === 'processing') && (
          <motion.div
            key="progress"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl"
          >
            <Loader2 className="mb-4 h-6 w-6 animate-spin text-sky-400" />
            <div className="h-2 w-full rounded-full bg-zinc-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-orange-500 transition-all"
                style={{ width: `${state === 'uploading' ? progress : processingProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-zinc-400">{processingMessage || 'Uploading...'}</p>
          </motion.div>
        )}
        {state === 'complete' && (
          <motion.div
            key="complete"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl"
          >
            <CheckCircle className="mb-4 h-8 w-8 text-emerald-400" />
            <p className="mb-4 text-sm text-zinc-400">Analysis complete — open your coaching report.</p>
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
              className="w-full bg-sky-500 hover:bg-sky-400"
              onClick={() => router.push(`${reportPath}/${replayId}/report`)}
            >
              <FileVideo className="mr-2 h-4 w-4" /> View Coaching Report
            </Button>
          </motion.div>
        )}
        {state === 'error' && (
          <motion.div
            key="error"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl"
          >
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
