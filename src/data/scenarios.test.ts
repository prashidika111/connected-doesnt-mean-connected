import { describe, expect, it } from 'vitest';
import {
  getScenarioById,
  getAllScenarios,
  getNetworkStagesForOutcome,
} from './scenarios';

describe('Educational Scenario Library Integrity', () => {
  it('contains exactly 7 distinct educational failure scenarios', () => {
    const scenarios = getAllScenarios();
    expect(scenarios).toHaveLength(7);

    const ids = scenarios.map((s) => s.scenarioId);
    expect(ids).toEqual([
      'DNS-01',
      'SRV-04',
      'HTTP-05',
      'GW-02',
      'LAN-03',
      'DNS-06',
      'IND-07',
    ]);
  });

  it('preserves the verified Cisco Packet Tracer DNS demonstration (DNS-01)', () => {
    const dns = getScenarioById('DNS-01');
    expect(dns).toBeDefined();
    expect(dns?.fileStatus.hasVerifiedPkt).toBe(true);
    expect(dns?.fileStatus.isCiscoProofOfConcept).toBe(true);
    expect(dns?.fileStatus.simulatedInBrowser).toBe(true);
    expect(dns?.fileStatus.suggestedFileName).toBe(
      'Scenario 1. DNS Failure Cisco Simulation.pkt'
    );
    expect(dns?.fileStatus.fileDirectory).toBe('Network Simulation (Cisco Demo)/');

    // Verify IP addresses match the verified single LAN 192.168.0.0/24 topology
    const laptop = dns?.baselineTopology.devices.find((d) => d.name === 'Client laptop');
    expect(laptop?.ipAddress).toBe('192.168.0.100');
    expect(laptop?.defaultGateway).toBe('192.168.0.1');
    expect(laptop?.dnsServer).toBe('192.168.0.10');

    const dnsServer = dns?.baselineTopology.devices.find((d) => d.name === 'DNS server');
    expect(dnsServer?.ipAddress).toBe('192.168.0.10');

    const webServer = dns?.baselineTopology.devices.find((d) => d.name === 'Web server');
    expect(webServer?.ipAddress).toBe('192.168.0.20');

    expect(dns?.faultInjection.configurationChange).toContain('192.168.0.99');
  });

  it('marks remaining 6 scenarios honestly as documented simulations without fabricated .pkt files', () => {
    const unverifiedIds = ['SRV-04', 'HTTP-05', 'GW-02', 'LAN-03', 'DNS-06', 'IND-07'];
    for (const id of unverifiedIds) {
      const scenario = getScenarioById(id);
      expect(scenario, `Scenario ${id} exists`).toBeDefined();
      expect(scenario?.fileStatus.hasVerifiedPkt).toBe(false);
      expect(scenario?.fileStatus.isCiscoProofOfConcept).toBe(false);
      expect(scenario?.fileStatus.simulatedInBrowser).toBe(true);
      expect(scenario?.fileStatus.suggestedFileName).toBeUndefined();
      expect(scenario?.fileStatus.fileDirectory).toBeUndefined();
      expect(scenario?.fileStatus.manualStepsRequired?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('ensures every scenario has complete educational metadata and study questions', () => {
    const scenarios = getAllScenarios();
    for (const s of scenarios) {
      expect(s.scenarioId).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.teachingGoal).toBeTruthy();
      expect(s.baselineTopology.devices.length).toBeGreaterThanOrEqual(2);
      expect(s.baselineTopology.connections.length).toBeGreaterThanOrEqual(1);
      expect(s.baselineBehavior.expectedBrowserOutput).toBeTruthy();
      expect(s.faultInjection.faultType).toBeTruthy();
      expect(s.failureBehavior.contrastInsight).toBeTruthy();
      expect(s.packetInspectionCheckpoints.length).toBeGreaterThanOrEqual(2);
      expect(s.studyQuestions && s.studyQuestions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns valid 5-stage network paths for all defined outcomes', () => {
    const outcomes = [
      'DNS_MATCH',
      'HTTP_SERVICE_MATCH',
      'CONTRASTING_SERVER_ERROR',
      'CONTRASTING_LOCAL_OFFLINE',
      'GATEWAY_MISCONFIG',
      'CAPTIVE_PORTAL',
      'CONTRASTING_GENERAL_OUTAGE',
      'INSUFFICIENT_INFO',
    ];

    for (const outcome of outcomes) {
      const stages = getNetworkStagesForOutcome(outcome);
      expect(stages).toHaveLength(5);
      const stageIds = stages.map((st) => st.id);
      expect(stageIds).toEqual(['device', 'local_link', 'gateway_router', 'dns', 'destination']);
    }
  });
});
