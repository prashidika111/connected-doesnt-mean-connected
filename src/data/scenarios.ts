import { ScenarioExperiment, NetworkStage } from '../types/scenario';

export const DNS_01_SCENARIO: ScenarioExperiment = {
  scenarioId: 'DNS-01',
  title: 'DNS Failure While Direct IP Access Still Works',
  category: 'Name Resolution (UDP 53)',
  teachingGoal:
    'Demonstrate that a client can reach a web server by its direct IP address while access by domain name fails when the configured DNS resolver is unreachable.',
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
        name: 'HomeRouter-PT-AC',
        type: 'Router',
        ipAddress: 'LAN: 192.168.0.1',
        subnetMask: '255.255.255.0',
        defaultGateway: 'Not applicable',
        role: 'Provides the local network gateway and default route.',
      },
      {
        name: 'DNS server',
        type: 'Server',
        ipAddress: '192.168.0.10',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Contains the authoritative A record www.example.edu pointing to 192.168.0.20.',
      },
      {
        name: 'Web server',
        type: 'Server',
        ipAddress: '192.168.0.20',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Hosts the example educational website with HTTP and HTTPS enabled.',
      },
    ],
    connections: [
      'Client laptop connected to HomeRouter LAN via FastEthernet',
      'DNS server connected to HomeRouter LAN (192.168.0.10)',
      'Web server connected to HomeRouter LAN (192.168.0.20)',
    ],
  },
  baselineBehavior: {
    userAction: 'Open the browser on the laptop and visit http://www.example.edu.',
    expectedDnsQuery:
      'The laptop queries DNS server 192.168.0.10 for www.example.edu. The configured A record returns 192.168.0.20.',
    expectedBrowserOutput:
      'The website loads successfully. Opening http://192.168.0.20 directly in the browser also loads the web server page.',
    status: 'Baseline working (Control state)',
  },
  faultInjection: {
    faultType: 'Incorrect DNS server address configured on host',
    configurationChange:
      'On the laptop Desktop -> IP Configuration, change the DNS server IP from 192.168.0.10 to 192.168.0.99 (a non-existent host). Leave all other settings intact.',
    affectedComponent: 'Laptop operating system DNS resolver configuration',
  },
  failureBehavior: {
    userAction: 'Attempt to browse to http://www.example.edu, then test direct IP reachability using ping 192.168.0.20.',
    observedDnsResult:
      'The laptop sends DNS queries to 192.168.0.99. No device responds, resulting in DNS query timeout (Server IP address could not be found).',
    observedBrowserOutput:
      'The web browser fails immediately with a DNS resolution error before any TCP connection is attempted.',
    observedPingResult:
      'Direct IP ping (ping 192.168.0.20) and direct HTTP access (http://192.168.0.20) succeed completely with 0% packet loss.',
    contrastInsight:
      'This proves that domain name resolution and Layer 3 IP reachability are separate network stages. A DNS failure breaks human-readable hostnames while the underlying network and web server remain fully operational.',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'DNS (UDP)',
      event: 'Laptop queries authoritative resolver',
      whatToObserve:
        'In Simulation Mode, observe the outgoing DNS query packet sent to UDP port 53 on 192.168.0.10 and verify the resolved answer payload in baseline.',
    },
    {
      step: 2,
      protocol: 'DNS (UDP)',
      event: 'Resolver query sent to invalid IP',
      whatToObserve:
        'After fault injection, observe UDP query directed to 192.168.0.99. No ARP reply or DNS response returns, and the query repeats before timing out.',
    },
    {
      step: 3,
      protocol: 'TCP',
      event: 'No TCP SYN is ever generated for domain target',
      whatToObserve:
        'Notice that because DNS resolution failed, the client operating system cannot construct a TCP SYN packet because the destination IP remains unknown.',
    },
    {
      step: 4,
      protocol: 'ICMP / HTTP',
      event: 'Direct IP communication bypasses DNS stage',
      whatToObserve:
        'Opening http://192.168.0.20 generates an immediate ARP/TCP SYN directly to the server, completely skipping UDP port 53.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: true,
    isCiscoProofOfConcept: true,
    simulatedInBrowser: true,
    suggestedFileName: 'Scenario 1. DNS Failure Cisco Simulation.pkt',
    fileDirectory: 'Network Simulation (Cisco Demo)/',
    manualStepsRequired: [
      'Open Scenario 1. DNS Failure Cisco Simulation.pkt in Cisco Packet Tracer.',
      'Verify the baseline topology: Laptop (192.168.0.100), Router (192.168.0.1), DNS (192.168.0.10), Web Server (192.168.0.20).',
      'Confirm DNS service is ON on the DNS Server and has an A Record: www.example.edu -> 192.168.0.20.',
      'On Client Laptop, open Web Browser and navigate to http://www.example.edu to verify baseline operation.',
      'Inject fault: Click Laptop -> Desktop -> IP Configuration -> change DNS Server to 192.168.0.99.',
      'In Command Prompt, run nslookup www.example.edu (fails) and ping 192.168.0.20 (succeeds).',
      'Restore DNS Server to 192.168.0.10 after completing observations.',
    ],
  },
  studyQuestions: [
    {
      question: 'Why does ping 192.168.0.20 succeed while ping www.example.edu fails in the fault state?',
      answer:
        'ping 192.168.0.20 uses a direct Layer 3 IP address and does not require DNS. ping www.example.edu requires the OS to resolve the domain name via UDP port 53 first. Since 192.168.0.99 does not exist, name resolution fails and the ICMP echo request is never sent.',
      networkingConcept: 'Layer 7 Name Resolution vs. Layer 3 Unicast Forwarding',
    },
    {
      question: 'Does the DNS failure indicate that the Web Server daemon has crashed?',
      answer:
        'No. The Web Server daemon is running normally on 192.168.0.20:80. The failure is confined to the client resolver stage.',
      networkingConcept: 'Decoupling of Application Servers from Naming Infrastructure',
    },
    {
      question: 'In the TCP/IP protocol stack, where does DNS operate relative to TCP and IP?',
      answer:
        'DNS operates at the Application Layer (Layer 7 / Layer 5-7), typically over UDP port 53. It must complete before a Transport Layer (TCP) session can be addressed and initiated.',
      networkingConcept: 'Protocol Stack Dependency Ordering',
    },
  ],
};

