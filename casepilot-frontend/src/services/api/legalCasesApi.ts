import { API_BASE_URL } from "./config";
import { getAuthHeaders } from "./authHeaders";
import type {
  CaseStatisticsResponse,
  LegalCase,
  LegalCaseInput,
  PagedResponse,
} from "./types";

type PendingOperation =
  | {
      type: "create";
      caseId: string;
      payload: LegalCaseInput;
    }
  | {
      type: "update";
      caseId: string;
      payload: LegalCaseInput;
    }
  | {
      type: "delete";
      caseId: string;
    };

const CASES_CACHE_KEY = "casepilot:legalCases:cache";
const CASES_PENDING_OPS_KEY = "casepilot:legalCases:pendingOps";
let isSyncingPendingOps = false;
let isOnlineListenerRegistered = false;

export type CaseSyncStatus = "syncing" | "success" | "error";

type CaseSyncListener = (status: CaseSyncStatus) => void;
type PendingOperationsListener = (count: number) => void;

const caseSyncListeners = new Set<CaseSyncListener>();
const pendingOperationsListeners = new Set<PendingOperationsListener>();

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "A apărut o eroare la comunicarea cu serverul.";

    try {
      const errorData = await response.json();

      if (errorData?.errors && typeof errorData.errors === "object") {
        const allErrors = Object.values(errorData.errors).flat() as string[];

        if (allErrors.length > 0) {
          errorMessage = allErrors.join(" ");
        } else if (errorData?.title) {
          errorMessage = errorData.title;
        }
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // ignoră erorile de parsare
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  const storage = getStorage();

  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

function getCachedCases(): LegalCase[] {
  return readJson<LegalCase[]>(CASES_CACHE_KEY, []);
}

function setCachedCases(cases: LegalCase[]): void {
  writeJson(CASES_CACHE_KEY, cases);
}

function getPendingOperations(): PendingOperation[] {
  return readJson<PendingOperation[]>(CASES_PENDING_OPS_KEY, []);
}

function setPendingOperations(operations: PendingOperation[]): void {
  writeJson(CASES_PENDING_OPS_KEY, operations);
  const pendingCount = operations.length;
  pendingOperationsListeners.forEach((listener) => {
    listener(pendingCount);
  });
}

export function getPendingLegalCaseOperationsCount(): number {
  return getPendingOperations().length;
}

export function subscribeToPendingLegalCaseOperations(
  listener: PendingOperationsListener
): () => void {
  pendingOperationsListeners.add(listener);
  listener(getPendingLegalCaseOperationsCount());

  return () => {
    pendingOperationsListeners.delete(listener);
  };
}

export function subscribeToCaseSyncStatus(
  listener: CaseSyncListener
): () => void {
  caseSyncListeners.add(listener);

  return () => {
    caseSyncListeners.delete(listener);
  };
}

function emitCaseSyncStatus(status: CaseSyncStatus): void {
  caseSyncListeners.forEach((listener) => {
    listener(status);
  });
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function isNetworkUnavailableError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed")
  );
}

function paginateCases(
  cases: LegalCase[],
  page: number,
  pageSize: number
): PagedResponse<LegalCase> {
  const startIndex = Math.max(0, (page - 1) * pageSize);
  const endIndex = startIndex + pageSize;
  const items = cases.slice(startIndex, endIndex);
  const totalCount = cases.length;

  return {
    items,
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

function upsertCachedCase(updatedCase: LegalCase): void {
  const existingCases = getCachedCases();
  const index = existingCases.findIndex((item) => item.id === updatedCase.id);

  if (index === -1) {
    setCachedCases([updatedCase, ...existingCases]);
    return;
  }

  const nextCases = [...existingCases];
  nextCases[index] = updatedCase;
  setCachedCases(nextCases);
}

function removeCachedCase(caseId: string): void {
  setCachedCases(getCachedCases().filter((item) => item.id !== caseId));
}

function replaceCachedCaseId(tempId: string, serverCase: LegalCase): void {
  const nextCases = getCachedCases().map((item) =>
    item.id === tempId ? serverCase : item
  );

  setCachedCases(nextCases);
}

function normalizePendingOperationsAfterCreate(
  operations: PendingOperation[],
  oldCaseId: string,
  newCaseId: string
): PendingOperation[] {
  return operations.map((operation) => {
    if (operation.caseId !== oldCaseId) {
      return operation;
    }

    return {
      ...operation,
      caseId: newCaseId,
    };
  });
}

function buildLocalCase(input: LegalCaseInput, caseId: string): LegalCase {
  return {
    id: caseId,
    ...input,
    documents: [],
    hearings: [],
  };
}

function enqueueCreateOperation(payload: LegalCaseInput): LegalCase {
  const tempId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `local-${crypto.randomUUID()}`
      : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const localCase = buildLocalCase(payload, tempId);

  upsertCachedCase(localCase);
  setPendingOperations([
    ...getPendingOperations(),
    {
      type: "create",
      caseId: tempId,
      payload,
    },
  ]);

  return localCase;
}

function enqueueUpdateOperation(caseId: string, payload: LegalCaseInput): LegalCase {
  const cachedCase = getCachedCases().find((item) => item.id === caseId);
  const localCase = {
    ...(cachedCase ?? buildLocalCase(payload, caseId)),
    ...payload,
  };

  upsertCachedCase(localCase);

  const pendingOperations = getPendingOperations();
  const createIndex = pendingOperations.findIndex(
    (operation) => operation.type === "create" && operation.caseId === caseId
  );

  if (createIndex !== -1) {
    const nextOperations = [...pendingOperations];
    const createOperation = nextOperations[createIndex];

    if (createOperation.type === "create") {
      nextOperations[createIndex] = {
        ...createOperation,
        payload,
      };
      setPendingOperations(nextOperations);
      return localCase;
    }
  }

  const filteredOperations = pendingOperations.filter(
    (operation) => !(operation.type === "update" && operation.caseId === caseId)
  );

  setPendingOperations([
    ...filteredOperations,
    {
      type: "update",
      caseId,
      payload,
    },
  ]);

  return localCase;
}

function enqueueDeleteOperation(caseId: string): void {
  removeCachedCase(caseId);

  const pendingOperations = getPendingOperations();
  const hadPendingCreate = pendingOperations.some(
    (operation) => operation.type === "create" && operation.caseId === caseId
  );

  const withoutCaseOps = pendingOperations.filter(
    (operation) => operation.caseId !== caseId
  );

  if (hadPendingCreate) {
    setPendingOperations(withoutCaseOps);
    return;
  }

  setPendingOperations([
    ...withoutCaseOps,
    {
      type: "delete",
      caseId,
    },
  ]);
}

async function fetchLegalCasesFromServer(
  page = 1,
  pageSize = 10
): Promise<PagedResponse<LegalCase>> {
  const response = await fetch(
    `${API_BASE_URL}/LegalCases?page=${page}&pageSize=${pageSize}`,
    { headers: { ...getAuthHeaders() } }
  );

  return handleResponse<PagedResponse<LegalCase>>(response);
}

async function fetchLegalCaseByIdFromServer(id: string): Promise<LegalCase> {
  const response = await fetch(`${API_BASE_URL}/LegalCases/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<LegalCase>(response);
}

async function createLegalCaseOnServer(
  payload: LegalCaseInput
): Promise<LegalCase> {
  const response = await fetch(`${API_BASE_URL}/LegalCases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<LegalCase>(response);
}

async function updateLegalCaseOnServer(
  id: string,
  payload: LegalCaseInput
): Promise<LegalCase> {
  const response = await fetch(`${API_BASE_URL}/LegalCases/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<LegalCase>(response);
}

async function deleteLegalCaseOnServer(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/LegalCases/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });

  return handleResponse<void>(response);
}

export async function syncPendingLegalCaseOperations(): Promise<void> {
  if (isSyncingPendingOps || isOffline()) {
    return;
  }

  const initialPendingOps = getPendingOperations();

  if (initialPendingOps.length === 0) {
    return;
  }

  isSyncingPendingOps = true;
  emitCaseSyncStatus("syncing");

  try {
    let pendingOperations = [...initialPendingOps];

    while (pendingOperations.length > 0) {
      const [currentOperation, ...restOperations] = pendingOperations;

      if (currentOperation.type === "create") {
        const createdCase = await createLegalCaseOnServer(currentOperation.payload);
        replaceCachedCaseId(currentOperation.caseId, createdCase);

        pendingOperations = normalizePendingOperationsAfterCreate(
          restOperations,
          currentOperation.caseId,
          createdCase.id
        );
        setPendingOperations(pendingOperations);
        continue;
      }

      if (currentOperation.type === "update") {
        const updatedCase = await updateLegalCaseOnServer(
          currentOperation.caseId,
          currentOperation.payload
        );
        upsertCachedCase(updatedCase);

        pendingOperations = restOperations;
        setPendingOperations(pendingOperations);
        continue;
      }

      await deleteLegalCaseOnServer(currentOperation.caseId);
      removeCachedCase(currentOperation.caseId);

      pendingOperations = restOperations;
      setPendingOperations(pendingOperations);
    }

    emitCaseSyncStatus("success");
  } catch (error) {
    emitCaseSyncStatus("error");
    throw error;
  } finally {
    isSyncingPendingOps = false;
  }
}

function ensureSyncOnReconnect(): void {
  if (isOnlineListenerRegistered || typeof window === "undefined") {
    return;
  }

  window.addEventListener("online", () => {
    void syncPendingLegalCaseOperations();
  });

  isOnlineListenerRegistered = true;
}

ensureSyncOnReconnect();

export async function getLegalCases(
  page = 1,
  pageSize = 10
): Promise<PagedResponse<LegalCase>> {
  if (!isOffline()) {
    try {
      await syncPendingLegalCaseOperations();
      const serverResponse = await fetchLegalCasesFromServer(page, pageSize);
      setCachedCases(serverResponse.items);
      return serverResponse;
    } catch (error) {
      if (!isNetworkUnavailableError(error)) {
        throw error;
      }
    }
  }

  const cachedCases = getCachedCases();
  return paginateCases(cachedCases, page, pageSize);
}

export async function getLegalCaseById(id: string): Promise<LegalCase> {
  if (!isOffline()) {
    try {
      await syncPendingLegalCaseOperations();
      const legalCase = await fetchLegalCaseByIdFromServer(id);
      upsertCachedCase(legalCase);
      return legalCase;
    } catch (error) {
      if (!isNetworkUnavailableError(error)) {
        throw error;
      }
    }
  }

  const cachedCase = getCachedCases().find((item) => item.id === id);

  if (!cachedCase) {
    throw new Error("Dosarul nu este disponibil offline.");
  }

  return cachedCase;
}

export async function createLegalCase(
  payload: LegalCaseInput
): Promise<LegalCase> {
  if (!isOffline()) {
    try {
      await syncPendingLegalCaseOperations();
      const createdCase = await createLegalCaseOnServer(payload);
      upsertCachedCase(createdCase);
      return createdCase;
    } catch (error) {
      if (!isNetworkUnavailableError(error)) {
        throw error;
      }
    }
  }

  return enqueueCreateOperation(payload);
}

export async function updateLegalCase(
  id: string,
  payload: LegalCaseInput
): Promise<LegalCase> {
  if (!isOffline()) {
    try {
      await syncPendingLegalCaseOperations();
      const updatedCase = await updateLegalCaseOnServer(id, payload);
      upsertCachedCase(updatedCase);
      return updatedCase;
    } catch (error) {
      if (!isNetworkUnavailableError(error)) {
        throw error;
      }
    }
  }

  return enqueueUpdateOperation(id, payload);
}

export async function deleteLegalCase(id: string): Promise<void> {
  if (!isOffline()) {
    try {
      await syncPendingLegalCaseOperations();
      await deleteLegalCaseOnServer(id);
      removeCachedCase(id);
      return;
    } catch (error) {
      if (!isNetworkUnavailableError(error)) {
        throw error;
      }
    }
  }

  enqueueDeleteOperation(id);
}

export async function getCaseStatistics(): Promise<CaseStatisticsResponse> {
  const response = await fetch(`${API_BASE_URL}/Statistics/cases`, {
    headers: { ...getAuthHeaders() },
  });
  return handleResponse<CaseStatisticsResponse>(response);
}

