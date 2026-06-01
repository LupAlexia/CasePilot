import { API_BASE_URL } from './config';
import { getAuthHeaders } from './authHeaders';

export interface HearingWithCase {
  id: string;
  title: string;
  date: string; // ISO datetime string
  courtRoom: string;
  note: string;
  caseId: string;
  caseNumber: string;
  court: string;
}

export async function getHearings(): Promise<HearingWithCase[]> {
  const response = await fetch(`${API_BASE_URL}/hearings`, {
    headers: { ...getAuthHeaders() }
  });

  if (!response.ok) {
    throw new Error('Eroare la preluarea termenelor de judecată.');
  }

  return response.json() as Promise<HearingWithCase[]>;
}
