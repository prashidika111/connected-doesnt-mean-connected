import { lookup as dnsLookup } from 'node:dns/promises';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { parseInvestigationTarget, isBlockedResolvedAddress } from '../src/engine/targetValidation';
import { mappedScenarioFromInvestigation } from '../src/engine/mapLiveResults';
import { pathStagesFromChecks } from '../src/engine/pathFromChecks';
import {
  CheckOutcome,
  InvestigationResult,
  ParsedTarget,
} from '../src/types/investigation';

const DNS_TIMEOUT_MS = 4000;
const TCP_TIMEOUT_MS = 4000;
const HTTP_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 2;
const MAX_RESPONSE_BYTES = 8192;
const MAX_BODY_JSON = 4096;

const HELPER_LABEL =
  'Local diagnostic helper (Node.js process serving this app — typically `npm run dev`). Measurements are from this host, not from a browser sandbox and not necessarily from a different student laptop.';

function emptyCheck(
  id: CheckOutcome['id'],
  title: string,
  status: CheckOutcome['status'],
  summary: string,
  detail: string,
  limitations: string
): CheckOutcome {
  return {
    id,
    title,
    status,
    provenance: status === 'not-tested' ? 'not-tested' : 'conceptual',
    executionLocation: 'not-executed',
    summary,
    detail,
    limitations,
    durationMs: null,
    evidence: {},
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error(`${label} timed out after ${ms}ms`), { code: 'ETIMEOUT' }));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

async function resolvePublicAddresses(hostname: string): Promise<{
  addresses: ResolvedAddress[];
  blocked: ResolvedAddress[];
  durationMs: number;
}> {
  const started = Date.now();
  const records = await withTimeout(
    dnsLookup(hostname, { all: true, verbatim: true }),
    DNS_TIMEOUT_MS,
    'DNS lookup'
  );
  const durationMs = Date.now() - started;
  const addresses: ResolvedAddress[] = [];
  const blocked: ResolvedAddress[] = [];
  for (const rec of records) {
    const family = rec.family === 6 ? 6 : 4;
    const item = { address: rec.address, family: family as 4 | 6 };
    if (isBlockedResolvedAddress(rec.address, item.family)) {
      blocked.push(item);
    } else {
      addresses.push(item);
    }
  }
  return { addresses, blocked, durationMs };
}

