import { create } from 'zustand';
import { initialCases } from '../data/mockCases';
import { caseService } from '../services/caseService';
import type { LegalCase, LegalCaseInput } from '../types/case';

interface CasesState {
  cases: LegalCase[];
  setCases: (cases: LegalCase[]) => void;
  addCase: (input: LegalCaseInput) => void;
  updateCase: (id: string, input: LegalCaseInput) => void;
  deleteCase: (id: string) => void;
  getCaseById: (id: string) => LegalCase | undefined;
  resetCases: () => void;
}

export const useCaseStore = create<CasesState>((set, get) => ({
  cases: initialCases,
  setCases: (cases) => set({ cases }),
  addCase: (input) =>
    set((state) => ({
      cases: [caseService.createCase(input), ...state.cases]
    })),
  updateCase: (id, input) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id === id
          ? {
              ...item,
              ...input
            }
          : item
      )
    })),
  deleteCase: (id) =>
    set((state) => ({
      cases: state.cases.filter((item) => item.id !== id)
    })),
  getCaseById: (id) => get().cases.find((item) => item.id === id),
  resetCases: () => set({ cases: initialCases })
}));
