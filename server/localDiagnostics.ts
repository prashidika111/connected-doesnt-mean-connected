
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isIP } from 'node:net';
import { lookup as dnsLookup } from 'node:dns/promises';
import {
  isBlockedResolvedAddress,
  parseInvestigationTarget,
} from '../src/engine/targetValidation';

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 9000;
const MAX_REQUEST_BYTES = 4096;

function send(res: any, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function runCommand(
  command: string,
  args: string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  try {
    const result = await execFileAsync(command, args, {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });

    return {
      ok: true,
      output: `${result.stdout || ''}\n${result.stderr || ''}`.trim(),
      error: '',
    };
  } catch (error: any) {
    return {
      ok: false,
      output: `${error?.stdout || ''}\n${error?.stderr || ''}`.trim(),
      error: String(error?.message || error),
    };
  }
}

/**
 * Read the default IPv4 gateway from the operating system.
 * This does not probe an arbitrary user-supplied private address.
 */
async function defaultGateway(): Promise<{
  gateway: string | null;
  method: string;
  raw: string;
  note: string;
}> {
  const platform = process.platform;
  let command: string;
  let args: string[];

  if (platform === 'win32') {
    command = 'route';
    args = ['print', '-4'];
  } else if (platform === 'darwin') {
    command = 'route';
    args = ['-n', 'get', 'default'];
  } else {
    command = 'ip';
    args = ['route', 'show', 'default'];
  }

  const result = await runCommand(command, args, 5000);
  const output = result.output;
  let gateway: string | null = null;

  if (platform === 'win32') {
    // Windows route print output contains:
    // Network Destination  Netmask  Gateway  Interface  Metric
    for (const line of output.split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);

      if (
        columns.length >= 4 &&
        columns[0] === '0.0.0.0' &&
        columns[1] === '0.0.0.0' &&
        isIP(columns[2]) === 4 &&
        columns[2] !== '0.0.0.0'
      ) {
        gateway = columns[2];
        break;
      }
    }
  } else if (platform === 'darwin') {
    const match = output.match(/gateway:\s*(\S+)/i);
    gateway = match?.[1] || null;
  } else {
    const match = output.match(/(?:^|\s)default\s+via\s+(\S+)/m);
    gateway = match?.[1] || null;
  }

  return {
    gateway,
    method: `${command} ${args.join(' ')}`,
    raw: output.slice(0, 1200),
    note: result.ok
      ? gateway
        ? 'Gateway read from the operating system routing table.'
        : 'The command ran, but no default IPv4 gateway could be parsed.'
      : `Could not read the routing table: ${result.error}`,
  };
}

/**
 * This function accepts only the gateway discovered from the OS.
 * It intentionally does not use the public-destination validator:
 * private gateway addresses are normal in local networks.
 */
async function pingHost(host: string) {
  if (isIP(host) !== 4) {
    return {
      responded: false,
      command: '',
      output: '',
      interpretation: 'The discovered gateway was not a valid IPv4 address.',
    };
  }

  const args =
    process.platform === 'win32'
      ? ['-n', '1', '-w', '2500', host]
      : ['-c', '1', '-W', '3', host];

  const result = await runCommand('ping', args, 4500);

  return {
    responded: result.ok,
    command: `ping ${args.join(' ')}`,
    output: (result.output || result.error).slice(0, 1000),
    interpretation: result.ok
      ? 'The gateway replied to an ICMP echo request.'
      : 'No successful ping reply was observed. Some gateways block ICMP, so this alone does not prove the gateway is down.',
  };
}

/**
 * Local diagnostics inspect the machine running this Node.js process.
 * Private interface addresses and the OS-discovered gateway are expected.
 */
