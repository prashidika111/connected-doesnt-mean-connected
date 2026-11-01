import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { handleInvestigateRequest } from './investigate';
import { handleLocalDiagnosticsRequest, handleTraceRouteRequest } from './localDiagnostics';
import { inspectAndParsePktBuffer, MAX_PKT_FILE_SIZE_BYTES } from './pktParser';
import { getSavedDrafts, saveDraft, deleteDraft } from './draftManager';

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

function handlePktDownload(req: any, res: any) {
  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const requestedFile = parsedUrl.searchParams.get('file') || 'Scenario 1. DNS Failure Cisco Simulation.pkt';
    const sanitized = path.basename(requestedFile);

    const candidates = [
      path.resolve(process.cwd(), 'public/Network Simulation (Cisco Demo)', sanitized),
      path.resolve(process.cwd(), 'Network Simulation (Cisco Demo)', sanitized),
    ];

    let targetPath: string | null = null;
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        targetPath = cand;
        break;
      }
    }

    if (!targetPath) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `File "${sanitized}" not found in lab repository.` }));
      return;
    }

    const stat = fs.statSync(targetPath);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sanitized)}"`);
    res.setHeader('Content-Length', stat.size);

    const readStream = fs.createReadStream(targetPath);
    readStream.pipe(res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to download lab file.' }));
  }
}

function handlePktParse(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
    return;
  }

  let body = '';
  let receivedBytes = 0;

  req.on('data', (chunk: Buffer) => {
    receivedBytes += chunk.length;
    if (receivedBytes > MAX_PKT_FILE_SIZE_BYTES * 1.5) {
      res.statusCode = 413;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Payload too large (maximum 10MB).' }));
      req.destroy();
      return;
    }
    body += chunk.toString('utf8');
  });

  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      const fileName = parsed.fileName || 'uploaded-lab.pkt';
      const base64Data = parsed.base64Data || '';

      const buffer = Buffer.from(base64Data, 'base64');
      const report = inspectAndParsePktBuffer(buffer, fileName);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(report));
    } catch (err: any) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON payload. Expected { fileName, base64Data }.' }));
    }
  });
}

function handleDrafts(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    const drafts = getSavedDrafts();
    res.statusCode = 200;
    res.end(JSON.stringify({ drafts }));
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      try {
        const draft = JSON.parse(body);
        const result = saveDraft(draft);
        res.statusCode = result.success ? 200 : 400;
        res.end(JSON.stringify(result));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid draft JSON' }));
      }
    });
    return;
  }

  if (req.method === 'DELETE') {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const id = parsedUrl.searchParams.get('id');
    if (!id) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing draft id' }));
      return;
    }
    const result = deleteDraft(id);
    res.statusCode = result.success ? 200 : 400;
    res.end(JSON.stringify(result));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
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
    if (url === '/api/pkt-download') {
      handlePktDownload(req, res);
      return;
    }
    if (url === '/api/pkt-parse') {
      handlePktParse(req, res);
      return;
    }
    if (url === '/api/drafts') {
      handleDrafts(req, res);
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
