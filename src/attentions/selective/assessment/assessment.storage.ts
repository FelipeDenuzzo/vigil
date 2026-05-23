/* src/attentions/selective/assessment/assessment.storage.ts */

import type {
  SelectiveAttentionAssessmentResult,
  StoredAssessmentRecord,
} from './assessment.types';

const STORAGE_KEY = 'atento.selective.assessment.results';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStorage(): StoredAssessmentRecord[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue as StoredAssessmentRecord[];
  } catch {
    return [];
  }
}

function writeStorage(records: StoredAssessmentRecord[]): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export class AssessmentStorage {
  getAll(): StoredAssessmentRecord[] {
    return readStorage();
  }

  getBySessionId(sessionId: string): StoredAssessmentRecord | null {
    const records = readStorage();

    return records.find((record) => record.sessionId === sessionId) ?? null;
  }

  save(result: SelectiveAttentionAssessmentResult): StoredAssessmentRecord {
    const records = readStorage();

    const record: StoredAssessmentRecord = {
      sessionId: result.sessionId,
      gameKey: result.gameKey,
      createdAt: result.createdAt,
      result,
    };

    const nextRecords = records.filter(
      (existingRecord) => existingRecord.sessionId !== result.sessionId
    );

    nextRecords.unshift(record);

    writeStorage(nextRecords);

    return record;
  }

  remove(sessionId: string): void {
    const records = readStorage();
    const nextRecords = records.filter((record) => record.sessionId !== sessionId);

    writeStorage(nextRecords);
  }

  clear(): void {
    if (!isBrowser()) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const assessmentStorage = new AssessmentStorage();