export async function handleLocalDiagnosticsRequest(
  _req: any,
  res: any,
) {
  try {
    const interfaces = Object.entries(os.networkInterfaces()).flatMap(
      ([name, entries]) =>
        (entries || [])
          .filter((entry) => !entry.internal)
          .map((entry) => ({
            name,
            address: entry.address,
            family: entry.family,
            netmask: entry.netmask,
            mac: entry.mac,
            cidr: entry.cidr,
            internal: entry.internal,
          })),
    );

    const route = await defaultGateway();
    const gatewayTest = route.gateway
      ? await pingHost(route.gateway)
      : null;

    send(res, 200, {
      checkedAt: new Date().toISOString(),
      hostLabel: 'Computer running the local Node.js app',
      platform: process.platform,
      hostname: os.hostname(),
      interfaces,
      gateway: route.gateway,
      gatewayMethod: route.method,
      gatewayNote: route.note,
      gatewayRaw: route.raw,
      gatewayPing: gatewayTest,
      limitations: [
        'These readings belong to the computer running the Node.js app, which may not be the same device as the browser if the app is hosted remotely.',
        'Private IP addresses are normal for local interfaces and gateways.',
        'An interface address indicates configuration, not guaranteed internet access.',
        'A failed gateway ping can mean ICMP is blocked; it is not proof the gateway is offline.',
        'This tool reads local interface and route information; it does not log into or inspect the router internally.',
      ],
    });
  } catch (error: any) {
    send(res, 500, {
      error: 'Local diagnostics failed.',
      detail: String(error?.message || error),
    });
  }
}

/**
 * Route tracing accepts public targets only.
 * Local gateway checks are handled by the separate local diagnostics API.
 */
export async function handleTraceRouteRequest(req: any, res: any) {
  try {
    let body = '';

    for await (const chunk of req) {
      body += chunk.toString();

      if (body.length > MAX_REQUEST_BYTES) {
        send(res, 413, { error: 'Request too large.' });
        return;
      }
    }

    let input: { target?: unknown };

    try {
      input = JSON.parse(body || '{}');
    } catch {
      send(res, 400, { error: 'Request body must contain valid JSON.' });
      return;
    }

    const parsed = parseInvestigationTarget(String(input.target || ''));

    if (!parsed.ok) {
      send(res, 400, {
        error: parsed.issues.map((issue) => issue.message).join(' '),
      });
      return;
    }

    const target = parsed.target;
    const host = target.hostname;

    // A literal private IP is rejected for destination tracing.
    // Private addresses remain permitted only in the dedicated
    // OS-discovered local gateway diagnostic above.
    if (
      target.kind === 'ipv4' &&
      isBlockedResolvedAddress(host, 4)
    ) {
      send(res, 400, {
        error:
          'Route tracing is limited to public destinations. Use local network diagnostics to check your own gateway.',
      });
      return;
    }

    if (target.kind === 'hostname') {
      const answers = await dnsLookup(host, {
        all: true,
        verbatim: true,
      });

      if (
        !answers.length ||
        answers.some((answer) =>
          isBlockedResolvedAddress(
            answer.address,
            answer.family === 6 ? 6 : 4,
          ),
        )
      ) {
        send(res, 400, {
          error:
            'Route tracing is limited to hostnames resolving only to public IP addresses.',
        });
        return;
      }
    }

    const command =
      process.platform === 'win32' ? 'tracert' : 'traceroute';

    const args =
      process.platform === 'win32'
        ? ['-d', '-h', '12', '-w', '800', host]
        : ['-n', '-m', '12', '-w', '1', host];

    const result = await runCommand(command, args, 18000);

    send(res, 200, {
      target: target.display,
      command: `${command} ${args.join(' ')}`,
      completed: result.ok,
      output: (
        result.output ||
        result.error ||
        'No route output returned.'
      ).slice(0, 9000),
      note: result.ok
        ? 'These are the hops that responded from the machine running this app. Asterisks or missing hops can reflect filtering and do not necessarily mean traffic stops there.'
        : `Route tracing could not complete. The command may be unavailable or blocked. ${result.error}`,
      executionLocation: 'Local Node.js process serving this app',
    });
  } catch (error: any) {
    send(res, 400, {
      error: 'Could not run route tracing.',
      detail: String(error?.message || error),
    });
  }
}
