import { ParsedTarget, TargetParseResult, ValidationIssue } from '../types/investigation';

const MAX_INPUT_LENGTH = 2048;
const ALLOWED_PORTS = new Set([80, 443]);

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'metadata.internal',
  'metadata',
  'instance-data',
  'kubernetes.default.svc',
]);

function issue(code: string, message: string): ValidationIssue {
  return { code, message };
}

function fail(...issues: ValidationIssue[]): TargetParseResult {
  return { ok: false, issues };
}

/** Strict dotted-decimal IPv4. Rejects octal-looking leading zeros and out-of-range octets. */
export function parseStrictIpv4(value: string): number[] | null {
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^(0|[1-9]\d{0,2})$/.test(part)) return null;
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    octets.push(n);
  }
  return octets;
}

export function ipv4ToInt(octets: number[]): number {
  return (
    ((octets[0] << 24) >>> 0) +
    ((octets[1] << 16) >>> 0) +
    ((octets[2] << 8) >>> 0) +
    (octets[3] >>> 0)
  ) >>> 0;
}

function inCidr(ip: number, base: number, prefix: number): boolean {
  if (prefix === 0) return true;
  const mask = prefix === 32 ? 0xffffffff : (~((1 << (32 - prefix)) - 1)) >>> 0;
  return (ip & mask) === (base & mask);
}

/** True when an IPv4 address is not a globally routable unicast address. */
export function isNonPublicIpv4(octets: number[]): boolean {
  const ip = ipv4ToInt(octets);

  if (inCidr(ip, ipv4ToInt([0, 0, 0, 0]), 8)) return true;
  if (inCidr(ip, ipv4ToInt([10, 0, 0, 0]), 8)) return true;
  if (inCidr(ip, ipv4ToInt([100, 64, 0, 0]), 10)) return true; // Carrier-Grade NAT & Cloud metadata
  if (inCidr(ip, ipv4ToInt([127, 0, 0, 0]), 8)) return true;
  if (inCidr(ip, ipv4ToInt([169, 254, 0, 0]), 16)) return true; // Link-local & AWS/Azure metadata 169.254.169.254
  if (inCidr(ip, ipv4ToInt([172, 16, 0, 0]), 12)) return true;
  if (inCidr(ip, ipv4ToInt([192, 0, 0, 0]), 24)) return true;
  if (inCidr(ip, ipv4ToInt([192, 0, 2, 0]), 24)) return true; // TEST-NET-1
  if (inCidr(ip, ipv4ToInt([192, 88, 99, 0]), 24)) return true;
  if (inCidr(ip, ipv4ToInt([192, 168, 0, 0]), 16)) return true;
  if (inCidr(ip, ipv4ToInt([198, 18, 0, 0]), 15)) return true;
  if (inCidr(ip, ipv4ToInt([198, 51, 100, 0]), 24)) return true; // TEST-NET-2
  if (inCidr(ip, ipv4ToInt([203, 0, 113, 0]), 24)) return true; // TEST-NET-3
  if (inCidr(ip, ipv4ToInt([224, 0, 0, 0]), 4)) return true;
  if (inCidr(ip, ipv4ToInt([240, 0, 0, 0]), 4)) return true;
  if (ip === ipv4ToInt([255, 255, 255, 255])) return true;
  return false;
}

function expandIpv6(address: string): number[] | null {
  const trimmed = address.trim().toLowerCase();
  if (!trimmed.includes(':')) return null;
  if (trimmed.startsWith('[') || trimmed.endsWith(']')) return null;

  const zoneSplit = trimmed.split('%')[0];
  const mapped = zoneSplit.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) {
    const octets = parseStrictIpv4(mapped[1]);
    if (!octets) return null;
    return [0, 0, 0, 0, 0, 0xffff, (octets[0] << 8) + octets[1], (octets[2] << 8) + octets[3]];
  }

  const sides = zoneSplit.split('::');
  if (sides.length > 2) return null;

  const parseGroup = (chunk: string): number[] | null => {
    if (!chunk) return [];
    const parts = chunk.split(':');
    const out: number[] = [];
    for (const p of parts) {
      if (p.includes('.')) {
        const octets = parseStrictIpv4(p);
        if (!octets) return null;
        out.push((octets[0] << 8) + octets[1], (octets[2] << 8) + octets[3]);
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/.test(p)) return null;
      out.push(parseInt(p, 16));
    }
    return out;
  };

  if (sides.length === 1) {
    const groups = parseGroup(sides[0]);
    if (!groups || groups.length !== 8) return null;
    return groups;
  }

  const left = parseGroup(sides[0]);
  const right = parseGroup(sides[1]);
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;
  return [...left, ...Array(missing).fill(0), ...right];
}