async function runDnsCheck(target: ParsedTarget): Promise<{
  check: CheckOutcome;
  addresses: ResolvedAddress[];
}> {
  if (target.kind !== 'hostname') {
    const family = target.kind === 'ipv6' ? 6 : 4;
    const addr = { address: target.hostname, family: family as 4 | 6 };
    if (isBlockedResolvedAddress(addr.address, addr.family)) {
      return {
        addresses: [],
        check: {
          id: 'dns',
          title: 'DNS resolution',
          status: 'failed',
          provenance: 'measured',
          executionLocation: 'local-diagnostic-helper',
          summary: 'Literal IP is non-public and is blocked.',
          detail: 'SSRF guard rejected the address before any socket was opened.',
          limitations: 'Non-public IP literals are never probed.',
          durationMs: 0,
          evidence: { skipped: true, reason: 'non-public-ip' },
        },
      };
    }
    return {
      addresses: [addr],
      check: {
        id: 'dns',
        title: 'DNS resolution',
        status: 'not-tested',
        provenance: 'not-tested',
        executionLocation: 'not-executed',
        summary: `Target is already a literal ${target.kind.toUpperCase()} address, so DNS name lookup was not run.`,
        detail: `Using ${target.hostname} directly. DNS is bypassed for IP literals.`,
        limitations:
          'Skipping DNS is correct for an IP target. It does not prove a hostname would resolve on your device.',
        durationMs: 0,
        evidence: { skipped: true, literalIp: target.hostname },
      },
    };
  }

  try {
    const result = await resolvePublicAddresses(target.hostname);
    if (result.addresses.length === 0 && result.blocked.length > 0) {
      return {
        addresses: [],
        check: {
          id: 'dns',
          title: 'DNS resolution',
          status: 'failed',
          provenance: 'measured',
          executionLocation: 'local-diagnostic-helper',
          summary: `Hostname resolved only to non-public addresses (${result.blocked
            .map((b) => b.address)
            .join(', ')}). Probing was blocked.`,
          detail:
            'After DNS, every answer was loopback, private, link-local, CGNAT, multicast, or otherwise non-public. The helper refuses to connect (SSRF control, including DNS rebinding).',
          limitations: 'This guard is intentional. It is not a diagnosis of your LAN.',
          durationMs: result.durationMs,
          evidence: {
            blockedAddresses: result.blocked.map((b) => b.address),
            publicAddresses: [],
          },
        },
      };
    }
    if (result.addresses.length === 0) {
      return {
        addresses: [],
        check: {
          id: 'dns',
          title: 'DNS resolution',
          status: 'failed',
          provenance: 'measured',
          executionLocation: 'local-diagnostic-helper',
          summary: `No addresses were returned for ${target.hostname}.`,
          detail: 'dns.lookup completed but produced an empty answer set.',
          limitations: 'Empty answers are treated as DNS failure. The helper uses this host’s resolver, not yours.',
          durationMs: result.durationMs,
          evidence: { addresses: [] },
        },
      };
    }
    return {
      addresses: result.addresses,
      check: {
        id: 'dns',
        title: 'DNS resolution',
        status: 'passed',
        provenance: 'measured',
        executionLocation: 'local-diagnostic-helper',
        summary: `${target.hostname} resolved to ${result.addresses
          .map((a) => a.address)
          .join(', ')} via the helper’s OS resolver.`,
        detail: `Node.js dns.lookup (all: true) succeeded in ${result.durationMs}ms.`,
        limitations:
          'This is the helper host’s resolver (often the lab PC or the same machine as the browser). It is not a packet capture of your phone’s DNS, and it is not ICMP.',
        durationMs: result.durationMs,
        evidence: {
          addresses: result.addresses.map((a) => a.address),
          blockedDropped: result.blocked.map((b) => b.address),
        },
      },
    };
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    const code = error.code || 'UNKNOWN';
    let summary = `DNS lookup for ${target.hostname} failed (${code}).`;
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      summary = `The helper resolver could not find ${target.hostname} (NXDOMAIN / ENOTFOUND).`;
    } else if (code === 'ETIMEOUT' || code === 'ETIMEOUT'.toString()) {
      summary = `DNS lookup for ${target.hostname} timed out after ${DNS_TIMEOUT_MS}ms.`;
    } else if (code === 'ESERVFAIL') {
      summary = `Resolver returned SERVFAIL for ${target.hostname}.`;
    }
    return {
      addresses: [],
      check: {
        id: 'dns',
        title: 'DNS resolution',
        status: 'failed',
        provenance: 'measured',
        executionLocation: 'local-diagnostic-helper',
        summary,
        detail: error.message,
        limitations:
          'Failure is from the helper’s stub resolver. Your ISP DNS, a router DNS proxy, or DNS-over-HTTPS in the browser can differ.',
        durationMs: DNS_TIMEOUT_MS,
        evidence: { errorCode: code },
      },
    };
  }
}

function connectTcp(ip: string, port: number, timeoutMs: number): Promise<{
  ok: boolean;
  code?: string;
  message: string;
  durationMs: number;
}> {
  const started = Date.now();
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (result: { ok: boolean; code?: string; message: string }) => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      resolve({ ...result, durationMs: Date.now() - started });
    };
    socket.setTimeout(timeoutMs);
    socket.connect(port, ip, () => {
      finish({
        ok: true,
        message: `TCP handshake to ${ip}:${port} completed.`,
      });
    });
    socket.on('timeout', () => {
      finish({
        ok: false,
        code: 'ETIMEDOUT',
        message: `TCP SYN to ${ip}:${port} timed out after ${timeoutMs}ms.`,
      });
    });
    socket.on('error', (err: NodeJS.ErrnoException) => {
      finish({
        ok: false,
        code: err.code,
        message: err.message,
      });
    });
  });
}

