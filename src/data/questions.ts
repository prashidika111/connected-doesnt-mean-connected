import { Question } from '../types/diagnosis';

export const QUESTIONS: Question[] = [
  {
    id: 'Q_LINK_STATUS',
    title: 'Does your device indicate that it is connected to a local network?',
    subtitle: 'Check the Wi Fi or Ethernet symbol in your device’s system tray or menu bar.',
    category: 'physical',
    whyItMatters: 'Establishes whether Layer 1/2 physical link and local association to an Access Point or Switch are active.',
    options: [
      {
        id: 'LINK_WIFI_ETH_OK',
        label: 'Yes, it says Connected (Wi Fi or Ethernet)',
        description: 'The operating system displays an active network icon with link status UP.',
      },
      {
        id: 'LINK_DISCONNECTED',
        label: 'No, it shows Disconnected / Searching',
        description: 'No local Wi Fi or wired connection is active.',
      },
      {
        id: 'LINK_NOT_SURE',
        label: 'Not sure / haven’t checked',
        description: 'The local link status is currently unverified.',
      },
    ],
  },
  {
    id: 'Q_TARGET_TYPE',
    title: 'What kind of destination are you trying to access?',
    subtitle: 'Different types of destinations rely on different networking protocols.',
    category: 'service',
    whyItMatters: 'Domain names require DNS resolution (translating names to IP addresses), whereas raw IP addresses bypass DNS entirely.',
    options: [
      {
        id: 'TARGET_WEBSITE_NAME',
        label: 'A website domain name (e.g., example.edu, wikipedia.org)',
        description: 'Typing an alphanumeric URL into a web browser address bar.',
      },
      {
        id: 'TARGET_IP_DIRECT',
        label: 'A direct numerical IP address (e.g., 192.168.0.1, 93.184.216.34)',
        description: 'Connecting directly to an IP without needing name resolution.',
      },
      {
        id: 'TARGET_APP_SERVICE',
        label: 'A standalone app or background service',
        description: 'An application that may maintain its own active sockets or cached IPs.',
      },
      {
        id: 'TARGET_NOT_SURE',
        label: 'Not sure',
        description: 'Uncertain of the exact destination format.',
      },
    ],
  },
  {
    id: 'Q_SCOPE',
    title: 'How broad is the connectivity issue across other sites and applications?',
    subtitle: 'Helps distinguish between an isolated server failure and a systemic resolver/routing breakdown.',
    category: 'scope',
    whyItMatters: 'If one site fails but all others work, the domain or specific server might be down. If all named sites fail uniformly, the resolver or routing path is suspect.',
    options: [
      {
        id: 'SCOPE_ALL_WEBSITES',
        label: 'All websites fail to load by name',
        description: 'No new domain names resolve, even though the device says connected.',
      },
      {
        id: 'SCOPE_SINGLE_SPECIFIC',
        label: 'Only one specific website fails; others load normally',
        description: 'Other websites and online services work without trouble.',
      },
      {
        id: 'SCOPE_ALL_APPS_DEAD',
        label: 'Everything is failing — no apps, services, or websites work',
        description: 'Total blackout of all outbound communications.',
      },
      {
        id: 'SCOPE_NOT_SURE',
        label: 'Not sure / haven’t tested other sites',
        description: 'Haven’t verified whether other services are reachable.',
      },
    ],
  },
  {
    id: 'Q_SYMPTOM_ERROR',
    title: 'What specific message or symptom does the browser show?',
    subtitle: 'Browser error screens provide crucial diagnostic fingerprints.',
    category: 'symptom',
    whyItMatters: 'DNS lookup failure triggers distinct error codes (like DNS_PROBE_FINISHED or Server IP address could not be found) before any TCP handshake is even attempted.',
    options: [
      {
        id: 'ERROR_NAME_RESOLUTION',
        label: '“Server IP address could not be found” / DNS_PROBE_FINISHED',
        description: 'The browser cannot map the domain name to an IP address.',
      },
      {
        id: 'ERROR_TIMEOUT',
        label: '“Connection timed out” after waiting a long time',
        description: 'The address was resolved or contacted, but packets were dropped or unanswered.',
      },
      {
        id: 'ERROR_HTTP_STATUS',
        label: 'An HTTP error code like “404 Not Found” or “500 Server Error”',
        description: 'The web server was successfully contacted and replied with an application error.',
      },
      {
        id: 'ERROR_NO_INTERNET_BANNER',
        label: '“You are not connected to the Internet” / No connection detected',
        description: 'The operating system notified the browser of an offline state.',
      },
      {
        id: 'ERROR_NOT_SURE',
        label: 'A generic blank page or spinning loading icon',
        description: 'No specific error code was read or noticed.',
      },
    ],
  },
  {
    id: 'Q_DIRECT_IP',
    title: 'Can you reach any device by direct numerical IP address?',
    subtitle: 'For example, opening your local router settings (192.168.0.1) or pinging a known public IP.',
    category: 'evidence',
    whyItMatters: 'If direct IP communication succeeds while domain names fail, DNS is strongly implicated because Layer 3/4 packet routing is proven operational.',
    options: [
      {
        id: 'IP_WORKS',
        label: 'Yes, direct IP access or router admin page works',
        description: 'Packets reach numerical addresses, proving local & routing connectivity is alive.',
      },
      {
        id: 'IP_FAILS',
        label: 'No, direct IP connection also fails completely',
        description: 'Even raw IP packets cannot traverse the network path.',
      },
      {
        id: 'IP_NOT_TESTED',
        label: 'I haven’t tested this / Not sure how to check',
        description: 'No direct IP reachability test has been performed.',
      },
    ],
  },
];