export function isNonPublicIpv6(address: string): boolean {
  const groups = expandIpv6(address);
  if (!groups) return true;

  const isUnspecified = groups.every((g) => g === 0);
  if (isUnspecified) return true;
  const isLoopback = groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1;
  if (isLoopback) return true;

  // IPv4-mapped
  if (
    groups[0] === 0 &&
    groups[1] === 0 &&
    groups[2] === 0 &&
    groups[3] === 0 &&
    groups[4] === 0 &&
    groups[5] === 0xffff
  ) {
    const octets = [
      (groups[6] >> 8) & 0xff,
      groups[6] & 0xff,
      (groups[7] >> 8) & 0xff,
      groups[7] & 0xff,
    ];
    return isNonPublicIpv4(octets);
  }

  if ((groups[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 ULA
  if ((groups[0] & 0xffc0) === 0xfe80) return true; // fe80::/10
  if ((groups[0] & 0xff00) === 0xff00) return true; // multicast
  if (groups[0] === 0x2001 && groups[1] === 0xdb8) return true; // documentation
  if (groups[0] === 0x0100 && groups[1] === 0) return true; // 100::/64 discard
  return false;
}

export function isBlockedResolvedAddress(address: string, family: 4 | 6): boolean {
  if (family === 4) {
    const octets = parseStrictIpv4(address);
    if (!octets) return true;
    return isNonPublicIpv4(octets);
  }
  return isNonPublicIpv6(address);
}

function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) return false;
  if (hostname.endsWith('.')) {
    hostname = hostname.slice(0, -1);
  }
  if (hostname.toLowerCase() === 'localhost') return false;
  const labels = hostname.split('.');
  if (labels.length < 2) return false;
  return labels.every((label) => {
    if (label.length < 1 || label.length > 63) return false;
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label)) return false;
    return true;
  });
}

function looksLikeIpv6(value: string): boolean {
  if (value.startsWith('[') && value.includes(']')) return true;
  const colons = (value.match(/:/g) || []).length;
  return colons >= 2;
}

function stripBrackets(host: string): string {
  if (host.startsWith('[') && host.endsWith(']')) {
    return host.slice(1, -1);
  }
  return host;
}

function defaultPort(protocol: 'http' | 'https'): 80 | 443 {
  return protocol === 'http' ? 80 : 443;
}

function normalizePath(pathname: string, search: string): { pathname: string; search: string } {
  const path = pathname && pathname.length > 0 ? pathname : '/';
  return { pathname: path, search: search || '' };
}

/**
 * Parse and validate a user-supplied URL or IP for investigation.
 * Allows only http/https, ports 80/443, and public hostnames/IPs at parse time.
 * DNS answers are re-checked later for SSRF (rebinding / private ranges).
 */
