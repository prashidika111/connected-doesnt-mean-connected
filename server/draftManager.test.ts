import { describe, expect, it, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getSavedDrafts, saveDraft, deleteDraft } from './draftManager';
import { ImportedDraftScenario } from '../src/types/importer';

const DRAFTS_FILE = path.resolve(__dirname, 'drafts.json');

describe('Lab Importer - Scenario Draft Store', () => {
  const testDraftId = 'test-draft-xyz-999';

  afterEach(() => {
    // Clean up test draft
    deleteDraft(testDraftId);
  });

  it('can save and retrieve a scenario draft', () => {
    const draft: ImportedDraftScenario = {
      id: testDraftId,
      scenarioId: 'DNS-01-CUSTOM',
      title: 'Custom DNS Test Scenario',
      category: 'Name Resolution',
      teachingGoal: 'Test draft persistence',
      verificationStatus: 'draft',
      devices: [
        {
          name: 'HostA',
          type: 'PC',
          ipAddress: '10.0.0.5',
          subnetMask: '255.255.255.0',
          defaultGateway: '10.0.0.1',
          role: 'Client test',
        },
      ],
      connections: ['HostA <-> Switch1'],
      baselineBehavior: {
        userAction: 'Open test',
        expectedDnsQuery: 'Query',
        expectedBrowserOutput: 'Loads',
      },
      faultInjection: {
        faultType: 'Fault',
        configurationChange: 'Change',
        affectedComponent: 'HostA',
      },
      failureBehavior: {
        userAction: 'Open test',
        observedDnsResult: 'Fails',
        observedBrowserOutput: 'Fails',
        observedPingResult: 'Passes',
        contrastInsight: 'Insight',
      },
      baselineEvents: [],
      faultEvents: [],
      reproductionSteps: ['Step 1'],
      evidenceNotes: ['Note 1'],
      lastModified: Date.now(),
    };

    const saveRes = saveDraft(draft);
    expect(saveRes.success).toBe(true);

    const drafts = getSavedDrafts();
    const found = drafts.find((d) => d.id === testDraftId);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Custom DNS Test Scenario');
    expect(found?.devices[0].name).toBe('HostA');
  });

  it('can delete an existing draft', () => {
    const draft: ImportedDraftScenario = {
      id: testDraftId,
      scenarioId: 'TEST-DEL',
      title: 'To Be Deleted',
      category: 'Testing',
      teachingGoal: 'Delete test',
      verificationStatus: 'draft',
      devices: [],
      connections: [],
      baselineBehavior: { userAction: '', expectedDnsQuery: '', expectedBrowserOutput: '' },
      faultInjection: { faultType: '', configurationChange: '', affectedComponent: '' },
      failureBehavior: { userAction: '', observedDnsResult: '', observedBrowserOutput: '', observedPingResult: '', contrastInsight: '' },
      baselineEvents: [],
      faultEvents: [],
      reproductionSteps: [],
      evidenceNotes: [],
      lastModified: Date.now(),
    };

    saveDraft(draft);
    expect(getSavedDrafts().some((d) => d.id === testDraftId)).toBe(true);

    const delRes = deleteDraft(testDraftId);
    expect(delRes.success).toBe(true);
    expect(getSavedDrafts().some((d) => d.id === testDraftId)).toBe(false);
  });
});
