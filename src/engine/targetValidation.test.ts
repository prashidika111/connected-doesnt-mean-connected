import { describe, expect, it } from 'vitest';
import { parseInvestigationTarget, isBlockedResolvedAddress } from './targetValidation';

describe('diagnostic target validation', () => {
  it('accepts a public hostname and public IP', () => {
    expect(parseInvestigationTarget('https://example.com').ok).toBe(true);
    expect(parseInvestigationTarget('8.8.8.8').ok).toBe(true);
  });

  it('rejects malformed and unsupported targets', () => {
    expect(parseInvestigationTarget('not a valid URL').ok).toBe(false);
    expect(parseInvestigationTarget('ftp://example.com').ok).toBe(false);
    expect(parseInvestigationTarget('https://user:secret@example.com').ok).toBe(false);
    expect(parseInvestigationTarget('https://example.com:3000').ok).toBe(false);
  });

  it('rejects loopback, private and link local addresses', () => {
    for (const target of [
      'http://127.0.0.1',
      'http://10.0.0.2',
      'http://192.168.0.20',
      'http://169.254.169.254',
      'http://[::1]',
      'http://[fe80::1]',
      'http://2130706433',
    ]) {
      expect(parseInvestigationTarget(target).ok, target).toBe(false);
    }
  });

  it('blocks resolved private addresses', () => {
    expect(isBlockedResolvedAddress('192.168.0.10', 4)).toBe(true);
    expect(isBlockedResolvedAddress('8.8.8.8', 4)).toBe(false);
  });
});