async function runTcpCheck(
  target: ParsedTarget,
  addresses: ResolvedAddress[]
): Promise<CheckOutcome> {
  if (addresses.length === 0) {
    return emptyCheck(
      'tcp',
      'TCP port connectivity',
      'not-tested',
      'TCP was not run because no public IP was available after DNS and SSRF checks.',
      'Connecting without a public address would be unsafe or meaningless.',
      'A skipped TCP check is not a pass and not a fail.'
    );
  }

  const chosen = addresses.find((a) => a.family === 4) ?? addresses[0];
  const result = await connectTcp(chosen.address, target.port, TCP_TIMEOUT_MS);
  if (result.ok) {
    return {
      id: 'tcp',
      title: `TCP port ${target.port}`,
      status: 'passed',
      provenance: 'measured',
      executionLocation: 'local-diagnostic-helper',
      summary: `Helper completed a TCP handshake to ${chosen.address}:${target.port} in ${result.durationMs}ms.`,
      detail: result.message,
      limitations:
        'TCP success only proves the helper could complete a handshake. It is not ping, not your Wi-Fi, and not a guarantee that HTTP content is healthy.',
      durationMs: result.durationMs,
      evidence: {
        ip: chosen.address,
        port: target.port,
        errorCode: null,
      },
    };
  }
  return {
    id: 'tcp',
    title: `TCP port ${target.port}`,
    status: 'failed',
    provenance: 'measured',
    executionLocation: 'local-diagnostic-helper',
    summary: `Helper could not complete TCP to ${chosen.address}:${target.port} (${result.code ?? 'error'}).`,
    detail: result.message,
    limitations:
      'Timeouts can be firewalls, routing, or a silent drop. ECONNREFUSED is stronger evidence that the host sent RST. Always from the helper’s vantage point.',
    durationMs: result.durationMs,
    evidence: {
      ip: chosen.address,
      port: target.port,
      errorCode: result.code ?? 'UNKNOWN',
    },
  };
}

interface HttpAttempt {
  protocol: 'http' | 'https';
  hostname: string;
  port: 80 | 443;
  pathname: string;
  search: string;
  ip: string;
}

async function resolveForHttp(hostname: string, kindHint?: ParsedTarget['kind']): Promise<ResolvedAddress[]> {
  if (kindHint === 'ipv4' || parseableV4(hostname)) {
    if (isBlockedResolvedAddress(hostname, 4)) return [];
    return [{ address: hostname, family: 4 }];
  }
  if (kindHint === 'ipv6' || hostname.includes(':')) {
    if (isBlockedResolvedAddress(hostname, 6)) return [];
    return [{ address: hostname, family: 6 }];
  }
  const resolved = await resolvePublicAddresses(hostname);
  return resolved.addresses;
}

function parseableV4(value: string): boolean {
  return /^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(value);
}

