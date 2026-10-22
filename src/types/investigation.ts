/**
 * Typed structures for URL/IP investigation, live check outcomes,
 * provenance labels, and mapping into the educational diagnosis system.
 */

export type CheckStatus =
  | 'passed'
  | 'failed'
  | 'inconclusive'
  | 'unavailable'
  | 'not-tested';

export type ProvenanceKind =
  | 'measured'
  | 'inferred'
  | 'simulated'
  | 'conceptual'
  | 'not-tested';

export type ExecutionLocation =
  | 'local-diagnostic-helper'
  | 'browser'
  | 'not-executed';

export type TargetKind = 'hostname' | 'ipv4' | 'ipv6';

export interface ParsedTarget {
  rawInput: string;
  kind: TargetKind;
  protocol: 'http' | 'https';
  hostname: string;
  port: 80 | 443;
  pathname: string;
  search: string;
  display: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export type TargetParseResult =
  | { ok: true; target: ParsedTarget }
  | { ok: false; issues: ValidationIssue[] };

export type CheckKind = 'dns' | 'tcp' | 'http';

export interface CheckOutcome {
  id: CheckKind;
  title: string;
  status: CheckStatus;
  provenance: ProvenanceKind;
  executionLocation: ExecutionLocation;
  summary: string;
  detail: string;
  limitations: string;
  durationMs: number | null;
  evidence: Record<string, string | number | boolean | string[] | null>;
}

export interface PathStageView {
  id: 'device' | 'local_link' | 'gateway_router' | 'dns' | 'destination';
  name: string;
  role: string;
  status: 'success' | 'warning' | 'error' | 'untested' | 'bypassed';
  provenance: ProvenanceKind;
  description: string;
}

export interface InvestigationResult {
  accepted: boolean;
  rejectedReason: string | null;
  target: ParsedTarget | null;
  ranAt: string;
  helperLabel: string;
  checks: CheckOutcome[];
  pathStages: PathStageView[];
  mappedScenarioId: string | null;
  mappedOutcome: string | null;
  educationalHeadline: string;
  educationalSummary: string;
  certaintyNote: string;
}
