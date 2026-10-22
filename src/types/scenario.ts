/**
 * Scenario metadata and Packet Tracer experiment specifications.
 */

export type StageStatus = 'success' | 'warning' | 'error' | 'untested' | 'bypassed';
export type StageProvenance =
  | 'measured'
  | 'inferred'
  | 'simulated'
  | 'conceptual'
  | 'not-tested';

export interface NetworkStage {
  id: 'device' | 'local_link' | 'gateway_router' | 'dns' | 'destination';
  name: string;
  role: string;
  status: StageStatus;
  description: string;
  provenance?: StageProvenance;
}

export interface SimulationDevice {
  name: string;
  type: 'PC' | 'Switch' | 'Router' | 'Server';
  ipAddress: string;
  subnetMask: string;
  defaultGateway: string;
  dnsServer?: string;
  role: string;
}

export interface ScenarioExperiment {
  scenarioId: string;
  title: string;
  category: string;
  teachingGoal: string;
  baselineTopology: {
    description: string;
    devices: SimulationDevice[];
    connections: string[];
  };
  baselineBehavior: {
    userAction: string;
    expectedDnsQuery: string;
    expectedBrowserOutput: string;
    status: string;
  };
  faultInjection: {
    faultType: string;
    configurationChange: string;
    affectedComponent: string;
  };
  failureBehavior: {
    userAction: string;
    observedDnsResult: string;
    observedBrowserOutput: string;
    observedPingResult: string;
    contrastInsight: string;
  };
  packetInspectionCheckpoints: {
    step: number;
    protocol: string;
    event: string;
    whatToObserve: string;
  }[];
  fileStatus: {
    hasVerifiedPkt: boolean;
    suggestedFileName: string;
    fileDirectory: string;
    manualStepsRequired: string[];
  };
}