export function parseInvestigationTarget(raw: string): TargetParseResult {
  if (typeof raw !== 'string') {
    return fail(issue('NOT_STRING', 'Target must be a text URL or IP address.'));
  }
  if (/[\r\n\t\u0000-\u001f\u007f]/.test(raw)) {
    return fail(issue('CONTROL_CHARS', 'Target contains control characters or newlines and cannot be used.'));
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return fail(issue('EMPTY', 'Enter a website address or public IP to investigate.'));
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return fail(issue('TOO_LONG', 'Target is too long to investigate.'));
  }
  if (/\s/.test(trimmed)) {
    return fail(issue('WHITESPACE', 'Remove spaces from the URL or IP address.'));
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('ftp:') ||
    lower.startsWith('ws:') ||
    lower.startsWith('wss:') ||
    lower.startsWith('blob:')
  ) {
    return fail(
      issue(
        'SCHEME_FORBIDDEN',
        'Only http:// and https:// targets are allowed. Other URL schemes are blocked.'
      )
    );
  }

  let protocol: 'http' | 'https' = 'https';
  let rest = trimmed;
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    protocol = lower.startsWith('http://') ? 'http' : 'https';
    try {
      const url = new URL(trimmed);
      if (url.username || url.password) {
        return fail(issue('USERINFO', 'URLs with usernames or passwords are not accepted.'));
      }
      if (url.port && !ALLOWED_PORTS.has(Number(url.port))) {
        return fail(
          issue(
            'PORT_FORBIDDEN',
            `Port ${url.port} is not allowed. Only ports 80 and 443 may be probed.`
          )
        );
      }
      const hostname = stripBrackets(url.hostname);
      const port = (url.port ? Number(url.port) : defaultPort(protocol)) as 80 | 443;
      if (!ALLOWED_PORTS.has(port)) {
        return fail(issue('PORT_FORBIDDEN', 'Only ports 80 and 443 may be probed.'));
      }
      return finalizeTarget(trimmed, protocol, hostname, port, url.pathname, url.search);
    } catch {
      return fail(issue('MALFORMED_URL', 'That value is not a valid http(s) URL.'));
    }
  }

  // Bare host, host:port, or IP
  let hostname = rest;
  let port: 80 | 443 = 443;
  let pathname = '/';
  let search = '';

  const slashIndex = rest.search(/[/?#]/);
  if (slashIndex >= 0) {
    const after = rest.slice(slashIndex);
    rest = rest.slice(0, slashIndex);
    if (after.startsWith('#')) {
      pathname = '/';
    } else {
      try {
        const dummy = new URL(`https://placeholder.example${after.startsWith('/') ? after : `/${after}`}`);
        pathname = dummy.pathname;
        search = dummy.search;
      } catch {
        return fail(issue('MALFORMED_PATH', 'The path portion of the target is malformed.'));
      }
    }
    hostname = rest;
  }

  if (hostname.startsWith('[') && hostname.includes(']')) {
    const end = hostname.indexOf(']');
    const ip = hostname.slice(1, end);
    const after = hostname.slice(end + 1);
    if (after.startsWith(':')) {
      const p = Number(after.slice(1));
      if (!ALLOWED_PORTS.has(p)) {
        return fail(
          issue('PORT_FORBIDDEN', `Port ${after.slice(1)} is not allowed. Only ports 80 and 443 may be probed.`)
        );
      }
      port = p as 80 | 443;
    } else if (after) {
      return fail(issue('MALFORMED_HOST', 'IPv6 host is malformed.'));
    }
    protocol = port === 80 ? 'http' : 'https';
    return finalizeTarget(trimmed, protocol, ip, port, pathname, search);
  }

  const lastColon = hostname.lastIndexOf(':');
  if (lastColon > 0 && hostname.indexOf(':') === lastColon && !looksLikeIpv6(hostname)) {
    const maybePort = hostname.slice(lastColon + 1);
    hostname = hostname.slice(0, lastColon);
    const p = Number(maybePort);
    if (!ALLOWED_PORTS.has(p)) {
      return fail(
        issue('PORT_FORBIDDEN', `Port ${maybePort} is not allowed. Only ports 80 and 443 may be probed.`)
      );
    }
    port = p as 80 | 443;
    protocol = port === 80 ? 'http' : 'https';
  } else {
    protocol = 'https';
    port = 443;
  }

  return finalizeTarget(trimmed, protocol, hostname, port, pathname, search);
}

function finalizeTarget(
  rawInput: string,
  protocol: 'http' | 'https',
  hostname: string,
  port: 80 | 443,
  pathname: string,
  search: string
): TargetParseResult {
  const host = hostname.trim().replace(/\.$/, '');
  if (!host) {
    return fail(issue('MISSING_HOST', 'The target has no hostname.'));
  }
  if (host.includes('..') || host.startsWith('.') || host.endsWith('.')) {
    return fail(issue('MALFORMED_HOST', 'The hostname is malformed.'));
  }

  const paths = normalizePath(pathname, search);
  const lowerHost = host.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(lowerHost) || lowerHost.endsWith('.localhost') || lowerHost.endsWith('.local')) {
    return fail(
      issue(
        'NON_PUBLIC_HOST',
        'Loopback, local, and cloud metadata hostnames are blocked. This tool only investigates public internet names.'
      )
    );
  }

  const ipv4 = parseStrictIpv4(host);
  if (ipv4) {
    if (isNonPublicIpv4(ipv4)) {
      return fail(
        issue(
          'NON_PUBLIC_IP',
          `${host} is a private, loopback, link-local, or otherwise non-public IPv4 address. It cannot be probed.`
        )
      );
    }
    const displayHost = host;
    const display: ParsedTarget = {
      rawInput,
      kind: 'ipv4',
      protocol,
      hostname: host,
      port,
      pathname: paths.pathname,
      search: paths.search,
      display: `${protocol}://${displayHost}${port === defaultPort(protocol) ? '' : `:${port}`}${paths.pathname}${paths.search}`,
    };
    return { ok: true, target: display };
  }

  if (host.includes(':')) {
    if (isNonPublicIpv6(host)) {
      return fail(
        issue(
          'NON_PUBLIC_IP',
          'That IPv6 address is loopback, link-local, unique-local, or otherwise non-public and cannot be probed.'
        )
      );
    }
    const groups = expandIpv6(host);
    if (!groups) {
      return fail(issue('MALFORMED_IPV6', 'That IPv6 address could not be parsed.'));
    }
    const display: ParsedTarget = {
      rawInput,
      kind: 'ipv6',
      protocol,
      hostname: host,
      port,
      pathname: paths.pathname,
      search: paths.search,
      display: `${protocol}://[${host}]${port === defaultPort(protocol) ? '' : `:${port}`}${paths.pathname}${paths.search}`,
    };
    return { ok: true, target: display };
  }

  if (!isValidHostname(host)) {
    return fail(
      issue(
        'INVALID_HOSTNAME',
        'Enter a valid public hostname (for example example.com) or a public IP address.'
      )
    );
  }

  const display: ParsedTarget = {
    rawInput,
    kind: 'hostname',
    protocol,
    hostname: lowerHost,
    port,
    pathname: paths.pathname,
    search: paths.search,
    display: `${protocol}://${lowerHost}${port === defaultPort(protocol) ? '' : `:${port}`}${paths.pathname}${paths.search}`,
  };
  return { ok: true, target: display };
}
