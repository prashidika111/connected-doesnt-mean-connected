import { describe, it, expect } from 'vitest';
import { evaluateAnswers } from './evaluator';
import { UserAnswers } from '../types/diagnosis';

describe('Deterministic Rule Evaluator', () => {
  const classicDnsAnswers: UserAnswers = {
    Q_LINK_STATUS: 'LINK_WIFI_ETH_OK',
    Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
    Q_SCOPE: 'SCOPE_ALL_WEBSITES',
    Q_SYMPTOM_ERROR: 'ERROR_NAME_RESOLUTION',
    Q_DIRECT_IP: 'IP_NOT_TESTED',
  };

  const dnsWithDirectIpAnswers: UserAnswers = {
    Q_LINK_STATUS: 'LINK_WIFI_ETH_OK',
    Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
    Q_SCOPE: 'SCOPE_ALL_WEBSITES',
    Q_SYMPTOM_ERROR: 'ERROR_NAME_RESOLUTION',
    Q_DIRECT_IP: 'IP_WORKS',
  };

  const contrastingOfflineAnswers: UserAnswers = {
    Q_LINK_STATUS: 'LINK_DISCONNECTED',
    Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
    Q_SCOPE: 'SCOPE_ALL_WEBSITES',
    Q_SYMPTOM_ERROR: 'ERROR_NO_INTERNET_BANNER',
    Q_DIRECT_IP: 'IP_FAILS',
  };

  const contrastingServerErrorAnswers: UserAnswers = {
    Q_LINK_STATUS: 'LINK_WIFI_ETH_OK',
    Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
    Q_SCOPE: 'SCOPE_SINGLE_SPECIFIC',
    Q_SYMPTOM_ERROR: 'ERROR_HTTP_STATUS',
    Q_DIRECT_IP: 'IP_NOT_TESTED',
  };

  const contrastingGeneralOutageAnswers: UserAnswers = {
    Q_LINK_STATUS: 'LINK_WIFI_ETH_OK',
    Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
    Q_SCOPE: 'SCOPE_ALL_APPS_DEAD',
    Q_SYMPTOM_ERROR: 'ERROR_NO_INTERNET_BANNER',
    Q_DIRECT_IP: 'IP_FAILS',
  };

  const inconclusiveAnswers: UserAnswers = {
    Q_LINK_STATUS: 'LINK_NOT_SURE',
    Q_TARGET_TYPE: 'TARGET_NOT_SURE',
    Q_SCOPE: 'SCOPE_NOT_SURE',
    Q_SYMPTOM_ERROR: 'ERROR_NOT_SURE',
    Q_DIRECT_IP: 'IP_NOT_TESTED',
  };

  it('selects DNS educational scenario (DNS-01) for classic DNS-consistent answers', () => {
    const result = evaluateAnswers(classicDnsAnswers);
    expect(result.outcome).toBe('DNS_MATCH');
    expect(result.scenarioId).toBe('DNS-01');
    expect(result.certainty).toBe('LIKELY');
    expect(result.evidence.length).toBeGreaterThanOrEqual(3);
    expect(result.title).toContain('DNS');
    expect(result.whatIsWorking.length).toBeGreaterThan(0);
    expect(result.whatIsFailing.length).toBeGreaterThan(0);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it('reinforces DNS match when direct IP access is confirmed to work', () => {
    const result = evaluateAnswers(dnsWithDirectIpAnswers);
    expect(result.outcome).toBe('DNS_MATCH');
    expect(result.scenarioId).toBe('DNS-01');
    const directIpEvidence = result.evidence.find((e) =>
      e.questionTitle.includes('Direct IP')
    );
    expect(directIpEvidence).toBeDefined();
    expect(directIpEvidence?.supportsOutcome).toBe(true);
  });

  it('handles incomplete answer patterns appropriately as INSUFFICIENT_INFO', () => {
    const incompleteAnswers: Partial<UserAnswers> = {
      Q_LINK_STATUS: 'LINK_WIFI_ETH_OK',
      Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
      // Missing remaining 3 questions
    };

    const result = evaluateAnswers(incompleteAnswers);
    expect(result.outcome).toBe('INSUFFICIENT_INFO');
    expect(result.scenarioId).toBeNull();
    expect(result.certainty).toBe('UNKNOWN_INSUFFICIENT');
    expect(result.recommendedAction).toContain('complete all questions');
  });

  it('does NOT force DNS when local physical link is disconnected', () => {
    const result = evaluateAnswers(contrastingOfflineAnswers);
    expect(result.outcome).toBe('CONTRASTING_LOCAL_OFFLINE');
    expect(result.scenarioId).toBeNull();
    expect(result.title).toContain('Local Link Disconnected');
    expect(result.plainLanguageExplanation).toContain('cable or connected to Wi-Fi');
  });

  it('does NOT force DNS when symptom is an HTTP 404/500 server error', () => {
    const result = evaluateAnswers(contrastingServerErrorAnswers);
    expect(result.outcome).toBe('CONTRASTING_SERVER_ERROR');
    expect(result.scenarioId).toBeNull();
    expect(result.title).toContain('Web Server Error');
    expect(result.plainLanguageExplanation).toContain('DNS all worked');
  });

  it('identifies general uplink outage when direct IP fails across all apps', () => {
    const result = evaluateAnswers(contrastingGeneralOutageAnswers);
    expect(result.outcome).toBe('CONTRASTING_GENERAL_OUTAGE');
    expect(result.scenarioId).toBeNull();
    expect(result.title).toContain('Outage');
  });

  it('flags inconclusive when user provides too many "Not sure" answers', () => {
    const result = evaluateAnswers(inconclusiveAnswers);
    expect(result.outcome).toBe('INSUFFICIENT_INFO');
    expect(result.certainty).toBe('UNKNOWN_INSUFFICIENT');
    expect(result.summary).toContain('Not sure');
  });

  it('guarantees determinism: same answers always produce identical results', () => {
    const result1 = evaluateAnswers(classicDnsAnswers);
    const result2 = evaluateAnswers(classicDnsAnswers);
    expect(result1).toEqual(result2);
  });

  it('reevaluates cleanly when answers are updated', () => {
    // Start with DNS answers
    const initial = evaluateAnswers(classicDnsAnswers);
    expect(initial.outcome).toBe('DNS_MATCH');

    // Change only link status to disconnected
    const updatedAnswers: UserAnswers = {
      ...classicDnsAnswers,
      Q_LINK_STATUS: 'LINK_DISCONNECTED',
    };
    const revised = evaluateAnswers(updatedAnswers);
    expect(revised.outcome).toBe('CONTRASTING_LOCAL_OFFLINE');
    expect(revised.scenarioId).toBeNull();
  });
});