export const SRV_04_SCENARIO: ScenarioExperiment = {
  scenarioId: 'SRV-04',
  title: 'HTTP Service Down While IP and DNS Still Work',
  category: 'Transport / Application (TCP 80/443)',
  teachingGoal:
    'Show that ping and DNS success do not mean a website will load. If the HTTP daemon is stopped or port 80/443 is closed, the host is alive at Layer 3 but TCP connection is refused or ignored.',
  baselineTopology: {
    description:
      'Standard local network with client, DNS server, and web server. Client uses 192.168.0.100, DNS server is 192.168.0.10, and web server is 192.168.0.20.',
    devices: [
      {
        name: 'Client-Laptop',
        type: 'PC',
        ipAddress: '192.168.0.100',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        dnsServer: '192.168.0.10',
        role: 'End-user client requesting http://www.example.edu',
      },
      {
        name: 'Local-Switch',
        type: 'Switch',
        ipAddress: 'VLAN 1: 192.168.0.2',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Layer 2 Ethernet switching across the LAN',
      },
      {
        name: 'DNS-Server',
        type: 'Server',
        ipAddress: '192.168.0.10',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Authoritative DNS server mapping www.example.edu to 192.168.0.20',
      },
      {
        name: 'Gateway-Router',
        type: 'Router',
        ipAddress: 'LAN: 192.168.0.1',
        subnetMask: '255.255.255.0',
        defaultGateway: 'Not applicable',
        role: 'Default gateway router',
      },
      {
        name: 'Web-Server',
        type: 'Server',
        ipAddress: '192.168.0.20',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Hosts HTTP service on port 80. Stopped during fault injection.',
      },
    ],
    connections: [
      'Client-Laptop FastEthernet0 <-> Local-Switch FastEthernet0/1',
      'DNS-Server FastEthernet0 <-> Local-Switch FastEthernet0/2',
      'Web-Server FastEthernet0 <-> Local-Switch FastEthernet0/3',
      'Gateway-Router GigabitEthernet0/0 <-> Local-Switch GigabitEthernet0/1',
    ],
  },
  baselineBehavior: {
    userAction: 'On Client-Laptop, browse to http://www.example.edu and ping 192.168.0.20.',
    expectedDnsQuery:
      'DNS query to 192.168.0.10 returns 192.168.0.20. Client successfully completes TCP 3-way handshake to 192.168.0.20:80.',
    expectedBrowserOutput: 'Web page loads with HTTP 200 status code.',
    status: 'Baseline working (Control state)',
  },
  faultInjection: {
    faultType: 'HTTP daemon stopped / port 80 closed',
    configurationChange:
      'On Web-Server -> Services -> HTTP, toggle HTTP to OFF (leave HTTPS OFF as well). Do not change DNS records, IP addresses, or routing.',
    affectedComponent: 'Web-Server Layer 4/7 TCP port 80 listener',
  },
  failureBehavior: {
    userAction: 'Browse to http://www.example.edu, run nslookup www.example.edu, and run ping 192.168.0.20.',
    observedDnsResult: 'nslookup www.example.edu returns 192.168.0.20 with zero errors.',
    observedBrowserOutput:
      'Browser displays connection refused (ERR_CONNECTION_REFUSED) or connection timed out.',
    observedPingResult:
      'ping 192.168.0.20 returns 4/4 echo replies with <1ms latency. Ping to www.example.edu also succeeds.',
    contrastInsight:
      'Layer 3 reachability (ICMP) and Layer 7 name resolution (DNS) can both be 100% operational while the web service is down. Being able to ping a server does not prove the website works.',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'DNS (UDP)',
      event: 'Name lookup completes successfully',
      whatToObserve:
        'Client sends DNS query to 192.168.0.10:53 and receives an A record containing 192.168.0.20.',
    },
    {
      step: 2,
      protocol: 'TCP',
      event: 'Client sends TCP SYN to port 80',
      whatToObserve:
        'Client sends TCP SYN packet to 192.168.0.20:80. Because the daemon is stopped, the server OS sends back a TCP RST (Reset) or drops the packet.',
    },
    {
      step: 3,
      protocol: 'HTTP',
      event: 'No HTTP request can be transmitted',
      whatToObserve:
        'Because the TCP three-way handshake fails to complete, the client application never sends an HTTP GET request.',
    },
    {
      step: 4,
      protocol: 'ICMP',
      event: 'Direct ping succeeds normally',
      whatToObserve:
        'ICMP echo requests and replies flow between laptop and server, confirming bidirectional Layer 3 connectivity.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: false,
    isCiscoProofOfConcept: false,
    simulatedInBrowser: true,
    manualStepsRequired: [
      'Open the SRV-04 interactive simulation in your web browser.',
      'In "Baseline Working" mode, observe normal DNS resolution, TCP three-way handshake on port 80, and HTTP 200 OK delivery.',
      'Switch to "Injected Fault" mode to simulate a stopped web service daemon on Target-Web-Server.',
      'Step through the timeline to observe that DNS and ICMP ping succeed, but the TCP SYN to port 80 receives a TCP RST/ACK refusal (ECONNREFUSED) with zero HTTP payload transmitted.',
      'Click the Target-Web-Server node on the topology to inspect its closed port state.',
    ],
  },
  studyQuestions: [
    {
      question: 'Why does ICMP ping work when the web server is down?',
      answer:
        'ICMP operates directly above IP at Layer 3 (RFC 792) and is processed by the host operating system kernel, independent of any user-space application daemons like Apache or Nginx.',
      networkingConcept: 'Layer 3 Control Protocol vs. Layer 4/7 Application Services',
    },
    {
      question: 'What is the diagnostic difference between a TCP RST response and a TCP SYN timeout?',
      answer:
        'A TCP RST (Reset) indicates that packets reached the destination host, but no socket was listening on that port (closed port). A timeout indicates that the SYN was either silently dropped by a firewall or lost in transit.',
      networkingConcept: 'TCP Handshake Negotiation and Rejection Semantics',
    },
  ],
};

