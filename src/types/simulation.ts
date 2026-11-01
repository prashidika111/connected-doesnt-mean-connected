/**
 * Types for browser-based interactive network experiment simulation.
 */

export type ProtocolType = 'DNS' | 'TCP' | 'HTTP' | 'ICMP' | 'ARP' | 'DHCP';

export type EventOutcome = 'success' | 'failure' | 'timeout' | 'bypassed';

export interface TopologyDeviceNode {
  id: string;
  name: string;
  type: 'PC' | 'Switch' | 'Router' | 'Server';
  ipAddress: string;
  subnetMask: string;
  defaultGateway: string;
  dnsServer?: string;
  role: string;
  /** Normalized coordinates for canvas/SVG layout (0 to 100) */
  x: number;
  y: number;
  /** Active status badge or override */
  state?: 'normal' | 'faulty' | 'active' | 'unreachable';
}

export interface TopologyLink {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  status: 'up' | 'down' | 'degraded';
}

export interface SimulationPacketEvent {
  step: number;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  /** Path hops traversed for packet animation */
  pathNodeIds: string[];
  protocol: ProtocolType;
  port?: string;
  summary: string;
  payloadDetail: string;
  outcome: EventOutcome;
  simpleExplanation: string;
  technicalExplanation: string;
  /** Cisco Packet Tracer Simulation Mode reference checkpoint */
  packetTracerCheckpoint?: string;
}

export interface InteractiveScenarioData {
  scenarioId: string;
  title: string;
  userFacingSymptom: string;
  learningGoal: string;
  nodes: TopologyDeviceNode[];
  links: TopologyLink[];
  /** Control baseline event sequence */
  baselineEvents: SimulationPacketEvent[];
  /** Fault injected event sequence */
  faultEvents: SimulationPacketEvent[];
  /** Optional direct IP access event sequence (for DNS failure contrast) */
  directIpEvents?: SimulationPacketEvent[];
  faultedNodeId?: string;
  faultDescription: string;
  baselineSummary: string;
  failureSummary: string;
  contrastInsight: string;
  ciscoVerificationNotes: string[];
}
