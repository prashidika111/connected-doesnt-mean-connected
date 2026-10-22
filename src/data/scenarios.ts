import { ScenarioExperiment, NetworkStage } from '../types/scenario';

export const DNS_01_SCENARIO: ScenarioExperiment = {
  scenarioId: 'DNS-01',
  title: 'DNS failure while direct IP access still works',
  category: 'Name resolution',
  teachingGoal:
    'Demonstrate that a client can reach a web server by its IP address while access by domain name fails when the configured DNS resolver is unreachable.',
  baselineTopology: {
    description:
      'A single local network using 192.168.0.0/24. The laptop, home router, DNS server and web server share the same LAN. The router LAN address is 192.168.0.1, the DNS server is 192.168.0.10, and the web server is 192.168.0.20.',
    devices: [
      {
        name: 'Client laptop',
        type: 'PC',
        ipAddress: '192.168.0.100',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        dnsServer: '192.168.0.10',
        role: 'Opens the test website by domain name or direct IP address.',
      },
      {
        name: 'Home router',
        type: 'Router',
        ipAddress: 'LAN: 192.168.0.1',
        subnetMask: '255.255.255.0',
        defaultGateway: 'Not applicable',
        role: 'Provides the local network gateway.',
      },
      {
        name: 'DNS server',
        type: 'Server',
        ipAddress: '192.168.0.10',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Contains the A record www.example.edu pointing to 192.168.0.20.',
      },
      {
        name: 'Web server',
        type: 'Server',
        ipAddress: '192.168.0.20',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Hosts the example website with HTTP and HTTPS enabled.',
      },
    ],
    connections: [
      'Client laptop connected to the HomeRouter LAN',
      'DNS server connected to the same 192.168.0.0/24 LAN',
      'Web server connected to the same 192.168.0.0/24 LAN',
    ],
  },
  baselineBehavior: {
    userAction: 'Open the browser on the laptop and visit http://www.example.edu.',
    expectedDnsQuery:
      'The laptop asks DNS server 192.168.0.10 for the address of www.example.edu. The configured A record returns 192.168.0.20.',
    expectedBrowserOutput:
      'The website loads. Opening http://192.168.0.20 directly also reaches the web server.',
    status: 'Baseline working',
  },
  faultInjection: {
    faultType: 'Incorrect DNS server address',
    configurationChange:
      'On the laptop, change the DNS server address from 192.168.0.10 to 192.168.0.99.',
    affectedComponent: 'The laptop DNS resolver setting',
  },
  failureBehavior: {
    userAction: 'Try the domain name again, then try the direct IP address.',
    observedDnsResult:
      'The laptop sends DNS queries to 192.168.0.99. No DNS server responds at that address.',
    observedBrowserOutput:
      'The domain name does not resolve, so the browser cannot find the server by name.',
    observedPingResult:
      'Direct access to 192.168.0.20 should still work while the web service and local network remain available.',
    contrastInsight:
      'This demonstrates that domain name resolution and IP connectivity are different stages. A DNS failure does not by itself prove the web server or local network is down.',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'DNS',
      event: 'The laptop requests the website address',
      whatToObserve:
        'In Simulation Mode, inspect the DNS request sent to 192.168.0.10 in the baseline state.',
    },
    {
      step: 2,
      protocol: 'DNS',
      event: 'The configured resolver does not answer',
      whatToObserve:
        'After changing the laptop DNS setting to 192.168.0.99, observe that the DNS request receives no useful reply.',
    },
    {
      step: 3,
      protocol: 'HTTP',
      event: 'Domain access fails before a web request can be addressed',
      whatToObserve:
        'The browser cannot use the domain name until it has an IP address. Try the web server IP directly to compare the result.',
    },
    {
      step: 4,
      protocol: 'HTTP',
      event: 'Direct IP access provides a contrast',
      whatToObserve:
        'Open http://192.168.0.20 directly. If the web service remains enabled, this should still reach the server.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: true,
    suggestedFileName: 'Scenario 1. DNS Failure Cisco Simulation.pkt',
    fileDirectory: 'Network Simulation (Cisco Demo)/',
    manualStepsRequired: [
      'Open Scenario 1. DNS Failure Cisco Simulation.pkt in Cisco Packet Tracer.',
      'Confirm the laptop uses IP 192.168.0.100, gateway 192.168.0.1 and DNS 192.168.0.10.',
      'Confirm the DNS A record maps www.example.edu to 192.168.0.20.',
      'Check that the domain name and direct IP address both work in the baseline state.',
      'Change the laptop DNS address to 192.168.0.99 and repeat both checks.',
      'Restore the laptop DNS address to 192.168.0.10 after the demonstration.',
    ],
  },
};

