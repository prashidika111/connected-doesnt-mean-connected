import {
  UserAnswers,
  EvaluationResult,
  EvidenceItem,
  QuestionId,
} from '../types/diagnosis';
import { QUESTIONS } from '../data/questions';

/**
 * Pure, deterministic evaluation function that maps structured answers
 * to an educational diagnostic result.
 */
export function evaluateAnswers(answers: Partial<UserAnswers>): EvaluationResult {
  // 1. Guard against incomplete / insufficient answers
  // All 5 questions must be answered for a complete evaluation
  const requiredQuestions: QuestionId[] = [
    'Q_LINK_STATUS',
    'Q_TARGET_TYPE',
    'Q_SCOPE',
    'Q_SYMPTOM_ERROR',
    'Q_DIRECT_IP',
  ];

  const missingQuestions = requiredQuestions.filter((q) => !answers[q]);
  if (missingQuestions.length > 0) {
    return {
      outcome: 'INSUFFICIENT_INFO',
      scenarioId: null,
      title: 'Inconclusive: Incomplete Questionnaire',
      summary:
        'You have not completed all questions. Network diagnostics require evaluating local link, destination format, scope, and observable errors.',
      certainty: 'UNKNOWN_INSUFFICIENT',
      certaintyExplanation:
        'Without answers to all key diagnostic questions, no educational scenario can be matched responsibly.',
      evidence: [
        {
          questionTitle: 'Completion Check',
          answerLabel: `${missingQuestions.length} question(s) remaining`,
          implication: 'Insufficient evidence to form a diagnostic inference.',
          supportsOutcome: false,
        },
      ],
      plainLanguageExplanation:
        'Diagnosing a connectivity problem requires eliminating basic causes first, such as whether your computer is attached to Wi Fi, before determining whether a higher-level service like DNS is failing.',
      technicalExplanation:
        'In the TCP/IP stack, lower layers (Physical & Data Link) must be verified before diagnosing Application Layer protocols like DNS (RFC 1035).',
      whatIsWorking: ['Unable to determine from current inputs.'],
      whatIsFailing: ['Questionnaire incomplete.'],
      limitations: [
        'No educational scenario can be matched until all guided questions are completed.',
      ],
      recommendedAction: 'Please complete all questions in the questionnaire.',
    };
  }

  // Helper to get question title and option label
  const getQuestionInfo = (qId: QuestionId, optId: string) => {
    const q = QUESTIONS.find((item) => item.id === qId);
    const opt = q?.options.find((o) => o.id === optId);
    return {
      title: q?.title || qId,
      label: opt?.label || optId,
    };
  };

  const linkStatus = answers.Q_LINK_STATUS!;
  const targetType = answers.Q_TARGET_TYPE!;
  const scope = answers.Q_SCOPE!;
  const symptomError = answers.Q_SYMPTOM_ERROR!;
  const directIp = answers.Q_DIRECT_IP!;

  // 2. CONTRADICTION / CONTRASTING 1: Physical Link Disconnected
  if (linkStatus === 'LINK_DISCONNECTED') {
    const q1 = getQuestionInfo('Q_LINK_STATUS', linkStatus);
    return {
      outcome: 'CONTRASTING_LOCAL_OFFLINE',
      scenarioId: null,
      title: 'Local Link Disconnected (Layer 1 / Layer 2 Failure)',
      summary:
        'Your answers indicate that your device is not connected to a local Wi Fi or wired network.',
      certainty: 'LIKELY',
      certaintyExplanation:
        'Based on your reported disconnect status, the failure occurs at the physical or data link stage, not DNS.',
      evidence: [
        {
          questionTitle: q1.title,
          answerLabel: q1.label,
          implication:
            'Device network adapter does not have an active link or Wi Fi association.',
          supportsOutcome: true,
        },
      ],
      plainLanguageExplanation:
        'Before a computer can look up a website name, it must first be plugged into a cable or connected to Wi-Fi. Because your device shows disconnected, the failure is at the very first step.',
      technicalExplanation:
        'Physical Layer (802.11 / 802.3) carrier detection or Layer 2 association is absent. IP stack is offline.',
      whatIsWorking: ['Internal device hardware.'],
      whatIsFailing: [
        'Local Wi Fi association or physical Ethernet connection.',
        'Local IP address assignment (DHCP).',
      ],
      limitations: [
        'This website does not inspect your Wi Fi card; this explanation is based solely on your reported answer.',
      ],
      recommendedAction:
        'Check that your Wi Fi toggle is ON, or verify that your Ethernet cable is securely seated.',
    };
  }

  // 3. CONTRADICTION / CONTRASTING 2: Web Server HTTP Error (404/500)
  if (symptomError === 'ERROR_HTTP_STATUS') {
    const q4 = getQuestionInfo('Q_SYMPTOM_ERROR', symptomError);
    return {
      outcome: 'CONTRASTING_SERVER_ERROR',
      scenarioId: null,
      title: 'Destination Web Server Error (DNS Actually Succeeded)',
      summary:
        'You received an HTTP status code (such as 404 or 500) from the website server.',
      certainty: 'LIKELY',
      certaintyExplanation:
        'An HTTP error code proves that DNS resolution and network routing were 100% successful.',
      evidence: [
        {
          questionTitle: q4.title,
          answerLabel: q4.label,
          implication:
            'A response came back from the remote web server. Therefore, name resolution worked perfectly.',
          supportsOutcome: true,
        },
      ],
      plainLanguageExplanation:
        'Here is a fascinating networking contrast: if you see a "404 Not Found" or "500 Internal Server Error" page, your internet connection, router, and DNS all worked! Your computer looked up the address, contacted the server miles away, and the server answered. The page itself was simply missing or crashed on the server.',
      technicalExplanation:
        'DNS resolution succeeded, TCP three step handshake completed (SYN/ACK), and an HTTP response with a 4xx/5xx status code was returned by the web daemon.',
      whatIsWorking: [
        'Local Wi Fi / Ethernet connection.',
        'DNS Name Resolution (working completely).',
        'Default Gateway routing and Internet path.',
      ],
      whatIsFailing: [
        'Application logic or missing resource on the destination web server.',
      ],
      limitations: [
        'Based on your reported HTTP error symptom. The application does not probe the remote server.',
      ],
      recommendedAction:
        'Check the spelling of the URL path, or wait for the website administrator to resolve their internal server issue.',
    };
  }

  // 4. CONTRADICTION / CONTRASTING 3: Total blackout / direct IP failure
  if (
    directIp === 'IP_FAILS' &&
    scope === 'SCOPE_ALL_APPS_DEAD' &&
    symptomError === 'ERROR_NO_INTERNET_BANNER'
  ) {
    return {
      outcome: 'CONTRASTING_GENERAL_OUTAGE',
      scenarioId: null,
      title: 'Broad Gateway or ISP Uplink Outage',
      summary:
        'Both domain names and raw numerical IP addresses fail across all applications.',
      certainty: 'LIKELY',
      certaintyExplanation:
        'A pure DNS issue only breaks name lookups. When raw IP routing and all apps fail simultaneously, the default gateway or ISP uplink is down.',
      evidence: [
        {
          questionTitle: 'Direct IP Reachability',
          answerLabel: 'Direct IP also fails completely',
          implication: 'Layer 3 IP packet forwarding is broken.',
          supportsOutcome: true,
        },
        {
          questionTitle: 'Problem Scope',
          answerLabel: 'Everything is failing — no apps or sites work',
          implication: 'Failure is not isolated to name resolution.',
          supportsOutcome: true,
        },
      ],
      plainLanguageExplanation:
        'If even direct numerical addresses fail and all background apps disconnect, the problem is not merely a name-lookup issue. The pipeline connecting your local router to your Internet Service Provider (ISP) is likely broken.',
      technicalExplanation:
        'Loss of Layer 3 IP routing, default gateway reachability, or ISP WAN link failure (PPPoE/DOCSIS/Fiber down).',
      whatIsWorking: ['Local Wi Fi link to your router.'],
      whatIsFailing: [
        'Default Gateway forwarding to the WAN.',
        'Internet Service Provider uplink.',
      ],
      limitations: [
        'Based on your answers. The system has not sent ping or traceroute packets to your gateway.',
      ],
      recommendedAction:
        'Restart your home modem/router or contact your Internet Service Provider to check for regional outages.',
    };
  }

  // 5. INCONCLUSIVE: Too many "Not sure" answers
  const notSureCount = [
    linkStatus === 'LINK_NOT_SURE',
    targetType === 'TARGET_NOT_SURE',
    scope === 'SCOPE_NOT_SURE',
    symptomError === 'ERROR_NOT_SURE',
    directIp === 'IP_NOT_TESTED',
  ].filter(Boolean).length;

  if (notSureCount >= 3) {
    return {
      outcome: 'INSUFFICIENT_INFO',
      scenarioId: null,
      title: 'Inconclusive: Insufficient Observational Evidence',
      summary:
        'You selected "Not sure" or untested for most questions. The system cannot distinguish DNS from router or server issues.',
      certainty: 'UNKNOWN_INSUFFICIENT',
      certaintyExplanation:
        'Our transparent certainty policy prevents making guesses without observable clues.',
      evidence: [
        {
          questionTitle: 'Diagnostic Answers',
          answerLabel: `${notSureCount} answers were "Not sure" or untested`,
          implication:
            'Too many variables are unknown to isolate the failing network stage.',
          supportsOutcome: false,
        },
      ],
      plainLanguageExplanation:
        'Network troubleshooting works like detective work: we need specific clues (such as the exact error message or whether other sites work) to eliminate working stages. With several details unverified, we cannot confidently determine if DNS is responsible.',
      technicalExplanation:
        'Multiple candidate failure states have overlapping symptoms when error codes and IP reachability tests are absent.',
      whatIsWorking: ['Local connection may be active.'],
      whatIsFailing: ['Unable to pinpoint without additional observations.'],
      limitations: [
        'Transparent rules require specific observational signals to avoid false diagnosis.',
      ],
      recommendedAction:
        'Take a closer look at your browser’s error message or test whether another device on the same Wi Fi works, then update your answers.',
    };
  }

  // 6. POSITIVE MATCH: DNS / Name-Resolution Failure
  // Consistent indicators:
  // - Local link is UP (LINK_WIFI_ETH_OK)
  // - Target is website domain name (TARGET_WEBSITE_NAME) or app service
  // - Symptom is ERROR_NAME_RESOLUTION, or (ERROR_TIMEOUT with IP_WORKS), or (SCOPE_ALL_WEBSITES with IP_WORKS)
  const isLinkUp = linkStatus === 'LINK_WIFI_ETH_OK';
  const isNameTarget = targetType === 'TARGET_WEBSITE_NAME' || targetType === 'TARGET_APP_SERVICE';
  const hasDnsError = symptomError === 'ERROR_NAME_RESOLUTION';
  const directIpWorks = directIp === 'IP_WORKS';
  const allWebsitesAffected = scope === 'SCOPE_ALL_WEBSITES';

  // Rule 6A: Strong DNS Match
  // Link UP + Name Target + Explicit Name Resolution Error
  if (isLinkUp && isNameTarget && hasDnsError) {
    const evidence: EvidenceItem[] = [
      {
        questionTitle: 'Local Connection State',
        answerLabel: 'Yes, it says Connected (Wi Fi or Ethernet)',
        implication:
          'Physical and Data Link layers (Layer 1 & 2) to your local router are functional.',
        supportsOutcome: true,
      },
      {
        questionTitle: 'Target Destination',
        answerLabel: getQuestionInfo('Q_TARGET_TYPE', targetType).label,
        implication:
          'Requires translating a human readable domain name into an IP address before connecting.',
        supportsOutcome: true,
      },
      {
        questionTitle: 'Observed Symptom',
        answerLabel: getQuestionInfo('Q_SYMPTOM_ERROR', symptomError).label,
        implication:
          'Browser specifically reports an inability to resolve the host IP address (DNS lookup failure).',
        supportsOutcome: true,
      },
    ];

    if (directIpWorks) {
      evidence.push({
        questionTitle: 'Direct IP Reachability',
        answerLabel: 'Direct IP access works',
        implication:
          'Confirms Layer 3/4 routing is working, isolating the fault squarely to name resolution.',
        supportsOutcome: true,
      });
    }

    return {
      outcome: 'DNS_MATCH',
      scenarioId: 'DNS-01',
      title: 'Symptoms are Consistent with a DNS / Name-Resolution Failure',
      summary:
        'Your answers fit the classic educational pattern: your device is connected locally, but the mechanism that converts website names into IP addresses is failing.',
      certainty: directIpWorks ? 'LIKELY' : 'LIKELY',
      certaintyExplanation:
        'Your reported symptoms strongly match the DNS learning scenario. However, because this application does not inspect your actual device or network packets, this is a plausible educational explanation rather than a verified diagnosis.',
      evidence,
      plainLanguageExplanation:
        'The Internet does not navigate using words like "example.com" — it uses numerical IP addresses like "192.168.0.20". The Domain Name System (DNS) acts like the contacts list on your phone: you type a person\'s name, and DNS provides their phone number. If your contacts list is unreachable, your phone still works, but you cannot call anyone by name. Similarly, your Wi Fi is active, but your computer cannot look up where the website lives.',
      technicalExplanation:
        'The host operating system successfully established Layer 2 association and obtained an IP address. When the web browser queried the configured DNS resolver via UDP port 53, the request either timed out or received an ICMP unreachable reply. Because no IP address was returned, the browser could not construct a TCP SYN packet to initiate the HTTP session.',
      whatIsWorking: [
        'Local Wi Fi or Ethernet link to your local access point.',
        'Local IP address assignment (DHCP).',
        directIpWorks
          ? 'Direct Layer 3 IP routing to numerical addresses.'
          : 'Local network interface operation.',
      ],
      whatIsFailing: [
        'Domain Name System (DNS) resolution on UDP port 53.',
        'Translation of alphanumeric hostnames into routable destination IP addresses.',
      ],
      limitations: [
        'This result is based on your answers. The application has not tested your actual network.',
        'A faulty local router DNS proxy, misconfigured client DNS server IP, or upstream ISP resolver failure can produce similar symptoms.',
      ],
      recommendedAction:
        'Explore the Cisco Packet Tracer DNS scenario to observe how this failure unfolds in a controlled network.',
    };
  }

  // Rule 6B: Direct IP Works while all websites fail (Classic DNS indicator even if error wasn't read)
  if (isLinkUp && isNameTarget && directIpWorks && (allWebsitesAffected || symptomError === 'ERROR_TIMEOUT')) {
    return {
      outcome: 'DNS_MATCH',
      scenarioId: 'DNS-01',
      title: 'Symptoms are Consistent with a DNS / Name-Resolution Failure',
      summary:
        'Direct IP connectivity succeeds while website names fail. This contrast is the hallmark of a DNS failure.',
      certainty: 'LIKELY',
      certaintyExplanation:
        'The contrast between working direct IP communication and failing domain names strongly points towards DNS resolver failure.',
      evidence: [
        {
          questionTitle: 'Local Connection State',
          answerLabel: 'Connected to local network',
          implication: 'Local network link is operational.',
          supportsOutcome: true,
        },
        {
          questionTitle: 'Direct IP Reachability',
          answerLabel: 'Direct IP access works',
          implication:
            'Proves packets can travel across the router and reach destinations by raw address.',
          supportsOutcome: true,
        },
        {
          questionTitle: 'Scope & Target',
          answerLabel: 'Websites fail by name across the board',
          implication:
            'Only services requiring hostname translation are blocked.',
          supportsOutcome: true,
        },
      ],
      plainLanguageExplanation:
        'Because you can reach numerical addresses, we know the "road" (your network cable, Wi Fi, and router) is completely clear. The only thing breaking down is the "translator" (DNS) that turns website names into numerical addresses.',
      technicalExplanation:
        'Routing, ARP, and Layer 3 IP reachability are functional. The failure is isolated to Layer 7 DNS resolver queries or upstream port 53 packet drops.',
      whatIsWorking: [
        'Local Wi Fi / Ethernet link.',
        'Default Gateway routing and IP packet transit.',
        'Direct IP connections.',
      ],
      whatIsFailing: [
        'DNS resolution on UDP port 53.',
        'Mapping of hostnames to IP addresses.',
      ],
      limitations: [
        'Educational scenario match based on user answers, not a packet trace.',
      ],
      recommendedAction:
        'Proceed to the Cisco Packet Tracer simulation guide to observe this exact contrast.',
    };
  }

  // 7. POSITIVE MATCH: Destination HTTP service / TCP port failure (SRV-04)
  // Link UP, named website, a single site times out (DNS error would have matched earlier).
  if (
    isLinkUp &&
    isNameTarget &&
    symptomError === 'ERROR_TIMEOUT' &&
    scope === 'SCOPE_SINGLE_SPECIFIC'
  ) {
    return {
      outcome: 'HTTP_SERVICE_MATCH',
      scenarioId: 'SRV-04',
      title: 'Symptoms are Consistent with a Destination Service / Port Failure',
      summary:
        'Your device appears locally connected and the problem is isolated to one named site that times out — a pattern consistent with a closed or filtered HTTP port after DNS has done its job, or with a silent drop on that service.',
      certainty: 'LIKELY',
      certaintyExplanation:
        'A timeout on one website does not uniquely prove a stopped web daemon; a host firewall can look the same. A controlled service failure scenario can demonstrate how HTTP can fail while DNS and IP access still work.',
      evidence: [
        {
          questionTitle: 'Local Connection State',
          answerLabel: 'Connected to local network',
          implication: 'Physical and data-link stages are reported as up.',
          supportsOutcome: true,
        },
        {
          questionTitle: 'Problem Scope',
          answerLabel: getQuestionInfo('Q_SCOPE', scope).label,
          implication:
            'Other sites working while one name times out argues against a total DNS or gateway outage.',
          supportsOutcome: true,
        },
        {
          questionTitle: 'Observed Symptom',
          answerLabel: getQuestionInfo('Q_SYMPTOM_ERROR', symptomError).label,
          implication:
            'A hang or timeout can mean TCP SYN never completes, which is different from “server IP address could not be found.”',
          supportsOutcome: true,
        },
      ],
      plainLanguageExplanation:
        'Think of DNS as looking up a street address and HTTP as knocking on the door. If other websites open, your “map” (DNS) and “roads” (routing) are probably working. A single site that spins until it times out often means that particular door is closed, the service crashed, or a guard (firewall) is dropping the knocks.',
      technicalExplanation:
        'After a successful A/AAAA lookup, the client sends TCP SYN to port 80/443. Connection refused (RST) isolates a closed socket. A timeout is weaker evidence: it may be RST-less filtering, congestion, or an upstream blackhole to that prefix.',
      whatIsWorking: [
        'Reported local Wi Fi or Ethernet link.',
        'Name-based access to other sites (implied by single site scope).',
      ],
      whatIsFailing: [
        'Completion of TCP/HTTP to the one destination, or a filter on that path.',
      ],
      limitations: [
        'The questionnaire cannot see TCP flags. Timeout ≠ RST.',
        'This is an educational interpretation, not a live port scan of the website you entered.',
      ],
      recommendedAction:
        'Compare this explanation with the DNS learning scenario. A separate service failure simulation is not included in the supplied Packet Tracer file.',
    };
  }

  // 8. DEFAULT FALLBACK: Inconclusive / ambiguous pattern
  return {
    outcome: 'INSUFFICIENT_INFO',
    scenarioId: null,
    title: 'Inconclusive: The answers do not clearly match DNS failure',
    summary:
      'Your combination of answers does not present the clear diagnostic fingerprint of a DNS-specific failure.',
    certainty: 'UNKNOWN_INSUFFICIENT',
    certaintyExplanation:
      'The symptoms could be caused by multiple competing factors (e.g., firewall policy, single web server outage, or slow connection).',
    evidence: [
      {
        questionTitle: 'Reported Pattern',
        answerLabel: `${getQuestionInfo('Q_SYMPTOM_ERROR', symptomError).label} (${getQuestionInfo('Q_SCOPE', scope).label})`,
        implication:
          'Ambiguous evidence that could stem from server congestion, firewall filtering, or route flapping.',
        supportsOutcome: false,
      },
    ],
    plainLanguageExplanation:
      'When only a single website fails or when connections simply time out without direct IP verification, the cause might be that the specific website is overloaded, or a firewall is blocking traffic, rather than your DNS being broken.',
    technicalExplanation:
      'Symptoms do not uniquely isolate Layer 7 DNS from Layer 4 TCP connection timeouts or remote server application faults.',
    whatIsWorking: ['Local connection appears active.'],
    whatIsFailing: ['Ambiguous failure point.'],
    limitations: [
      'Our deterministic rules avoid jumping to conclusions without supporting evidence.',
    ],
    recommendedAction:
      'You can review and change your answers to test other symptom combinations, or explore the DNS simulation directly.',
  };
}