export const HTTP_05_SCENARIO: ScenarioExperiment = {
  scenarioId: 'HTTP-05',
  title: 'Application Server Error (HTTP 500 / 404) with Full Network Reachability',
  category: 'Application Layer (HTTP Status Codes)',
  teachingGoal:
    'Demonstrate that receiving an HTTP error code (such as 404 Not Found or 500 Internal Server Error) proves that the entire physical, link, routing, DNS, and TCP transport pipeline worked completely.',
  baselineTopology: {
    description:
      'Standard client-server architecture. Client accesses a functional web server delivering valid HTTP 200 OK responses.',
    devices: [
      {
        name: 'Client-PC',
        type: 'PC',
        ipAddress: '192.168.0.100',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        dnsServer: '192.168.0.10',
        role: 'Client requesting web resources',
      },
      {
        name: 'DNS-Server',
        type: 'Server',
        ipAddress: '192.168.0.10',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Resolves hostnames to IP addresses',
      },
      {
        name: 'Web-Server',
        type: 'Server',
        ipAddress: '192.168.0.20',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Web server hosting index.html and error endpoints',
      },
    ],
    connections: [
      'Client-PC connected to Local LAN switch',
      'DNS-Server connected to Local LAN switch',
      'Web-Server connected to Local LAN switch',
    ],
  },
  baselineBehavior: {
    userAction: 'Client requests http://www.example.edu/index.html.',
    expectedDnsQuery: 'DNS query returns 192.168.0.20. TCP 3-way handshake succeeds.',
    expectedBrowserOutput: 'Browser renders the page; server sends HTTP/1.1 200 OK header.',
    status: 'Baseline working (Control state)',
  },
  faultInjection: {
    faultType: 'Missing resource (404) or server-side application crash (500)',
    configurationChange:
      'Client requests http://www.example.edu/nonexistent-page.html, or server script throws an unhandled exception returning HTTP 500.',
    affectedComponent: 'Destination web server application layer logic',
  },
  failureBehavior: {
    userAction: 'Open http://www.example.edu/nonexistent-page.html in browser.',
    observedDnsResult: 'DNS succeeds: www.example.edu resolves to 192.168.0.20 in <5ms.',
    observedBrowserOutput: 'Browser displays 404 Not Found or 500 Internal Server Error page.',
    observedPingResult: 'Ping to 192.168.0.20 succeeds with 0% packet loss.',
    contrastInsight:
      'An HTTP error code is NOT a network failure. The fact that the user sees 404 or 500 proves that DNS, IP routing, TCP handshake, and HTTP request-response all succeeded. The failure is strictly within the application.',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'DNS',
      event: 'Domain resolution',
      whatToObserve: 'DNS A record query and reply execute successfully.',
    },
    {
      step: 2,
      protocol: 'TCP',
      event: 'Three-way handshake',
      whatToObserve: 'SYN, SYN-ACK, and ACK packets successfully establish the TCP connection.',
    },
    {
      step: 3,
      protocol: 'HTTP',
      event: 'GET request delivered & HTTP 500 error returned',
      whatToObserve:
        'Client issues GET / HTTP/1.1 across the active TCP session. The server application throws an internal error and responds with HTTP/1.1 500 Internal Server Error.',
    },
    {
      step: 4,
      protocol: 'TCP',
      event: 'Connection teardown',
      whatToObserve: 'TCP FIN/ACK sequence cleanly closes the HTTP session after error payload delivery.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: false,
    isCiscoProofOfConcept: false,
    simulatedInBrowser: true,
    manualStepsRequired: [
      'Open the HTTP-05 interactive simulation in your web browser.',
      'In "Baseline Working" mode, observe normal DNS resolution, TCP handshake, HTTP GET request, and HTTP 200 OK delivery.',
      'Switch to "Injected Fault" mode to simulate a server-side application crash (HTTP 500 Internal Server Error).',
      'Step through the timeline to observe that DNS, TCP handshake, and HTTP GET request all succeed completely across the network.',
      'Observe the server returning an HTTP 500 status code, demonstrating that the failure is inside server application code rather than network connectivity.',
    ],
  },
  studyQuestions: [
    {
      question: 'Why does receiving an HTTP 404 or 500 status code eliminate a network outage as the cause?',
      answer:
        'HTTP is an Application Layer protocol running on top of TCP and IP. A client cannot receive an HTTP status code without successfully resolving DNS, completing a TCP handshake, and transmitting an HTTP request to the server.',
      networkingConcept: 'Application Layer Status Codes vs. Transport/Network Reachability',
    },
    {
      question: 'What is the semantic difference between HTTP 4xx and HTTP 5xx codes?',
      answer:
        '4xx codes (e.g. 404, 403, 400) signify client-side errors, such as requesting a resource that does not exist. 5xx codes (e.g. 500, 502, 503) indicate that the server encountered an internal failure while processing a valid request.',
      networkingConcept: 'RFC 9110 HTTP Semantics Status Code Classes',
    },
  ],
};

