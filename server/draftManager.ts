import fs from 'node:fs';
import path from 'node:path';
import { ImportedDraftScenario } from '../src/types/importer';

const DRAFTS_FILE = path.resolve(__dirname, 'drafts.json');

export function getSavedDrafts(): ImportedDraftScenario[] {
  try {
    if (!fs.existsSync(DRAFTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DRAFTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft: ImportedDraftScenario): { success: boolean; error?: string } {
  try {
    if (!draft || !draft.id || !draft.title) {
      return { success: false, error: 'Draft requires an id and title.' };
    }
    const drafts = getSavedDrafts();
    const existingIndex = drafts.findIndex((d) => d.id === draft.id);
    if (existingIndex >= 0) {
      drafts[existingIndex] = { ...draft, lastModified: Date.now() };
    } else {
      drafts.push({ ...draft, lastModified: Date.now() });
    }
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save draft.' };
  }
}

export function deleteDraft(id: string): { success: boolean; error?: string } {
  try {
    const drafts = getSavedDrafts().filter((d) => d.id !== id);
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2), 'utf8');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete draft.' };
  }
}
