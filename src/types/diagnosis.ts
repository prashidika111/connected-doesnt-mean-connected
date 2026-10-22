/**
 * Core types for symptom gathering, rule evaluation, and diagnosis outcomes.
 * Uses stable string literal identifiers for questions and options.
 */

export type QuestionId =
  | 'Q_LINK_STATUS'
  | 'Q_TARGET_TYPE'
  | 'Q_SCOPE'
  | 'Q_SYMPTOM_ERROR'
  | 'Q_DIRECT_IP';

export interface Option {
  id: string;
  label: string;
  description?: string;
  hint?: string;
}

export interface Question {
  id: QuestionId;
  title: string;
  subtitle: string;
  category: 'physical' | 'service' | 'scope' | 'symptom' | 'evidence';
  options: Option[];
  whyItMatters: string;
}

export type UserAnswers = Record<QuestionId, string>;

export type CertaintyLevel =
  | 'CONFIRMED_BY_CHECK'
  | 'LIKELY'
  | 'UNKNOWN_INSUFFICIENT'
  | 'CONTRADICTORY';

export type DiagnosticOutcome =
  | 'DNS_MATCH'
  | 'HTTP_SERVICE_MATCH'
  | 'INSUFFICIENT_INFO'
  | 'CONTRASTING_LOCAL_OFFLINE'
  | 'CONTRASTING_SERVER_ERROR'
  | 'CONTRASTING_GENERAL_OUTAGE';

export interface EvidenceItem {
  questionTitle: string;
  answerLabel: string;
  implication: string;
  supportsOutcome: boolean;
}

export interface EvaluationResult {
  outcome: DiagnosticOutcome;
  scenarioId: string | null;
  title: string;
  summary: string;
  certainty: CertaintyLevel;
  certaintyExplanation: string;
  evidence: EvidenceItem[];
  plainLanguageExplanation: string;
  technicalExplanation: string;
  whatIsWorking: string[];
  whatIsFailing: string[];
  limitations: string[];
  recommendedAction: string;
}
