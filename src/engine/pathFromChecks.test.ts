import { describe, expect, it } from 'vitest';
import { pathStagesFromChecks, toNetworkStages } from './pathFromChecks';
import { CheckOutcome } from '../types/investigation';

function createCheck(
  id: CheckOutcome['id'],
  status: CheckOutcome['status'],
  summary = 'summary',
  evidence: CheckOutcome['evidence'] = {}
): CheckOutcome {
  return {
    id,
    title: id.toUpperCase(),
    status,
    provenance: 'measured',
    executionLocation: 'local-diagnostic-helper',
    summary,
    detail: 'detail',
    limitations: 'limitations',
    durationMs: 15,
    evidence,
  };
}

describe('Evidence-Driven Path Stages Generation', () => {
  it('correctly maps DNS failure by setting DNS stage to error and Destination to bypassed', () => {
    const checks: CheckOutcome[] = [
      createCheck('dns', 'failed', 'DNS resolution failed'),
      createCheck('tcp', 'not-tested'),
      createCheck('http', 'not-tested'),
    ];

    const stages = pathStagesFromChecks(checks);
    expect(stages).toHaveLength(5);

    const dnsStage = stages.find((s) => s.id === 'dns');
    expect(dnsStage?.status).toBe('error');
    expect(dnsStage?.provenance).toBe('measured');

    const destStage = stages.find((s) => s.id === 'destination');
    expect(destStage?.status).toBe('bypassed');
  });

  it('correctly maps TCP failure by setting DNS to success and Destination to error', () => {
    const checks: CheckOutcome[] = [
      createCheck('dns', 'passed', 'Resolved to public IP'),
      createCheck('tcp', 'failed', 'Connection refused ECONNREFUSED'),
      createCheck('http', 'not-tested'),
    ];

    const stages = pathStagesFromChecks(checks);
    const dnsStage = stages.find((s) => s.id === 'dns');
    expect(dnsStage?.status).toBe('success');

    const destStage = stages.find((s) => s.id === 'destination');
    expect(destStage?.status).toBe('error');
  });

  it('marks Destination stage as warning when HTTP status is an application error (>= 400)', () => {
    const checks: CheckOutcome[] = [
      createCheck('dns', 'passed', 'Resolved to public IP'),
      createCheck('tcp', 'passed', 'Handshake completed'),
      createCheck('http', 'passed', 'Received HTTP 500', { statusCode: 500 }),
    ];

    const stages = pathStagesFromChecks(checks);
    const destStage = stages.find((s) => s.id === 'destination');
    expect(destStage?.status).toBe('warning');
  });

  it('marks Destination stage as success when HTTP 200 is received', () => {
    const checks: CheckOutcome[] = [
      createCheck('dns', 'passed', 'Resolved to public IP'),
      createCheck('tcp', 'passed', 'Handshake completed'),
      createCheck('http', 'passed', 'Received HTTP 200', { statusCode: 200 }),
    ];

    const stages = pathStagesFromChecks(checks);
    const destStage = stages.find((s) => s.id === 'destination');
    expect(destStage?.status).toBe('success');
  });

  it('never marks client device or local link as measured live observations', () => {
    const checks: CheckOutcome[] = [
      createCheck('dns', 'passed'),
      createCheck('tcp', 'passed'),
      createCheck('http', 'passed'),
    ];

    const stages = pathStagesFromChecks(checks);
    const deviceStage = stages.find((s) => s.id === 'device');
    expect(deviceStage?.provenance).toBe('conceptual');
    expect(deviceStage?.status).toBe('untested');

    const linkStage = stages.find((s) => s.id === 'local_link');
    expect(linkStage?.provenance).toBe('not-tested');
    expect(linkStage?.status).toBe('untested');
  });

  it('infers gateway status with clear inference provenance when helper probes ran', () => {
    const checks: CheckOutcome[] = [
      createCheck('dns', 'passed'),
      createCheck('tcp', 'passed'),
    ];

    const stages = pathStagesFromChecks(checks);
    const gatewayStage = stages.find((s) => s.id === 'gateway_router');
    expect(gatewayStage?.provenance).toBe('inferred');
    expect(gatewayStage?.description).toContain('Inferred only');
  });

  it('toNetworkStages converts PathStageView to NetworkStage correctly', () => {
    const checks: CheckOutcome[] = [createCheck('dns', 'passed')];
    const path = pathStagesFromChecks(checks);
    const networkStages = toNetworkStages(path);
    expect(networkStages).toHaveLength(5);
    expect(networkStages[0].description).toContain('[Provenance:');
  });
});