export const SRV_04_SCENARIO: ScenarioExperiment = {
  scenarioId: 'SRV-04',
  title: 'HTTP Service Down While IP and DNS Still Work',
  category: 'Transport / Application (TCP 80)',
  teachingGoal:
    'Show that ping and DNS success do not mean a website will load. If the HTTP daemon is stopped, the host is alive at Layer 3 but TCP port 80 refuses or ignores the browser.',
  baselineTopology: {
    description:
      'This is a conceptual service failure scenario. It is not represented by the supplied DNS Packet Tracer file.',
    devices: [
      {
        name: 'Client-PC (Laptop)',
        type: 'PC',
        ipAddress: '192.168.0.100',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        dnsServer: '192.168.0.10',
        role: 'End-user client requesting http://www.example.edu',
      },
      {
        name: 'Local-Switch (2960)',
        type: 'Switch',
        ipAddress: 'VLAN 1: Unmanaged',
        subnetMask: '255.255.255.0',
        defaultGateway: 'N/A',
        role: 'Local Layer 2 forwarding',
      },
      {
        name: 'DNS-Server',
        type: 'Server',
        ipAddress: '192.168.0.10',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'A record www.example.edu → 192.168.0.20 remains correct.',
      },
      {
        name: 'Gateway-Router (1941/2901)',
        type: 'Router',
        ipAddress: 'G0/0: LAN: 192.168.0.1',
        subnetMask: '255.255.255.0',
        defaultGateway: 'N/A',
        role: 'Interconnects 192.168.0.0/24 and 192.168.0.0/24',
      },
      {
        name: 'Web-Server (HTTP)',
        type: 'Server',
        ipAddress: '192.168.0.20',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'HTTP service is ON in baseline and turned OFF in the fault state.',
      },
    ],
    connections: [
      'Client-PC FastEthernet0 <---> Local-Switch FastEthernet0/1',
      'DNS-Server FastEthernet0 <---> Local-Switch FastEthernet0/2',
      'Local-Switch GigabitEthernet0/1 <---> Gateway-Router GigabitEthernet0/0',
      'Gateway-Router GigabitEthernet0/1 <---> Web-Server FastEthernet0',
    ],
  },
  baselineBehavior: {
    userAction: 'On Client-PC, browse to http://www.example.edu',
    expectedDnsQuery:
      'UDP/53 to 192.168.0.10 returns 192.168.0.20. Client then completes TCP handshake to 192.168.0.20:80.',
    expectedBrowserOutput: 'Educational welcome page loads.',
    status: 'BASELINE WORKING (Control State)',
  },
  faultInjection: {
    faultType: 'HTTP daemon stopped / port 80 closed',
    configurationChange:
      'On Web-Server → Services → HTTP → turn HTTP service OFF (leave HTTPS off as well). Do not change DNS records or client DNS settings.',
    affectedComponent: 'Web-Server TCP port 80 listener',
  },
  failureBehavior: {
    userAction: 'Browse again to http://www.example.edu and ping 192.168.0.20',
    observedDnsResult: 'nslookup www.example.edu still returns 192.168.0.20.',
    observedBrowserOutput:
      'Browser hangs or reports connection refused / timed out. Page does not load.',
    observedPingResult:
      'ping 192.168.0.20 succeeds. ping www.example.edu also succeeds because DNS still works. Only HTTP fails.',
    contrastInsight:
      'Layer 3 reachability and DNS can both be perfect while Layer 4/7 HTTP is down. “Connected” and even “ping works” are not the same as “the website works.”',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'DNS (UDP)',
      event: 'Name lookup still succeeds',
      whatToObserve:
        'DNS query and response for www.example.edu complete. The client now has 192.168.0.20.',
    },
    {
      step: 2,
      protocol: 'TCP',
      event: 'SYN toward port 80',
      whatToObserve:
        'Client sends TCP SYN to 192.168.0.20:80. With HTTP off, Packet Tracer typically shows the server returning RST (connection refused) or no SYN-ACK.',
    },
    {
      step: 3,
      protocol: 'HTTP',
      event: 'No HTTP GET',
      whatToObserve:
        'Because the handshake never completes, no HTTP GET is issued. Contrast with DNS-01, where no SYN is sent at all because no IP was known.',
    },
    {
      step: 4,
      protocol: 'ICMP',
      event: 'Direct IP ping still works',
      whatToObserve:
        'ICMP echo to 192.168.0.20 succeeds, proving the fault is not a missing route.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: false,
    suggestedFileName: 'SRV-04.pkt',
    fileDirectory: 'simulations/',
    manualStepsRequired: [
      'Start from the DNS-01 working baseline (correct DNS server IP 192.168.0.10, HTTP ON).',
      'On Web-Server, disable the HTTP service only.',
      'Verify: nslookup www.example.edu → 192.168.0.20; ping 192.168.0.20 succeeds; browser to http://www.example.edu fails.',
      'Save as SRV-04.pkt under simulations/ if you want a local copy. This app does not drive Packet Tracer by API.',
    ],
  },
};

