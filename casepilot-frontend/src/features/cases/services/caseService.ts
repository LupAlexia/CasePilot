import type { LegalCase, LegalCaseInput } from '../types/case';

export const caseService = {
  createCase(input: LegalCaseInput): LegalCase {
    return {
      id: crypto.randomUUID(),
      ...input,
      documents: [],
      hearings: []
    };
  }
};