export const GW_02_SCENARIO: ScenarioExperiment = {
  scenarioId: 'GW-02',
  title: 'Default Gateway Misconfigured or Unreachable',
  category: 'Routing & Subnetting (Layer 3 Gateway)',
  teachingGoal:
    'Demonstrate how a host can communicate with any local LAN neighbor via Layer 2 ARP while being completely unable to reach any IP address outside its local subnet when the default gateway is missing or invalid.',
  baselineTopology: {
    description:
      'LAN subnet 192.168.0.0/24 connected through router interface G0/0 (192.168.0.1). Remote WAN/Cloud subnet 10.0.0.0/24 connected via router G0/1 (10.0.0.1) hosting remote server 10.0.0.50.',
    devices: [
      {
        name: 'Client-Laptop',
        type: 'PC',
        ipAddress: '192.168.0.100',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        dnsServer: '192.168.0.10',
        role: 'Client attempting to reach local and remote destinations',
      },
      {
        name: 'Local-Server',
        type: 'Server',
        ipAddress: '192.168.0.10',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        role: 'Local subnet DNS server (192.168.0.0/24)',
      },
      {
        name: 'Gateway-Router',
        type: 'Router',
        ipAddress: 'G0/0: 192.168.0.1, G0/1: 10.0.0.1',
        subnetMask: '255.255.255.0',
        defaultGateway: 'N/A',
        role: 'Routes traffic between 192.168.0.0/24 and 10.0.0.0/24',
      },
      {
        name: 'Remote-Web-Server',
        type: 'Server',
        ipAddress: '10.0.0.50',
        subnetMask: '255.255.255.0',
        defaultGateway: '10.0.0.1',
        role: 'External web server in remote network',
      },
    ],
    connections: [
      'Client-Laptop connected to LAN switch',
      'Local-Server connected to LAN switch',
      'Gateway-Router G0/0 connected to LAN switch',
      'Gateway-Router G0/1 connected to Remote-Web-Server',
    ],
  },
  baselineBehavior: {
    userAction: 'Client pings Local-Server (192.168.0.10) and Remote-Web-Server (10.0.0.50).',
    expectedDnsQuery: 'N/A (Testing direct IP routing).',
    expectedBrowserOutput: 'Client can access both local services and remote web server.',
    status: 'Baseline working (Control state)',
  },
  faultInjection: {
    faultType: 'Incorrect default gateway IP address on client',
    configurationChange:
      'On Client-Laptop -> Desktop -> IP Configuration, change Default Gateway from 192.168.0.1 to 192.168.0.254 (an IP where no router exists). Leave client IP and subnet mask unchanged.',
    affectedComponent: 'Client Layer 3 routing table (Default Route 0.0.0.0/0)',
  },
  failureBehavior: {
    userAction: 'Ping 192.168.0.10 (local LAN), then ping 10.0.0.50 (remote subnet).',
    observedDnsResult: 'Local DNS queries to 192.168.0.10 still work; external DNS queries fail.',
    observedBrowserOutput: 'Local LAN pages load; remote sites show Destination Host Unreachable.',
    observedPingResult:
      'ping 192.168.0.10 succeeds (0% loss). ping 10.0.0.50 fails with Destination Host Unreachable / Request Timed Out.',
    contrastInsight:
      'Traffic to 192.168.0.10 does not require a router because the client subnet mask (255.255.255.0) identifies it as on-link. Traffic to 10.0.0.50 requires forwarding to the default gateway; since the gateway IP is non-existent, ARP for 192.168.0.254 times out.',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'ARP / ICMP',
      event: 'Local subnet communication succeeds without router',
      whatToObserve:
        'When pinging 192.168.0.10, the client broadcasts ARP for 192.168.0.10, gets a reply, and sends ICMP echo directly at Layer 2.',
    },
    {
      step: 2,
      protocol: 'ARP',
      event: 'Remote packet triggers ARP for configured gateway',
      whatToObserve:
        'When pinging 10.0.0.50, client checks its subnet mask, realizes 10.0.0.50 is off-subnet, and broadcasts ARP asking: Who has 192.168.0.254?',
    },
    {
      step: 3,
      protocol: 'ARP',
      event: 'ARP for invalid gateway fails',
      whatToObserve:
        'Because 192.168.0.254 does not exist on the LAN, no ARP reply arrives. The client cannot encapsulate the IP packet into an Ethernet frame.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: false,
    isCiscoProofOfConcept: false,
    simulatedInBrowser: true,
    manualStepsRequired: [
      'Open the GW-02 interactive simulation in your web browser.',
      'In "Baseline Working" mode, observe the client routing external packets to default gateway 192.168.0.1 to reach remote server 10.0.0.50.',
      'Switch to "Injected Fault" mode where the client Default Gateway is misconfigured to non-existent host 192.168.0.254.',
      'Observe that local subnet ping to 192.168.0.10 succeeds directly via ARP without needing a router or gateway.',
      'Observe that off-subnet ping to 10.0.0.50 triggers ARP for 192.168.0.254, which times out, causing the client OS to drop the packet locally ("Destination Host Unreachable").',
    ],
  },
  studyQuestions: [
    {
      question: 'How does a host decide whether to send a packet directly to a target or to its default gateway?',
      answer:
        'The host performs a bitwise AND operation between the destination IP and its own subnet mask. If the resulting network prefix matches the local interface prefix, the target is on-link and reached directly via ARP. If they differ, the packet is forwarded to the default gateway MAC.',
      networkingConcept: 'Subnet Mask Evaluation and Local vs. Remote Forwarding Decision',
    },
  ],
};

