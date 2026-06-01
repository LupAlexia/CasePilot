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
  type: string;
  uploadedAt: string;
  contentType?: string;
  sizeBytes?: number;
  hasContent?: boolean;
}

export interface ApiCaseDocument {
  id: string;
  name: string;
  type: number | string;
  uploadedAt: string;
  contentType?: string;
  sizeBytes?: number;
  hasContent?: boolean;
}

export interface LegalCase {
  id: string;
  number: string;
  registrationDate: string;
  court: string;
  object: string;
  reclamant: string;
  parat: string;
  stage: number | string;
  status: number | string;
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
  stage: number | string;
  status: number | string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CaseStatisticsResponse {
  totalCases: number;
  activeCases: number;
  postponedCases: number;
  suspendedCases: number;
  finalizedCases: number;
  casesWithUpcomingHearings: number;
  casesPerCourt: Record<string, number>;
}

export interface CreateCaseDocumentRequest {
  name: string
  type: number
}

export interface UpdateCaseDocumentRequest {
  name: string
  type: number
}

export interface DocumentActivity {
  id: string
  caseId: string
  caseNumber: string
  documentName: string
  action: string
  date: string
}
