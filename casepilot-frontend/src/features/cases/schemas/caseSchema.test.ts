import { caseSchema } from './caseSchema';

describe('caseSchema', () => {
  it('valideaza payload corect', () => {
    const parsed = caseSchema.safeParse({
      number: '1234/2024',
      registrationDate: '2024-01-10',
      court: 'Tribunalul București',
      object: 'Litigiu',
      reclamant: 'SC ACME SRL',
      parat: 'SC BETA INDUSTRIES SRL',
      stage: 'Fond',
      status: 'Activ'
    });

    expect(parsed.success).toBe(true);
  });

  it('respinge format invalid pentru numar dosar', () => {
    const parsed = caseSchema.safeParse({
      number: 'abc',
      registrationDate: '2024-01-10',
      court: 'Tribunalul București',
      object: 'Litigiu',
      reclamant: 'SC ACME SRL',
      parat: 'SC BETA INDUSTRIES SRL',
      stage: 'Fond',
      status: 'Activ'
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/format recomandat/i);
    }
  });
});
