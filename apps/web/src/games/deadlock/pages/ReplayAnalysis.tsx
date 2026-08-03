'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { uploadReplay, apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileVideo, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamePath } from '@/shared/context/game-context';
import type { GamePageProps } from '@/games/types';

type UploadState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export function DeadlockReplayAnalysis(_props: GamePageProps) {
  const router = useRouter();
  const reportPath = useGamePath('replays');
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [replayId, setReplayId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string> | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.dem')) {
      setError('Only .dem replay files are supported');
      setState('error');
      return;
    }
    setError(null);
    setState('uploading');
    setProgress(0);
    try {
      const result = await uploadReplay(file, setProgress);
      setReplayId(result.replayId);
      setState('processing');
      setProcessingProgress(0);
      setProcessingMessage('Queued for analysis...');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (state !== 'processing' || !replayId) return;
    const poll = setInterval(async () => {
      try {
        const status = await apiFetch<{ stage: string; progress: number; message: string; error?: string }>(
          `/api/replays/${replayId}/status`
        );
        setProcessingProgress(status.progress);
        setProcessingMessage(status.message ?? status.stage);
        if (status.stage === 'complete') {
          setState('complete');
          clearInterval(poll);
          const replay = await apiFetch<{ hero?: string; map?: string; durationSeconds?: number; gameMode?: string; version?: string }>(
            `/api/replays/${replayId}`
          );
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
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(poll);
  }, [state, replayId]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Replay Analysis</h1>
      <p className="text-zinc-400 mb-8">Upload a Deadlock .dem file for AI coaching</p>
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'glass rounded-2xl p-12 text-center border-2 border-dashed transition-all cursor-pointer',
              dragOver ? 'border-purple-500 glow-purple' : 'border-white/10 hover:border-purple-500/50'
            )}
            onClick={() => document.getElementById('dl-file-input')?.click()}
          >
            <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Drop your .dem replay here</p>
            <Button variant="glow">Select Replay File</Button>
            <input id="dl-file-input" type="file" accept=".dem" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </motion.div>
        )}
        {(state === 'uploading' || state === 'processing') && (
          <motion.div key="progress" className="glass rounded-2xl p-8">
            <Loader2 className="h-6 w-6 text-purple-400 animate-spin mb-4" />
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div className="gradient-purple h-2 rounded-full transition-all" style={{ width: `${state === 'uploading' ? progress : processingProgress}%` }} />
            </div>
            <p className="text-sm text-zinc-400 mt-2">{processingMessage || 'Uploading...'}</p>
          </motion.div>
        )}
        {state === 'complete' && (
          <motion.div key="complete" className="glass rounded-2xl p-8">
            <CheckCircle className="h-8 w-8 text-green-400 mb-4" />
            {metadata && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(metadata).map(([key, val]) => (
                  <div key={key} className="bg-zinc-900/50 rounded-lg p-3">
                    <p className="text-xs text-zinc-500">{key}</p>
                    <p className="text-sm text-white">{val}</p>
                  </div>
                ))}
              </div>
            )}
            <Button variant="glow" className="w-full" onClick={() => router.push(`${reportPath}/${replayId}/report`)}>
              <FileVideo className="h-4 w-4 mr-2" /> View Coaching Report
            </Button>
          </motion.div>
        )}
        {state === 'error' && (
          <motion.div key="error" className="glass rounded-2xl p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button variant="outline" onClick={() => setState('idle')}>Try Again</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
