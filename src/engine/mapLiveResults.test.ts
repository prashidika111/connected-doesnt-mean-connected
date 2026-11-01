import { describe, expect, it } from 'vitest';
import { evaluationFromLiveInvestigation, mappedScenarioFromInvestigation } from './mapLiveResults';
import { InvestigationResult, CheckOutcome, ParsedTarget } from '../types/investigation';

function createMockTarget(overrides: Partial<ParsedTarget> = {}): ParsedTarget {
  return {
    rawInput: 'https://example.com',
    kind: 'hostname',
    protocol: 'https',
    hostname: 'example.com',
    port: 443,
    pathname: '/',
    search: '',
    display: 'https://example.com',
    ...overrides,
  };
}

function createCheck(
  id: CheckOutcome['id'],
  status: CheckOutcome['status'],
  summary = 'test summary',
  evidence: CheckOutcome['evidence'] = {}
): CheckOutcome {
  return {
    id,
    title: id.toUpperCase(),
    status,
    provenance: 'measured',
    executionLocation: 'local-diagnostic-helper',
    summary,
    detail: 'detail text',
    limitations: 'test limitation',
    durationMs: 42,
    evidence,
  };
}

describe('Map Live Investigation Results to Educational Diagnosis', () => {
  it('maps a rejected target to INSUFFICIENT_INFO without probe execution', () => {
    const rejected: InvestigationResult = {
      accepted: false,
      rejectedReason: 'Port 8080 is not permitted.',
      target: null,
      ranAt: new Date().toISOString(),
      helperLabel: 'Local helper',
      checks: [
        createCheck('dns', 'not-tested'),
        createCheck('tcp', 'not-tested'),
        createCheck('http', 'not-tested'),
      ],
      pathStages: [],
      mappedScenarioId: null,
      mappedOutcome: 'INSUFFICIENT_INFO',
      educationalHeadline: 'Target Rejected',
      educationalSummary: 'Rejected reason',
      certaintyNote: 'No probe run',
    };

    const evaluation = evaluationFromLiveInvestigation(rejected);
    expect(evaluation.outcome).toBe('INSUFFICIENT_INFO');
    expect(evaluation.scenarioId).toBeNull();
    expect(evaluation.title).toContain('Target Rejected');
    expect(evaluation.whatIsWorking).toContain('Input validation and SSRF guards.');
  });

  it('maps DNS failure to DNS_MATCH and Scenario DNS-01', () => {
    const dnsFailedInvestigation: InvestigationResult = {
      accepted: true,
      rejectedReason: null,
      target: createMockTarget(),
      ranAt: new Date().toISOString(),
      helperLabel: 'Local helper',
      checks: [
        createCheck('dns', 'failed', 'DNS resolution failed ENOTFOUND', { errorCode: 'ENOTFOUND' }),
        createCheck('tcp', 'not-tested'),
        createCheck('http', 'not-tested'),
      ],
      pathStages: [],
      mappedScenarioId: null,
      mappedOutcome: null,
      educationalHeadline: '',
      educationalSummary: '',
      certaintyNote: '',
    };

    const evaluation = evaluationFromLiveInvestigation(dnsFailedInvestigation);
    expect(evaluation.outcome).toBe('DNS_MATCH');
    expect(evaluation.scenarioId).toBe('DNS-01');
    expect(evaluation.certainty).toBe('CONFIRMED_BY_CHECK');
    expect(evaluation.title).toContain('DNS Lookup Failed');

    const mapped = mappedScenarioFromInvestigation(dnsFailedInvestigation);
    expect(mapped.mappedScenarioId).toBe('DNS-01');
    expect(mapped.mappedOutcome).toBe('DNS_MATCH');
  });

  it('maps TCP connection failure to HTTP_SERVICE_MATCH and Scenario SRV-04', () => {
    const tcpFailedInvestigation: InvestigationResult = {
      accepted: true,
      rejectedReason: null,
      target: createMockTarget(),
      ranAt: new Date().toISOString(),
      helperLabel: 'Local helper',
      checks: [
        createCheck('dns', 'passed', 'Resolved to 93.184.216.34'),
        createCheck('tcp', 'failed', 'Connection refused ECONNREFUSED', { errorCode: 'ECONNREFUSED' }),
        createCheck('http', 'not-tested'),
      ],
      pathStages: [],
      mappedScenarioId: null,
      mappedOutcome: null,
      educationalHeadline: '',
      educationalSummary: '',
      certaintyNote: '',
    };

    const evaluation = evaluationFromLiveInvestigation(tcpFailedInvestigation);
    expect(evaluation.outcome).toBe('HTTP_SERVICE_MATCH');
    expect(evaluation.scenarioId).toBe('SRV-04');
    expect(evaluation.certainty).toBe('CONFIRMED_BY_CHECK');
    expect(evaluation.title).toContain('TCP Port Was Refused');
  });

  it('maps HTTP 404/500 application error to CONTRASTING_SERVER_ERROR and Scenario HTTP-05', () => {
    const httpErrorInvestigation: InvestigationResult = {
      accepted: true,
      rejectedReason: null,
      target: createMockTarget(),
      ranAt: new Date().toISOString(),
      helperLabel: 'Local helper',
      checks: [
        createCheck('dns', 'passed', 'Resolved to 93.184.216.34'),
        createCheck('tcp', 'passed', 'TCP handshake completed'),
        createCheck('http', 'passed', 'Server returned HTTP 404', { statusCode: 404 }),
      ],
      pathStages: [],
      mappedScenarioId: null,
      mappedOutcome: null,
      educationalHeadline: '',
      educationalSummary: '',
      certaintyNote: '',
    };

    const evaluation = evaluationFromLiveInvestigation(httpErrorInvestigation);
    expect(evaluation.outcome).toBe('CONTRASTING_SERVER_ERROR');
    expect(evaluation.scenarioId).toBe('HTTP-05');
    expect(evaluation.title).toContain('Web Server Returned an Error Page');
    expect(evaluation.plainLanguageExplanation).toContain('network did its job completely');
  });

  it('explains full reachability without claiming device Wi-Fi is tested', () => {
    const allPassedInvestigation: InvestigationResult = {
      accepted: true,
      rejectedReason: null,
      target: createMockTarget(),
      ranAt: new Date().toISOString(),
      helperLabel: 'Local helper',
      checks: [
        createCheck('dns', 'passed', 'Resolved to 93.184.216.34'),
        createCheck('tcp', 'passed', 'TCP port 443 open'),
        createCheck('http', 'passed', 'Received HTTP 200 OK', { statusCode: 200 }),
      ],
      pathStages: [],
      mappedScenarioId: null,
      mappedOutcome: null,
      educationalHeadline: '',
      educationalSummary: '',
      certaintyNote: '',
    };

    const evaluation = evaluationFromLiveInvestigation(allPassedInvestigation);
    expect(evaluation.outcome).toBe('INSUFFICIENT_INFO');
    expect(evaluation.scenarioId).toBeNull();
    expect(evaluation.title).toContain('Helper Reached This Public Target');
    expect(evaluation.summary).toContain('does not prove the same URL works on your device');
  });
});
