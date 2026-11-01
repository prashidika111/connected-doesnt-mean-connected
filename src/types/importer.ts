import { SimulationDevice } from './scenario';
import { SimulationPacketEvent, TopologyLink } from './simulation';

export type VerificationStatus =
  | 'draft'
  | 'imported_needs_review'
  | 'topology_configured'
  | 'model_configured'
  | 'awaiting_cisco_verification'
  | 'verified_pkt'
  | 'published';

export interface PktExtractionReport {
  fileName: string;
  fileSize: number;
  sha256: string;
  detectedFormat:
    | 'pt7_8_twofish_eax'
    | 'unencrypted_pt_xml'
    | 'unsupported_binary'
    | 'corrupt';
  formatDescription: string;
  extractionSuccess: boolean;
  message: string;
  extractedDevices: SimulationDevice[];
  extractedConnections: string[];
  guidedFallbackRequired: boolean;
  notes: string[];
}

export interface ImportedDraftScenario {
  id: string;
  scenarioId: string;
  title: string;
  category: string;
  teachingGoal: string;
  verificationStatus: VerificationStatus;
  rawPktFileName?: string;
  rawPktFileSize?: number;
  rawPktSha256?: string;
  devices: SimulationDevice[];
  connections: string[];
  links?: TopologyLink[];
  baselineBehavior: {
    userAction: string;
    expectedDnsQuery: string;
    expectedBrowserOutput: string;
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
  baselineEvents: SimulationPacketEvent[];
  faultEvents: SimulationPacketEvent[];
  reproductionSteps: string[];
  evidenceNotes: string[];
  lastModified: number;
}