export const LAN_03_SCENARIO: ScenarioExperiment = {
  scenarioId: 'LAN-03',
  title: 'DHCP Lease Failure (APIPA 169.254.x.x Auto-Configuration)',
  category: 'Local Network & IP Auto-Configuration (DHCP / APIPA)',
  teachingGoal:
    'Demonstrate the behavior of an operating system when the physical link is connected and carrier is active, but the local DHCP service is unavailable. The client fails to receive a network configuration, automatically assigns an Automatic Private IP Address (APIPA, RFC 3927: 169.254.x.x), and cannot route traffic to any gateway or internet service.',
  baselineTopology: {
    description:
      'Home/Office LAN where devices obtain IP configuration dynamically via DHCP from a home gateway across an active Ethernet connection.',
    devices: [
      {
        name: 'Client-Laptop',
        type: 'PC',
        ipAddress: 'DHCP (192.168.0.100 in baseline)',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        dnsServer: '192.168.0.10',
        role: 'Client configured for dynamic IP addressing via DHCP',
      },
      {
        name: 'Home-Router-DHCP',
        type: 'Router',
        ipAddress: '192.168.0.1',
        subnetMask: '255.255.255.0',
        defaultGateway: 'N/A',
        role: 'DHCP server and default gateway',
      },
    ],
    connections: ['Client-Laptop connected via active Ethernet cable to Home-Router-DHCP'],
  },
  baselineBehavior: {
    userAction: 'Client laptop boots up with physical link connected and requests dynamic address via DHCP.',
    expectedDnsQuery: 'DHCP DORA process completes across active link. Client receives IP 192.168.0.100, Gateway 192.168.0.1, DNS 192.168.0.10.',
    expectedBrowserOutput: 'Network adapter icon shows Connected. All local and WAN connectivity works.',
    status: 'Baseline working (Control state)',
  },
  faultInjection: {
    faultType: 'Local router DHCP service stopped or address pool exhausted',
    configurationChange:
      'Disable the DHCP service daemon on Home-Router-DHCP while keeping the physical Ethernet cable connected and link carrier up. On Client-Laptop, execute ipconfig /renew.',
    affectedComponent: 'Local router DHCP daemon service (UDP ports 67/68)',
  },
  failureBehavior: {
    userAction: 'Run ipconfig /all on the client laptop and test reachability to 192.168.0.1.',
    observedDnsResult: 'No DNS server assigned. Any DNS lookup fails immediately with local error.',
    observedBrowserOutput: 'Browser immediately displays No Internet / You are not connected.',
    observedPingResult:
      'ping 192.168.0.1 fails with Transmit failed: General failure or Destination host unreachable.',
    contrastInsight:
      'The physical Ethernet cable is connected and carrier signal is detected (link lights green). However, because DHCP failed, the OS assigns an RFC 3927 APIPA address (169.254.x.x / 255.255.0.0) without any default gateway. Pinging the router 192.168.0.1 fails because the client has no gateway and is stranded on a separate link-local subnet.',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'DHCP',
      event: 'Client transmits DHCPDISCOVER broadcast across active link',
      whatToObserve:
        'Client sends DHCP Discover broadcast to 255.255.255.255 on UDP port 67 across the operational physical cable.',
    },
    {
      step: 2,
      protocol: 'DHCP',
      event: 'No DHCP Offer received (Service Inactive)',
      whatToObserve:
        'With DHCP service stopped on the router, no server responds with an Offer. After multiple retries, the client gives up.',
    },
    {
      step: 3,
      protocol: 'IPv4 / ARP',
      event: 'APIPA assignment and gratuitous ARP',
      whatToObserve:
        'Client randomly selects an address in 169.254.0.0/16 and sends Gratuitous ARP to ensure no IP collision on the link.',
    },
    {
      step: 4,
      protocol: 'ICMP',
      event: 'Router ping dropped locally (No gateway)',
      whatToObserve:
        'Attempting to ping 192.168.0.1 fails locally because destination is off-link and routing table has no default gateway.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: false,
    isCiscoProofOfConcept: false,
    simulatedInBrowser: true,
    manualStepsRequired: [
      'Open the LAN-03 interactive simulation in your web browser.',
      'In "Baseline Working" mode, observe the successful DHCP DORA handshake where the client receives IP 192.168.0.100 and Gateway 192.168.0.1.',
      'Switch to "Injected Fault" mode to simulate a stopped DHCP daemon on the router.',
      'Step through the timeline to observe DHCPDISCOVER broadcasts timing out across the active link.',
      'Verify that the OS assigns an APIPA link-local address (169.254.88.12) with 0.0.0.0 gateway, preventing router communication.',
    ],
  },
  studyQuestions: [
    {
      question: 'What does an IP address beginning with 169.254 indicate?',
      answer:
        '169.254.0.0/16 is the IPv4 Link-Local address block defined by RFC 3927 (APIPA). It indicates that the operating system was configured for DHCP but received no reply from any DHCP server on the local link.',
      networkingConcept: 'IPv4 Link-Local Auto-Configuration (APIPA, RFC 3927)',
    },
  ],
};

