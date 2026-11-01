import {
  CheckOutcome,
  InvestigationResult,
  PathStageView,
} from '../types/investigation';
import { NetworkStage, StageStatus } from '../types/scenario';

function findCheck(checks: CheckOutcome[], id: CheckOutcome['id']): CheckOutcome | undefined {
  return checks.find((c) => c.id === id);
}

function visualStatus(
  checkStatus: CheckOutcome['status'] | undefined,
  fallback: StageStatus = 'untested'
): StageStatus {
  if (!checkStatus) return fallback;
  switch (checkStatus) {
    case 'passed':
      return 'success';
    case 'failed':
      return 'error';
    case 'inconclusive':
      return 'warning';
    case 'unavailable':
      return 'warning';
    case 'not-tested':
    default:
      return 'untested';
  }
}

/**
 * Build request-path stages from actual check outcomes.
 * Local NIC / Wi-Fi / user gateway are never claimed as measured from this helper.
 */
export function pathStagesFromChecks(checks: CheckOutcome[]): PathStageView[] {
  const dns = findCheck(checks, 'dns');
  const tcp = findCheck(checks, 'tcp');
  const http = findCheck(checks, 'http');

  const dnsFailed = dns?.status === 'failed';

  let destinationStatus: StageStatus = 'untested';
  if (dnsFailed) {
    destinationStatus = 'bypassed';
  } else if (http && http.status !== 'not-tested') {
    destinationStatus = visualStatus(http.status, 'untested');
    if (http.status === 'passed' && Number(http.evidence?.statusCode ?? 0) >= 400) {
      destinationStatus = 'warning';
    }
  } else if (tcp && tcp.status !== 'not-tested') {
    destinationStatus = visualStatus(tcp.status, 'untested');
  }

  // Gateway: inferred only — helper is not the user's home router.
  let gatewayVisual: StageStatus = 'untested';
  let gatewayProvenance: PathStageView['provenance'] = 'not-tested';
  let gatewayDescription =
    'Not tested. This application cannot read your default gateway or routing table.';

  const helperProducedNetworkEvidence = checks.some(
    (c) =>
      c.executionLocation === 'local-diagnostic-helper' &&
      (c.status === 'passed' || c.status === 'failed')
  );

  if (helperProducedNetworkEvidence) {
    gatewayVisual = 'warning';
    gatewayProvenance = 'inferred';
    gatewayDescription =
      'Inferred only: the diagnostic helper sent packets from the machine running this app. That is not a measurement of your laptop’s default gateway.';
  }

  return [
    {
      id: 'device',
      name: 'Client Device',
      role: 'Your OS & network adapter',
      status: 'untested',
      provenance: 'conceptual',
      description:
        'Conceptual stage. A browser page cannot inspect your Wi-Fi association, NIC state, or DHCP lease.',
    },
    {
      id: 'local_link',
      name: 'Local Connection',
      role: 'Wi-Fi / Ethernet link',
      status: 'untested',
      provenance: 'not-tested',
      description:
        'Not tested. Link-layer association and switch connectivity are not visible to this web app.',
    },
    {
      id: 'gateway_router',
      name: 'Routing & Gateway',
      role: 'Default gateway / ISP path',
      status: gatewayVisual,
      provenance: gatewayProvenance,
      description: gatewayDescription,
    },
    {
      id: 'dns',
      name: 'DNS Name Resolution',
      role: 'Hostname → IP (helper DNS)',
      status: visualStatus(dns?.status),
      provenance: dns?.provenance ?? 'not-tested',
      description:
        dns?.summary ??
        'DNS was not run (for example the target was already a literal IP, or the helper was unavailable).',
    },
    {
      id: 'destination',
      name: 'Destination Service',
      role: 'TCP / HTTP(S) on the target',
      status: destinationStatus,
      provenance: (http?.provenance ?? tcp?.provenance ?? 'not-tested') as PathStageView['provenance'],
      description:
        http?.summary ??
        tcp?.summary ??
        'TCP and HTTP were not run. Destination reachability is unknown.',
    },
  ];
}

export function toNetworkStages(path: PathStageView[]): NetworkStage[] {
  return path.map((stage) => ({
    id: stage.id,
    name: stage.name,
    role: stage.role,
    status: stage.status,
    description: `${stage.description} [Provenance: ${stage.provenance}]`,
    provenance: stage.provenance,
  }));
}

export function attachPath(result: Omit<InvestigationResult, 'pathStages'>): InvestigationResult {
  return {
    ...result,
    pathStages: pathStagesFromChecks(result.checks),
  };
}