export const SCENARIO_LIBRARY: Record<string, ScenarioExperiment> = {
  'DNS-01': DNS_01_SCENARIO,
  'SRV-04': SRV_04_SCENARIO,
};

export const getScenarioById = (id: string): ScenarioExperiment | null =>
  SCENARIO_LIBRARY[id] ?? null;

export const getNetworkStagesForOutcome = (
  outcome: string
): NetworkStage[] => {
  switch (outcome) {
    case 'DNS_MATCH':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'success',
          description: 'Network interface card is enabled, assigned IP 192.168.0.100 via static or DHCP.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi Fi / Ethernet Switch Link',
          status: 'success',
          description: 'Layer 1 physical link is UP. Layer 2 Ethernet frames are transmitting properly.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'success',
          description: 'Direct IP packets and ping can reach external IP subnets successfully.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation (UDP 53)',
          status: 'error',
          description:
            'FAILS HERE: Cannot translate "example.edu" into an IP address. Query times out or resolver unreachable.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'bypassed',
          description:
            'Never reached because the browser could not determine which IP address to contact.',
        },
      ];

    case 'CONTRASTING_LOCAL_OFFLINE':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'warning',
          description: 'Adapter reports disconnected or searching for signal.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi Fi / Ethernet Switch Link',
          status: 'error',
          description: 'FAILS HERE: Physical/Data Link failure. No association or link carrier detected.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'untested',
          description: 'Unreachable due to local link disconnection.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'untested',
          description: 'Not reached because device cannot access local router.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'untested',
          description: 'Unreachable.',
        },
      ];

    case 'HTTP_SERVICE_MATCH':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'success',
          provenance: 'conceptual',
          description: 'Client is assumed up from reported or helper-adjacent evidence. Not a NIC scan.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi Fi / Ethernet Switch Link',
          status: 'success',
          provenance: 'conceptual',
          description: 'Local link is conceptually working in this educational pattern.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'success',
          provenance: 'inferred',
          description: 'Other destinations or DNS success imply some forwarding path exists. Not a traceroute.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation (UDP 53)',
          status: 'success',
          provenance: 'inferred',
          description: 'A single site timeout after a hostname is used typically means DNS already returned an IP (or would have shown a name-resolution error).',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'error',
          provenance: 'simulated',
          description:
            'FAILS HERE in scenario SRV-04: TCP/HTTP to the web daemon does not complete while the host IP remains pingable in the lab.',
        },
      ];

    case 'CONTRASTING_SERVER_ERROR':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'success',
          description: 'Operating system and network interface operating normally.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi Fi / Ethernet Switch Link',
          status: 'success',
          description: 'Local connection is fully functional.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'success',
          description: 'Packets routed across Internet to destination host.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'success',
          description: 'SUCCESS: The domain name was resolved into an IP address.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'error',
          description:
            'FAILS HERE: The destination web server replied with an application error (e.g. 404/500). The network path worked!',
        },
      ];

    default:
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'untested',
          description: 'Device state unknown or inconclusive.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi Fi / Ethernet Switch Link',
          status: 'untested',
          description: 'Local link state uncertain.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'untested',
          description: 'Routing state uncertain.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'untested',
          description: 'DNS resolution status unverified.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'untested',
          description: 'Destination reachability uncertain.',
        },
      ];
  }
};