export const DNS_06_SCENARIO: ScenarioExperiment = {
  scenarioId: 'DNS-06',
  title: 'Captive Portal / Intercepted DNS & Web Traffic',
  category: 'Access Control & Redirection',
  teachingGoal:
    'Explain the behavior of public Wi-Fi networks (hotels, airports, universities) where the device associates successfully and receives a local IP address, but all DNS or HTTP traffic is intercepted and redirected until the user accepts terms or logs in.',
  baselineTopology: {
    description:
      'Public wireless network with captive portal controller intercepting port 80/53 traffic.',
    devices: [
      {
        name: 'Guest-Laptop',
        type: 'PC',
        ipAddress: '192.168.1.50',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.1.1',
        dnsServer: '192.168.1.1',
        role: 'Unauthenticated guest client on public network',
      },
      {
        name: 'Captive-Gateway',
        type: 'Router',
        ipAddress: '192.168.1.1',
        subnetMask: '255.255.255.0',
        defaultGateway: 'N/A',
        role: 'Intercepts port 80/53 traffic from unauthenticated MACs',
      },
      {
        name: 'Portal-Web-Server',
        type: 'Server',
        ipAddress: '192.168.1.2',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.1.1',
        role: 'Hosts guest splash page / login portal',
      },
    ],
    connections: ['Guest-Laptop connected to Captive-Gateway AP via Wi-Fi'],
  },
  baselineBehavior: {
    userAction: 'Client connects to Wi-Fi and attempts to navigate to http://www.example.edu.',
    expectedDnsQuery: 'Gateway intercepts query or HTTP request.',
    expectedBrowserOutput: 'Client is redirected to http://192.168.1.2/login.html.',
    status: 'Captive redirect active',
  },
  faultInjection: {
    faultType: 'Access control interception of unauthenticated clients',
    configurationChange:
      'Gateway firewall rule redirects all outbound TCP port 80 traffic to the internal portal web server (192.168.1.2) until client MAC is authorized.',
    affectedComponent: 'Network Access Controller / Gateway NAT redirection',
  },
  failureBehavior: {
    userAction: 'Guest attempts to visit an external website or test HTTPS connectivity.',
    observedDnsResult: 'DNS queries either resolve normally or are spoofed to return 192.168.1.2.',
    observedBrowserOutput:
      'HTTP requests return 302 Found redirect to portal login. HTTPS requests produce SSL/TLS certificate warnings because the gateway cannot forge third-party certificates.',
    observedPingResult: 'Ping to gateway (192.168.1.1) succeeds; ping to external WAN IPs is blocked.',
    contrastInsight:
      'The device displays "Connected, Action Needed" or opens a captive browser. The local Wi-Fi association and IP lease are healthy, but policy blocks external reachability until authorization is granted.',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'TCP / HTTP',
      event: 'Client sends HTTP GET to destination',
      whatToObserve:
        'Client connects to external IP:80 and sends GET /index.html.',
    },
    {
      step: 2,
      protocol: 'HTTP',
      event: 'Gateway returns HTTP 302 Redirect',
      whatToObserve:
        'Instead of forwarding to the destination, the gateway returns HTTP 302 with Location: http://192.168.1.2/login.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: false,
    isCiscoProofOfConcept: false,
    simulatedInBrowser: true,
    manualStepsRequired: [
      'Open the DNS-06 interactive simulation in your web browser.',
      'In "Baseline Working" mode, observe authenticated outbound HTTP traffic flowing through the gateway to the external web server.',
      'Switch to "Injected Fault" mode where the client MAC address is unauthenticated on the public hotspot.',
      'Step through the timeline: observe that local Wi-Fi association and DHCP IP assignment succeed completely ("Connected").',
      'Observe the gateway intercepting outbound HTTP port 80 traffic and returning an HTTP 302 Found redirect to http://192.168.1.2/login.html.',
      'Observe that direct WAN transit and HTTPS access remain blocked by captive firewall policy until login is completed.',
    ],
  },
  studyQuestions: [
    {
      question: 'Why do captive portals often trigger HTTPS certificate security warnings in modern browsers?',
      answer:
        'Captive portals intercept TCP connections destined for external domains (e.g. https://bank.com). Because the portal gateway does not possess the private key for bank.com, the TLS handshake certificate validation fails, correctly alerting the user to an interception (man-in-the-middle).',
      networkingConcept: 'TLS Security Boundaries and Captive Interception',
    },
  ],
};

