import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { inspectAndParsePktBuffer, MAX_PKT_FILE_SIZE_BYTES } from './pktParser';

describe('Packet Tracer Lab Importer - Binary & XML Parser', () => {
  it('correctly inspects the real DNS-01 Packet Tracer lab file', () => {
    const pktPath = path.resolve(
      __dirname,
      '../Network Simulation (Cisco Demo)/Scenario 1. DNS Failure Cisco Simulation.pkt'
    );
    expect(fs.existsSync(pktPath)).toBe(true);

    const buffer = fs.readFileSync(pktPath);
    const report = inspectAndParsePktBuffer(buffer, 'Scenario 1. DNS Failure Cisco Simulation.pkt');

    expect(report.fileName).toBe('Scenario 1. DNS Failure Cisco Simulation.pkt');
    expect(report.fileSize).toBe(buffer.length);
    expect(report.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(report.detectedFormat).toBe('pt7_8_twofish_eax');
    expect(report.guidedFallbackRequired).toBe(true);
    expect(report.formatDescription).toContain('Twofish-128-EAX');
    expect(report.notes.length).toBeGreaterThanOrEqual(4);
  });

  it('correctly parses unencrypted Packet Tracer XML payload', () => {
    const fakePtXml = `<?xml version="1.0" encoding="utf-8"?>
<PACKETTRACER5>
  <NETWORK>
    <DEVICE>
      <NAME>Host-A</NAME>
      <TYPE>PC</TYPE>
      <IP_ADDRESS>192.168.1.50</IP_ADDRESS>
      <SUBNET_MASK>255.255.255.0</SUBNET_MASK>
      <DEFAULT_GATEWAY>192.168.1.1</DEFAULT_GATEWAY>
      <DNS_SERVER>192.168.1.10</DNS_SERVER>
    </DEVICE>
    <DEVICE>
      <NAME>CoreRouter</NAME>
      <TYPE>Router</TYPE>
      <IP_ADDRESS>192.168.1.1</IP_ADDRESS>
      <SUBNET_MASK>255.255.255.0</SUBNET_MASK>
      <DEFAULT_GATEWAY>None</DEFAULT_GATEWAY>
    </DEVICE>
    <LINK>
      <DEVICE1>Host-A</DEVICE1>
      <DEVICE2>CoreRouter</DEVICE2>
    </LINK>
  </NETWORK>
</PACKETTRACER5>`;

    const buffer = Buffer.from(fakePtXml, 'utf8');
    const report = inspectAndParsePktBuffer(buffer, 'test-topology.pkt');

    expect(report.detectedFormat).toBe('unencrypted_pt_xml');
    expect(report.extractionSuccess).toBe(true);
    expect(report.guidedFallbackRequired).toBe(false);
    expect(report.extractedDevices).toHaveLength(2);
    expect(report.extractedDevices[0].name).toBe('Host-A');
    expect(report.extractedDevices[0].ipAddress).toBe('192.168.1.50');
    expect(report.extractedDevices[1].name).toBe('CoreRouter');
    expect(report.extractedDevices[1].type).toBe('Router');
    expect(report.extractedConnections).toHaveLength(1);
    expect(report.extractedConnections[0]).toContain('Host-A <-> CoreRouter');
  });

  it('rejects empty 0-byte files with corrupt status', () => {
    const buffer = Buffer.alloc(0);
    const report = inspectAndParsePktBuffer(buffer, 'empty.pkt');

    expect(report.detectedFormat).toBe('corrupt');
    expect(report.fileSize).toBe(0);
    expect(report.extractionSuccess).toBe(false);
    expect(report.guidedFallbackRequired).toBe(true);
  });

  it('rejects oversized files exceeding 10MB', () => {
    // Create a mock large buffer header
    const largeBuffer = Buffer.alloc(MAX_PKT_FILE_SIZE_BYTES + 1024);
    const report = inspectAndParsePktBuffer(largeBuffer, 'huge.pkt');

    expect(report.detectedFormat).toBe('corrupt');
    expect(report.message).toContain('exceeds 10MB limit');
    expect(report.guidedFallbackRequired).toBe(true);
  });
});
