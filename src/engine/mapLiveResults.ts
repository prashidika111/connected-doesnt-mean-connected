import { EvaluationResult } from '../types/diagnosis';
import { CheckOutcome, InvestigationResult } from '../types/investigation';

function check(checks: CheckOutcome[], id: CheckOutcome['id']): CheckOutcome | undefined {
  return checks.find((c) => c.id === id);
}

/**
 * Map measured helper checks onto the existing educational diagnosis outcomes.
 * Live evidence is labeled as measured from the helper, not the user's NIC.
 */
export function evaluationFromLiveInvestigation(
  investigation: InvestigationResult
): EvaluationResult {
  const dns = check(investigation.checks, 'dns');
  const tcp = check(investigation.checks, 'tcp');
  const http = check(investigation.checks, 'http');
  const targetLabel = investigation.target?.display ?? investigation.target?.hostname ?? 'the target';

  const evidenceFromChecks = investigation.checks.map((c) => ({
    questionTitle: c.title,
    answerLabel: `${c.status} · ${c.executionLocation}`,
    implication: c.summary,
    supportsOutcome: c.status === 'failed' || c.status === 'passed',
  }));

  if (!investigation.accepted || !investigation.target) {
    return {
      outcome: 'INSUFFICIENT_INFO',
      scenarioId: null,
      title: 'Target Rejected Before Any Check Ran',
      summary:
        investigation.rejectedReason ??
        'The URL or IP was malformed or unsafe, so no network checks were executed.',
      certainty: 'UNKNOWN_INSUFFICIENT',
      certaintyExplanation:
        'Checks are never marked passed or failed unless they actually ran against an accepted public target.',
      evidence: evidenceFromChecks,
      plainLanguageExplanation:
        'The investigator only talks to public HTTP/HTTPS destinations. Private, loopback, and unusual URL schemes are blocked on purpose so this tool cannot be used as an open scanner of internal networks.',
      technicalExplanation:
        'Input validation runs before DNS. Rejected targets produce no sockets and no HTTP requests.',
      whatIsWorking: ['Input validation and SSRF guards.'],
      whatIsFailing: ['No live probe was issued.'],
      limitations: [
        'A rejected target is not a diagnosis of the user’s home network.',
      ],
      recommendedAction: 'Enter a public hostname such as example.com, or a public IPv4 address.',
    };
  }

  if (dns?.status === 'failed') {
    return {
      outcome: 'DNS_MATCH',
      scenarioId: 'DNS-01',
      title: 'Helper DNS Lookup Failed for This Hostname',
      summary: `From the diagnostic helper, ${targetLabel} did not resolve to an IP address. A browser using this same resolver path would not know which host to contact.`,
      certainty: 'CONFIRMED_BY_CHECK',
      certaintyExplanation:
        'The DNS failure was measured by Node.js dns.lookup on the machine running this app. It is not a capture of your laptop’s stub resolver, and it does not prove your Wi-Fi is healthy.',
      evidence: evidenceFromChecks,
      plainLanguageExplanation:
        'The internet routes packets to numbers, not names. If the name cannot be translated into an IP address, the web request stops before any TCP handshake toward a web server.',
      technicalExplanation:
        dns.detail ||
        'Helper DNS resolution returned no usable address (NXDOMAIN, SERVFAIL, timeout, or empty answer).',
      whatIsWorking: [
        'The helper process was able to attempt a DNS query (the check ran).',
      ],
      whatIsFailing: [
        'Hostname translation for the submitted name, as seen by the helper resolver.',
      ],
      limitations: [
        dns.limitations,
        'Your device may use a different resolver (ISP, router, or DoH) than this helper.',
        'A missing public DNS record is different from a broken home DNS setting, but both produce “server IP address could not be found” in a browser.',
      ],
      recommendedAction:
        'Compare this with the DNS Packet Tracer lab (DNS-01), where the client DNS server IP is pointed at a non-existent address while direct IP ping still works.',
    };
  }

  if (tcp?.status === 'failed' && (dns?.status === 'passed' || dns?.status === 'not-tested')) {
    const refused = String(tcp.evidence.errorCode ?? '') === 'ECONNREFUSED';
    return {
      outcome: 'HTTP_SERVICE_MATCH',
      scenarioId: 'SRV-04',
      title: refused
        ? 'DNS Worked; TCP Port Was Refused'
        : 'DNS Worked; TCP/HTTP Connectivity Failed',
      summary: `The helper resolved or already had an IP for ${targetLabel}, but it could not complete a TCP connection to port ${investigation.target.port}.`,
      certainty: 'CONFIRMED_BY_CHECK',
      certaintyExplanation:
        'TCP failure was measured with a Node.js socket from the helper host to the resolved public IP. Firewalls between the helper and the target can look identical to a down service.',
      evidence: evidenceFromChecks,
      plainLanguageExplanation:
        refused
          ? 'The destination computer answered “nobody is listening on that door.” The path to the machine exists; the web service on that port does not (or a firewall sent a reset).'
          : 'The helper knew the IP address but never finished the TCP handshake. That can be a closed port, a dropped packet, or a filter along the path — this check cannot always tell those apart.',
      technicalExplanation: tcp.detail,
      whatIsWorking: [
        dns?.status === 'passed'
          ? 'DNS resolution of the hostname (measured on the helper).'
          : 'Literal IP target (DNS not required).',
      ],
      whatIsFailing: [
        `TCP connectivity to port ${investigation.target.port} from the helper.`,
      ],
      limitations: [
        tcp.limitations,
        http?.limitations ?? 'HTTP was not attempted because TCP did not complete.',
        'This is not a scan of your LAN and not a Packet Tracer API result.',
      ],
      recommendedAction:
        'Compare this with scenario SRV-04 in the Scenario Library to observe how Layer 3 ping and DNS can work while Layer 4 TCP port 80/443 is refused or stopped.',
    };
  }

  if (http && tcp?.status === 'passed' && http.status === 'passed') {
    const statusCode = Number(http.evidence.statusCode ?? 0);
    if (statusCode >= 400) {
      return {
        outcome: 'CONTRASTING_SERVER_ERROR',
        scenarioId: 'HTTP-05',
        title: 'Network Path Worked; The Web Server Returned an Error Page',
        summary: `HTTP ${statusCode} was received from ${targetLabel}. DNS and TCP succeeded from the helper, so the network path is fully operational and the error originates in the web server application.`,
        certainty: 'CONFIRMED_BY_CHECK',
        certaintyExplanation:
          'An HTTP status code proves the helper completed DNS (if needed), TCP 3-way handshake, and an HTTP request/response exchange.',
        evidence: evidenceFromChecks,
        plainLanguageExplanation:
          'Seeing 404 or 500 means the network did its job completely: the name was found, the server was reached, and the server answered. The page was simply missing or crashed on the server.',
        technicalExplanation: http.detail,
        whatIsWorking: [
          'DNS (if the target was a hostname).',
          `TCP port ${investigation.target.port}.`,
          'HTTP response received successfully.',
        ],
        whatIsFailing: ['Application content or server-side logic on the destination host.'],
        limitations: [http.limitations],
        recommendedAction:
          'Compare this with scenario HTTP-05 in the Scenario Library, illustrating how application errors are distinct from network reachability failures.',
      };
    }
  }

  if (
    (dns?.status === 'passed' || dns?.status === 'not-tested') &&
    tcp?.status === 'passed' &&
    (http?.status === 'passed' || http?.status === 'inconclusive')
  ) {
    return {
      outcome: 'INSUFFICIENT_INFO',
      scenarioId: null,
      title: 'Helper Reached This Public Target',
      summary: `From the diagnostic helper, ${targetLabel} was reachable at the layers we actually tested. That does not prove the same URL works on your device.`,
      certainty: 'LIKELY',
      certaintyExplanation:
        'Successful helper checks confirm a public path from this app’s host. Your browser, DNS, firewall, or captive portal can still fail independently.',
      evidence: evidenceFromChecks,
      plainLanguageExplanation:
        'If a website loads from this checker but not from your laptop, the break is likely local to your device or network, not a global outage of that name. Use the symptom questionnaire to reason about which local stage might differ.',
      technicalExplanation:
        'Measured helper DNS and TCP succeeded. HTTP may be passed or inconclusive (for example TLS or redirects were bounded).',
      whatIsWorking: [
        'Public DNS and/or TCP from the helper host to this target.',
      ],
      whatIsFailing: ['No helper-measured failure on the tested stages.'],
      limitations: investigation.checks.map((c) => c.limitations),
      recommendedAction:
        'If your device still cannot load the URL, complete the five-question questionnaire — helper success does not diagnose Wi-Fi, VPN, or a local DNS override.',
    };
  }

  return {
    outcome: 'INSUFFICIENT_INFO',
    scenarioId: null,
    title: 'Live Checks Did Not Isolate a Single Failure Stage',
    summary:
      'Some checks were unavailable, inconclusive, or not tested. The helper will not invent a passed/failed mark for a probe that did not run.',
    certainty: 'UNKNOWN_INSUFFICIENT',
    certaintyExplanation:
      'When DNS, TCP, and HTTP evidence is incomplete, several causes remain possible.',
    evidence: evidenceFromChecks,
    plainLanguageExplanation:
      'Honest diagnosis stops when the evidence stops. A missing test is labeled not-tested or unavailable, never passed.',
    technicalExplanation:
      'See individual check statuses. Helper downtime, timeouts, TLS policy, or skipped DNS for literal IPs can all leave gaps.',
    whatIsWorking: ['Validation and explicit status labeling.'],
    whatIsFailing: ['Insufficient measured evidence to name one educational scenario.'],
    limitations: investigation.checks.map((c) => c.limitations),
    recommendedAction:
      'Retry while `npm run dev` is running, try example.com, or use the questionnaire if the helper cannot reach the network.',
  };
}

export function mappedScenarioFromInvestigation(investigation: InvestigationResult): {
  mappedScenarioId: string | null;
  mappedOutcome: string;
  educationalHeadline: string;
  educationalSummary: string;
  certaintyNote: string;
} {
  const evaluation = evaluationFromLiveInvestigation(investigation);
  return {
    mappedScenarioId: evaluation.scenarioId,
    mappedOutcome: evaluation.outcome,
    educationalHeadline: evaluation.title,
    educationalSummary: evaluation.summary,
    certaintyNote: evaluation.certaintyExplanation,
  };
}
