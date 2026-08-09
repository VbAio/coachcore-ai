import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { ReplayProcessingStatus } from '@clutchcore/shared';

const clients = new Map<string, Set<WebSocket>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    const replayId = url.searchParams.get('replayId');

    if (replayId) {
      if (!clients.has(replayId)) clients.set(replayId, new Set());
      clients.get(replayId)!.add(ws);

      ws.on('close', () => {
        clients.get(replayId)?.delete(ws);
      });
    }

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
      } catch {
        /* ignore */
      }
    });
  });

  return wss;
}

export function broadcastReplayStatus(replayId: string, status: ReplayProcessingStatus) {
  const subs = clients.get(replayId);
  if (!subs) return;

  const payload = JSON.stringify({ type: 'replay_status', data: status });
  for (const ws of subs) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}
