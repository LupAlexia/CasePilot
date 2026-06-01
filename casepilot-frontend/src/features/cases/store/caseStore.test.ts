import { useCaseStore } from './caseStore';

describe('caseStore', () => {
  beforeEach(() => {
    useCaseStore.getState().resetCases();
  });

  it('adauga dosar nou la început', () => {
    const randomUUID = vi.fn(() => 'new-case-id');
    vi.stubGlobal('crypto', { randomUUID });

    useCaseStore.getState().addCase({
      number: '7777/2026',
      registrationDate: '2026-03-10',
      court: 'Tribunal',
      object: 'Pretenții',
      reclamant: 'SC Client SRL',
      parat: 'SC Debitor SRL',
      stage: 'Fond',
      status: 'Activ'
    });

    const state = useCaseStore.getState();
    expect(state.cases[0].id).toBe('new-case-id');
    expect(state.cases[0].number).toBe('7777/2026');

    vi.unstubAllGlobals();
  });

  it('actualizeaza dosar existent', () => {
    useCaseStore.getState().updateCase('1', {
      number: '1234/2024',
      registrationDate: '2024-01-10',
      court: 'Tribunalul Nou',
      object: 'Obiect nou',
      reclamant: 'SC ACME SRL',
      parat: 'SC BETA INDUSTRIES SRL',
      stage: 'Apel',
      status: 'Amânat'
    });

    const updated = useCaseStore.getState().getCaseById('1');
    expect(updated?.court).toBe('Tribunalul Nou');
    expect(updated?.stage).toBe('Apel');
  });

  it('sterge dosar după id', () => {
    useCaseStore.getState().deleteCase('2');

    expect(useCaseStore.getState().getCaseById('2')).toBeUndefined();
  });

  it('resetează lista de dosare', () => {
    useCaseStore.getState().deleteCase('1');
    expect(useCaseStore.getState().getCaseById('1')).toBeUndefined();

    useCaseStore.getState().resetCases();
    expect(useCaseStore.getState().getCaseById('1')).toBeDefined();
  });
});