export const IND_07_SCENARIO: ScenarioExperiment = {
  scenarioId: 'IND-07',
  title: 'The "Connected, No Internet" Paradox: Local LAN OK, Upstream WAN Down',
  category: 'End-to-End Reachability (LAN vs. WAN Uplink)',
  teachingGoal:
    'Directly solve the central question of this project: "Why does my computer show Connected when the website is unreachable?" Show that local Wi-Fi and DHCP connectivity exist between client and home router, while the router has lost its upstream WAN internet link.',
  baselineTopology: {
    description:
      'Home router connects a local LAN (192.168.0.0/24) to an ISP Cable/Fiber Modem via WAN port (203.0.113.2/30).',
    devices: [
      {
        name: 'Client-Laptop',
        type: 'PC',
        ipAddress: '192.168.0.100',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.0.1',
        dnsServer: '192.168.0.1',
        role: 'End-user client connected to home Wi-Fi',
      },
      {
        name: 'Home-Wi-Fi-Router',
        type: 'Router',
        ipAddress: 'LAN: 192.168.0.1, WAN: 203.0.113.2',
        subnetMask: 'LAN: 255.255.255.0, WAN: 255.255.255.252',
        defaultGateway: '203.0.113.1 (ISP Gateway)',
        role: 'Provides local Wi-Fi/DHCP and NAT routing to ISP',
      },
      {
        name: 'ISP-Gateway-Router',
        type: 'Router',
        ipAddress: '203.0.113.1',
        subnetMask: '255.255.255.252',
        defaultGateway: 'Upstream Provider',
        role: 'Internet Service Provider head-end gateway',
      },
      {
        name: 'Public-DNS-Server',
        type: 'Server',
        ipAddress: '8.8.8.8',
        subnetMask: '255.255.255.0',
        defaultGateway: '203.0.113.1',
        role: 'Public recursive resolver on the internet',
      },
    ],
    connections: [
      'Client-Laptop connected to Home-Wi-Fi-Router LAN',
      'Home-Wi-Fi-Router WAN port connected to ISP-Gateway-Router',
      'ISP-Gateway-Router connected to Public-DNS-Server (8.8.8.8)',
    ],
  },
  baselineBehavior: {
    userAction: 'Client laptop accesses web services on the internet.',
    expectedDnsQuery: 'DNS queries forward through home router to ISP/Public DNS 8.8.8.8.',
    expectedBrowserOutput: 'Websites load normally; OS network status indicates Internet Access.',
    status: 'Baseline working (Control state)',
  },
  faultInjection: {
    faultType: 'Router WAN cable disconnected or ISP uplink outage',
    configurationChange:
      'Disconnect the cable between Home-Wi-Fi-Router WAN port and the ISP modem (or shut down the router WAN interface). Do NOT touch the local Wi-Fi or LAN settings.',
    affectedComponent: 'Home router WAN interface (uplink to ISP)',
  },
  failureBehavior: {
    userAction: 'Ping 192.168.0.1 (local router), then ping 8.8.8.8 (public internet), then open a website.',
    observedDnsResult: 'DNS queries sent to 192.168.0.1 fail because the router cannot forward them to the ISP.',
    observedBrowserOutput: 'Browser reports DNS_PROBE_FINISHED_NO_INTERNET or Connection Timed Out.',
    observedPingResult:
      'ping 192.168.0.1 succeeds with <1ms and 0% loss! ping 8.8.8.8 fails with Request timed out or Destination net unreachable.',
    contrastInsight:
      'The operating system network icon originally says "Connected" because the local Wi-Fi association and IP address lease to 192.168.0.1 remain 100% active. Only when the OS active probe (such as Windows NCSI or Apple captive check) fails does it change to "Connected, No Internet". Connected does not mean connected to the internet!',
  },
  packetInspectionCheckpoints: [
    {
      step: 1,
      protocol: 'ICMP',
      event: 'Local gateway ping succeeds perfectly',
      whatToObserve:
        'Client sends ICMP echo to 192.168.0.1. The home router replies instantly because the LAN switch and IP stack are working.',
    },
    {
      step: 2,
      protocol: 'ICMP / IP',
      event: 'WAN traffic dropped at router',
      whatToObserve:
        'Client sends ICMP echo to 8.8.8.8. The packet arrives at 192.168.0.1, but because the WAN interface is down, the router drops the packet or returns ICMP Destination Network Unreachable.',
    },
    {
      step: 3,
      protocol: 'DNS (UDP)',
      event: 'DNS queries fail due to missing upstream route',
      whatToObserve:
        'DNS queries to external resolvers cannot leave the router, demonstrating how a WAN drop cascades into an apparent DNS failure.',
    },
  ],
  fileStatus: {
    hasVerifiedPkt: false,
    isCiscoProofOfConcept: false,
    simulatedInBrowser: true,
    manualStepsRequired: [
      'Open the IND-07 interactive simulation in your web browser.',
      'In "Baseline Working" mode, observe normal local Wi-Fi forwarding and successful WAN transit through the ISP gateway.',
      'Switch to "Injected Fault" mode to simulate a disconnected router WAN cable / ISP uplink outage.',
      'Step through the timeline: observe that local ping to router 192.168.0.1 succeeds with 0% loss (the OS reports "Connected").',
      'Observe that external requests sent to the router fail with ICMP Destination Host Unreachable because the WAN interface is down (explaining "No Internet").',
    ],
  },
  studyQuestions: [
    {
      question: 'How do modern operating systems (like Windows and Android) detect that a connection has "No Internet Access"?',
      answer:
        'Operating systems run Network Connectivity Status Indicator (NCSI) tests. After connecting to Wi-Fi and obtaining an IP, the OS sends an HTTP request to a well-known probe server (such as www.msftconnecttest.com/connecttest.txt or connectivitycheck.gstatic.com). If the expected plain text is received, it reports Internet Access. If DNS fails or the request times out, it displays "Connected, No Internet".',
      networkingConcept: 'Operating System Active Probing & NCSI Architecture',
    },
    {
      question: 'What is the physical boundary of a home Wi-Fi connection?',
      answer:
        'The Wi-Fi connection is strictly a Layer 1/2 wireless link between the client device wireless NIC and the radio antenna of the local Access Point (typically inside the home router), covering tens of meters. It has zero bearing on the miles of fiber/copper connecting the router to the ISP.',
      networkingConcept: 'Local Wireless Access vs. Wide Area Network Transit',
    },
  ],
};

export const SCENARIO_LIBRARY: Record<string, ScenarioExperiment> = {
  'DNS-01': DNS_01_SCENARIO,
  'SRV-04': SRV_04_SCENARIO,
  'HTTP-05': HTTP_05_SCENARIO,
  'GW-02': GW_02_SCENARIO,
  'LAN-03': LAN_03_SCENARIO,
  'DNS-06': DNS_06_SCENARIO,
  'IND-07': IND_07_SCENARIO,
};

export const getScenarioById = (id: string): ScenarioExperiment | null =>
  SCENARIO_LIBRARY[id] ?? null;

export const getAllScenarios = (): ScenarioExperiment[] =>
  Object.values(SCENARIO_LIBRARY);

