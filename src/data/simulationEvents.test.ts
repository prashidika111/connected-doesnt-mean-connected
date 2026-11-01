import { describe, expect, it } from 'vitest';
import { getInteractiveScenarioData, SCENARIO_SIMULATIONS } from './simulationEvents';
import { getAllScenarios, getScenarioById } from './scenarios';

describe('Interactive Browser Simulation Event Engine', () => {
  const EXPECTED_SCENARIO_IDS = [
    'DNS-01',
    'SRV-04',
    'HTTP-05',
    'GW-02',
    'LAN-03',
    'DNS-06',
    'IND-07',
  ];

  it('1. Catalogue and simulation definitions contain exactly the expected seven IDs', () => {
    const catalogScenarios = getAllScenarios();
    const catalogIds = catalogScenarios.map((s) => s.scenarioId);
    expect(catalogIds).toEqual(EXPECTED_SCENARIO_IDS);

    const simulationIds = Object.keys(SCENARIO_SIMULATIONS);
    expect(simulationIds.sort()).toEqual([...EXPECTED_SCENARIO_IDS].sort());
  });

  it('2. Each ID resolves to its own distinct simulation scenario', () => {
    for (const id of EXPECTED_SCENARIO_IDS) {
      const simData = getInteractiveScenarioData(id);
      expect(simData, `Scenario data for ${id} should exist`).not.toBeNull();
      expect(simData?.scenarioId).toBe(id);

      const catalogData = getScenarioById(id);
      expect(catalogData, `Catalog data for ${id} should exist`).toBeDefined();
      expect(catalogData?.scenarioId).toBe(id);
    }
  });

  it('3. An unknown or misspelled ID returns null and does NOT silently fall back to DNS-01', () => {
    expect(getInteractiveScenarioData('UNKNOWN-99')).toBeNull();
    expect(getInteractiveScenarioData('dns-01')).toBeNull();
    expect(getInteractiveScenarioData('')).toBeNull();
    expect(getInteractiveScenarioData('INVALID_SCENARIO')).toBeNull();
  });

  it('4. All referenced event nodes and paths are valid in every scenario', () => {
    for (const id of EXPECTED_SCENARIO_IDS) {
      const data = getInteractiveScenarioData(id)!;
      const validNodeIds = new Set(data.nodes.map((n) => n.id));

      // Check all links reference valid nodes
      for (const link of data.links) {
        expect(
          validNodeIds.has(link.sourceId),
          `Scenario ${id}: Link sourceId '${link.sourceId}' must exist in nodes`
        ).toBe(true);
        expect(
          validNodeIds.has(link.targetId),
          `Scenario ${id}: Link targetId '${link.targetId}' must exist in nodes`
        ).toBe(true);
      }

      // Check all baseline events
      for (const ev of data.baselineEvents) {
        expect(
          validNodeIds.has(ev.fromNodeId),
          `Scenario ${id} baseline #${ev.step}: fromNodeId '${ev.fromNodeId}' must exist in nodes`
        ).toBe(true);
        expect(
          validNodeIds.has(ev.toNodeId),
          `Scenario ${id} baseline #${ev.step}: toNodeId '${ev.toNodeId}' must exist in nodes`
        ).toBe(true);
        for (const hop of ev.pathNodeIds) {
          expect(
            validNodeIds.has(hop),
            `Scenario ${id} baseline #${ev.step}: path hop '${hop}' must exist in nodes`
          ).toBe(true);
        }
      }

      // Check all fault events
      for (const ev of data.faultEvents) {
        expect(
          validNodeIds.has(ev.fromNodeId),
          `Scenario ${id} fault #${ev.step}: fromNodeId '${ev.fromNodeId}' must exist in nodes`
        ).toBe(true);
        expect(
          validNodeIds.has(ev.toNodeId),
          `Scenario ${id} fault #${ev.step}: toNodeId '${ev.toNodeId}' must exist in nodes`
        ).toBe(true);
        for (const hop of ev.pathNodeIds) {
          expect(
            validNodeIds.has(hop),
            `Scenario ${id} fault #${ev.step}: path hop '${hop}' must exist in nodes`
          ).toBe(true);
        }
      }

      // Check direct IP events if present
      if (data.directIpEvents) {
        for (const ev of data.directIpEvents) {
          expect(
            validNodeIds.has(ev.fromNodeId),
            `Scenario ${id} direct IP #${ev.step}: fromNodeId '${ev.fromNodeId}' must exist in nodes`
          ).toBe(true);
          expect(
            validNodeIds.has(ev.toNodeId),
            `Scenario ${id} direct IP #${ev.step}: toNodeId '${ev.toNodeId}' must exist in nodes`
          ).toBe(true);
          for (const hop of ev.pathNodeIds) {
            expect(
              validNodeIds.has(hop),
              `Scenario ${id} direct IP #${ev.step}: path hop '${hop}' must exist in nodes`
            ).toBe(true);
          }
        }
      }
    }
  });

  it('5. Every scenario has usable topology links and baseline/fault events', () => {
    for (const id of EXPECTED_SCENARIO_IDS) {
      const data = getInteractiveScenarioData(id)!;
      expect(data.nodes.length, `Scenario ${id} nodes count`).toBeGreaterThanOrEqual(2);
      expect(data.links.length, `Scenario ${id} links count`).toBeGreaterThanOrEqual(1);
      expect(data.baselineEvents.length, `Scenario ${id} baseline events count`).toBeGreaterThanOrEqual(2);
      expect(data.faultEvents.length, `Scenario ${id} fault events count`).toBeGreaterThanOrEqual(2);
      expect(data.faultDescription, `Scenario ${id} fault description`).toBeTruthy();
      expect(data.baselineSummary, `Scenario ${id} baseline summary`).toBeTruthy();
      expect(data.failureSummary, `Scenario ${id} failure summary`).toBeTruthy();
      expect(data.contrastInsight, `Scenario ${id} contrast insight`).toBeTruthy();
    }
  });

  it('6 & 7. DNS-01: Baseline DNS/TCP/HTTP succeeds, fault halts before TCP, and direct IP bypasses DNS', () => {
    const dns01 = getInteractiveScenarioData('DNS-01')!;
    expect(dns01.scenarioId).toBe('DNS-01');

    // Baseline sequence
    const baseline = dns01.baselineEvents;
    expect(baseline[0].protocol).toBe('DNS');
    expect(baseline[0].outcome).toBe('success');
    const tcpStep = baseline.find((e) => e.protocol === 'TCP');
    expect(tcpStep?.outcome).toBe('success');
    const httpStep = baseline.find((e) => e.protocol === 'HTTP');
    expect(httpStep?.outcome).toBe('success');

    // Fault sequence: resolver misconfigured, times out, no TCP SYN constructed
    const fault = dns01.faultEvents;
    expect(fault[0].protocol).toBe('DNS');
    const timeoutStep = fault.find((e) => e.outcome === 'timeout');
    expect(timeoutStep).toBeDefined();
    const finalFaultStep = fault[fault.length - 1];
    expect(finalFaultStep.outcome).toBe('failure');
    expect(finalFaultStep.payloadDetail).toContain('No TCP SYN');

    // Direct IP: skips DNS entirely and completes TCP/HTTP
    expect(dns01.directIpEvents).toBeDefined();
    const directIp = dns01.directIpEvents!;
    expect(directIp[0].outcome).toBe('bypassed');
    expect(directIp[0].protocol).not.toBe('DNS');
    const directIpConnect = directIp.find((e) => e.protocol === 'TCP' || e.protocol === 'HTTP');
    expect(directIpConnect?.outcome).toBe('success');
  });

  it('8. HTTP-05: Returns an HTTP 500 error after a successful TCP handshake and HTTP request', () => {
    const http05 = getInteractiveScenarioData('HTTP-05')!;
    expect(http05.scenarioId).toBe('HTTP-05');

    const fault = http05.faultEvents;
    // Step 1: DNS resolution succeeds
    expect(fault[0].protocol).toBe('DNS');
    expect(fault[0].outcome).toBe('success');

    // Step 2: TCP handshake succeeds
    expect(fault[1].protocol).toBe('TCP');
    expect(fault[1].outcome).toBe('success');

    // Step 3: HTTP GET delivered across network
    expect(fault[2].protocol).toBe('HTTP');
    expect(fault[2].outcome).toBe('success');
    expect(fault[2].summary).toContain('GET');

    // Step 4: Server application returns HTTP 500
    const errStep = fault[3];
    expect(errStep.protocol).toBe('HTTP');
    expect(errStep.summary).toContain('500');
    expect(errStep.outcome).toBe('failure');
  });

  it('9. SRV-04: TCP connection is refused (RST) and no HTTP request is sent', () => {
    const srv04 = getInteractiveScenarioData('SRV-04')!;
    expect(srv04.scenarioId).toBe('SRV-04');

    const fault = srv04.faultEvents;
    // DNS succeeds
    const dnsStep = fault.find((e) => e.protocol === 'DNS');
    expect(dnsStep?.outcome).toBe('success');

    // ICMP Ping succeeds (host kernel online)
    const pingStep = fault.find((e) => e.protocol === 'ICMP');
    expect(pingStep?.outcome).toBe('success');

    // TCP connection refused
    const rstStep = fault.find((e) => e.summary.includes('ECONNREFUSED') || e.summary.includes('RST'));
    expect(rstStep).toBeDefined();
    expect(rstStep?.outcome).toBe('failure');

    // Verify no HTTP request is ever sent
    const httpGet = fault.find((e) => e.protocol === 'HTTP' && e.summary.includes('GET'));
    expect(httpGet).toBeUndefined();

    // Final event confirms halt before HTTP
    const finalStep = fault[fault.length - 1];
    expect(finalStep.summary).toContain('ERR_CONNECTION_REFUSED');
  });

  it('10. GW-02: Local subnet works directly via ARP, while off-subnet access fails without valid gateway', () => {
    const gw02 = getInteractiveScenarioData('GW-02')!;
    expect(gw02.scenarioId).toBe('GW-02');

    const fault = gw02.faultEvents;
    // Local subnet communication succeeds
    expect(fault[0].protocol).toBe('ICMP');
    expect(fault[0].outcome).toBe('success');
    expect(fault[0].summary).toContain('192.168.0.10');

    // Off-subnet attempt triggers gateway ARP and fails
    const arpTimeout = fault.find((e) => e.protocol === 'ARP' && e.outcome === 'timeout');
    expect(arpTimeout).toBeDefined();

    // Destination host unreachable locally
    const droppedLocally = fault[fault.length - 1];
    expect(droppedLocally.outcome).toBe('failure');
    expect(droppedLocally.summary).toContain('Destination Host Unreachable');
  });

  it('11. LAN-03: Models primary DHCP lease failure with active physical link and APIPA fallback', () => {
    const lan03 = getInteractiveScenarioData('LAN-03')!;
    expect(lan03.scenarioId).toBe('LAN-03');

    // Physical link is connected (UP)
    const clientLink = lan03.links.find((l) => l.sourceId === 'client');
    expect(clientLink?.status).toBe('up');

    const fault = lan03.faultEvents;
    // Step 1: DHCP Discover sent across active link
    expect(fault[0].protocol).toBe('DHCP');
    expect(fault[0].summary).toContain('DHCPDISCOVER');

    // Step 2: No offer / service inactive
    expect(fault[1].protocol).toBe('DHCP');
    expect(fault[1].outcome).toBe('timeout');

    // Step 4: APIPA link-local assignment (RFC 3927)
    const apipaStep = fault.find((e) => e.summary.includes('169.254'));
    expect(apipaStep).toBeDefined();
    expect(apipaStep?.payloadDetail).toContain('RFC 3927');

    // Step 5: Router ping unreachable due to subnet mismatch & missing gateway
    const finalStep = fault[fault.length - 1];
    expect(finalStep.outcome).toBe('failure');
    expect(finalStep.summary).toContain('Destination Host Unreachable');
  });

  it('12. DNS-06: Local Wi-Fi associates and HTTP requests are intercepted with HTTP 302 redirect to portal', () => {
    const dns06 = getInteractiveScenarioData('DNS-06')!;
    expect(dns06.scenarioId).toBe('DNS-06');

    const fault = dns06.faultEvents;
    // Step 1: Wi-Fi association & DHCP succeed
    expect(fault[0].protocol).toBe('DHCP');
    expect(fault[0].outcome).toBe('success');

    // Step 2: Client attempts HTTP request to destination
    expect(fault[1].protocol).toBe('HTTP');
    expect(fault[1].summary).toContain('GET');

    // Step 3: Gateway intercepts and returns HTTP 302 redirect
    const redirectStep = fault.find((e) => e.summary.includes('302 Found'));
    expect(redirectStep).toBeDefined();
    expect(redirectStep?.outcome).toBe('failure');
    expect(redirectStep?.summary).toContain('Location: http://192.168.1.2/login.html');

    // Step 4: Splash login page renders
    const splashStep = fault.find((e) => e.summary.includes('Splash Login Page'));
    expect(splashStep).toBeDefined();
    expect(splashStep?.outcome).toBe('bypassed');
  });

  it('13. IND-07: Local router ping succeeds while upstream WAN link failure drops external transit', () => {
    const ind07 = getInteractiveScenarioData('IND-07')!;
    expect(ind07.scenarioId).toBe('IND-07');

    // Local link to router is UP
    const localLink = ind07.links.find((l) => l.id === 'l1');
    expect(localLink?.status).toBe('up');

    // WAN uplink to ISP is marked down
    const wanLink = ind07.links.find((l) => l.id === 'l2');
    expect(wanLink?.status).toBe('down');

    const fault = ind07.faultEvents;
    // Step 1: Ping to local router 192.168.0.1 succeeds (0% loss)
    expect(fault[0].protocol).toBe('ICMP');
    expect(fault[0].outcome).toBe('success');
    expect(fault[0].summary).toContain('192.168.0.1');

    // Step 2 & 3: External request to router returns ICMP Destination Host Unreachable
    const unreachableStep = fault[fault.length - 1];
    expect(unreachableStep.protocol).toBe('ICMP');
    expect(unreachableStep.outcome).toBe('failure');
    expect(unreachableStep.summary).toContain('Destination Host Unreachable');
  });
});
