import type { Plugin } from 'vite';
import { handleInvestigateRequest } from './investigate';
import { handleLocalDiagnosticsRequest, handleTraceRouteRequest } from './localDiagnostics';

const RATE_WINDOW_MS = 1500;
const lastByIp = new Map<string, number>();

function clientIp(req: { socket?: { remoteAddress?: string } }): string {
  return req.socket?.remoteAddress || 'unknown';
}

function tooFrequent(ip: string): boolean {
  const now = Date.now();
  const prev = lastByIp.get(ip) ?? 0;
  if (now - prev < RATE_WINDOW_MS) return true;
  lastByIp.set(ip, now);
  return false;
}

function attach(
  server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }
) {
  server.middlewares.use((req, res, next) => {
    const url = req.url?.split('?')[0];
    if (url === '/api/local-diagnostics') {
      void handleLocalDiagnosticsRequest(req, res);
      return;
    }
    if (url === '/api/trace-route') {
      void handleTraceRouteRequest(req, res);
      return;
    }
    if (url !== '/api/investigate') {
      next();
      return;
    }
    if (tooFrequent(clientIp(req))) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Please wait a moment before running another check.' }));
      return;
    }
    void handleInvestigateRequest(req, res);
  });
}

export function investigatePlugin(): Plugin {
  return {
    name: 'cn-investigate-helper',
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server);
    },
  };
}