export const getNetworkStagesForOutcome = (outcome: string): NetworkStage[] => {
  switch (outcome) {
    case 'DNS_MATCH':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'success',
          provenance: 'inferred',
          description: 'Network interface card is enabled, assigned IP 192.168.0.100 via static or DHCP.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi-Fi / Ethernet Switch Link',
          status: 'success',
          provenance: 'inferred',
          description: 'Layer 1 physical link is UP. Layer 2 Ethernet frames are transmitting properly.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'success',
          provenance: 'inferred',
          description: 'Direct IP packets and ping can reach external IP subnets successfully.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation (UDP 53)',
          status: 'error',
          provenance: 'measured',
          description:
            'FAILS HERE (DNS-01): Cannot translate domain into an IP address. Query times out or resolver unreachable.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'bypassed',
          provenance: 'conceptual',
          description:
            'Never reached because the browser could not determine which IP address to contact.',
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
          description: 'Client device networking stack operational.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi-Fi / Ethernet Switch Link',
          status: 'success',
          provenance: 'conceptual',
          description: 'Local Layer 2 forwarding operational.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'success',
          provenance: 'inferred',
          description: 'Layer 3 IP routing functional; ping packets reach destination host.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation (UDP 53)',
          status: 'success',
          provenance: 'measured',
          description: 'SUCCESS: Hostname resolved to IP address.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'error',
          provenance: 'measured',
          description:
            'FAILS HERE (SRV-04): TCP SYN to port 80/443 was refused (RST) or timed out. Web daemon is down or port filtered.',
        },
      ];

    case 'CONTRASTING_SERVER_ERROR':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'success',
          provenance: 'measured',
          description: 'Operating system and network interface operating normally.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi-Fi / Ethernet Switch Link',
          status: 'success',
          provenance: 'measured',
          description: 'Local connection is fully functional.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'success',
          provenance: 'measured',
          description: 'Packets routed across network path to destination host.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'success',
          provenance: 'measured',
          description: 'SUCCESS: Domain name resolved into an IP address.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'error',
          provenance: 'measured',
          description:
            'APPLICATION ERROR (HTTP-05): Web server answered with HTTP 4xx/5xx. All network stages succeeded!',
        },
      ];

    case 'CONTRASTING_LOCAL_OFFLINE':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'error',
          provenance: 'inferred',
          description: 'FAILS HERE (LAN-03): Adapter disconnected, cable unplugged, or APIPA 169.254.x.x assigned.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi-Fi / Ethernet Switch Link',
          status: 'error',
          provenance: 'inferred',
          description: 'Physical or Data Link carrier absent. No association to local network.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'untested',
          provenance: 'not-tested',
          description: 'Unreachable due to local link failure.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'untested',
          provenance: 'not-tested',
          description: 'Not reached because device is completely offline locally.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'untested',
          provenance: 'not-tested',
          description: 'Unreachable.',
        },
      ];

    case 'GATEWAY_MISCONFIG':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'success',
          provenance: 'inferred',
          description: 'Device interface configured with local IP address.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi-Fi / Ethernet Switch Link',
          status: 'success',
          provenance: 'inferred',
          description: 'Local Layer 2 link works. Same-subnet neighbors are reachable.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'error',
          provenance: 'inferred',
          description:
            'FAILS HERE (GW-02): Default gateway IP is invalid or router is unreachable. Packets destined outside subnet cannot exit.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'untested',
          provenance: 'not-tested',
          description: 'External DNS unreachable without a functional gateway.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'bypassed',
          provenance: 'conceptual',
          description: 'Cannot be routed off the local subnet.',
        },
      ];

    case 'CAPTIVE_PORTAL':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'success',
          provenance: 'inferred',
          description: 'Wi-Fi associated and DHCP lease obtained.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi-Fi / Ethernet Switch Link',
          status: 'success',
          provenance: 'inferred',
          description: 'Layer 2 wireless link active.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'warning',
          provenance: 'inferred',
          description:
            'FAILS HERE (DNS-06): Gateway policy intercepts external traffic and redirects HTTP/DNS to login splash screen.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'warning',
          provenance: 'inferred',
          description: 'DNS queries intercepted or spoofed by captive gateway.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'bypassed',
          provenance: 'conceptual',
          description: 'Blocked until captive portal terms are accepted.',
        },
      ];

    case 'CONTRASTING_GENERAL_OUTAGE':
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'success',
          provenance: 'inferred',
          description: 'Device network adapter is enabled with active link.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi-Fi / Ethernet Switch Link',
          status: 'success',
          provenance: 'inferred',
          description: 'Local connection to home router is UP (Connected locally).',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'error',
          provenance: 'inferred',
          description:
            'FAILS HERE (IND-07): Home router has lost upstream WAN link to ISP. Local LAN works, but internet transit is broken.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'error',
          provenance: 'inferred',
          description: 'Queries fail because upstream ISP resolvers cannot be contacted.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'bypassed',
          provenance: 'conceptual',
          description: 'No packets can reach the wider internet.',
        },
      ];

    default:
      return [
        {
          id: 'device',
          name: 'Client Device',
          role: 'Operating System & Network Adapter',
          status: 'untested',
          provenance: 'not-tested',
          description: 'Device state unknown or unverified.',
        },
        {
          id: 'local_link',
          name: 'Local Connection',
          role: 'Wi-Fi / Ethernet Switch Link',
          status: 'untested',
          provenance: 'not-tested',
          description: 'Local link state uncertain.',
        },
        {
          id: 'gateway_router',
          name: 'Routing & Gateway',
          role: 'Default Gateway Router (Layer 3)',
          status: 'untested',
          provenance: 'not-tested',
          description: 'Routing state uncertain.',
        },
        {
          id: 'dns',
          name: 'DNS Name Resolution',
          role: 'Domain Name Translation',
          status: 'untested',
          provenance: 'not-tested',
          description: 'DNS resolution status unverified.',
        },
        {
          id: 'destination',
          name: 'Destination Web Server',
          role: 'Target HTTP/HTTPS Service',
          status: 'untested',
          provenance: 'not-tested',
          description: 'Destination reachability uncertain.',
        },
      ];
  }
};
