import { API_BASE_URL } from './config';
import { getAuthHeaders } from './authHeaders';
import type { HearingTerm } from './types';

export interface HearingTermInput {
  title: string;
  date: string; // ISO datetime string
  courtRoom: string;
  note: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'A apărut o eroare.';
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
      else if (err?.title) message = err.title;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function createHearingTerm(
  caseId: string,
  data: HearingTermInput
): Promise<HearingTerm> {
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}/hearings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  return handleResponse<HearingTerm>(response);
}

export async function updateHearingTerm(
  caseId: string,
  hearingId: string,
  data: HearingTermInput
): Promise<HearingTerm> {
  const response = await fetch(
    `${API_BASE_URL}/cases/${caseId}/hearings/${hearingId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    }
  );
  return handleResponse<HearingTerm>(response);
}

export async function deleteHearingTerm(
  caseId: string,
  hearingId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/cases/${caseId}/hearings/${hearingId}`,
    {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    }
  );
  return handleResponse<void>(response);
}
