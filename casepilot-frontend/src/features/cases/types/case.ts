export type CaseStatus = 'Activ' | 'Amânat' | 'Suspendat' | 'Finalizat';
export type CaseStage = 'Fond' | 'Apel' | 'Recurs' | 'Executare' | 'Contestație';
export type DocumentType = 'PDF' | 'DOCX' | 'IMG';

export interface HearingTerm {
  id: string;
  title: string;
  date: string;
  courtRoom: string;
  note: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type: DocumentType;
  uploadedAt: string;
}

export interface LegalCase {
  id: string;
  number: string;
  registrationDate: string;
  court: string;
  object: string;
  reclamant: string;
  parat: string;
  stage: CaseStage;
  status: CaseStatus;
  documents: CaseDocument[];
  hearings: HearingTerm[];
}

export interface LegalCaseInput {
  number: string;
  registrationDate: string;
  court: string;
  object: string;
  reclamant: string;
  parat: string;
  stage: CaseStage;
  status: CaseStatus;
}