function requestOnce(attempt: HttpAttempt): Promise<{
  statusCode: number;
  location: string | null;
  bytesRead: number;
  truncated: boolean;
}> {
  const lib = attempt.protocol === 'https' ? https : http;
  const path = `${attempt.pathname || '/'}${attempt.search || ''}`;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        host: attempt.ip,
        port: attempt.port,
        method: 'GET',
        path,
        headers: {
          Host: attempt.hostname.includes(':') ? `[${attempt.hostname}]` : attempt.hostname,
          'User-Agent': 'CN-Project-Educational-Diagnostics/0.2',
          Accept: 'text/html,*/*;q=0.8',
          Connection: 'close',
        },
        servername: attempt.protocol === 'https' ? attempt.hostname : undefined,
        timeout: HTTP_TIMEOUT_MS,
        rejectUnauthorized: true,
      },
      (res) => {
        let bytesRead = 0;
        let truncated = false;
        res.on('data', (chunk: Buffer) => {
          bytesRead += chunk.length;
          if (bytesRead > MAX_RESPONSE_BYTES) {
            truncated = true;
            req.destroy();
          }
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            location: typeof res.headers.location === 'string' ? res.headers.location : null,
            bytesRead,
            truncated,
          });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(Object.assign(new Error('HTTP request timed out'), { code: 'ETIMEOUT' }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runHttpCheck(
  target: ParsedTarget,
  addresses: ResolvedAddress[],
  tcp: CheckOutcome
): Promise<CheckOutcome> {
  if (tcp.status !== 'passed') {
    return emptyCheck(
      'http',
      'HTTP(S) response',
      'not-tested',
      'HTTP was not run because TCP did not succeed. A web GET is not faked when the handshake never completed.',
      'Skipping HTTP after TCP failure avoids implying an application-layer result that was never observed.',
      'not-tested means the probe was not executed.'
    );
  }
  const chosen = addresses.find((a) => a.family === 4) ?? addresses[0];
  if (!chosen) {
    return emptyCheck(
      'http',
      'HTTP(S) response',
      'not-tested',
      'HTTP was not run; no public IP remained.',
      'SSRF controls require a public address.',
      'No HTTP bytes were fetched.'
    );
  }

  let current: HttpAttempt = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port,
    pathname: target.pathname,
    search: target.search,
    ip: chosen.address,
  };

  const hopCodes: number[] = [];
  const started = Date.now();

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      // Re-validate destination IP immediately before connecting (DNS rebinding).
      const fresh = await resolveForHttp(
        current.hostname,
        parseableV4(current.hostname) ? 'ipv4' : current.hostname.includes(':') ? 'ipv6' : 'hostname'
      );
      if (fresh.length === 0) {
        return {
          id: 'http',
          title: 'HTTP(S) response',
          status: 'failed',
          provenance: 'measured',
          executionLocation: 'local-diagnostic-helper',
          summary: 'Redirect or reconnect target resolved only to non-public addresses and was blocked.',
          detail: `Stopped before hop ${hop} to ${current.hostname}.`,
          limitations: 'SSRF redirect checks run after every Location header.',
          durationMs: Date.now() - started,
          evidence: { hops: hop, statusCodes: hopCodes },
        };
      }
      current = { ...current, ip: (fresh.find((a) => a.family === 4) ?? fresh[0]).address };

      const response = await withTimeout(
        requestOnce(current),
        HTTP_TIMEOUT_MS,
        'HTTP GET'
      );
      hopCodes.push(response.statusCode);

      const redirected = response.statusCode >= 300 && response.statusCode < 400 && response.location;
      if (redirected) {
        if (hop === MAX_REDIRECTS) {
          return {
            id: 'http',
            title: 'HTTP(S) response',
            status: 'inconclusive',
            provenance: 'measured',
            executionLocation: 'local-diagnostic-helper',
            summary: `Stopped after ${MAX_REDIRECTS} redirects (last status ${response.statusCode}).`,
            detail: `Location was ${response.location}`,
            limitations: 'Redirect following is intentionally bounded. This is not a full browser navigation.',
            durationMs: Date.now() - started,
            evidence: { statusCodes: hopCodes, truncated: response.truncated },
          };
        }
        let nextUrl: URL;
        try {
          nextUrl = new URL(response.location, `${current.protocol}://${current.hostname}${current.pathname}`);
        } catch {
          return {
            id: 'http',
            title: 'HTTP(S) response',
            status: 'inconclusive',
            provenance: 'measured',
            executionLocation: 'local-diagnostic-helper',
            summary: 'Redirect Location header was not a valid URL.',
            detail: String(response.location),
            limitations: 'Malformed redirects are not followed.',
            durationMs: Date.now() - started,
            evidence: { statusCodes: hopCodes },
          };
        }
        const parsedNext = parseInvestigationTarget(nextUrl.toString());
        if (!parsedNext.ok) {
          return {
            id: 'http',
            title: 'HTTP(S) response',
            status: 'failed',
            provenance: 'measured',
            executionLocation: 'local-diagnostic-helper',
            summary: 'Redirect pointed at a disallowed URL (scheme, port, or non-public host) and was not followed.',
            detail: parsedNext.issues.map((i) => i.message).join(' '),
            limitations: 'Open redirectors into RFC1918 space are blocked.',
            durationMs: Date.now() - started,
            evidence: { statusCodes: hopCodes, location: nextUrl.toString() },
          };
        }
        current = {
          protocol: parsedNext.target.protocol,
          hostname: parsedNext.target.hostname,
          port: parsedNext.target.port,
          pathname: parsedNext.target.pathname,
          search: parsedNext.target.search,
          ip: parsedNext.target.kind === 'hostname' ? '' : parsedNext.target.hostname,
        };
        continue;
      }

      const applicationError = response.statusCode >= 400;
      return {
        id: 'http',
        title: 'HTTP(S) response',
        // Any HTTP status proves that a web server answered. The status code
        // describes the application response, not a network connection failure.
        status: 'passed',
        provenance: 'measured',
        executionLocation: 'local-diagnostic-helper',
        summary: applicationError
          ? `The web server answered with HTTP ${response.statusCode}. DNS, TCP and an HTTP exchange succeeded, but the requested page or application returned an error.`
          : `Helper received HTTP ${response.statusCode} from ${current.hostname} (${current.ip}).`,
        detail: `GET ${current.protocol}://${current.hostname}${current.pathname} via ${current.ip}:${current.port}; read ${response.bytesRead} bytes (cap ${MAX_RESPONSE_BYTES}).`,
        limitations:
          'Fetched from the helper with a short timeout, redirect cap, and body cap. TLS uses Node’s certificate store. This is not your browser’s cookie jar, cache, or extension set.',
        durationMs: Date.now() - started,
        evidence: {
          statusCode: response.statusCode,
          ip: current.ip,
          truncated: response.truncated,
          statusCodes: hopCodes,
        },
      };
    }
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    return {
      id: 'http',
      title: 'HTTP(S) response',
      status: 'failed',
      provenance: 'measured',
      executionLocation: 'local-diagnostic-helper',
      summary: `HTTP GET from the helper failed (${error.code ?? 'error'}).`,
      detail: error.message,
      limitations:
        'TLS certificate errors, resets, and timeouts are all reported as failed HTTP from the helper. They are not classified as DNS failures.',
      durationMs: Date.now() - started,
      evidence: { errorCode: error.code ?? 'UNKNOWN' },
    };
  }

  return emptyCheck(
    'http',
    'HTTP(S) response',
    'inconclusive',
    'HTTP ended without a final status.',
    'Unexpected control flow.',
    'Treat as inconclusive, not passed.'
  );
}

