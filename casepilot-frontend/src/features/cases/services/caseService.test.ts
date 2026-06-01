import { caseService } from './caseService';

describe('caseService', () => {
  it('creează dosar cu id și colecții goale', () => {
    const randomUUID = vi.fn(() => 'generated-id');
    vi.stubGlobal('crypto', { randomUUID });

    const created = caseService.createCase({
      number: '9999/2026',
      registrationDate: '2026-05-01',
      court: 'Tribunal',
      object: 'Pretenții',
      reclamant: 'SC Client SRL',
      parat: 'SC Debitor SRL',
      stage: 'Fond',
      status: 'Activ'
    });

    expect(created.id).toBe('generated-id');
    expect(created.documents).toEqual([]);
    expect(created.hearings).toEqual([]);

    vi.unstubAllGlobals();
  });
});
