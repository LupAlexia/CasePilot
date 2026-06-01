import { API_BASE_URL } from './config'
import { getAuthHeaders } from './authHeaders'
import { saveAs } from 'file-saver'
import type {
  CaseDocument,
  CreateCaseDocumentRequest,
  UpdateCaseDocumentRequest,
  DocumentActivity
} from './types'

type ApiResponse<T> = {
  data: T
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'A aparut o eroare la comunicarea cu serverul.'

    try {
      const errorData = await response.json()

      if (errorData?.errors && typeof errorData.errors === 'object') {
        const allErrors = Object.values(errorData.errors).flat() as string[]

        if (allErrors.length > 0) {
          message = allErrors.join(' ')
        } else if (errorData?.title) {
          message = errorData.title
        }
      } else if (errorData?.title) {
        message = errorData.title
      } else if (errorData?.message) {
        message = errorData.message
      }
    } catch {
      // Ignore parsing errors and keep fallback message.
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await parseResponse<T>(response)
  return { data }
}

const api = {
  get<T>(url: string) {
    return request<T>('GET', url)
  },
  post<T>(url: string, body: unknown) {
    return request<T>('POST', url, body)
  },
  put<T>(url: string, body: unknown) {
    return request<T>('PUT', url, body)
  },
  delete(url: string) {
    return request<void>('DELETE', url)
  }
}

export async function getCaseDocuments(caseId: string) {
  const response = await api.get<CaseDocument[]>(`/cases/${caseId}/documents`)
  return response.data
}

export async function createCaseDocument(
  caseId: string,
  data: CreateCaseDocumentRequest
) {
  const response = await api.post<CaseDocument>(
    `/cases/${caseId}/documents`,
    data
  )
  return response.data
}

/**
 * Multipart upload — sends the actual file bytes + extracted text to the server.
 * The server stores the binary content and makes it available for download.
 */
export async function uploadCaseDocument(
  caseId: string,
  data: {
    name: string
    type: number
    file: File
    textContent?: string
  }
): Promise<CaseDocument> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('type', String(data.type))
  if (data.textContent) formData.append('textContent', data.textContent)
  formData.append('file', data.file, data.file.name)

  const response = await fetch(`${API_BASE_URL}/cases/${caseId}/documents`, {
    method: 'POST',
    headers: {
      // Do NOT set Content-Type — the browser sets it with the multipart boundary
      ...getAuthHeaders()
    },
    body: formData
  })

  if (!response.ok) {
    let message = 'Eroare la încărcarea documentului.'
    try {
      const err = await response.json()
      if (err?.message) message = err.message
      else if (err?.title) message = err.title
    } catch { /* ignore */ }
    throw new Error(message)
  }

  return response.json() as Promise<CaseDocument>
}

/**
 * Downloads the original file for a document and triggers a browser save-as dialog.
 */
export async function downloadCaseDocument(
  caseId: string,
  documentId: string,
  filename: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/cases/${caseId}/documents/${documentId}/download`,
    { headers: { ...getAuthHeaders() } }
  )

  if (!response.ok) {
    throw new Error('Fișierul nu este disponibil pentru descărcare.')
  }

  const blob = await response.blob()
  saveAs(blob, filename)
}

export async function updateCaseDocument(
  caseId: string,
  documentId: string,
  data: UpdateCaseDocumentRequest
) {
  const response = await api.put<CaseDocument>(
    `/cases/${caseId}/documents/${documentId}`,
    data
  )
  return response.data
}

export async function deleteCaseDocument(
  caseId: string,
  documentId: string
) {
  await api.delete(`/cases/${caseId}/documents/${documentId}`)
}

export async function getRecentDocuments() {
  const response = await api.get<CaseDocument[]>(
    `/statistics/documents/recent`
  )
  return response.data
}

export async function getRecentActivity() {
  const response = await api.get<DocumentActivity[]>(
    `/statistics/documents/activity`
  )
  return response.data
}