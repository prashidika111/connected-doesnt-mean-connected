import { describe, expect, it } from 'vitest';
import {
  parseInvestigationTarget,
  isBlockedResolvedAddress,
  parseStrictIpv4,
  isNonPublicIpv6,
} from './targetValidation';

describe('Diagnostic Target Validation', () => {
  describe('Valid Targets', () => {
    it('accepts public hostnames with https and http', () => {
      const httpsResult = parseInvestigationTarget('https://example.com');
      expect(httpsResult.ok).toBe(true);
      if (httpsResult.ok) {
        expect(httpsResult.target.hostname).toBe('example.com');
        expect(httpsResult.target.port).toBe(443);
        expect(httpsResult.target.protocol).toBe('https');
        expect(httpsResult.target.kind).toBe('hostname');
      }

      const httpResult = parseInvestigationTarget('http://example.com');
      expect(httpResult.ok).toBe(true);
      if (httpResult.ok) {
        expect(httpResult.target.protocol).toBe('http');
        expect(httpResult.target.port).toBe(80);
      }
    });

    it('accepts bare hostnames and assigns default https and port 443', () => {
      const bareResult = parseInvestigationTarget('example.com');
      expect(bareResult.ok).toBe(true);
      if (bareResult.ok) {
        expect(bareResult.target.hostname).toBe('example.com');
        expect(bareResult.target.protocol).toBe('https');
        expect(bareResult.target.port).toBe(443);
      }
    });

    it('accepts public IPv4 addresses', () => {
      const ipResult = parseInvestigationTarget('8.8.8.8');
      expect(ipResult.ok).toBe(true);
      if (ipResult.ok) {
        expect(ipResult.target.hostname).toBe('8.8.8.8');
        expect(ipResult.target.kind).toBe('ipv4');
      }

      const cloudflare = parseInvestigationTarget('https://1.1.1.1');
      expect(cloudflare.ok).toBe(true);
    });

    it('accepts permitted explicit ports 80 and 443', () => {
      const port80 = parseInvestigationTarget('http://example.com:80');
      expect(port80.ok).toBe(true);
      if (port80.ok) expect(port80.target.port).toBe(80);

      const port443 = parseInvestigationTarget('https://example.com:443');
      expect(port443.ok).toBe(true);
      if (port443.ok) expect(port443.target.port).toBe(443);
    });

    it('preserves path and query parameters safely', () => {
      const result = parseInvestigationTarget('https://example.com/test/path?foo=bar');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.target.pathname).toBe('/test/path');
        expect(result.target.search).toBe('?foo=bar');
      }
    });
  });

  describe('Invalid or Malformed Inputs', () => {
    it('rejects empty or whitespace-only inputs', () => {
      expect(parseInvestigationTarget('').ok).toBe(false);
      expect(parseInvestigationTarget('   ').ok).toBe(false);
    });

    it('rejects input with whitespace or control characters', () => {
      expect(parseInvestigationTarget('https://exa mple.com').ok).toBe(false);
      expect(parseInvestigationTarget('example.com\n').ok).toBe(false);
      expect(parseInvestigationTarget('example.com\x00').ok).toBe(false);
    });

    it('rejects malformed URLs and invalid hostnames', () => {
      expect(parseInvestigationTarget('not a valid URL').ok).toBe(false);
      expect(parseInvestigationTarget('example..com').ok).toBe(false);
      expect(parseInvestigationTarget('.example.com').ok).toBe(false);
      expect(parseInvestigationTarget('example.com.').ok).toBe(true); // Trailing dot normalized
      expect(parseInvestigationTarget('http://').ok).toBe(false);
      expect(parseInvestigationTarget('http://.').ok).toBe(false);
    });

    it('rejects forbidden URL schemes (SSRF prevention)', () => {
      const forbiddenSchemes = [
        'ftp://example.com',
        'file:///etc/passwd',
        'javascript:alert(1)',
        'data:text/html,test',
        'ws://example.com',
        'wss://example.com',
        'blob:https://example.com',
      ];
      for (const scheme of forbiddenSchemes) {
        const res = parseInvestigationTarget(scheme);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.issues.some((i) => i.code === 'SCHEME_FORBIDDEN')).toBe(true);
        }
      }
    });

    it('rejects URLs with credentials', () => {
      const res = parseInvestigationTarget('https://user:password@example.com');
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.issues.some((i) => i.code === 'USERINFO')).toBe(true);
      }
    });

    it('rejects non-standard ports (allowing only 80 and 443)', () => {
      const forbiddenPorts = [
        'https://example.com:8080',
        'http://example.com:3000',
        'https://example.com:22',
        'https://example.com:21',
        'https://example.com:8443',
        'example.com:65535',
      ];
      for (const target of forbiddenPorts) {
        const res = parseInvestigationTarget(target);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.issues.some((i) => i.code === 'PORT_FORBIDDEN')).toBe(true);
        }
      }
    });
  });

  describe('SSRF Protection: Blocked IP Ranges and Hostnames', () => {
    it('blocks loopback addresses (127.0.0.0/8, ::1, localhost)', () => {
      expect(parseInvestigationTarget('http://127.0.0.1').ok).toBe(false);
      expect(parseInvestigationTarget('http://127.0.0.2').ok).toBe(false);
      expect(parseInvestigationTarget('http://127.255.255.254').ok).toBe(false);
      expect(parseInvestigationTarget('http://localhost').ok).toBe(false);
      expect(parseInvestigationTarget('http://localhost.localdomain').ok).toBe(false);
      expect(parseInvestigationTarget('http://[::1]').ok).toBe(false);
    });

    it('blocks RFC 1918 private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
      expect(parseInvestigationTarget('10.0.0.1').ok).toBe(false);
      expect(parseInvestigationTarget('10.254.254.254').ok).toBe(false);
      expect(parseInvestigationTarget('172.16.0.1').ok).toBe(false);
      expect(parseInvestigationTarget('172.31.255.254').ok).toBe(false);
      expect(parseInvestigationTarget('192.168.0.1').ok).toBe(false);
      expect(parseInvestigationTarget('192.168.1.254').ok).toBe(false);
    });

    it('blocks link-local and cloud metadata addresses (169.254.0.0/16, metadata hostnames)', () => {
      expect(parseInvestigationTarget('169.254.169.254').ok).toBe(false);
      expect(parseInvestigationTarget('169.254.1.1').ok).toBe(false);
      expect(parseInvestigationTarget('http://metadata.google.internal').ok).toBe(false);
      expect(parseInvestigationTarget('http://instance-data').ok).toBe(false);
    });

    it('blocks multicast, broadcast, and reserved addresses', () => {
      expect(parseInvestigationTarget('0.0.0.0').ok).toBe(false);
      expect(parseInvestigationTarget('224.0.0.1').ok).toBe(false); // Multicast
      expect(parseInvestigationTarget('239.255.255.250').ok).toBe(false); // Multicast
      expect(parseInvestigationTarget('240.0.0.1').ok).toBe(false); // Reserved
      expect(parseInvestigationTarget('255.255.255.255').ok).toBe(false); // Broadcast
    });

    it('blocks documentation subnets (TEST-NET-1, 2, 3)', () => {
      expect(parseInvestigationTarget('192.0.2.1').ok).toBe(false);
      expect(parseInvestigationTarget('198.51.100.1').ok).toBe(false);
      expect(parseInvestigationTarget('203.0.113.1').ok).toBe(false);
    });

    it('blocks non-public IPv6 addresses', () => {
      expect(isNonPublicIpv6('::1')).toBe(true); // Loopback
      expect(isNonPublicIpv6('fe80::1')).toBe(true); // Link-local
      expect(isNonPublicIpv6('fc00::1')).toBe(true); // ULA
      expect(isNonPublicIpv6('ff02::1')).toBe(true); // Multicast
    });
  });

  describe('Strict IPv4 Parsing helper', () => {
    it('correctly validates valid IPv4 octets', () => {
      expect(parseStrictIpv4('192.168.1.1')).toEqual([192, 168, 1, 1]);
      expect(parseStrictIpv4('0.0.0.0')).toEqual([0, 0, 0, 0]);
      expect(parseStrictIpv4('255.255.255.255')).toEqual([255, 255, 255, 255]);
    });

    it('rejects leading zeros (octal ambiguity) and numbers out of range', () => {
      expect(parseStrictIpv4('192.168.01.1')).toBeNull();
      expect(parseStrictIpv4('256.0.0.1')).toBeNull();
      expect(parseStrictIpv4('192.168.1')).toBeNull();
      expect(parseStrictIpv4('192.168.1.1.1')).toBeNull();
      expect(parseStrictIpv4('192.168.1.-1')).toBeNull();
    });

    it('isBlockedResolvedAddress returns true for private IPs', () => {
      expect(isBlockedResolvedAddress('127.0.0.1', 4)).toBe(true);
      expect(isBlockedResolvedAddress('192.168.1.1', 4)).toBe(true);
      expect(isBlockedResolvedAddress('10.0.0.1', 4)).toBe(true);
      expect(isBlockedResolvedAddress('8.8.8.8', 4)).toBe(false);
      expect(isBlockedResolvedAddress('1.1.1.1', 4)).toBe(false);
    });
  });
});
