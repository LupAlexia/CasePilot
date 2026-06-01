import { API_BASE_URL } from './config';
import { getAuthHeaders } from './authHeaders';

export interface GenerateDocumentRequest {
  caseId: string;
  documentType: string;
  additionalData: string;
  templateText?: string;
}

export interface GenerateDocumentResponse {
  content: string;
}

export interface SummarizeDocumentResponse {
  summary: string;
}

async function handleAiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Eroare la serviciul AI.';
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function generateDocument(
  payload: GenerateDocumentRequest
): Promise<GenerateDocumentResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return handleAiResponse<GenerateDocumentResponse>(response);
}

export async function summarizeDocument(
  caseId: string,
  documentId: string
): Promise<SummarizeDocumentResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ caseId, documentId })
  });
  return handleAiResponse<SummarizeDocumentResponse>(response);
}