export async function runInvestigation(rawInput: string): Promise<InvestigationResult> {
  const parsed = parseInvestigationTarget(rawInput);
  if (!parsed.ok) {
    const checks: CheckOutcome[] = [
      emptyCheck(
        'dns',
        'DNS resolution',
        'not-tested',
        'DNS was not started because the target was rejected.',
        parsed.issues.map((i) => i.message).join(' '),
        'Unsafe or malformed input never reaches the resolver.'
      ),
      emptyCheck(
        'tcp',
        'TCP port connectivity',
        'not-tested',
        'TCP was not started because the target was rejected.',
        parsed.issues.map((i) => i.message).join(' '),
        'No sockets are opened for rejected targets.'
      ),
      emptyCheck(
        'http',
        'HTTP(S) response',
        'not-tested',
        'HTTP was not started because the target was rejected.',
        parsed.issues.map((i) => i.message).join(' '),
        'No URL fetching is performed for rejected targets.'
      ),
    ];
    const partial = {
      accepted: false,
      rejectedReason: parsed.issues.map((i) => i.message).join(' '),
      target: null,
      ranAt: new Date().toISOString(),
      helperLabel: HELPER_LABEL,
      checks,
      mappedScenarioId: null,
      mappedOutcome: 'INSUFFICIENT_INFO',
      educationalHeadline: 'Target Rejected Before Any Check Ran',
      educationalSummary: parsed.issues.map((i) => i.message).join(' '),
      certaintyNote: 'No probe was executed.',
    };
    const mapped = mappedScenarioFromInvestigation({
      ...partial,
      pathStages: pathStagesFromChecks(checks),
    });
    return {
      ...partial,
      ...mapped,
      pathStages: pathStagesFromChecks(checks),
    };
  }

  const dns = await runDnsCheck(parsed.target);
  const tcp = await runTcpCheck(parsed.target, dns.addresses);
  const httpCheck = await runHttpCheck(parsed.target, dns.addresses, tcp);
  const checks = [dns.check, tcp, httpCheck];
  const pathStages = pathStagesFromChecks(checks);
  const mapped = mappedScenarioFromInvestigation({
    accepted: true,
    rejectedReason: null,
    target: parsed.target,
    ranAt: new Date().toISOString(),
    helperLabel: HELPER_LABEL,
    checks,
    pathStages,
    mappedScenarioId: null,
    mappedOutcome: null,
    educationalHeadline: '',
    educationalSummary: '',
    certaintyNote: '',
  });

  return {
    accepted: true,
    rejectedReason: null,
    target: parsed.target,
    ranAt: new Date().toISOString(),
    helperLabel: HELPER_LABEL,
    checks,
    pathStages,
    ...mapped,
  };
}

export async function handleInvestigateRequest(
  req: { method?: string; on: Function },
  res: {
    statusCode: number;
    setHeader: (k: string, v: string) => void;
    end: (body?: string) => void;
  }
): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Use POST with JSON { "target": "example.com" }' }));
    return;
  }

  let raw = '';
  try {
    raw = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      req.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BODY_JSON) {
          reject(new Error('Request body too large'));
          return;
        }
        chunks.push(Buffer.from(chunk));
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  } catch {
    res.statusCode = 413;
    res.end(JSON.stringify({ error: 'Request body too large' }));
    return;
  }

  let target = '';
  try {
    const body = raw ? JSON.parse(raw) : {};
    target = typeof body.target === 'string' ? body.target : '';
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Body must be JSON' }));
    return;
  }

  try {
    const result = await runInvestigation(target);
    res.statusCode = result.accepted ? 200 : 400;
    res.end(JSON.stringify(result));
  } catch (err: unknown) {
    const error = err as Error;
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: 'Investigation helper failed',
        message: error.message,
      })
    );
  }
}
