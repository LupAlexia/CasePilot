import type { LegalCase } from '../types/case';

export const initialCases: LegalCase[] = [
  {
    id: '1',
    number: '1234/2024',
    registrationDate: '2024-01-10',
    court: 'Tribunalul București',
    object: 'Litigiu contractual',
    reclamant: 'SC ACME SRL',
    parat: 'SC BETA INDUSTRIES SRL',
    stage: 'Fond',
    status: 'Activ',
    documents: [
      { id: 'd1', name: 'Cerere de chemare în judecată', type: 'PDF', uploadedAt: '15.01.2024' },
      { id: 'd2', name: 'Întâmpinare', type: 'PDF', uploadedAt: '22.01.2024' },
      { id: 'd3', name: 'Contract comercial', type: 'PDF', uploadedAt: '10.12.2023' }
    ],
    hearings: [
      { id: 'h1', title: 'Termen judecată', date: '12.04.2026', courtRoom: 'Sala 4', note: 'Verificare înscrisuri depuse' },
      { id: 'h2', title: 'Administrare probe', date: '26.05.2026', courtRoom: 'Sala 4', note: 'Audiere martor propus de reclamant' }
    ]
  },
  {
    id: '2',
    number: '5678/2024',
    registrationDate: '2024-02-02',
    court: 'Judecătorie Sector 1',
    object: 'Recuperare creanțe',
    reclamant: 'Andrei Popescu',
    parat: 'Ioan Dumitrescu',
    stage: 'Apel',
    status: 'Activ',
    documents: [
      { id: 'd4', name: 'Cerere apel', type: 'PDF', uploadedAt: '02.02.2024' },
      { id: 'd5', name: 'Dovadă comunicare', type: 'PDF', uploadedAt: '08.02.2024' }
    ],
    hearings: [{ id: 'h3', title: 'Termen apel', date: '15.04.2026', courtRoom: 'Sala 2', note: 'Susțineri pe excepție' }]
  },
  {
    id: '3',
    number: '9012/2024',
    registrationDate: '2024-02-18',
    court: 'Curtea de Apel București',
    object: 'Contestație decizie',
    reclamant: 'Maria Radu',
    parat: 'Casa Județeană de Pensii Ilfov',
    stage: 'Recurs',
    status: 'Amânat',
    documents: [{ id: 'd6', name: 'Cerere recurs', type: 'PDF', uploadedAt: '18.02.2024' }],
    hearings: [{ id: 'h4', title: 'Fixare termen', date: '20.06.2026', courtRoom: 'Sala 7', note: 'Așteptare citație' }]
  },
  {
    id: '4',
    number: '3456/2024',
    registrationDate: '2024-03-04',
    court: 'Tribunalul București',
    object: 'Divorț',
    reclamant: 'Elena Marinescu',
    parat: 'Vlad Marinescu',
    stage: 'Fond',
    status: 'Activ',
    documents: [{ id: 'd7', name: 'Cerere divorț', type: 'PDF', uploadedAt: '04.03.2024' }],
    hearings: [{ id: 'h5', title: 'Primul termen', date: '11.04.2026', courtRoom: 'Sala 1', note: 'Prezență obligatorie părți' }]
  },
  {
    id: '5',
    number: '7890/2024',
    registrationDate: '2024-05-11',
    court: 'Judecătorie Sector 2',
    object: 'Succesiune',
    reclamant: 'Ana Ionescu',
    parat: 'Mihai Ionescu',
    stage: 'Executare',
    status: 'Finalizat',
    documents: [{ id: 'd8', name: 'Încheiere finală', type: 'PDF', uploadedAt: '10.01.2025' }],
    hearings: []
  }
];
